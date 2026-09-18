import type {
  CommercialRelationship as CommercialActionRelationship,
} from "./commercial-action-engine";

export type ExecutivePipelineStatus =
  | "healthy"
  | "attention"
  | "risk"
  | "critical";

export type ExecutivePipelineEvidence = {
  label: string;
  value: string;
  meaning: string;
  status: ExecutivePipelineStatus;
};

export type ExecutivePipelineDecision = {
  title: string;
  description: string;
  actionLabel: string;
  priority: ExecutivePipelineStatus;
};

export type ExecutiveCommercialPipelineChapter = {
  question: "¿Dónde está mi próxima decisión de ingresos?";
  status: ExecutivePipelineStatus;
  title: string;
  summary: string;
  evidence: ExecutivePipelineEvidence[];
  decision: ExecutivePipelineDecision;
  opportunityCount: number;
  openRevenue: number;
};

type PipelineRelationshipSignal = {
  currency: "PYG" | "USD";
  value: number;
  expectedValue: number;
  paidValue: number;
  isPaid: boolean;
  isClosed: boolean;
  isOpportunity: boolean;
  isRisk: boolean;
  isUrgent: boolean;
  isStalled: boolean;
  hasNextContact: boolean;
};

type PipelineMetrics = {
  openRevenue: number;
  openRevenueUsd: number;

  paidRevenue: number;
  paidRevenueUsd: number;

  opportunityRevenue: number;
  opportunityRevenueUsd: number;

  riskRevenue: number;
  riskRevenueUsd: number;

  urgentRevenue: number;
  urgentRevenueUsd: number;

  stalledRevenue: number;
  stalledRevenueUsd: number;

  protectedRevenueRate: number;
  openRevenueRate: number;
  riskRevenueRate: number;
  opportunityRevenueRate: number;

  protectedRevenueRateUsd: number;
  openRevenueRateUsd: number;
  riskRevenueRateUsd: number;
  opportunityRevenueRateUsd: number;

  opportunities: number;
  risks: number;
  urgentRelationships: number;
  stalledRelationships: number;
  paidRelationships: number;
  unpaidRelationships: number;
  closedRelationships: number;

  relationshipsWithValue: number;
  relationshipsWithPygValue: number;
  relationshipsWithUsdValue: number;

  relationshipsWithNextContact: number;
  relationshipsWithoutNextContact: number;

  commercialBalance: number;
};

type PipelineNarrative = {
  title: string;
  summary: string;
  decision: ExecutivePipelineDecision;
};

type PipelineEvidenceCandidate =
  ExecutivePipelineEvidence & {
    weight: number;
  };

function safeNumber(
  value: unknown,
) {
  if (
    typeof value === "number"
  ) {
    if (
      !Number.isFinite(value)
    ) {
      return 0;
    }

    return Math.max(
      0,
      value,
    );
  }

  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    return 0;
  }

  return Math.max(
    0,
    parsed,
  );
}

function clamp(
  value: number,
  min = 0,
  max = 100,
) {
  return Math.max(
    min,
    Math.min(
      max,
      value,
    ),
  );
}

function normalizeText(
  value: string | null | undefined,
) {
  return (value || "")
    .trim()
    .toLowerCase();
}

