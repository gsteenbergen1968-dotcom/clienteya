type AccessInput = {
  subscription_status: string | null;
  trial_ends_at: string | null;
};

export type AccessState = "active" | "trial" | "expired" | "pending" | "blocked";

export function isTrialValid(trialEndsAt: string | null) {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() > Date.now();
}

export function getAccessState(input: AccessInput) {
  const status = (input.subscription_status || "trial").toLowerCase();
  const trialValid = isTrialValid(input.trial_ends_at);

  let accessState: AccessState;

  if (status === "active") {
    accessState = "active";
  } else if (status === "pending_review") {
    accessState = "pending";
  } else if (status === "trial") {
    accessState = trialValid ? "trial" : "expired";
  } else {
    accessState = "blocked";
  }

  return {
    status,
    trialValid,
    accessState,
    hasAccess: accessState === "active" || accessState === "trial",
    isActive: accessState === "active",
    isPending: accessState === "pending",
    isTrial: accessState === "trial",
    isExpiredTrial: accessState === "expired",
    isBlocked: accessState === "blocked",
  };
}