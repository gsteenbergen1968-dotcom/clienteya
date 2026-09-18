export type ExecutiveActionStatus =
  | "stable"
  | "attention"
  | "risk"
  | "critical";

export type ExecutiveActionItem = {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  severity: ExecutiveActionStatus;
  type:
    | "followup"
    | "revenue"
    | "relationship"
    | "execution"
    | "growth";
};

export type ExecutiveActionsChapter = {
  question: "¿Qué debo hacer ahora?";
  title: string;
  summary: string;
  status: ExecutiveActionStatus;
  decision: {
    title: string;
    description: string;
    actionLabel: string;
  };
  actions: ExecutiveActionItem[];
};

export type ExecutiveActionsInput = {
  overdueRelationships: number;
  dueSoonRelationships: number;
  unpaidRelationships: number;
  paidRelationships: number;
  openRevenue: number;
  confirmedRevenue: number;
  openRevenueUsd?: number;
  confirmedRevenueUsd?: number;
  opportunities: number;
};

type ExecutiveActionMetrics = {
  totalRelationships: number;
  openRelationships: number;
  overdueRate: number;
  dueSoonRate: number;
  paidRate: number;
  opportunityRate: number;
  executionPressure: number;
  relationshipPressure: number;
  revenueExposure: number;
  revenueExposureUsd: number;
  hasRevenueEvidence: boolean;
  growthCapacity: number;
  decisionHealth: number;
};

type ExecutiveDecisionTheme =
  | "recover-followups"
  | "protect-revenue"
  | "protect-relationships"
  | "convert-opportunities"
  | "reduce-pressure"
  | "maintain-discipline"
  | "create-growth";

type ExecutiveActionCandidate =
  ExecutiveActionItem & {
    theme: ExecutiveDecisionTheme;
    weight: number;
    impactScore: number;
    urgencyScore: number;
    strategicScore: number;
  };