function normalizeCurrency(
  value: string | null | undefined,
): "PYG" | "USD" {
  return value === "USD"
    ? "USD"
    : "PYG";
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

function formatRevenuePosition({
  pyg,
  usd,
}: {
  pyg: number;
  usd: number;
}) {
  const values: string[] = [];

  if (pyg > 0) {
    values.push(
      formatGs(
        pyg,
      ),
    );
  }

  if (usd > 0) {
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

function toISODate(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const normalized =
    value.slice(
      0,
      10,
    );

  return /^\d{4}-\d{2}-\d{2}$/.test(
    normalized,
  )
    ? normalized
    : null;
}

function todayISO() {
  return new Date()
    .toISOString()
    .slice(
      0,
      10,
    );
}

function diffInDays(
  fromISO: string,
  toISO: string,
) {
  const from =
    new Date(
      `${fromISO}T00:00:00`,
    );

  const to =
    new Date(
      `${toISO}T00:00:00`,
    );

  return Math.round(
    (
      to.getTime() -
      from.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function isRelationshipPaid(
  relationship: CommercialActionRelationship,
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

function isRelationshipClosed(
  relationship: CommercialActionRelationship,
) {
  if (
    isRelationshipPaid(
      relationship,
    )
  ) {
    return false;
  }

  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("cerr")
  );
}

function getExpectedValue(
  relationship: CommercialActionRelationship,
) {
  const expectedAmount =
    safeNumber(
      relationship.expected_amount,
    );

  if (
    expectedAmount > 0
  ) {
    return expectedAmount;
  }

  if (
    !isRelationshipPaid(
      relationship,
    )
  ) {
    return safeNumber(
      relationship.amount,
    );
  }

  return 0;
}

function getPaidValue(
  relationship: CommercialActionRelationship,
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
    const compatibilityAmount =
      safeNumber(
        relationship.amount,
      );

    if (
      compatibilityAmount > 0
    ) {
      return compatibilityAmount;
    }

    return safeNumber(
      relationship.expected_amount,
    );
  }

  return 0;
}

function getRelationshipValue(
  relationship: CommercialActionRelationship,
) {
  return isRelationshipPaid(
    relationship,
  )
    ? getPaidValue(
        relationship,
      )
    : getExpectedValue(
        relationship,
      );
}

function isRelationshipOpportunity(
  relationship: CommercialActionRelationship,
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

  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("interes")
  );
}

function isRelationshipRisk(
  relationship: CommercialActionRelationship,
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

  const status =
    normalizeText(
      relationship.status,
    );

  const nextContactAt =
    toISODate(
      relationship.next_contact_at,
    );

  const overdue =
    nextContactAt
      ? diffInDays(
          todayISO(),
          nextContactAt,
        ) < 0
      : false;

  return (
    status.includes("sin respuesta") ||
    overdue
  );
}

function isRelationshipUrgent(
  relationship: CommercialActionRelationship,
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

  const nextContactAt =
    toISODate(
      relationship.next_contact_at,
    );

  if (!nextContactAt) {
    return false;
  }

  return (
    diffInDays(
      todayISO(),
      nextContactAt,
    ) < 0
  );
}

function isRelationshipStalled(
  relationship: CommercialActionRelationship,
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

  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("sin respuesta")
  );
}

function buildRelationshipSignal(
  relationship: CommercialActionRelationship,
): PipelineRelationshipSignal {
  const expectedValue =
    getExpectedValue(
      relationship,
    );

  const paidValue =
    getPaidValue(
      relationship,
    );

  const value =
    getRelationshipValue(
      relationship,
    );

  const isPaid =
    isRelationshipPaid(
      relationship,
    );

  const isClosed =
    isRelationshipClosed(
      relationship,
    );

  const isOpportunity =
    isRelationshipOpportunity(
      relationship,
    );

  const isRisk =
    isRelationshipRisk(
      relationship,
    );

  const isUrgent =
    isRelationshipUrgent(
      relationship,
    );

  const isStalled =
    isRelationshipStalled(
      relationship,
    );

  const hasNextContact =
    Boolean(
      toISODate(
        relationship.next_contact_at,
      ),
    );

  return {
    currency:
      normalizeCurrency(
        relationship.currency,
      ),

    value,
    expectedValue,
    paidValue,

    isPaid,
    isClosed,
    isOpportunity,
    isRisk,
    isUrgent,
    isStalled,
    hasNextContact,
  };
}

function sumRevenue(
  signals: PipelineRelationshipSignal[],
  {
    currency,
    predicate,
  }: {
    currency: "PYG" | "USD";
    predicate: (
      signal: PipelineRelationshipSignal,
    ) => boolean;
  },
) {
  return signals.reduce(
    (
      total,
      signal,
    ) => {
      if (
        signal.currency !==
          currency ||
        !predicate(
          signal,
        )
      ) {
        return total;
      }

      return (
        total +
        signal.value
      );
    },
    0,
  );
}

function getRevenueRates({
  paidRevenue,
  openRevenue,
  opportunityRevenue,
  riskRevenue,
}: {
  paidRevenue: number;
  openRevenue: number;
  opportunityRevenue: number;
  riskRevenue: number;
}) {
  const totalPipeline =
    paidRevenue +
    openRevenue;

  const protectedRevenueRate =
    totalPipeline > 0
      ? clamp(
          Math.round(
            (
              paidRevenue /
              totalPipeline
            ) *
              100,
          ),
        )
      : 0;

  const openRevenueRate =
    totalPipeline > 0
      ? clamp(
          Math.round(
            (
              openRevenue /
              totalPipeline
            ) *
              100,
          ),
        )
      : 0;

  const riskRevenueRate =
    openRevenue > 0
      ? clamp(
          Math.round(
            (
              riskRevenue /
              openRevenue
            ) *
              100,
          ),
        )
      : 0;

  const opportunityRevenueRate =
    openRevenue > 0
      ? clamp(
          Math.round(
            (
              opportunityRevenue /
              openRevenue
            ) *
              100,
          ),
        )
      : 0;

  return {
    protectedRevenueRate,
    openRevenueRate,
    riskRevenueRate,
    opportunityRevenueRate,
  };
}

function buildPipelineMetrics(
  relationships: CommercialActionRelationship[],
): PipelineMetrics {
  const signals =
    relationships.map(
      buildRelationshipSignal,
    );

  const openSignals =
    signals.filter(
      (
        signal,
      ) =>
        !signal.isPaid &&
        !signal.isClosed,
    );

  const openRevenue =
    sumRevenue(
      signals,
      {
        currency:
          "PYG",
        predicate:
          (
            signal,
          ) =>
            !signal.isPaid &&
            !signal.isClosed,
      },
    );

  const openRevenueUsd =
    sumRevenue(
      signals,
      {
        currency:
          "USD",
        predicate:
          (
            signal,
          ) =>
            !signal.isPaid &&
            !signal.isClosed,
      },
    );

  const paidRevenue =
    sumRevenue(
      signals,
      {
        currency:
          "PYG",
        predicate:
          (
            signal,
          ) =>
            signal.isPaid,
      },
    );

  const paidRevenueUsd =
    sumRevenue(
      signals,
      {
        currency:
          "USD",
        predicate:
          (
            signal,
          ) =>
            signal.isPaid,
      },
    );

  const opportunityRevenue =
    sumRevenue(
      signals,
      {
        currency:
          "PYG",
        predicate:
          (
            signal,
          ) =>
            signal.isOpportunity,
      },
    );

  const opportunityRevenueUsd =
    sumRevenue(
      signals,
      {
        currency:
          "USD",
        predicate:
          (
            signal,
          ) =>
            signal.isOpportunity,
      },
    );

  const riskRevenue =
    sumRevenue(
      signals,
      {
        currency:
          "PYG",
        predicate:
          (
            signal,
          ) =>
            signal.isRisk,
      },
    );

  const riskRevenueUsd =
    sumRevenue(
      signals,
      {
        currency:
          "USD",
        predicate:
          (
            signal,
          ) =>
            signal.isRisk,
      },
    );

  const urgentRevenue =
    sumRevenue(
      signals,
      {
        currency:
          "PYG",
        predicate:
          (
            signal,
          ) =>
            signal.isUrgent,
      },
    );

  const urgentRevenueUsd =
    sumRevenue(
      signals,
      {
        currency:
          "USD",
        predicate:
          (
            signal,
          ) =>
            signal.isUrgent,
      },
    );

  const stalledRevenue =
    sumRevenue(
      signals,
      {
        currency:
          "PYG",
        predicate:
          (
            signal,
          ) =>
            signal.isStalled,
      },
    );

  const stalledRevenueUsd =
    sumRevenue(
      signals,
      {
        currency:
          "USD",
        predicate:
          (
            signal,
          ) =>
            signal.isStalled,
      },
    );

  const pygRates =
    getRevenueRates({
      paidRevenue,
      openRevenue,
      opportunityRevenue,
      riskRevenue,
    });

  const usdRates =
    getRevenueRates({
      paidRevenue:
        paidRevenueUsd,
      openRevenue:
        openRevenueUsd,
      opportunityRevenue:
        opportunityRevenueUsd,
      riskRevenue:
        riskRevenueUsd,
    });

  const opportunities =
    signals.filter(
      (
        signal,
      ) =>
        signal.isOpportunity,
    ).length;

  const risks =
    signals.filter(
      (
        signal,
      ) =>
        signal.isRisk,
    ).length;

  const urgentRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isUrgent,
    ).length;

  const stalledRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isStalled,
    ).length;

  const paidRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isPaid,
    ).length;

  const closedRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isClosed,
    ).length;

  const unpaidRelationships =
    openSignals.length;

  const relationshipsWithValue =
    signals.filter(
      (
        signal,
      ) =>
        signal.value > 0,
    ).length;

  const relationshipsWithPygValue =
    signals.filter(
      (
        signal,
      ) =>
        signal.currency ===
          "PYG" &&
        signal.value > 0,
    ).length;

  const relationshipsWithUsdValue =
    signals.filter(
      (
        signal,
      ) =>
        signal.currency ===
          "USD" &&
        signal.value > 0,
    ).length;

  const relationshipsWithNextContact =
    openSignals.filter(
      (
        signal,
      ) =>
        signal.hasNextContact,
    ).length;

  const relationshipsWithoutNextContact =
    openSignals.filter(
      (
        signal,
      ) =>
        !signal.hasNextContact,
    ).length;

  const opportunityRate =
    unpaidRelationships > 0
      ? clamp(
          Math.round(
            (
              opportunities /
              unpaidRelationships
            ) *
              100,
          ),
        )
      : 0;

  const riskRate =
    unpaidRelationships > 0
      ? clamp(
          Math.round(
            (
              risks /
              unpaidRelationships
            ) *
              100,
          ),
        )
      : 0;

  const planningRate =
    unpaidRelationships > 0
      ? clamp(
          Math.round(
            (
              relationshipsWithNextContact /
              unpaidRelationships
            ) *
              100,
          ),
        )
      : 100;

  const conversionBase =
    paidRelationships +
    unpaidRelationships;

  const conversionRate =
    conversionBase > 0
      ? clamp(
          Math.round(
            (
              paidRelationships /
              conversionBase
            ) *
              100,
          ),
        )
      : 0;

  const commercialBalance =
    clamp(
      Math.round(
        opportunityRate *
          0.3 +
        conversionRate *
          0.25 +
        planningRate *
          0.25 +
        (
          100 -
          riskRate
        ) *
          0.2,
      ),
    );

  return {
    openRevenue,
    openRevenueUsd,

    paidRevenue,
    paidRevenueUsd,

    opportunityRevenue,
    opportunityRevenueUsd,

    riskRevenue,
    riskRevenueUsd,

    urgentRevenue,
    urgentRevenueUsd,

    stalledRevenue,
    stalledRevenueUsd,

    protectedRevenueRate:
      pygRates.protectedRevenueRate,

    openRevenueRate:
      pygRates.openRevenueRate,

    riskRevenueRate:
      pygRates.riskRevenueRate,

    opportunityRevenueRate:
      pygRates.opportunityRevenueRate,

    protectedRevenueRateUsd:
      usdRates.protectedRevenueRate,

    openRevenueRateUsd:
      usdRates.openRevenueRate,

    riskRevenueRateUsd:
      usdRates.riskRevenueRate,

    opportunityRevenueRateUsd:
      usdRates.opportunityRevenueRate,

    opportunities,
    risks,
    urgentRelationships,
    stalledRelationships,
    paidRelationships,
    unpaidRelationships,
    closedRelationships,

    relationshipsWithValue,
    relationshipsWithPygValue,
    relationshipsWithUsdValue,

    relationshipsWithNextContact,
    relationshipsWithoutNextContact,

    commercialBalance,
  };
}

