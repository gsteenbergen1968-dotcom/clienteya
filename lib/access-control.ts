import { canUseFounderMode } from "./founder-mode";

export type SubscriptionStatus =
  | "trial"
  | "pending"
  | "active"
  | "paused"
  | "canceled";

export type PlanType =
  | "pro"
  | "enterprise";

export type ProfileAccess = {
  email?: string | null;

  subscription_status?: SubscriptionStatus | null;

  trial_ends_at?: string | null;

  plan_type?: PlanType | null;

  subscription_started_at?: string | null;

  subscription_ends_at?: string | null;

  payment_provider?: string | null;

payment_reference?: string | null;
};

export type AccessReason =
  | "active"
  | "trial"
  | "pending"
  | "trial_expired"
  | "subscription_expired"
  | "inactive_subscription"
  | "missing_plan"
  | "upgrade_required"
  | "founder_mode";

export type AccessResult = {
  allowed: boolean;

  reason: AccessReason;

  requiresUpgrade: boolean;
};

function todayStart() {
  const now = new Date();

  now.setHours(0, 0, 0, 0);

  return now;
}

function founderAccess(
  profile: ProfileAccess,
): AccessResult | null {
  if (
    !canUseFounderMode(
      profile.email,
    )
  ) {
    return null;
  }

  return {
    allowed: true,

    reason: "founder_mode",

    requiresUpgrade: false,
  };
}

export function isTrialExpired(
  profile: Pick<
    ProfileAccess,
    "trial_ends_at"
  >,
) {
  if (
    !profile.trial_ends_at
  ) {
    return true;
  }

  const trialDate =
    new Date(
      profile.trial_ends_at,
    );

  return (
    trialDate <
    todayStart()
  );
}

export function isSubscriptionExpired(
  profile: Pick<
    ProfileAccess,
    "subscription_ends_at"
  >,
) {
  if (
    !profile.subscription_ends_at
  ) {
    return true;
  }

  const subscriptionEndDate =
    new Date(
      profile.subscription_ends_at,
    );

  return (
    subscriptionEndDate <
    todayStart()
  );
}

export function isSubscriptionActive(
  profile: Pick<
    ProfileAccess,
    | "subscription_status"
    | "subscription_ends_at"
  >,
) {
  return (
    profile.subscription_status ===
      "active" &&
    !isSubscriptionExpired(profile)
  );
}

export function isTrialActive(
  profile: ProfileAccess,
) {
  return (
    profile.subscription_status ===
      "trial" &&
    !isTrialExpired(profile)
  );
}

export function isPaymentPending(
  profile: ProfileAccess,
) {
  return (
    profile.subscription_status ===
    "pending"
  );
}

export function hasPlatformAccess(
  profile: ProfileAccess,
): AccessResult {
  const founder =
    founderAccess(profile);

  if (founder) {
    return founder;
  }

  if (
    isSubscriptionActive(
      profile,
    )
  ) {
    return {
      allowed: true,

      reason: "active",

      requiresUpgrade: false,
    };
  }

  if (
    profile.subscription_status ===
      "active" &&
    isSubscriptionExpired(profile)
  ) {
    return {
      allowed: false,

      reason:
        "subscription_expired",

      requiresUpgrade: true,
    };
  }

  if (
    isTrialActive(
      profile,
    )
  ) {
    return {
      allowed: true,

      reason: "trial",

      requiresUpgrade: false,
    };
  }

  if (
    isPaymentPending(
      profile,
    )
  ) {
    return {
      allowed: false,

      reason: "pending",

      requiresUpgrade: true,
    };
  }

  if (
    profile.subscription_status ===
      "trial" &&
    isTrialExpired(profile)
  ) {
    return {
      allowed: false,

      reason:
        "trial_expired",

      requiresUpgrade: true,
    };
  }

  return {
    allowed: false,

    reason:
      "inactive_subscription",

    requiresUpgrade: true,
  };
}

