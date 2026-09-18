import type {
  CommercialRelationship as CommercialActionRelationship,
} from "./commercial-action-engine";

export type ExecutiveCustomerStatus =
  | "healthy"
  | "attention"
  | "risk"
  | "critical";

export type ExecutiveCustomerEvidence = {
  label: string;
  value: string;
  meaning: string;
  status: ExecutiveCustomerStatus;
};

export type ExecutiveCustomerDecision = {
  title: string;
  description: string;
  actionLabel: string;
  priority: ExecutiveCustomerStatus;
};

export type ExecutiveCustomerIntelligenceChapter = {
  question: "¿Qué relaciones explican mis resultados?";
  status: ExecutiveCustomerStatus;
  title: string;
  summary: string;
  evidence: ExecutiveCustomerEvidence[];
  decision: ExecutiveCustomerDecision;
  activeRelationships: number;
  overdueRelationships: number;
};

type CustomerRelationshipSignal = {
  value: number;
  currency: "PYG" | "USD";
  daysUntilContact: number | null;
  isActive: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
  isSilent: boolean;
  isCooling: boolean;
  isStrategic: boolean;
  isOpportunity: boolean;
  isRisk: boolean;
  isPaid: boolean;
  isClosed: boolean;
  hasNextContact: boolean;
};

type CustomerMetrics = {
  totalRelationships: number;
  totalValue: number;
  paidValue: number;
  openValue: number;
  totalValueUsd: number;
  paidValueUsd: number;
  openValueUsd: number;
  relationshipsWithValue: number;
  activeRelationships: number;
  overdueRelationships: number;
  todayRelationships: number;
  dueSoonRelationships: number;
  silentRelationships: number;
  coolingRelationships: number;
  strategicRelationships: number;
  opportunityRelationships: number;
  riskRelationships: number;
  paidRelationships: number;
  unpaidRelationships: number;
  closedRelationships: number;
  relationshipsWithNextContact: number;
  relationshipsWithoutNextContact: number;
  activeRelationshipRate: number;
  silentRelationshipRate: number;
  planningRate: number;
  relationshipHealth: number;
};

type CustomerNarrative = {
  title: string;
  summary: string;
  decision: ExecutiveCustomerDecision;
};