function getStatus(
  metrics: PipelineMetrics,
): ExecutivePipelineStatus {
  const activePipeline =
    metrics.paidRelationships +
    metrics.unpaidRelationships;

  if (
    activePipeline === 0
  ) {
    return "attention";
  }

  if (
    metrics.urgentRelationships >= 4 ||
    (
      metrics.risks >= 4 &&
      metrics.risks >
        metrics.opportunities
    )
  ) {
    return "critical";
  }

  if (
    metrics.urgentRelationships > 0 ||
    metrics.risks >
      metrics.opportunities
  ) {
    return "risk";
  }

  if (
    metrics.opportunities === 0 ||
    metrics.relationshipsWithoutNextContact >
      metrics.relationshipsWithNextContact
  ) {
    return "attention";
  }

  return "healthy";
}

function buildCriticalNarrative(
  metrics: PipelineMetrics,
): PipelineNarrative {
  if (
    metrics.urgentRelationships >= 4
  ) {
    return {
      title:
        "Los seguimientos vencidos dominan el pipeline",
      summary:
        `${formatCount(
          metrics.urgentRelationships,
          "relación vencida",
          "relaciones vencidas",
        )} necesitan atención inmediata. ` +
        "La próxima decisión comercial es recuperar continuidad antes de ampliar el pipeline.",
      decision: {
        title:
          "Recuperar relaciones vencidas",
        description:
          "Resuelve primero los próximos contactos que ya pasaron su fecha y vuelve a ordenar el seguimiento.",
        actionLabel:
          "Revisar seguimientos vencidos",
        priority:
          "critical",
      },
    };
  }

  return {
    title:
      "Los riesgos superan las oportunidades activas",
    summary:
      `${formatCount(
        metrics.risks,
        "relación en riesgo",
        "relaciones en riesgo",
      )} compiten con ${formatCount(
        metrics.opportunities,
        "oportunidad activa",
        "oportunidades activas",
      )}. ` +
      "El pipeline necesita recuperar control antes de aumentar actividad.",
    decision: {
      title:
        "Reducir riesgo comercial",
      description:
        "Atiende primero las relaciones sin respuesta y los seguimientos vencidos.",
      actionLabel:
        "Revisar relaciones en riesgo",
      priority:
        "critical",
    },
  };
}