export function hasRequiredPlan(
  profile: ProfileAccess,
  requiredPlans: PlanType[],
) {
  if (
    canUseFounderMode(
      profile.email,
    )
  ) {
    return true;
  }

  if (
    !profile.plan_type
  ) {
    return false;
  }

  return requiredPlans.includes(
    profile.plan_type,
  );
}

export function canAccessPro(
  profile: ProfileAccess,
): AccessResult {
  const baseAccess =
    hasPlatformAccess(
      profile,
    );

  if (
    !baseAccess.allowed
  ) {
    return baseAccess;
  }

  const allowed =
    hasRequiredPlan(
      profile,
      [
        "pro",
        "enterprise",
      ],
    );

  return {
    allowed,

    reason:
      allowed
        ? baseAccess.reason
        : "upgrade_required",

    requiresUpgrade:
      !allowed,
  };
}

export function canAccessEnterprise(
  profile: ProfileAccess,
): AccessResult {
  const baseAccess =
    hasPlatformAccess(
      profile,
    );

  if (
    !baseAccess.allowed
  ) {
    return baseAccess;
  }

  const allowed =
    hasRequiredPlan(
      profile,
      [
        "enterprise",
      ],
    );

  return {
    allowed,

    reason:
      allowed
        ? baseAccess.reason
        : "upgrade_required",

    requiresUpgrade:
      !allowed,
  };
}

export function canAccessAICockpit(
  profile: ProfileAccess,
) {
  return canAccessPro(
    profile,
  );
}

export function canAccessAutomations(
  profile: ProfileAccess,
) {
  return canAccessPro(
    profile,
  );
}

export function canAccessFounderTools(
  profile: ProfileAccess,
) {
  return canAccessEnterprise(
    profile,
  );
}

export function getAccessBadge(
  profile: ProfileAccess,
) {
  if (
    canUseFounderMode(
      profile.email,
    )
  ) {
    return "Founder Mode";
  }

  if (
    profile.subscription_status ===
      "active" &&
    !isSubscriptionExpired(profile)
  ) {
    return "Activo";
  }

  if (
    profile.subscription_status ===
      "active" &&
    isSubscriptionExpired(profile)
  ) {
    return "Suscripción vencida";
  }

  if (
    profile.subscription_status ===
      "trial" &&
    !isTrialExpired(profile)
  ) {
    return "Trial";
  }

  if (
    profile.subscription_status ===
      "trial" &&
    isTrialExpired(profile)
  ) {
    return "Trial expirado";
  }

  if (
    profile.subscription_status ===
    "pending"
  ) {
    return "Pago pendiente";
  }

  if (
    profile.subscription_status ===
    "paused"
  ) {
    return "Pausado";
  }

  if (
    profile.subscription_status ===
    "canceled"
  ) {
    return "Cancelado";
  }

  return "Sin acceso";
}

export function getPlanLabel(
  plan?: PlanType | null,
) {
  if (
    plan === "pro"
  ) {
    return "Pro";
  }

  if (
    plan === "enterprise"
  ) {
    return "Enterprise";
  }

  return "Sin plan";
}

export function getUpgradeMessage(
  result: AccessResult,
) {
  if (
    result.reason ===
    "founder_mode"
  ) {
    return "Founder Mode activo.";
  }

  if (
    result.reason ===
    "trial_expired"
  ) {
    return "Tu período de prueba terminó.";
  }

  if (
    result.reason ===
    "subscription_expired"
  ) {
    return "Tu suscripción venció.";
  }

  if (
    result.reason ===
    "pending"
  ) {
    return "Tu pago está pendiente de confirmación.";
  }

  if (
    result.reason ===
    "upgrade_required"
  ) {
    return "Este módulo requiere un plan superior.";
  }

  if (
    result.reason ===
    "inactive_subscription"
  ) {
    return "Tu suscripción no está activa.";
  }

  return "Actualiza tu cuenta para continuar.";
}