type ExecutiveActionNarrative = {
  title: string;
  summary: string;
  decision: {
    title: string;
    description: string;
    actionLabel: string;
  };
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

function normalizeInput(
  input: ExecutiveActionsInput,
): ExecutiveActionsInput {
  return {
    overdueRelationships:
      safeNumber(
        input.overdueRelationships,
      ),

    dueSoonRelationships:
      safeNumber(
        input.dueSoonRelationships,
      ),

    unpaidRelationships:
      safeNumber(
        input.unpaidRelationships,
      ),

    paidRelationships:
      safeNumber(
        input.paidRelationships,
      ),

    openRevenue:
      safeNumber(
        input.openRevenue,
      ),

    confirmedRevenue:
      safeNumber(
        input.confirmedRevenue,
      ),

    openRevenueUsd:
      safeNumber(
        input.openRevenueUsd,
      ),

    confirmedRevenueUsd:
      safeNumber(
        input.confirmedRevenueUsd,
      ),

    opportunities:
      safeNumber(
        input.opportunities,
      ),
  };
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

function formatCount(
  value: number,
  singular: string,
  plural: string,
) {
  const normalizedValue =
    Math.max(
      0,
      Math.round(value),
    );

  return `${normalizedValue} ${
    normalizedValue === 1
      ? singular
      : plural
  }`;
}

function formatGs(
  value: number,
) {
  return `Gs. ${new Intl.NumberFormat(
    "es-PY",
  ).format(
    Math.round(
      Math.max(
        0,
        value,
      ),
    ),
  )}`;
}

function formatUsd(
  value: number,
) {
  return `USD ${new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 0,
    },
  ).format(
    Math.round(
      Math.max(
        0,
        value,
      ),
    ),
  )}`;
}

function formatRevenuePosition(
  pyg: number,
  usd: number,
) {
  const values: string[] = [];

  if (
    pyg > 0
  ) {
    values.push(
      formatGs(
        pyg,
      ),
    );
  }

  if (
    usd > 0
  ) {
    values.push(
      formatUsd(
        usd,
      ),
    );
  }

  if (
    values.length === 0
  ) {
    return "Sin valor registrado";
  }

  return values.join(
    " · ",
  );
}

function buildRevenueExposure(
  openRevenue: number,
  confirmedRevenue: number,
) {
  const total =
    openRevenue +
    confirmedRevenue;

  if (
    total <= 0
  ) {
    return 0;
  }

  return percentage(
    openRevenue,
    total,
  );
}

function buildMetrics(
  input: ExecutiveActionsInput,
): ExecutiveActionMetrics {
  const totalRelationships =
    input.paidRelationships +
    input.unpaidRelationships;

  const openRelationships =
    input.unpaidRelationships;

  const overdueRate =
    percentage(
      input.overdueRelationships,
      Math.max(
        1,
        openRelationships,
      ),
    );

  const dueSoonRate =
    percentage(
      input.dueSoonRelationships,
      Math.max(
        1,
        openRelationships,
      ),
    );

  const paidRate =
    percentage(
      input.paidRelationships,
      Math.max(
        1,
        totalRelationships,
      ),
    );

  const opportunityRate =
    percentage(
      input.opportunities,
      Math.max(
        1,
        openRelationships,
      ),
    );

  const executionPressure =
    clamp(
      Math.round(
        overdueRate *
          0.55 +
        dueSoonRate *
          0.2 +
        Math.min(
          100,
          input.overdueRelationships *
            12,
        ) *
          0.15 +
        Math.min(
          100,
          input.dueSoonRelationships *
            6,
        ) *
          0.1,
      ),
    );

  const relationshipPressure =
    clamp(
      Math.round(
        overdueRate *
          0.65 +
        dueSoonRate *
          0.25 +
        Math.min(
          100,
          input.overdueRelationships *
            10,
        ) *
          0.1,
      ),
    );

  const revenueExposure =
    buildRevenueExposure(
      input.openRevenue,
      input.confirmedRevenue,
    );

  const revenueExposureUsd =
    buildRevenueExposure(
      safeNumber(
        input.openRevenueUsd,
      ),
      safeNumber(
        input.confirmedRevenueUsd,
      ),
    );

  const hasRevenueEvidence =
    input.openRevenue > 0 ||
    input.confirmedRevenue > 0 ||
    safeNumber(
      input.openRevenueUsd,
    ) > 0 ||
    safeNumber(
      input.confirmedRevenueUsd,
    ) > 0;

  const growthCapacity =
    clamp(
      Math.round(
        opportunityRate *
          0.45 +
        paidRate *
          0.25 +
        (
          100 -
          executionPressure
        ) *
          0.3,
      ),
    );

  const strongestRevenueExposure =
    Math.max(
      revenueExposure,
      revenueExposureUsd,
    );

  const decisionHealth =
    clamp(
      Math.round(
        (
          100 -
          executionPressure
        ) *
          0.34 +
        (
          100 -
          relationshipPressure
        ) *
          0.26 +
        paidRate *
          0.14 +
        growthCapacity *
          0.14 +
        (
          100 -
          strongestRevenueExposure
        ) *
          0.12,
      ),
    );

  return {
    totalRelationships,
    openRelationships,
    overdueRate,
    dueSoonRate,
    paidRate,
    opportunityRate,
    executionPressure,
    relationshipPressure,
    revenueExposure,
    revenueExposureUsd,
    hasRevenueEvidence,
    growthCapacity,
    decisionHealth,
  };
}

function getStatus(
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionStatus {
  const strongestRevenueExposure =
    Math.max(
      metrics.revenueExposure,
      metrics.revenueExposureUsd,
    );

  if (
    input.overdueRelationships >= 5 ||
    metrics.executionPressure >= 70 ||
    strongestRevenueExposure >= 80 ||
    metrics.decisionHealth < 35
  ) {
    return "critical";
  }

  if (
    input.overdueRelationships >= 3 ||
    metrics.executionPressure >= 50 ||
    strongestRevenueExposure >= 60 ||
    metrics.decisionHealth < 55
  ) {
    return "risk";
  }

  if (
    input.overdueRelationships > 0 ||
    input.dueSoonRelationships > 0 ||
    input.opportunities > 0 ||
    (
      metrics.hasRevenueEvidence &&
      strongestRevenueExposure >= 35
    ) ||
    metrics.relationshipPressure >= 25 ||
    metrics.decisionHealth < 70
  ) {
    return "attention";
  }

  return "stable";
}

function getSeverityWeight(
  severity: ExecutiveActionStatus,
) {
  if (
    severity === "critical"
  ) {
    return 100;
  }

  if (
    severity === "risk"
  ) {
    return 75;
  }

  if (
    severity === "attention"
  ) {
    return 50;
  }

  return 20;
}

function buildCandidateWeight(
  severity: ExecutiveActionStatus,
  impactScore: number,
  urgencyScore: number,
  strategicScore: number,
) {
  return Math.round(
    getSeverityWeight(
      severity,
    ) *
      0.25 +
    impactScore *
      0.35 +
    urgencyScore *
      0.25 +
    strategicScore *
      0.15,
  );
}

function buildFollowupCandidate(
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionCandidate | null {
  if (
    input.overdueRelationships <= 0
  ) {
    return null;
  }

  const severity:
    ExecutiveActionStatus =
      input.overdueRelationships >= 5 ||
      metrics.overdueRate >= 40
        ? "critical"
        : input.overdueRelationships >= 3 ||
            metrics.overdueRate >= 25
          ? "risk"
          : "attention";

  const impactScore =
    clamp(
      metrics.relationshipPressure +
        Math.min(
          30,
          input.overdueRelationships *
            5,
        ),
    );

  const urgencyScore =
    clamp(
      65 +
        input.overdueRelationships *
          7,
    );

  const strategicScore =
    clamp(
      55 +
        metrics.opportunityRate *
          0.25,
    );

  return {
    id:
      "recover-overdue-relationships",

    theme:
      "recover-followups",

    title:
      "Recuperar relaciones vencidas",

    description:
      `${formatCount(
        input.overdueRelationships,
        "relación",
        "relaciones",
      )} superaron su fecha de seguimiento y requieren atención.`,

    recommendation:
      "Recupera primero las relaciones vencidas con interés activo o mayor cercanía al próximo paso.",

    severity,

    type:
      "followup",

    impactScore,
    urgencyScore,
    strategicScore,

    weight:
      buildCandidateWeight(
        severity,
        impactScore,
        urgencyScore,
        strategicScore,
      ),
  };
}

function buildRevenueCandidate(
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionCandidate | null {
  if (
    !metrics.hasRevenueEvidence
  ) {
    return null;
  }

  const openRevenue =
    safeNumber(
      input.openRevenue,
    );

  const openRevenueUsd =
    safeNumber(
      input.openRevenueUsd,
    );

  if (
    openRevenue <= 0 &&
    openRevenueUsd <= 0
  ) {
    return null;
  }

  const strongestRevenueExposure =
    Math.max(
      metrics.revenueExposure,
      metrics.revenueExposureUsd,
    );

  const severity:
    ExecutiveActionStatus =
      strongestRevenueExposure >= 80
        ? "critical"
        : strongestRevenueExposure >= 60
          ? "risk"
          : "attention";

  const impactScore =
    clamp(
      strongestRevenueExposure +
        (
          openRevenue > 0
            ? 10
            : 0
        ) +
        (
          openRevenueUsd > 0
            ? 10
            : 0
        ),
    );

  const urgencyScore =
    clamp(
      35 +
        strongestRevenueExposure *
          0.55,
    );

  const strategicScore =
    clamp(
      60 +
        metrics.opportunityRate *
          0.2,
    );

  return {
    id:
      "protect-open-revenue",

    theme:
      "protect-revenue",

    title:
      "Proteger ingresos abiertos",

    description:
      `${formatRevenuePosition(
        openRevenue,
        openRevenueUsd,
      )} permanecen abiertos dentro de Relaciones.`,

    recommendation:
      "Prioriza relaciones con valor abierto, intención comercial y un siguiente paso claro. Mantén PYG y USD separados.",

    severity,

    type:
      "revenue",

    impactScore,
    urgencyScore,
    strategicScore,

    weight:
      buildCandidateWeight(
        severity,
        impactScore,
        urgencyScore,
        strategicScore,
      ),
  };
}

function buildRelationshipCandidate(
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionCandidate | null {
  if (
    input.dueSoonRelationships <= 0
  ) {
    return null;
  }

  const severity:
    ExecutiveActionStatus =
      input.dueSoonRelationships >= 6 ||
      metrics.dueSoonRate >= 40
        ? "risk"
        : "attention";

  const impactScore =
    clamp(
      metrics.relationshipPressure +
        input.dueSoonRelationships *
          5,
    );

  const urgencyScore =
    clamp(
      55 +
        input.dueSoonRelationships *
          6,
    );

  const strategicScore =
    clamp(
      45 +
        metrics.growthCapacity *
          0.3,
    );

  return {
    id:
      "protect-upcoming-relationships",

    theme:
      "protect-relationships",

    title:
      "Proteger relaciones próximas",

    description:
      `${formatCount(
        input.dueSoonRelationships,
        "relación",
        "relaciones",
      )} requieren contacto en los próximos días para mantener continuidad.`,

    recommendation:
      "Ejecuta estos contactos antes de que se conviertan en nueva deuda de seguimiento.",

    severity,

    type:
      "relationship",

    impactScore,
    urgencyScore,
    strategicScore,

    weight:
      buildCandidateWeight(
        severity,
        impactScore,
        urgencyScore,
        strategicScore,
      ),
  };
}

function buildOpportunityCandidate(
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionCandidate | null {
  if (
    input.opportunities <= 0
  ) {
    return null;
  }

  const severity:
    ExecutiveActionStatus =
      metrics.executionPressure >= 60
        ? "attention"
        : "stable";

  const impactScore =
    clamp(
      Math.min(
        100,
        input.opportunities *
          14,
      ) +
        metrics.opportunityRate *
          0.25,
    );

  const urgencyScore =
    clamp(
      35 +
        input.opportunities *
          5,
    );

  const strategicScore =
    clamp(
      metrics.growthCapacity +
        10,
    );

  return {
    id:
      "convert-active-opportunities",

    theme:
      "convert-opportunities",

    title:
      "Convertir oportunidades activas",

    description:
      `${formatCount(
        input.opportunities,
        "oportunidad",
        "oportunidades",
      )} muestran intención comercial dentro de la cartera actual.`,

    recommendation:
      "Prioriza las relaciones interesadas por próximo contacto y claridad del siguiente paso.",

    severity,

    type:
      "growth",

    impactScore,
    urgencyScore,
    strategicScore,

    weight:
      buildCandidateWeight(
        severity,
        impactScore,
        urgencyScore,
        strategicScore,
      ),
  };
}

function buildExecutionCandidate(
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionCandidate | null {
  if (
    metrics.executionPressure < 35
  ) {
    return null;
  }

  const severity:
    ExecutiveActionStatus =
      metrics.executionPressure >= 70
        ? "critical"
        : metrics.executionPressure >= 50
          ? "risk"
          : "attention";

  const visiblePressureSignals =
    input.overdueRelationships +
    input.dueSoonRelationships;

  const impactScore =
    metrics.executionPressure;

  const urgencyScore =
    clamp(
      metrics.executionPressure +
        visiblePressureSignals *
          4,
    );

  const strategicScore =
    clamp(
      100 -
        metrics.decisionHealth +
        20,
    );

  return {
    id:
      "reduce-execution-pressure",

    theme:
      "reduce-pressure",

    title:
      "Reducir presión de ejecución",

    description:
      `La presión ejecutiva alcanza ${metrics.executionPressure}/100 y ${formatCount(
        visiblePressureSignals,
        "seguimiento",
        "seguimientos",
      )} compiten por atención inmediata o próxima.`,

    recommendation:
      "Resuelve primero los vencimientos, después los contactos próximos y evita abrir tareas que no protejan continuidad.",

    severity,

    type:
      "execution",

    impactScore,
    urgencyScore,
    strategicScore,

    weight:
      buildCandidateWeight(
        severity,
        impactScore,
        urgencyScore,
        strategicScore,
      ),
  };
}

function buildGrowthCandidate(
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionCandidate | null {
  const hasRevenuePressure =
    Math.max(
      metrics.revenueExposure,
      metrics.revenueExposureUsd,
    ) >= 35;

  if (
    input.opportunities > 0 ||
    metrics.executionPressure >= 35 ||
    input.overdueRelationships > 0 ||
    input.dueSoonRelationships > 0 ||
    hasRevenuePressure
  ) {
    return null;
  }

  const impactScore =
    clamp(
      metrics.growthCapacity +
        15,
    );

  const urgencyScore =
    20;

  const strategicScore =
    clamp(
      metrics.decisionHealth +
        15,
    );

  return {
    id:
      "create-qualified-growth",

    theme:
      "create-growth",

    title:
      "Crear nuevas oportunidades calificadas",

    description:
      "La operación está bajo control y no existen oportunidades activas que requieran conversión inmediata.",

    recommendation:
      "Crea nuevas relaciones con intención comercial clara y registra desde el inicio su próximo paso.",

    severity:
      "attention",

    type:
      "growth",

    impactScore,
    urgencyScore,
    strategicScore,

    weight:
      buildCandidateWeight(
        "attention",
        impactScore,
        urgencyScore,
        strategicScore,
      ),
  };
}

function buildDisciplineCandidate(
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionCandidate | null {
  const hasRevenuePressure =
    Math.max(
      metrics.revenueExposure,
      metrics.revenueExposureUsd,
    ) >= 35;

  const hasPressure =
    input.overdueRelationships > 0 ||
    input.dueSoonRelationships > 0 ||
    metrics.executionPressure >= 35 ||
    hasRevenuePressure;

  if (
    hasPressure
  ) {
    return null;
  }

  const impactScore =
    clamp(
      metrics.decisionHealth,
    );

  const urgencyScore =
    15;

  const strategicScore =
    clamp(
      metrics.paidRate +
        metrics.growthCapacity *
          0.35,
    );

  return {
    id:
      "maintain-executive-discipline",

    theme:
      "maintain-discipline",

    title:
      "Mantener disciplina ejecutiva",

    description:
      `${formatCount(
        input.paidRelationships,
        "relación",
        "relaciones",
      )} están marcadas como pagadas y no existe presión de seguimiento o ingresos dominante.`,

    recommendation:
      "Mantén seguimiento y control sin introducir nuevas tareas que no mejoren continuidad o crecimiento.",

    severity:
      "stable",

    type:
      "execution",

    impactScore,
    urgencyScore,
    strategicScore,

    weight:
      buildCandidateWeight(
        "stable",
        impactScore,
        urgencyScore,
        strategicScore,
      ),
  };
}

function buildActionCandidates(
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionCandidate[] {
  const candidates = [
    buildFollowupCandidate(
      input,
      metrics,
    ),

    buildRevenueCandidate(
      input,
      metrics,
    ),

    buildRelationshipCandidate(
      input,
      metrics,
    ),

    buildOpportunityCandidate(
      input,
      metrics,
    ),

    buildExecutionCandidate(
      input,
      metrics,
    ),

    buildGrowthCandidate(
      input,
      metrics,
    ),

    buildDisciplineCandidate(
      input,
      metrics,
    ),
  ];

  return candidates.filter(
    (
      candidate,
    ): candidate is ExecutiveActionCandidate =>
      candidate !== null,
  );
}

function getTypePriority(
  type: ExecutiveActionItem["type"],
) {
  if (
    type === "revenue"
  ) {
    return 6;
  }

  if (
    type === "followup"
  ) {
    return 5;
  }

  if (
    type === "relationship"
  ) {
    return 4;
  }

  if (
    type === "execution"
  ) {
    return 3;
  }

  if (
    type === "growth"
  ) {
    return 2;
  }

  return 1;
}

function deduplicateCandidates(
  candidates: ExecutiveActionCandidate[],
) {
  const selectedByTheme =
    new Map<
      ExecutiveDecisionTheme,
      ExecutiveActionCandidate
    >();

  for (
    const candidate of candidates
  ) {
    const current =
      selectedByTheme.get(
        candidate.theme,
      );

    if (
      !current ||
      candidate.weight >
        current.weight
    ) {
      selectedByTheme.set(
        candidate.theme,
        candidate,
      );
    }
  }

  return Array.from(
    selectedByTheme.values(),
  );
}

function sortCandidates(
  candidates: ExecutiveActionCandidate[],
) {
  return [...candidates].sort(
    (
      first,
      second,
    ) => {
      if (
        second.weight !==
        first.weight
      ) {
        return (
          second.weight -
          first.weight
        );
      }

      const severityDifference =
        getSeverityWeight(
          second.severity,
        ) -
        getSeverityWeight(
          first.severity,
        );

      if (
        severityDifference !==
        0
      ) {
        return severityDifference;
      }

      return (
        getTypePriority(
          second.type,
        ) -
        getTypePriority(
          first.type,
        )
      );
    },
  );
}

function ensureExecutiveBalance(
  candidates: ExecutiveActionCandidate[],
) {
  const sorted =
    sortCandidates(
      deduplicateCandidates(
        candidates,
      ),
    );

  const selected:
    ExecutiveActionCandidate[] = [];

  const usedTypes =
    new Set<
      ExecutiveActionItem["type"]
    >();

  for (
    const candidate of sorted
  ) {
    if (
      selected.length >= 3
    ) {
      break;
    }

    if (
      !usedTypes.has(
        candidate.type,
      )
    ) {
      selected.push(
        candidate,
      );

      usedTypes.add(
        candidate.type,
      );
    }
  }

  if (
    selected.length < 3
  ) {
    for (
      const candidate of sorted
    ) {
      if (
        selected.length >= 3
      ) {
        break;
      }

      if (
        selected.some(
          (
            selectedCandidate,
          ) =>
            selectedCandidate.id ===
            candidate.id,
        )
      ) {
        continue;
      }

      selected.push(
        candidate,
      );
    }
  }

  return selected;
}

function buildActions(
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionItem[] {
  const candidates =
    buildActionCandidates(
      input,
      metrics,
    );

  const selected =
    ensureExecutiveBalance(
      candidates,
    );

  if (
    selected.length > 0
  ) {
    return selected.map(
      (
        {
          theme,
          weight,
          impactScore,
          urgencyScore,
          strategicScore,
          ...action
        },
      ) =>
        action,
    );
  }

  return [
    {
      id:
        "maintain-control",

      title:
        "Mantener control ejecutivo",

      description:
        "No existe una decisión crítica dominante en este momento.",

      recommendation:
        "Mantén disciplina de seguimiento y revisa nuevas señales antes de introducir cambios.",

      severity:
        "stable",

      type:
        "execution",
    },
  ];
}

function getDominantAction(
  actions: ExecutiveActionItem[],
) {
  return (
    actions[0] ??
    null
  );
}

function buildCriticalNarrative(
  dominantAction: ExecutiveActionItem | null,
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionNarrative {
  if (
    dominantAction?.type ===
    "revenue"
  ) {
    return {
      title:
        "La prioridad ejecutiva es proteger ingresos abiertos",

      summary:
        `${formatRevenuePosition(
          input.openRevenue,
          safeNumber(
            input.openRevenueUsd,
          ),
        )} permanecen abiertos y requieren una decisión comercial clara.`,

      decision: {
        title:
          "Proteger valor antes de ampliar actividad",

        description:
          "Prioriza las relaciones con valor abierto, intención comercial y menor distancia hasta la conversión.",

        actionLabel:
          "Proteger ingresos abiertos",
      },
    };
  }

  if (
    dominantAction?.type ===
    "followup"
  ) {
    return {
      title:
        "La prioridad ejecutiva es recuperar relaciones vencidas",

      summary:
        `${formatCount(
          input.overdueRelationships,
          "relación vencida",
          "relaciones vencidas",
        )} explican la principal presión comercial.`,

      decision: {
        title:
          "Recuperar control relacional",

        description:
          "Atiende primero las relaciones vencidas con intención activa y vuelve a definir próximos pasos.",

        actionLabel:
          "Resolver relaciones críticas",
      },
    };
  }

  return {
    title:
      "La operación requiere una secuencia ejecutiva inmediata",

    summary:
      `La presión de ejecución alcanza ${metrics.executionPressure}/100 y la salud de decisión cayó a ${metrics.decisionHealth}/100.`,

    decision: {
      title:
        "Resolver la causa dominante",

      description:
        "Ejecuta primero vencimientos, ingresos abiertos y continuidad antes de abrir nuevos frentes.",

      actionLabel:
        "Ejecutar decisiones críticas",
    },
  };
}

function buildRiskNarrative(
  dominantAction: ExecutiveActionItem | null,
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionNarrative {
  if (
    dominantAction?.type ===
    "revenue"
  ) {
    return {
      title:
        "El valor económico abierto necesita protección",

      summary:
        `${formatRevenuePosition(
          input.openRevenue,
          safeNumber(
            input.openRevenueUsd,
          ),
        )} todavía no está confirmado.`,

      decision: {
        title:
          "Convertir valor antes de aumentar volumen",

        description:
          "Prioriza las relaciones con importe abierto y siguiente paso comercial claro.",

        actionLabel:
          "Revisar ingresos abiertos",
      },
    };
  }

  if (
    dominantAction?.type ===
      "followup" ||
    dominantAction?.type ===
      "relationship"
  ) {
    return {
      title:
        "La continuidad relacional necesita intervención",

      summary:
        `La presión relacional alcanza ${metrics.relationshipPressure}/100 y existen ${formatCount(
          input.overdueRelationships +
            input.dueSoonRelationships,
          "seguimiento",
          "seguimientos",
        )} vencidos o próximos.`,

      decision: {
        title:
          "Proteger continuidad",

        description:
          "Recupera vencimientos y ejecuta contactos próximos antes de ampliar actividad.",

        actionLabel:
          "Proteger relaciones",
      },
    };
  }

  return {
    title:
      "La operación está perdiendo equilibrio ejecutivo",

    summary:
      `La presión alcanza ${metrics.executionPressure}/100 y la salud de decisión ${metrics.decisionHealth}/100.`,

    decision: {
      title:
        "Reducir fricción antes de acelerar",

      description:
        "Concentra la ejecución en seguimiento, ingresos abiertos y continuidad antes de abrir nuevos frentes.",

      actionLabel:
        "Resolver prioridades",
    },
  };
}

function buildAttentionNarrative(
  dominantAction: ExecutiveActionItem | null,
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionNarrative {
  if (
    dominantAction?.type ===
    "revenue"
  ) {
    return {
      title:
        "La próxima decisión está en proteger valor abierto",

      summary:
        `${formatRevenuePosition(
          input.openRevenue,
          safeNumber(
            input.openRevenueUsd,
          ),
        )} permanecen abiertos sin una presión crítica dominante.`,

      decision: {
        title:
          "Convertir valor con disciplina",

        description:
          "Prioriza relaciones con importe abierto, intención visible y próximo paso definido.",

        actionLabel:
          "Revisar valor abierto",
      },
    };
  }

  if (
    dominantAction?.type ===
    "growth"
  ) {
    return {
      title:
        input.opportunities > 0
          ? "La próxima decisión está en convertir oportunidades"
          : "La operación puede crear nuevo crecimiento",

      summary:
        input.opportunities > 0
          ? `${formatCount(
              input.opportunities,
              "oportunidad",
              "oportunidades",
            )} muestran intención comercial sin una presión defensiva dominante.`
          : "No existen vencimientos dominantes ni oportunidades activas que requieran conversión inmediata.",

      decision: {
        title:
          input.opportunities > 0
            ? "Convertir las oportunidades activas"
            : "Crear oportunidades calificadas",

        description:
          input.opportunities > 0
            ? "Prioriza relaciones interesadas por próximo contacto y claridad del siguiente paso."
            : "Amplía la cartera con relaciones que tengan intención comercial y un próximo paso definido.",

        actionLabel:
          input.opportunities > 0
            ? "Convertir oportunidades"
            : "Crear crecimiento",
      },
    };
  }

  if (
    dominantAction?.type ===
    "relationship"
  ) {
    return {
      title:
        "La ejecución de relaciones próximas protegerá el ritmo comercial",

      summary:
        `${formatCount(
          input.dueSoonRelationships,
          "relación",
          "relaciones",
        )} requieren contacto próximo para evitar nueva presión.`,

      decision: {
        title:
          "Ejecutar antes de que aparezca atraso",

        description:
          "Protege las relaciones próximas y evita convertir actividad planificada en deuda operativa.",

        actionLabel:
          "Ejecutar contactos próximos",
      },
    };
  }

  return {
    title:
      "La operación necesita una prioridad ejecutiva clara",

    summary:
      `La salud de decisión alcanza ${metrics.decisionHealth}/100. No existe una crisis dominante, pero sí una acción concreta que puede mejorar continuidad.`,

    decision: {
      title:
        "Ejecutar por impacto",

      description:
        "Resuelve primero la acción que más protege ingresos, seguimiento, relaciones o crecimiento.",

      actionLabel:
        "Ejecutar prioridad principal",
    },
  };
}

function buildStableNarrative(
  dominantAction: ExecutiveActionItem | null,
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionNarrative {
  if (
    dominantAction?.type ===
    "growth"
  ) {
    return {
      title:
        "La operación está preparada para crear crecimiento",

      summary:
        `La salud de decisión alcanza ${metrics.decisionHealth}/100 y no existe presión dominante de seguimiento o ingresos.`,

      decision: {
        title:
          "Crear oportunidades calificadas",

        description:
          "Amplía la cartera manteniendo disciplina de seguimiento e intención comercial.",

        actionLabel:
          "Crear crecimiento",
      },
    };
  }

  return {
    title:
      "La operación está bajo control ejecutivo",

    summary:
      `${formatCount(
        input.paidRelationships,
        "relación",
        "relaciones",
      )} están marcadas como pagadas. Ingresos confirmados: ${formatRevenuePosition(
        input.confirmedRevenue,
        safeNumber(
          input.confirmedRevenueUsd,
        ),
      )}.`,

    decision: {
      title:
        "Mantener disciplina sin intervenir de más",

      description:
        "Protege el ritmo actual y evita introducir acciones que no mejoren continuidad, ingresos o crecimiento.",

      actionLabel:
        "Mantener control",
    },
  };
}

function buildNarrative(
  status: ExecutiveActionStatus,
  dominantAction: ExecutiveActionItem | null,
  input: ExecutiveActionsInput,
  metrics: ExecutiveActionMetrics,
): ExecutiveActionNarrative {
  if (
    status === "critical"
  ) {
    return buildCriticalNarrative(
      dominantAction,
      input,
      metrics,
    );
  }

  if (
    status === "risk"
  ) {
    return buildRiskNarrative(
      dominantAction,
      input,
      metrics,
    );
  }

  if (
    status === "attention"
  ) {
    return buildAttentionNarrative(
      dominantAction,
      input,
      metrics,
    );
  }

  return buildStableNarrative(
    dominantAction,
    input,
    metrics,
  );
}

export function buildExecutiveActionsChapter(
  input: ExecutiveActionsInput,
): ExecutiveActionsChapter {
  const normalizedInput =
    normalizeInput(
      input,
    );

  const metrics =
    buildMetrics(
      normalizedInput,
    );

  const status =
    getStatus(
      normalizedInput,
      metrics,
    );

  const actions =
    buildActions(
      normalizedInput,
      metrics,
    );

  const dominantAction =
    getDominantAction(
      actions,
    );

  const narrative =
    buildNarrative(
      status,
      dominantAction,
      normalizedInput,
      metrics,
    );

  return {
    question:
      "¿Qué debo hacer ahora?",

    title:
      "Acciones ejecutivas",

    summary:
      narrative.summary,

    status,

    decision:
      narrative.decision,

    actions,
  };
}