function buildRiskNarrative(
  metrics: PipelineMetrics,
): PipelineNarrative {
  if (
    metrics.urgentRelationships > 0
  ) {
    return {
      title:
        "Los seguimientos vencidos condicionan la próxima decisión",
      summary:
        `${formatCount(
          metrics.urgentRelationships,
          "relación",
          "relaciones",
        )} ya superaron su fecha de próximo contacto. ` +
        "La prioridad es ejecutar antes de que aumente la pérdida de continuidad.",
      decision: {
        title:
          "Eliminar primero el atraso",
        description:
          "Recupera los seguimientos vencidos y define un nuevo próximo paso para cada relación.",
        actionLabel:
          "Recuperar seguimientos",
        priority:
          "risk",
      },
    };
  }

  return {
    title:
      "El pipeline conserva movimiento, pero el riesgo necesita atención",
    summary:
      `${formatCount(
        metrics.risks,
        "relación",
        "relaciones",
      )} presentan señales de riesgo frente a ${formatCount(
        metrics.opportunities,
        "oportunidad",
        "oportunidades",
      )} activas.`,
    decision: {
      title:
        "Proteger las relaciones sensibles",
      description:
        "Recupera primero las relaciones sin respuesta antes de ampliar el volumen comercial.",
      actionLabel:
        "Revisar relaciones sensibles",
      priority:
        "risk",
    },
  };
}

