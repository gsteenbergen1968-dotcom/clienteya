export type ExecutiveMetricsRelationship = {
  id: string;
  name?: string | null;
  company?: string | null;
  status?: string | null;
  notes?: string | null;
  reminder?: string | null;
  next_contact_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  paid?: boolean | null;
  expected_amount?: number | null;
  paid_amount?: number | null;
  currency?: "PYG" | "USD" | null;
  paid_at?: string | null;
  invoice_number?: string | null;
  payment_description?: string | null;
};

export type ExecutiveMetricsCommercialAction = {
  id: string;
  relationshipId: string;
  relationshipName: string;
  title: string;
  description: string;
  priority:
    | "urgent"
    | "high"
    | "medium"
    | "normal";
  category:
    | "overdue"
    | "today"
    | "upcoming"
    | "opportunity"
    | "risk"
    | "payment"
    | "relationship"
    | "followup";
  expectedRevenue?: number;
  dueDate?: string | null;
};

export type ExecutiveMetrics = {
  totalRelationships: number;
  activeRelationships: number;
  overdueRelationships: number;
  dueSoonRelationships: number;
  relationshipsToContactToday: number;
  recentRelationships: number;
  stalledRelationships: number;
  paidRelationships: number;
  unpaidRelationships: number;
  confirmedRevenue: number;
  openRevenue: number;
  confirmedRevenueUsd: number;
  openRevenueUsd: number;
  opportunities: number;
  risks: number;
  followupCount: number;
  founderScore: number;
  revenueMomentum: number;
  operationalPressure: number;
  executionQuality: number;
  pipelineVelocity: number;
  responseRate: number;
  conversionRate: number;
};

export type BuildExecutiveMetricsInput = {
  relationships: ExecutiveMetricsRelationship[];
  actions: ExecutiveMetricsCommercialAction[];
};

function clamp(
  value: number,
  min = 0,
  max = 100,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function normalizeText(
  value: string | null | undefined,
) {
  return (value || "")
    .trim()
    .toLowerCase();
}

function safeNumber(
  value: number | null | undefined,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    value,
  );
}

function percentage(
  value: number,
  total: number,
) {
  if (
    total <= 0
  ) {
    return 0;
  }

  return clamp(
    Math.round(
      (
        value /
        total
      ) *
        100,
    ),
  );
}