type CustomerEvidenceCandidate =
  ExecutiveCustomerEvidence & {
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

function formatCommercialValue(
  pygValue: number,
  usdValue: number,
) {
  const values: string[] = [];

  if (
    pygValue > 0
  ) {
    values.push(
      formatGs(
        pygValue,
      ),
    );
  }

  if (
    usdValue > 0
  ) {
    values.push(
      formatUsd(
        usdValue,
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

function getRelationshipCurrency(
  relationship: CommercialActionRelationship,
): "PYG" | "USD" {
  return relationship.currency === "USD"
    ? "USD"
    : "PYG";
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

function getExpectedAmount(
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

function getPaidAmount(
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
    ? getPaidAmount(
        relationship,
      )
    : getExpectedAmount(
        relationship,
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

  return normalizeText(
    relationship.status,
  ).includes(
    "cerr",
  );
}

function getNextContactDays(
  relationship: CommercialActionRelationship,
) {
  const nextContactAt =
    toISODate(
      relationship.next_contact_at,
    );

  if (
    !nextContactAt
  ) {
    return null;
  }

  return diffInDays(
    todayISO(),
    nextContactAt,
  );
}

function isOpportunityStatus(
  status: string,
) {
  return (
    status.includes("interes")
  );
}

function isContactedStatus(
  status: string,
) {
  return (
    status.includes("contact")
  );
}

function isNewStatus(
  status: string,
) {
  return (
    status.includes("nuevo") ||
    status.includes("lead")
  );
}

function isNoResponseStatus(
  status: string,
) {
  return (
    status.includes("sin respuesta")
  );
}

function buildRelationshipSignals(
  relationships: CommercialActionRelationship[],
): CustomerRelationshipSignal[] {
  return relationships.map(
    (
      relationship,
    ) => {
      const value =
        getRelationshipValue(
          relationship,
        );

      const currency =
        getRelationshipCurrency(
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

      const status =
        normalizeText(
          relationship.status,
        );

      const daysUntilContact =
        getNextContactDays(
          relationship,
        );

      const hasNextContact =
        typeof daysUntilContact ===
        "number";

      const isOverdue =
        !isPaid &&
        !isClosed &&
        hasNextContact &&
        daysUntilContact < 0;

      const isDueToday =
        !isPaid &&
        !isClosed &&
        daysUntilContact === 0;

      const isDueSoon =
        !isPaid &&
        !isClosed &&
        hasNextContact &&
        daysUntilContact > 0 &&
        daysUntilContact <= 3;

      const isOpportunity =
        !isPaid &&
        !isClosed &&
        isOpportunityStatus(
          status,
        );

      const isSilent =
        !isPaid &&
        !isClosed &&
        isNoResponseStatus(
          status,
        );

      const isCooling =
        !isPaid &&
        !isClosed &&
        (
          isSilent ||
          (
            hasNextContact &&
            daysUntilContact < -3
          )
        );

      const isRisk =
        !isPaid &&
        !isClosed &&
        (
          isSilent ||
          isOverdue
        );

      const isActive =
        !isClosed &&
        (
          isPaid ||
          isOpportunity ||
          isContactedStatus(
            status,
          ) ||
          isNewStatus(
            status,
          ) ||
          hasNextContact
        );

      const isStrategic =
        !isPaid &&
        !isClosed &&
        (
          isOpportunity ||
          isRisk ||
          isDueToday ||
          isDueSoon
        );

      return {
        value,
        currency,
        daysUntilContact,
        isActive,
        isOverdue,
        isDueToday,
        isDueSoon,
        isSilent,
        isCooling,
        isStrategic,
        isOpportunity,
        isRisk,
        isPaid,
        isClosed,
        hasNextContact,
      };
    },
  );
}

function buildCustomerMetrics(
  relationships: CommercialActionRelationship[],
): CustomerMetrics {
  const signals =
    buildRelationshipSignals(
      relationships,
    );

  const totalValue =
    signals.reduce(
      (
        total,
        signal,
      ) =>
        signal.currency ===
          "PYG"
          ? total +
            signal.value
          : total,
      0,
    );

  const totalValueUsd =
    signals.reduce(
      (
        total,
        signal,
      ) =>
        signal.currency ===
          "USD"
          ? total +
            signal.value
          : total,
      0,
    );

  const paidValue =
    signals.reduce(
      (
        total,
        signal,
      ) =>
        signal.isPaid &&
        signal.currency ===
          "PYG"
          ? total +
            signal.value
          : total,
      0,
    );

  const paidValueUsd =
    signals.reduce(
      (
        total,
        signal,
      ) =>
        signal.isPaid &&
        signal.currency ===
          "USD"
          ? total +
            signal.value
          : total,
      0,
    );

  const openValue =
    signals.reduce(
      (
        total,
        signal,
      ) =>
        !signal.isPaid &&
        !signal.isClosed &&
        signal.currency ===
          "PYG"
          ? total +
            signal.value
          : total,
      0,
    );

  const openValueUsd =
    signals.reduce(
      (
        total,
        signal,
      ) =>
        !signal.isPaid &&
        !signal.isClosed &&
        signal.currency ===
          "USD"
          ? total +
            signal.value
          : total,
      0,
    );

  const relationshipsWithValue =
    signals.filter(
      (
        signal,
      ) =>
        signal.value > 0,
    ).length;

  const activeRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isActive,
    ).length;

  const overdueRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isOverdue,
    ).length;

  const todayRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isDueToday,
    ).length;

  const dueSoonRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isDueSoon,
    ).length;

  const silentRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isSilent,
    ).length;

  const coolingRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isCooling,
    ).length;

  const strategicRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isStrategic,
    ).length;

  const opportunityRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isOpportunity,
    ).length;

  const riskRelationships =
    signals.filter(
      (
        signal,
      ) =>
        signal.isRisk,
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
    signals.filter(
      (
        signal,
      ) =>
        !signal.isPaid &&
        !signal.isClosed,
    ).length;

  const openSignals =
    signals.filter(
      (
        signal,
      ) =>
        !signal.isPaid &&
        !signal.isClosed,
    );

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

  const totalRelationships =
    signals.length;

  const activeRelationshipRate =
    totalRelationships > 0
      ? clamp(
          Math.round(
            (
              activeRelationships /
              totalRelationships
            ) *
              100,
          ),
        )
      : 0;

  const silentRelationshipRate =
    unpaidRelationships > 0
      ? clamp(
          Math.round(
            (
              silentRelationships /
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

  const overdueRate =
    unpaidRelationships > 0
      ? clamp(
          Math.round(
            (
              overdueRelationships /
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
              riskRelationships /
              unpaidRelationships
            ) *
              100,
          ),
        )
      : 0;

  const opportunityRate =
    unpaidRelationships > 0
      ? clamp(
          Math.round(
            (
              opportunityRelationships /
              unpaidRelationships
            ) *
              100,
          ),
        )
      : 0;

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

  const relationshipHealth =
    clamp(
      Math.round(
        activeRelationshipRate *
          0.25 +
        planningRate *
          0.2 +
        conversionRate *
          0.2 +
        (
          100 -
          overdueRate
        ) *
          0.15 +
        (
          100 -
          riskRate
        ) *
          0.15 +
        opportunityRate *
          0.05,
      ),
    );

  return {
    totalRelationships,
    totalValue,
    paidValue,
    openValue,
    totalValueUsd,
    paidValueUsd,
    openValueUsd,
    relationshipsWithValue,
    activeRelationships,
    overdueRelationships,
    todayRelationships,
    dueSoonRelationships,
    silentRelationships,
    coolingRelationships,
    strategicRelationships,
    opportunityRelationships,
    riskRelationships,
    paidRelationships,
    unpaidRelationships,
    closedRelationships,
    relationshipsWithNextContact,
    relationshipsWithoutNextContact,
    activeRelationshipRate,
    silentRelationshipRate,
    planningRate,
    relationshipHealth,
  };
}

function getChapterStatus(
  metrics: CustomerMetrics,
): ExecutiveCustomerStatus {
  if (
    metrics.totalRelationships === 0
  ) {
    return "attention";
  }

  if (
    metrics.overdueRelationships >= 5 ||
    (
      metrics.riskRelationships >= 5 &&
      metrics.riskRelationships >
        metrics.opportunityRelationships
    ) ||
    metrics.relationshipHealth < 35
  ) {
    return "critical";
  }

  if (
    metrics.overdueRelationships >= 3 ||
    metrics.riskRelationships >
      metrics.opportunityRelationships ||
    metrics.relationshipHealth < 55
  ) {
    return "risk";
  }

  if (
    metrics.overdueRelationships > 0 ||
    metrics.coolingRelationships > 0 ||
    metrics.relationshipsWithoutNextContact >
      metrics.relationshipsWithNextContact ||
    metrics.relationshipHealth < 70
  ) {
    return "attention";
  }

  return "healthy";
}

function buildCriticalNarrative(
  metrics: CustomerMetrics,
): CustomerNarrative {
  if (
    metrics.overdueRelationships >= 5
  ) {
    return {
      title:
        "Los seguimientos vencidos están debilitando la cartera",
      summary:
        `${formatCount(
          metrics.overdueRelationships,
          "relación vencida",
          "relaciones vencidas",
        )} necesitan atención inmediata. ` +
        "La prioridad es recuperar continuidad antes de ampliar el número de relaciones.",
      decision: {
        title:
          "Recuperar las relaciones vencidas",
        description:
          "Atiende primero los próximos contactos que ya superaron su fecha y define un nuevo paso para cada relación.",
        actionLabel:
          "Revisar seguimientos vencidos",
        priority:
          "critical",
      },
    };
  }

  if (
    metrics.riskRelationships >= 5
  ) {
    return {
      title:
        "Demasiadas relaciones abiertas muestran riesgo",
      summary:
        `${formatCount(
          metrics.riskRelationships,
          "relación en riesgo",
          "relaciones en riesgo",
        )} requieren atención frente a ${formatCount(
          metrics.opportunityRelationships,
          "oportunidad activa",
          "oportunidades activas",
        )}.`,
      decision: {
        title:
          "Reducir riesgo relacional",
        description:
          "Recupera primero las relaciones sin respuesta y los seguimientos vencidos.",
        actionLabel:
          "Revisar relaciones en riesgo",
        priority:
          "critical",
      },
    };
  }

  return {
    title:
      "La base relacional necesita recuperar control",
    summary:
      `La salud relacional está en ${metrics.relationshipHealth}/100. ` +
      "La combinación de seguimiento, riesgo y conversión necesita una intervención más disciplinada.",
    decision: {
      title:
        "Recuperar control de la cartera",
      description:
        "Prioriza las relaciones vencidas, sensibles y con intención comercial visible.",
      actionLabel:
        "Revisar cartera crítica",
      priority:
        "critical",
    },
  };
}

function buildRiskNarrative(
  metrics: CustomerMetrics,
): CustomerNarrative {
  if (
    metrics.overdueRelationships >= 3
  ) {
    return {
      title:
        "El atraso está reduciendo la calidad de la cartera",
      summary:
        `${formatCount(
          metrics.overdueRelationships,
          "relación vencida",
          "relaciones vencidas",
        )} ya necesitan recuperación. ` +
        "La cartera conserva valor, pero la disciplina de seguimiento está perdiendo consistencia.",
      decision: {
        title:
          "Eliminar la deuda de seguimiento",
        description:
          "Recupera primero las relaciones vencidas y protege después los contactos próximos.",
        actionLabel:
          "Recuperar relaciones",
        priority:
          "risk",
      },
    };
  }

  if (
    metrics.riskRelationships >
    metrics.opportunityRelationships
  ) {
    return {
      title:
        "Los riesgos relacionales superan las oportunidades activas",
      summary:
        `${formatCount(
          metrics.riskRelationships,
          "relación en riesgo",
          "relaciones en riesgo",
        )} compiten con ${formatCount(
          metrics.opportunityRelationships,
          "oportunidad",
          "oportunidades",
        )}.`,
      decision: {
        title:
          "Recuperar equilibrio relacional",
        description:
          "Resuelve primero las relaciones sin respuesta y continúa después con las oportunidades activas.",
        actionLabel:
          "Equilibrar cartera",
        priority:
          "risk",
      },
    };
  }

  return {
    title:
      "La cartera conserva movimiento, pero necesita más consistencia",
    summary:
      `La salud relacional está en ${metrics.relationshipHealth}/100. ` +
      "El seguimiento y la planificación todavía pueden mejorar antes de ampliar actividad.",
    decision: {
      title:
        "Fortalecer consistencia relacional",
      description:
        "Mantén próximos contactos claros y elimina atrasos antes de aumentar el volumen.",
      actionLabel:
        "Revisar relaciones",
      priority:
        "risk",
    },
  };
}

function buildAttentionNarrative(
  metrics: CustomerMetrics,
): CustomerNarrative {
  if (
    metrics.overdueRelationships > 0
  ) {
    return {
      title:
        "Los atrasos empiezan a explicar la presión relacional",
      summary:
        `${formatCount(
          metrics.overdueRelationships,
          "relación atrasada",
          "relaciones atrasadas",
        )} necesitan contacto. ` +
        "La cartera sigue siendo viable, pero la disciplina de seguimiento empieza a influir en sus resultados.",
      decision: {
        title:
          "Eliminar la deuda de seguimiento",
        description:
          `Recupera primero las relaciones vencidas y prepara después ${formatCount(
            metrics.dueSoonRelationships,
            "contacto próximo",
            "contactos próximos",
          )}.`,
        actionLabel:
          "Revisar seguimientos",
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
        "La cartera necesita más próximos pasos definidos",
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
          "Ordenar la continuidad relacional",
        description:
          "Asigna próximo contacto solo a las relaciones que realmente justifican seguimiento.",
        actionLabel:
          "Ordenar relaciones",
        priority:
          "attention",
      },
    };
  }

  if (
    metrics.opportunityRelationships === 0
  ) {
    return {
      title:
        "La cartera necesita más intención comercial visible",
      summary:
        `${formatCount(
          metrics.unpaidRelationships,
          "relación abierta",
          "relaciones abiertas",
        )} todavía no contienen una señal explícita de interés comercial.`,
      decision: {
        title:
          "Identificar relaciones con intención",
        description:
          "Actualiza el estado de las relaciones cuando exista interés real para que ClienteYA pueda distinguir seguimiento de oportunidad.",
        actionLabel:
          "Revisar relaciones abiertas",
        priority:
          "attention",
      },
    };
  }

  return {
    title:
      "La cartera es estable, pero necesita una prioridad relacional más clara",
    summary:
      `La salud relacional está en ${metrics.relationshipHealth}/100. ` +
      "No existe una señal crítica dominante, aunque todavía hay margen para mejorar seguimiento y conversión.",
    decision: {
      title:
        "Concentrar la atención relacional",
      description:
        "Prioriza relaciones interesadas, contactos próximos y casos sin respuesta.",
      actionLabel:
        "Revisar relaciones prioritarias",
      priority:
        "attention",
    },
  };
}

function buildHealthyNarrative(
  metrics: CustomerMetrics,
): CustomerNarrative {
  return {
    title:
      "Las relaciones mantienen una base comercial saludable",
    summary:
      `${formatCount(
        metrics.opportunityRelationships,
        "oportunidad activa",
        "oportunidades activas",
      )} mantienen intención comercial y ${formatCount(
        metrics.paidRelationships,
        "relación",
        "relaciones",
      )} ya están marcadas como pagadas. ` +
      "No existe una señal dominante de deterioro.",
    decision: {
      title:
        "Mantener disciplina relacional",
      description:
        "Sostén el ritmo de contacto y protege las relaciones con intención y próximo paso definido.",
      actionLabel:
        "Mantener ritmo relacional",
      priority:
        "healthy",
    },
  };
}

function buildNarrative(
  status: ExecutiveCustomerStatus,
  metrics: CustomerMetrics,
): CustomerNarrative {
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
  metrics: CustomerMetrics,
): CustomerEvidenceCandidate[] {
  return [
    {
      label:
        metrics.overdueRelationships > 0
          ? "La deuda de seguimiento afecta la continuidad"
          : "La disciplina de seguimiento está protegida",
      value:
        formatCount(
          metrics.overdueRelationships,
          "vencida",
          "vencidas",
        ),
      meaning:
        metrics.overdueRelationships > 0
          ? `${formatCount(
              metrics.overdueRelationships,
              "relación",
              "relaciones",
            )} superaron su fecha de próximo contacto.`
          : "No existen relaciones vencidas que requieran recuperación inmediata.",
      status:
        metrics.overdueRelationships >= 5
          ? "critical"
          : metrics.overdueRelationships >= 3
            ? "risk"
            : metrics.overdueRelationships > 0
              ? "attention"
              : "healthy",
      weight:
        metrics.overdueRelationships *
        22,
    },

    {
      label:
        metrics.silentRelationships > 0
          ? "Las relaciones sin respuesta necesitan atención"
          : "No existe silencio relacional dominante",
      value:
        formatCount(
          metrics.silentRelationships,
          "sin respuesta",
          "sin respuesta",
        ),
      meaning:
        metrics.silentRelationships > 0
          ? `${metrics.silentRelationshipRate}% de las relaciones abiertas están marcadas como sin respuesta.`
          : "Ninguna relación abierta está actualmente marcada como sin respuesta.",
      status:
        metrics.silentRelationshipRate >= 50
          ? "critical"
          : metrics.silentRelationshipRate >= 30
            ? "risk"
            : metrics.silentRelationships > 0
              ? "attention"
              : "healthy",
      weight:
        metrics.silentRelationshipRate +
        metrics.silentRelationships *
          10,
    },

    {
      label:
        metrics.opportunityRelationships > 0
          ? "Las relaciones interesadas sostienen crecimiento"
          : "Todavía no hay oportunidades activas identificadas",
      value:
        formatCount(
          metrics.opportunityRelationships,
          "oportunidad",
          "oportunidades",
        ),
      meaning:
        metrics.opportunityRelationships > 0
          ? "Estas relaciones están marcadas como interesadas y representan intención comercial visible."
          : "Ninguna relación abierta está actualmente marcada como interesada.",
      status:
        metrics.opportunityRelationships >= 2
          ? "healthy"
          : metrics.opportunityRelationships === 1
            ? "attention"
            : "risk",
      weight:
        metrics.opportunityRelationships === 0
          ? 80
          : 40,
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
        metrics.paidRelationships > 0
          ? "Estas relaciones están registradas como pagadas dentro de Relaciones."
          : "La cartera todavía no contiene relaciones marcadas como pagadas.",
      status:
        metrics.paidRelationships > 0
          ? "healthy"
          : metrics.totalRelationships > 0
            ? "attention"
            : "risk",
      weight:
        metrics.paidRelationships > 0
          ? 30
          : 60,
    },

    {
      label:
        metrics.planningRate >= 60
          ? "La continuidad está planificada"
          : "Faltan próximos contactos en la cartera",
      value:
        `${metrics.planningRate}%`,
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
        metrics.planningRate >= 70
          ? "healthy"
          : metrics.planningRate >= 45
            ? "attention"
            : "risk",
      weight:
        metrics.planningRate >= 70
          ? 30
          : 100 -
            metrics.planningRate,
    },

    {
      label:
        metrics.relationshipHealth >= 70
          ? "La cartera mantiene salud relacional"
          : metrics.relationshipHealth >= 50
            ? "La salud relacional necesita disciplina"
            : "La salud relacional está debilitada",
      value:
        `${metrics.relationshipHealth}/100`,
      meaning:
        "La puntuación combina actividad, planificación, conversión, atrasos, riesgo e intención usando únicamente señales disponibles en Relaciones.",
      status:
        metrics.relationshipHealth >= 70
          ? "healthy"
          : metrics.relationshipHealth >= 50
            ? "attention"
            : metrics.relationshipHealth >= 35
              ? "risk"
              : "critical",
      weight:
        metrics.relationshipHealth >= 70
          ? 35
          : 100 -
            metrics.relationshipHealth,
    },

    {
      label:
        metrics.relationshipsWithValue > 0
          ? "Existe valor monetario registrado"
          : "Relaciones todavía no registra valor monetario",
      value:
        metrics.relationshipsWithValue > 0
          ? formatCommercialValue(
              metrics.totalValue,
              metrics.totalValueUsd,
            )
          : "Sin valor registrado",
      meaning:
        metrics.relationshipsWithValue > 0
          ? `Abierto: ${formatCommercialValue(
              metrics.openValue,
              metrics.openValueUsd,
            )}. Confirmado: ${formatCommercialValue(
              metrics.paidValue,
              metrics.paidValueUsd,
            )}.`
          : "ClienteYA no debe interpretar la ausencia de montos como relaciones sin valor comercial.",
      status:
        metrics.relationshipsWithValue > 0
          ? "healthy"
          : "attention",
      weight:
        metrics.relationshipsWithValue > 0
          ? 20
          : 45,
    },
  ];
}

function buildEvidence(
  metrics: CustomerMetrics,
): ExecutiveCustomerEvidence[] {
  const candidates =
    buildEvidenceCandidates(
      metrics,
    );

  const pressureEvidence =
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
    ...pressureEvidence,
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

export function buildExecutiveCustomerIntelligenceChapter(
  relationships: CommercialActionRelationship[],
): ExecutiveCustomerIntelligenceChapter {
  const metrics =
    buildCustomerMetrics(
      relationships,
    );

  const status =
    getChapterStatus(
      metrics,
    );

  const narrative =
    buildNarrative(
      status,
      metrics,
    );

  return {
    question:
      "¿Qué relaciones explican mis resultados?",

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

    activeRelationships:
      metrics.activeRelationships,

    overdueRelationships:
      metrics.overdueRelationships,
  };
}