function buildAttentionNarrative(
  metrics: PipelineMetrics,
): PipelineNarrative {
  const activePipeline =
    metrics.paidRelationships +
    metrics.unpaidRelationships;

  if (
    activePipeline === 0
  ) {
    return {
      title:
        "El pipeline todavía necesita relaciones activas",
      summary:
        "No existen suficientes relaciones abiertas o convertidas para construir una lectura comercial útil.",
      decision: {
        title:
          "Construir el pipeline",
        description:
          "Añade relaciones y registra su estado para que ClienteYA pueda identificar movimiento, riesgo y conversión.",
        actionLabel:
          "Crear relaciones",
        priority:
          "attention",
      },
    };
  }

  if (
    metrics.opportunities === 0
  ) {
    return {
      title:
        "El pipeline necesita oportunidades comerciales claras",
      summary:
        `${formatCount(
          metrics.unpaidRelationships,
          "relación abierta",
          "relaciones abiertas",
        )} todavía no contienen una señal explícita de interés comercial.`,
      decision: {
        title:
          "Convertir seguimiento en oportunidad",
        description:
          "Identifica cuáles relaciones muestran interés real y actualiza su estado para que el pipeline refleje la situación comercial.",
        actionLabel:
          "Revisar relaciones abiertas",
        priority:
          "attention",
      },
    };
  }

  if (
    metrics.relationshipsWithoutNextContact >
    metrics.relationshipsWithNextContact
  ) {
    return {
      title:
        "El pipeline necesita mayor disciplina de seguimiento",
      summary:
        `${formatCount(
          metrics.relationshipsWithoutNextContact,
          "relación abierta",
          "relaciones abiertas",
        )} no tienen próximo contacto definido frente a ${formatCount(
          metrics.relationshipsWithNextContact,
          "relación planificada",
          "relaciones planificadas",
        )}.`,
      decision: {
        title:
          "Definir próximos pasos",
        description:
          "Asigna una próxima fecha a las relaciones que todavía justifican seguimiento comercial.",
        actionLabel:
          "Ordenar seguimiento",
        priority:
          "attention",
      },
    };
  }

  return {
    title:
      "El pipeline necesita una prioridad comercial más clara",
    summary:
      `${formatCount(
        metrics.opportunities,
        "oportunidad activa",
        "oportunidades activas",
      )} mantienen movimiento, pero todavía no existe una señal dominante que determine la próxima decisión.`,
    decision: {
      title:
        "Concentrar la ejecución comercial",
      description:
        "Prioriza las relaciones interesadas con próximo contacto más cercano.",
      actionLabel:
        "Priorizar pipeline",
      priority:
        "attention",
    },
  };
}