function getDate(
  value: string | null | undefined,
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

function daysFromToday(
  date: Date | null,
) {
  if (!date) {
    return null;
  }

  const today =
    new Date();

  const target =
    new Date(date);

  today.setHours(
    0,
    0,
    0,
    0,
  );

  target.setHours(
    0,
    0,
    0,
    0,
  );

  return Math.round(
    (
      target.getTime() -
      today.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function getNextContactDays(
  relationship: ExecutiveMetricsRelationship,
) {
  return daysFromToday(
    getDate(
      relationship.next_contact_at,
    ),
  );
}

function getCreatedDays(
  relationship: ExecutiveMetricsRelationship,
) {
  return daysFromToday(
    getDate(
      relationship.created_at,
    ),
  );
}

function isRelationshipPaid(
  relationship: ExecutiveMetricsRelationship,
) {
  if (
    relationship.paid === true ||
    Boolean(
      relationship.paid_at,
    )
  ) {
    return true;
  }

  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("pag") ||
    status.includes("convert")
  );
}

function getRelationshipCurrency(
  relationship: ExecutiveMetricsRelationship,
): "PYG" | "USD" {
  return relationship.currency === "USD"
    ? "USD"
    : "PYG";
}

function getExpectedAmount(
  relationship: ExecutiveMetricsRelationship,
) {
  return safeNumber(
    relationship.expected_amount,
  );
}

function getPaidAmount(
  relationship: ExecutiveMetricsRelationship,
) {
  const paidAmount =
    safeNumber(
      relationship.paid_amount,
    );

  if (
    paidAmount > 0
  ) {
    return paidAmount;
  }

  if (
    isRelationshipPaid(
      relationship,
    )
  ) {
    return getExpectedAmount(
      relationship,
    );
  }

  return 0;
}

function getConfirmedRevenue(
  relationships: ExecutiveMetricsRelationship[],
  currency: "PYG" | "USD",
) {
  return relationships.reduce(
    (
      total,
      relationship,
    ) => {
      if (
        !isRelationshipPaid(
          relationship,
        ) ||
        getRelationshipCurrency(
          relationship,
        ) !== currency
      ) {
        return total;
      }

      return (
        total +
        getPaidAmount(
          relationship,
        )
      );
    },
    0,
  );
}

function getOpenRevenue(
  relationships: ExecutiveMetricsRelationship[],
  currency: "PYG" | "USD",
) {
  return relationships.reduce(
    (
      total,
      relationship,
    ) => {
      if (
        isRelationshipPaid(
          relationship,
        ) ||
        isRelationshipClosed(
          relationship,
        ) ||
        getRelationshipCurrency(
          relationship,
        ) !== currency
      ) {
        return total;
      }

      return (
        total +
        getExpectedAmount(
          relationship,
        )
      );
    },
    0,
  );
}

function isRelationshipClosed(
  relationship: ExecutiveMetricsRelationship,
) {
  if (
    isRelationshipPaid(
      relationship,
    )
  ) {
    return false;
  }

  return normalizeText(
    relationship.status,
  ).includes(
    "cerr",
  );
}

function isOpportunityRelationship(
  relationship: ExecutiveMetricsRelationship,
) {
  if (
    isRelationshipPaid(
      relationship,
    ) ||
    isRelationshipClosed(
      relationship,
    )
  ) {
    return false;
  }

  return normalizeText(
    relationship.status,
  ).includes(
    "interes",
  );
}

function isNoResponseRelationship(
  relationship: ExecutiveMetricsRelationship,
) {
  if (
    isRelationshipPaid(
      relationship,
    ) ||
    isRelationshipClosed(
      relationship,
    )
  ) {
    return false;
  }

  return normalizeText(
    relationship.status,
  ).includes(
    "sin respuesta",
  );
}

function isRespondedRelationship(
  relationship: ExecutiveMetricsRelationship,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  return (
    isRelationshipPaid(
      relationship,
    ) ||
    status.includes("contact") ||
    status.includes("interes")
  );
}

function isActiveRelationship(
  relationship: ExecutiveMetricsRelationship,
) {
  if (
    isRelationshipClosed(
      relationship,
    )
  ) {
    return false;
  }

  const status =
    normalizeText(
      relationship.status,
    );

  const hasNextContact =
    getNextContactDays(
      relationship,
    ) !== null;

  return (
    isRelationshipPaid(
      relationship,
    ) ||
    status.includes("nuevo") ||
    status.includes("lead") ||
    status.includes("contact") ||
    status.includes("interes") ||
    hasNextContact
  );
}

function isOverdueRelationship(
  relationship: ExecutiveMetricsRelationship,
) {
  if (
    isRelationshipPaid(
      relationship,
    ) ||
    isRelationshipClosed(
      relationship,
    )
  ) {
    return false;
  }

  const days =
    getNextContactDays(
      relationship,
    );

  return (
    typeof days === "number" &&
    days < 0
  );
}

function isDueTodayRelationship(
  relationship: ExecutiveMetricsRelationship,
) {
  if (
    isRelationshipPaid(
      relationship,
    ) ||
    isRelationshipClosed(
      relationship,
    )
  ) {
    return false;
  }

  return (
    getNextContactDays(
      relationship,
    ) === 0
  );
}

function isDueSoonRelationship(
  relationship: ExecutiveMetricsRelationship,
) {
  if (
    isRelationshipPaid(
      relationship,
    ) ||
    isRelationshipClosed(
      relationship,
    )
  ) {
    return false;
  }

  const days =
    getNextContactDays(
      relationship,
    );

  return (
    typeof days === "number" &&
    days > 0 &&
    days <= 3
  );
}

function isRiskRelationship(
  relationship: ExecutiveMetricsRelationship,
) {
  return (
    isNoResponseRelationship(
      relationship,
    ) ||
    isOverdueRelationship(
      relationship,
    )
  );
}

function isStalledRelationship(
  relationship: ExecutiveMetricsRelationship,
) {
  if (
    isRelationshipPaid(
      relationship,
    ) ||
    isRelationshipClosed(
      relationship,
    )
  ) {
    return false;
  }

  if (
    isNoResponseRelationship(
      relationship,
    )
  ) {
    return true;
  }

  const days =
    getNextContactDays(
      relationship,
    );

  return (
    typeof days === "number" &&
    days < -7
  );
}

function isRecentRelationship(
  relationship: ExecutiveMetricsRelationship,
) {
  const days =
    getCreatedDays(
      relationship,
    );

  return (
    typeof days === "number" &&
    days <= 0 &&
    days >= -14
  );
}

function hasPlannedFollowup(
  relationship: ExecutiveMetricsRelationship,
) {
  if (
    isRelationshipPaid(
      relationship,
    ) ||
    isRelationshipClosed(
      relationship,
    )
  ) {
    return false;
  }

  return (
    getNextContactDays(
      relationship,
    ) !== null
  );
}

function getMonetaryConversionRate({
  confirmedRevenue,
  openRevenue,
  confirmedRevenueUsd,
  openRevenueUsd,
  fallbackConversionRate,
}: {
  confirmedRevenue: number;
  openRevenue: number;
  confirmedRevenueUsd: number;
  openRevenueUsd: number;
  fallbackConversionRate: number;
}) {
  const pygBase =
    confirmedRevenue +
    openRevenue;

  const usdBase =
    confirmedRevenueUsd +
    openRevenueUsd;

  const currencyRates: number[] = [];

  if (
    pygBase > 0
  ) {
    currencyRates.push(
      percentage(
        confirmedRevenue,
        pygBase,
      ),
    );
  }

  if (
    usdBase > 0
  ) {
    currencyRates.push(
      percentage(
        confirmedRevenueUsd,
        usdBase,
      ),
    );
  }

  if (
    currencyRates.length === 0
  ) {
    return fallbackConversionRate;
  }

  return clamp(
    Math.round(
      currencyRates.reduce(
        (
          total,
          rate,
        ) =>
          total +
          rate,
        0,
      ) /
        currencyRates.length,
    ),
  );
}

export function buildExecutiveMetrics({
  relationships,
  actions,
}: BuildExecutiveMetricsInput): ExecutiveMetrics {
  const safeRelationships =
    relationships ?? [];

  const safeActions =
    actions ?? [];

  const totalRelationships =
    safeRelationships.length;

  const paidRelationships =
    safeRelationships.filter(
      isRelationshipPaid,
    ).length;

  const closedRelationships =
    safeRelationships.filter(
      isRelationshipClosed,
    ).length;

  const unpaidRelationships =
    Math.max(
      0,
      totalRelationships -
        paidRelationships -
        closedRelationships,
    );

  const activeRelationships =
    safeRelationships.filter(
      isActiveRelationship,
    ).length;

  const overdueRelationships =
    safeRelationships.filter(
      isOverdueRelationship,
    ).length;

  const relationshipsToContactToday =
    safeRelationships.filter(
      isDueTodayRelationship,
    ).length;

  const dueSoonRelationships =
    safeRelationships.filter(
      isDueSoonRelationship,
    ).length;

  const opportunities =
    safeRelationships.filter(
      isOpportunityRelationship,
    ).length;

  const risks =
    safeRelationships.filter(
      isRiskRelationship,
    ).length;

  const stalledRelationships =
    safeRelationships.filter(
      isStalledRelationship,
    ).length;

  const recentRelationships =
    safeRelationships.filter(
      isRecentRelationship,
    ).length;

  const followupCount =
    safeRelationships.filter(
      hasPlannedFollowup,
    ).length;

  const confirmedRevenue =
    getConfirmedRevenue(
      safeRelationships,
      "PYG",
    );

  const openRevenue =
    getOpenRevenue(
      safeRelationships,
      "PYG",
    );

  const confirmedRevenueUsd =
    getConfirmedRevenue(
      safeRelationships,
      "USD",
    );

  const openRevenueUsd =
    getOpenRevenue(
      safeRelationships,
      "USD",
    );

  const activeRate =
    percentage(
      activeRelationships,
      totalRelationships,
    );

  const overdueRate =
    percentage(
      overdueRelationships,
      Math.max(
        1,
        unpaidRelationships,
      ),
    );

  const opportunityRate =
    percentage(
      opportunities,
      Math.max(
        1,
        unpaidRelationships,
      ),
    );

  const riskRate =
    percentage(
      risks,
      Math.max(
        1,
        unpaidRelationships,
      ),
    );

  const stalledRate =
    percentage(
      stalledRelationships,
      Math.max(
        1,
        unpaidRelationships,
      ),
    );

  const planningRate =
    percentage(
      followupCount,
      Math.max(
        1,
        unpaidRelationships,
      ),
    );

  const paidBase =
    paidRelationships +
    unpaidRelationships;

  const conversionRate =
    percentage(
      paidRelationships,
      paidBase,
    );

  const respondedRelationships =
    safeRelationships.filter(
      isRespondedRelationship,
    ).length;

  const noResponseRelationships =
    safeRelationships.filter(
      isNoResponseRelationship,
    ).length;

  const responseEvidenceBase =
    respondedRelationships +
    noResponseRelationships;

  const responseRate =
    responseEvidenceBase > 0
      ? percentage(
          respondedRelationships,
          responseEvidenceBase,
        )
      : 0;

  const urgentActions =
    safeActions.filter(
      (
        action,
      ) =>
        action.priority ===
        "urgent" &&
        (
          action.category ===
            "overdue" ||
          action.category ===
            "today" ||
          action.category ===
            "risk"
        ),
    ).length;

  const highActions =
    safeActions.filter(
      (
        action,
      ) =>
        action.priority ===
        "high" &&
        (
          action.category ===
            "overdue" ||
          action.category ===
            "today" ||
          action.category ===
            "upcoming" ||
          action.category ===
            "risk" ||
          action.category ===
            "followup"
        ),
    ).length;

  const actionPressure =
    clamp(
      urgentActions * 18 +
      highActions * 8,
    );

  const operationalPressure =
    clamp(
      Math.round(
        overdueRate *
          0.35 +
        riskRate *
          0.25 +
        stalledRate *
          0.15 +
        actionPressure *
          0.15 +
        percentage(
          relationshipsToContactToday,
          Math.max(
            1,
            unpaidRelationships,
          ),
        ) *
          0.1,
      ),
    );

  const executionQuality =
    clamp(
      Math.round(
        activeRate *
          0.25 +
        planningRate *
          0.25 +
        (
          100 -
          overdueRate
        ) *
          0.2 +
        (
          100 -
          riskRate
        ) *
          0.15 +
        (
          100 -
          operationalPressure
        ) *
          0.15,
      ),
    );

  const recentRate =
    percentage(
      recentRelationships,
      Math.max(
        1,
        totalRelationships,
      ),
    );

  const pipelineVelocity =
    clamp(
      Math.round(
        activeRate *
          0.3 +
        opportunityRate *
          0.3 +
        planningRate *
          0.2 +
        recentRate *
          0.1 +
        (
          100 -
          stalledRate
        ) *
          0.1,
      ),
    );

  const monetaryConversionRate =
    getMonetaryConversionRate({
      confirmedRevenue,
      openRevenue,
      confirmedRevenueUsd,
      openRevenueUsd,
      fallbackConversionRate:
        conversionRate,
    });

  const revenueMomentum =
    clamp(
      Math.round(
        monetaryConversionRate *
          0.45 +
        opportunityRate *
          0.3 +
        pipelineVelocity *
          0.25,
      ),
    );

  const founderScore =
    clamp(
      Math.round(
        executionQuality *
          0.3 +
        revenueMomentum *
          0.2 +
        pipelineVelocity *
          0.2 +
        (
          100 -
          operationalPressure
        ) *
          0.3,
      ),
    );

  return {
    totalRelationships,
    activeRelationships,
    overdueRelationships,
    dueSoonRelationships,
    relationshipsToContactToday,
    recentRelationships,
    stalledRelationships,
    paidRelationships,
    unpaidRelationships,
    confirmedRevenue,
    openRevenue,
    confirmedRevenueUsd,
    openRevenueUsd,
    opportunities,
    risks,
    followupCount,
    founderScore,
    revenueMomentum,
    operationalPressure,
    executionQuality,
    pipelineVelocity,
    responseRate,
    conversionRate,
  };
}