function buildHealthyNarrative(
  metrics: PipelineMetrics,
): PipelineNarrative {
  return {
    title:
      "Las oportunidades activas marcan la próxima decisión comercial",
    summary:
      `${formatCount(
        metrics.opportunities,
        "oportunidad",
        "oportunidades",
      )} mantienen interés activo y el riesgo no domina el pipeline. ` +
      `${formatCount(
        metrics.paidRelationships,
        "relación",
        "relaciones",
      )} ya están marcadas como pagadas.`,
    decision: {
      title:
        "Convertir las oportunidades activas",
      description:
        "Prioriza las relaciones interesadas por próximo contacto y mantén la disciplina de seguimiento.",
      actionLabel:
        "Revisar oportunidades",
      priority:
        "healthy",
    },
  };
}

function buildNarrative(
  status: ExecutivePipelineStatus,
  metrics: PipelineMetrics,
): PipelineNarrative {
  if (
    status === "critical"
  ) {
    return buildCriticalNarrative(
      metrics,
    );
  }

  if (
    status === "risk"
  ) {
    return buildRiskNarrative(
      metrics,
    );
  }

  if (
    status === "attention"
  ) {
    return buildAttentionNarrative(
      metrics,
    );
  }

  return buildHealthyNarrative(
    metrics,
  );
}

function buildEvidenceCandidates(
  metrics: PipelineMetrics,
): PipelineEvidenceCandidate[] {
  const hasMonetaryValue =
    metrics.relationshipsWithValue >
    0;

  const activePipeline =
    metrics.paidRelationships +
    metrics.unpaidRelationships;

  const conversionRate =
    activePipeline > 0
      ? clamp(
          Math.round(
            (
              metrics.paidRelationships /
              activePipeline
            ) *
              100,
          ),
        )
      : 0;

  const opportunityRate =
    metrics.unpaidRelationships > 0
      ? clamp(
          Math.round(
            (
              metrics.opportunities /
              metrics.unpaidRelationships
            ) *
              100,
          ),
        )
      : 0;

  const riskRate =
    metrics.unpaidRelationships > 0
      ? clamp(
          Math.round(
            (
              metrics.risks /
              metrics.unpaidRelationships
            ) *
              100,
          ),
        )
      : 0;

  const planningRate =
    metrics.unpaidRelationships > 0
      ? clamp(
          Math.round(
            (
              metrics.relationshipsWithNextContact /
              metrics.unpaidRelationships
            ) *
              100,
          ),
        )
      : 100;

  return [
    {
      label:
        metrics.opportunities > 0
          ? "Las oportunidades activas sostienen el pipeline"
          : "No hay oportunidades activas identificadas",
      value:
        formatCount(
          metrics.opportunities,
          "oportunidad",
          "oportunidades",
        ),
      meaning:
        metrics.opportunities > 0
          ? `${opportunityRate}% de las relaciones abiertas están marcadas como interesadas.`
          : "Ninguna relación abierta está actualmente marcada como interesada.",
      status:
        metrics.opportunities >= 2
          ? "healthy"
          : metrics.opportunities === 1
            ? "attention"
            : "risk",
      weight:
        metrics.opportunities === 0
          ? 90
          : 100 -
            opportunityRate,
    },

    {
      label:
        metrics.risks > 0
          ? "Las relaciones sensibles necesitan protección"
          : "No existen riesgos comerciales dominantes",
      value:
        formatCount(
          metrics.risks,
          "riesgo",
          "riesgos",
        ),
      meaning:
        metrics.risks > 0
          ? `${riskRate}% de las relaciones abiertas muestran falta de respuesta o seguimiento vencido.`
          : "No hay relaciones abiertas con falta de respuesta o seguimiento vencido.",
      status:
        metrics.risks >= 4
          ? "critical"
          : metrics.risks > 0
            ? "risk"
            : "healthy",
      weight:
        metrics.risks *
          20 +
        riskRate,
    },

    {
      label:
        metrics.urgentRelationships > 0
          ? "Los seguimientos vencidos requieren ejecución"
          : "No existen seguimientos vencidos",
      value:
        formatCount(
          metrics.urgentRelationships,
          "vencido",
          "vencidos",
        ),
      meaning:
        metrics.urgentRelationships > 0
          ? "Estas relaciones ya superaron la fecha de próximo contacto."
          : "Las fechas registradas no generan atraso comercial.",
      status:
        metrics.urgentRelationships >= 4
          ? "critical"
          : metrics.urgentRelationships > 0
            ? "risk"
            : "healthy",
      weight:
        metrics.urgentRelationships *
        24,
    },

    {
      label:
        planningRate >= 60
          ? "El seguimiento del pipeline está planificado"
          : "El pipeline necesita más próximos contactos",
      value:
        `${planningRate}%`,
      meaning:
        `${formatCount(
          metrics.relationshipsWithNextContact,
          "relación abierta",
          "relaciones abiertas",
        )} tienen próximo contacto definido y ${formatCount(
          metrics.relationshipsWithoutNextContact,
          "relación",
          "relaciones",
        )} no tienen fecha.`,
      status:
        planningRate >= 70
          ? "healthy"
          : planningRate >= 45
            ? "attention"
            : "risk",
      weight:
        planningRate >= 70
          ? 30
          : 100 -
            planningRate,
    },

    {
      label:
        metrics.paidRelationships > 0
          ? "Las conversiones ya son visibles"
          : "Todavía no hay relaciones pagadas",
      value:
        formatCount(
          metrics.paidRelationships,
          "pagada",
          "pagadas",
        ),
      meaning:
        activePipeline > 0
          ? `${conversionRate}% de la base comercial activa está marcada como pagada.`
          : "Todavía no existe una base comercial suficiente para medir conversión.",
      status:
        conversionRate >= 40
          ? "healthy"
          : metrics.paidRelationships > 0
            ? "attention"
            : "risk",
      weight:
        metrics.paidRelationships > 0
          ? 100 -
            conversionRate
          : 75,
    },

    {
      label:
        hasMonetaryValue
          ? "El valor económico registrado es visible"
          : "Relaciones todavía sin valor monetario registrado",
      value:
        formatRevenuePosition({
          pyg:
            metrics.openRevenue,
          usd:
            metrics.openRevenueUsd,
        }),
      meaning:
        hasMonetaryValue
          ? `Abierto: ${formatRevenuePosition({
              pyg:
                metrics.openRevenue,
              usd:
                metrics.openRevenueUsd,
            })}. Confirmado: ${formatRevenuePosition({
              pyg:
                metrics.paidRevenue,
              usd:
                metrics.paidRevenueUsd,
            })}.`
          : "Relaciones todavía no registra montos suficientes. ClienteYA no convierte ausencia de valor en Gs. 0 como señal comercial.",
      status:
        hasMonetaryValue
          ? "healthy"
          : "attention",
      weight:
        hasMonetaryValue
          ? 20
          : 55,
    },

    {
      label:
        metrics.commercialBalance >= 70
          ? "El pipeline mantiene equilibrio comercial"
          : metrics.commercialBalance >= 50
            ? "El equilibrio comercial necesita disciplina"
            : "El pipeline necesita mayor control",
      value:
        `${metrics.commercialBalance}/100`,
      meaning:
        "La puntuación combina oportunidades, conversiones, planificación y riesgo usando únicamente señales disponibles en Relaciones.",
      status:
        metrics.commercialBalance >= 70
          ? "healthy"
          : metrics.commercialBalance >= 50
            ? "attention"
            : metrics.commercialBalance >= 30
              ? "risk"
              : "critical",
      weight:
        metrics.commercialBalance >= 70
          ? 30
          : 100 -
            metrics.commercialBalance,
    },
  ];
}

function buildEvidence(
  metrics: PipelineMetrics,
): ExecutivePipelineEvidence[] {
  const candidates =
    buildEvidenceCandidates(
      metrics,
    );

  const criticalEvidence =
    candidates
      .filter(
        (
          evidence,
        ) =>
          evidence.status ===
            "critical" ||
          evidence.status ===
            "risk",
      )
      .sort(
        (
          first,
          second,
        ) =>
          second.weight -
          first.weight,
      );

  const remainingEvidence =
    candidates
      .filter(
        (
          evidence,
        ) =>
          evidence.status !==
            "critical" &&
          evidence.status !==
            "risk",
      )
      .sort(
        (
          first,
          second,
        ) =>
          second.weight -
          first.weight,
      );

  return [
    ...criticalEvidence,
    ...remainingEvidence,
  ]
    .slice(
      0,
      5,
    )
    .map(
      (
        {
          weight,
          ...evidence
        },
      ) =>
        evidence,
    );
}

export function buildExecutiveCommercialPipelineChapter(
  relationships: CommercialActionRelationship[],
): ExecutiveCommercialPipelineChapter {
  const metrics =
    buildPipelineMetrics(
      relationships,
    );

  const status =
    getStatus(
      metrics,
    );

  const narrative =
    buildNarrative(
      status,
      metrics,
    );

  return {
    question:
      "¿Dónde está mi próxima decisión de ingresos?",

    status,

    title:
      narrative.title,

    summary:
      narrative.summary,

    evidence:
      buildEvidence(
        metrics,
      ),

    decision:
      narrative.decision,

    opportunityCount:
      metrics.opportunities,

    /*
     * Existing cockpit contract remains PYG here.
     * USD is represented separately inside the chapter evidence
     * and is never added to PYG.
     */
    openRevenue:
      metrics.openRevenue,
  };
}