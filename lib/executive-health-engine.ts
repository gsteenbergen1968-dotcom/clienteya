export type ExecutiveHealthStatus =
  | "critical"
  | "attention"
  | "healthy"
  | "excellent";

export type ExecutiveHealthTrend =
  | "improving"
  | "stable"
  | "declining";

export type ExecutiveHealthDriverTone =
  | "positive"
  | "warning"
  | "critical"
  | "neutral";

export type ExecutiveHealthDecisionType =
  | "continue-growth"
  | "reduce-pressure"
  | "protect-revenue"
  | "recover-followups"
  | "stabilize-operation";

export type ExecutiveHealthInput = {
  founderScore: number;
  revenueMomentum: number;
  operationalPressure: number;
  executionQuality: number;
  pipelineVelocity: number;

  confirmedRevenue: number;
  openRevenue: number;

  confirmedRevenueUsd?: number;
  openRevenueUsd?: number;

  paidRelationships: number;
  unpaidRelationships: number;
  overdueFollowups: number;
  dueSoonFollowups: number;
  recentRelationships: number;
  stalledRelationships: number;
  riskCount: number;
  opportunityCount: number;
  followupCount: number;
};

export type ExecutiveHealthDriver = {
  id: string;
  title: string;
  description: string;
  tone: ExecutiveHealthDriverTone;
  value: string;
};

export type ExecutiveHealthDecision = {
  type: ExecutiveHealthDecisionType;
  title: string;
  description: string;
  actionLabel: string;
};

export type ExecutiveHealthReport = {
  question: "¿Qué limita hoy la salud de mi empresa?";
  score: number;
  status: ExecutiveHealthStatus;
  trend: ExecutiveHealthTrend;
  title: string;
  summary: string;
  drivers: ExecutiveHealthDriver[];
  decision: ExecutiveHealthDecision;
};

type ExecutiveHealthNarrative = {
  title: string;
  summary: string;
  decision: ExecutiveHealthDecision;
};

type ExecutiveHealthDriverCandidate =
  ExecutiveHealthDriver & {
    weight: number;
  };

type ExecutiveHealthSignals = {
  revenueExposure: number;
  followupPressure: number;
  relationshipPaymentPressure: number;
  stalledPressure: number;
  riskPressure: number;
  opportunityStrength: number;
  executionStrength: number;
  commercialStrength: number;
};

type RevenueSnapshot = {
  pygConfirmed: number;
  pygOpen: number;
  usdConfirmed: number;
  usdOpen: number;
  pygTotal: number;
  usdTotal: number;
  pygExposure: number | null;
  usdExposure: number | null;
  combinedExposure: number;
  hasRevenueEvidence: boolean;
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
  if (typeof value !== "number") {
    return 0;
  }

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function safeScore(
  value: number | null | undefined,
) {
  return clamp(
    safeNumber(value),
  );
}

function formatGs(
  value: number,
) {
  return `Gs. ${Math.round(
    Math.max(0, value),
  ).toLocaleString("es-PY")}`;
}

function formatUsd(
  value: number,
) {
  return `USD ${Math.round(
    Math.max(0, value),
  ).toLocaleString("en-US")}`;
}

function formatCount(
  value: number,
  singular: string,
  plural: string,
) {
  const normalizedValue = Math.max(
    0,
    Math.round(value),
  );

  return `${normalizedValue} ${
    normalizedValue === 1
      ? singular
      : plural
  }`;
}

function normalizeInput(
  input: ExecutiveHealthInput,
): Required<ExecutiveHealthInput> {
  return {
    founderScore:
      safeScore(input.founderScore),

    revenueMomentum:
      safeScore(input.revenueMomentum),

    operationalPressure:
      safeScore(input.operationalPressure),

    executionQuality:
      safeScore(input.executionQuality),

    pipelineVelocity:
      safeScore(input.pipelineVelocity),

    confirmedRevenue:
      safeNumber(input.confirmedRevenue),

    openRevenue:
      safeNumber(input.openRevenue),

    confirmedRevenueUsd:
      safeNumber(
        input.confirmedRevenueUsd,
      ),

    openRevenueUsd:
      safeNumber(
        input.openRevenueUsd,
      ),

    paidRelationships:
      safeNumber(input.paidRelationships),

    unpaidRelationships:
      safeNumber(input.unpaidRelationships),

    overdueFollowups:
      safeNumber(input.overdueFollowups),

    dueSoonFollowups:
      safeNumber(input.dueSoonFollowups),

    recentRelationships:
      safeNumber(input.recentRelationships),

    stalledRelationships:
      safeNumber(input.stalledRelationships),

    riskCount:
      safeNumber(input.riskCount),

    opportunityCount:
      safeNumber(input.opportunityCount),

    followupCount:
      safeNumber(input.followupCount),
  };
}

function buildRevenueSnapshot(
  input: Required<ExecutiveHealthInput>,
): RevenueSnapshot {
  const pygConfirmed =
    input.confirmedRevenue;

  const pygOpen =
    input.openRevenue;

  const usdConfirmed =
    input.confirmedRevenueUsd;

  const usdOpen =
    input.openRevenueUsd;

  const pygTotal =
    pygConfirmed +
    pygOpen;

  const usdTotal =
    usdConfirmed +
    usdOpen;

  const pygExposure =
    pygTotal > 0
      ? clamp(
          Math.round(
            (
              pygOpen /
              pygTotal
            ) *
              100,
          ),
        )
      : null;

  const usdExposure =
    usdTotal > 0
      ? clamp(
          Math.round(
            (
              usdOpen /
              usdTotal
            ) *
              100,
          ),
        )
      : null;

  const exposureValues = [
    pygExposure,
    usdExposure,
  ].filter(
    (
      value,
    ): value is number =>
      value !== null,
  );

  const combinedExposure =
    exposureValues.length > 0
      ? clamp(
          Math.round(
            exposureValues.reduce(
              (
                total,
                value,
              ) =>
                total +
                value,
              0,
            ) /
              exposureValues.length,
          ),
        )
      : 0;

  return {
    pygConfirmed,
    pygOpen,
    usdConfirmed,
    usdOpen,
    pygTotal,
    usdTotal,
    pygExposure,
    usdExposure,
    combinedExposure,
    hasRevenueEvidence:
      pygTotal > 0 ||
      usdTotal > 0,
  };
}

function buildRevenuePositionText(
  revenue: RevenueSnapshot,
) {
  const parts: string[] = [];

  if (revenue.pygTotal > 0) {
    parts.push(
      `${formatGs(
        revenue.pygOpen,
      )} abiertos frente a ${formatGs(
        revenue.pygConfirmed,
      )} confirmados`,
    );
  }

  if (revenue.usdTotal > 0) {
    parts.push(
      `${formatUsd(
        revenue.usdOpen,
      )} abiertos frente a ${formatUsd(
        revenue.usdConfirmed,
      )} confirmados`,
    );
  }

  if (parts.length === 0) {
    return "Todavía no existe valor comercial suficiente para evaluar conversión de ingresos.";
  }

  return parts.join(
    " · ",
  );
}

function buildSignals(
  input: Required<ExecutiveHealthInput>,
  revenue: RevenueSnapshot,
): ExecutiveHealthSignals {
  const revenueExposure =
    revenue.combinedExposure;

  const totalRelationships =
    input.paidRelationships +
    input.unpaidRelationships;

  const relationshipPaymentPressure =
    totalRelationships > 0
      ? clamp(
          Math.round(
            (
              input.unpaidRelationships /
              totalRelationships
            ) *
              100,
          ),
        )
      : 0;

  const followupBase = Math.max(
    1,
    input.followupCount +
      input.overdueFollowups +
      input.dueSoonFollowups,
  );

  const followupPressure =
    clamp(
      Math.round(
        (
          (
            input.overdueFollowups *
              1.5 +
            input.dueSoonFollowups *
              0.5
          ) /
          followupBase
        ) *
          100,
      ),
    );

  const stalledBase = Math.max(
    1,
    input.recentRelationships +
      input.stalledRelationships +
      input.opportunityCount,
  );

  const stalledPressure =
    clamp(
      Math.round(
        (
          input.stalledRelationships /
          stalledBase
        ) *
          100,
      ),
    );

  const riskBase = Math.max(
    1,
    input.riskCount +
      input.opportunityCount,
  );

  const riskPressure =
    clamp(
      Math.round(
        (
          input.riskCount /
          riskBase
        ) *
          100,
      ),
    );

  const opportunityStrength =
    clamp(
      Math.round(
        input.pipelineVelocity *
          0.45 +
          input.revenueMomentum *
            0.35 +
          Math.min(
            100,
            input.opportunityCount *
              10,
          ) *
            0.2,
      ),
    );

  const executionStrength =
    clamp(
      Math.round(
        input.executionQuality *
          0.55 +
          input.founderScore *
            0.25 +
          (
            100 -
            input.operationalPressure
          ) *
            0.2,
      ),
    );

  const commercialStrength =
    clamp(
      Math.round(
        input.revenueMomentum *
          0.35 +
          input.pipelineVelocity *
            0.35 +
          input.executionQuality *
            0.3,
      ),
    );

  return {
    revenueExposure,
    followupPressure,
    relationshipPaymentPressure,
    stalledPressure,
    riskPressure,
    opportunityStrength,
    executionStrength,
    commercialStrength,
  };
}

function getStatus(
  score: number,
): ExecutiveHealthStatus {
  if (score >= 85) {
    return "excellent";
  }

  if (score >= 70) {
    return "healthy";
  }

  if (score >= 50) {
    return "attention";
  }

  return "critical";
}

function getTrend(
  input: Required<ExecutiveHealthInput>,
  signals: ExecutiveHealthSignals,
): ExecutiveHealthTrend {
  const positiveSignals =
    input.revenueMomentum *
      0.3 +
    input.executionQuality *
      0.25 +
    input.pipelineVelocity *
      0.25 +
    signals.opportunityStrength *
      0.2;

  const negativeSignals =
    input.operationalPressure *
      0.3 +
    signals.followupPressure *
      0.25 +
    signals.stalledPressure *
      0.2 +
    signals.riskPressure *
      0.15 +
    signals.relationshipPaymentPressure *
      0.1;

  const balance =
    positiveSignals -
    negativeSignals;

  if (balance >= 15) {
    return "improving";
  }

  if (balance <= -15) {
    return "declining";
  }

  return "stable";
}

function buildHealthScore(
  input: Required<ExecutiveHealthInput>,
  signals: ExecutiveHealthSignals,
) {
  const baseStrength =
    input.founderScore *
      0.22 +
    input.revenueMomentum *
      0.2 +
    input.executionQuality *
      0.22 +
    input.pipelineVelocity *
      0.18 +
    (
      100 -
      input.operationalPressure
    ) *
      0.18;

  const pressurePenalty =
    signals.followupPressure *
      0.08 +
    signals.relationshipPaymentPressure *
      0.05 +
    signals.stalledPressure *
      0.06 +
    signals.riskPressure *
      0.08;

  const opportunityBonus =
    Math.min(
      8,
      input.opportunityCount *
        0.8,
    ) +
    Math.min(
      5,
      input.recentRelationships *
        0.5,
    );

  return clamp(
    Math.round(
      baseStrength -
        pressurePenalty +
        opportunityBonus,
    ),
  );
}

function buildCriticalNarrative(
  input: Required<ExecutiveHealthInput>,
  signals: ExecutiveHealthSignals,
  revenue: RevenueSnapshot,
): ExecutiveHealthNarrative {
  const hasFollowupPressure =
    input.overdueFollowups > 0 ||
    signals.followupPressure >= 50;

  const hasRevenuePressure =
    revenue.hasRevenueEvidence &&
    signals.revenueExposure >= 55;

  const hasOperationalPressure =
    input.operationalPressure >= 70 ||
    input.riskCount >
      input.opportunityCount;

  if (hasFollowupPressure) {
    return {
      title:
        "Los seguimientos vencidos están debilitando la salud comercial",
      summary:
        `${formatCount(
          input.overdueFollowups,
          "seguimiento vencido",
          "seguimientos vencidos",
        )} requieren atención. ` +
        "La prioridad no es aumentar actividad, sino recuperar las relaciones que ya contienen valor comercial.",
      decision: {
        type:
          "recover-followups",
        title:
          "Recuperar relaciones comerciales críticas",
        description:
          `Atiende primero ${formatCount(
            input.overdueFollowups,
            "seguimiento vencido",
            "seguimientos vencidos",
          )}. ` +
          `${buildRevenuePositionText(
            revenue,
          )}.`,
        actionLabel:
          "Revisar seguimientos críticos",
      },
    };
  }

  if (hasRevenuePressure) {
    return {
      title:
        "El valor comercial abierto aún no se convierte en ingreso",
      summary:
        `${buildRevenuePositionText(
          revenue,
        )}. ` +
        "La empresa necesita convertir y proteger valor existente antes de ampliar el volumen comercial.",
      decision: {
        type:
          "protect-revenue",
        title:
          "Proteger el ingreso abierto",
        description:
          "Prioriza oportunidades, decisiones y cobros que ya representan valor antes de abrir nuevos frentes.",
        actionLabel:
          "Revisar ingresos abiertos",
      },
    };
  }

  if (hasOperationalPressure) {
    return {
      title:
        "La presión operativa está limitando la ejecución comercial",
      summary:
        `La presión operativa alcanzó ${Math.round(
          input.operationalPressure,
        )}/100 y existen ${formatCount(
          input.riskCount,
          "riesgo activo",
          "riesgos activos",
        )}. ` +
        "La empresa necesita recuperar control antes de acelerar el crecimiento.",
      decision: {
        type:
          "stabilize-operation",
        title:
          "Estabilizar la operación comercial",
        description:
          "Reduce riesgos abiertos, ordena las prioridades y protege la capacidad de ejecución del founder.",
        actionLabel:
          "Revisar prioridades críticas",
      },
    };
  }

  return {
    title:
      "La empresa necesita recuperar control ejecutivo",
    summary:
      "Varias señales comerciales y operativas están debilitando simultáneamente la capacidad de ejecución. La prioridad es estabilizar antes de crecer.",
    decision: {
      type:
        "stabilize-operation",
      title:
        "Recuperar control ejecutivo",
      description:
        "Concentra la operación en los riesgos, relaciones e ingresos que más afectan la continuidad comercial.",
      actionLabel:
        "Revisar focos críticos",
    },
  };
}

function buildAttentionNarrative(
  input: Required<ExecutiveHealthInput>,
  signals: ExecutiveHealthSignals,
  revenue: RevenueSnapshot,
): ExecutiveHealthNarrative {
  if (
    input.overdueFollowups > 0
  ) {
    return {
      title:
        "El atraso comercial está empezando a generar presión",
      summary:
        `La empresa mantiene una base operativa estable, pero ${formatCount(
          input.overdueFollowups,
          "seguimiento vencido",
          "seguimientos vencidos",
        )} pueden enfriar relaciones y reducir conversión si permanecen abiertos.`,
      decision: {
        type:
          "recover-followups",
        title:
          "Eliminar la deuda de seguimiento",
        description:
          `Recupera primero las relaciones vencidas y después atiende ${formatCount(
            input.dueSoonFollowups,
            "seguimiento próximo",
            "seguimientos próximos",
          )}.`,
        actionLabel:
          "Recuperar seguimientos",
      },
    };
  }

  if (
    revenue.hasRevenueEvidence &&
    signals.revenueExposure >= 50
  ) {
    return {
      title:
        "La salud depende de convertir el valor comercial abierto",
      summary:
        `${buildRevenuePositionText(
          revenue,
        )}. ` +
        "La empresa tiene potencial, pero todavía necesita convertirlo en resultado.",
      decision: {
        type:
          "protect-revenue",
        title:
          "Convertir valor antes de ampliar volumen",
        description:
          "Prioriza las oportunidades con mayor valor y menor distancia hasta la decisión.",
        actionLabel:
          "Revisar pipeline prioritario",
      },
    };
  }

  if (
    input.stalledRelationships > 0 ||
    signals.stalledPressure >= 35
  ) {
    return {
      title:
        "El enfriamiento de relaciones está reduciendo el ritmo comercial",
      summary:
        `${formatCount(
          input.stalledRelationships,
          "relación estancada",
          "relaciones estancadas",
        )} limitan la velocidad del pipeline. ` +
        "La prioridad es determinar qué relaciones pueden recuperarse y cuáles ya no justifican atención.",
      decision: {
        type:
          "reduce-pressure",
        title:
          "Resolver relaciones estancadas",
        description:
          "Recupera las relaciones con potencial y elimina del foco ejecutivo aquellas sin movimiento real.",
        actionLabel:
          "Revisar relaciones estancadas",
      },
    };
  }

  if (
    input.operationalPressure >= 50
  ) {
    return {
      title:
        "La presión operativa está consumiendo capacidad ejecutiva",
      summary:
        `La operación registra una presión de ${Math.round(
          input.operationalPressure,
        )}/100. ` +
        "El negocio sigue funcionando, pero necesita menos frentes abiertos y mayor disciplina de ejecución.",
      decision: {
        type:
          "reduce-pressure",
        title:
          "Reducir frentes abiertos",
        description:
          "Ordena las acciones del día por impacto comercial y evita abrir trabajo que no protege ingresos, relaciones o ejecución.",
        actionLabel:
          "Revisar focos del día",
      },
    };
  }

  return {
    title:
      "La empresa está estable, pero necesita una prioridad más clara",
    summary:
      "No existe una señal crítica dominante, aunque la combinación de presión operativa y ritmo comercial exige una decisión ejecutiva concreta.",
    decision: {
      type:
        "reduce-pressure",
      title:
        "Concentrar la ejecución",
      description:
        "Elige el frente con mayor impacto en ingresos, relaciones o continuidad y resuélvelo antes de ampliar actividad.",
      actionLabel:
        "Revisar prioridad ejecutiva",
    },
  };
}

function buildHealthyNarrative(
  status: ExecutiveHealthStatus,
  trend: ExecutiveHealthTrend,
  input: Required<ExecutiveHealthInput>,
  signals: ExecutiveHealthSignals,
  revenue: RevenueSnapshot,
): ExecutiveHealthNarrative {
  if (
    input.overdueFollowups > 0
  ) {
    return {
      title:
        "La empresa está saludable, pero debe proteger su disciplina comercial",
      summary:
        `La base ejecutiva es sólida, aunque ${formatCount(
          input.overdueFollowups,
          "seguimiento vencido",
          "seguimientos vencidos",
        )} pueden deteriorar relaciones que hoy todavía conservan valor.`,
      decision: {
        type:
          "recover-followups",
        title:
          "Proteger la disciplina de seguimiento",
        description:
          "Resuelve los atrasos antes de que se conviertan en presión comercial o pérdida de confianza.",
        actionLabel:
          "Revisar seguimientos",
      },
    };
  }

  if (
    revenue.hasRevenueEvidence &&
    signals.revenueExposure >= 50
  ) {
    return {
      title:
        "La empresa está saludable y su siguiente palanca es la conversión",
      summary:
        `${buildRevenuePositionText(
          revenue,
        )}. ` +
        "La salud actual permite crecer, siempre que el valor existente se convierta con disciplina.",
      decision: {
        type:
          "protect-revenue",
        title:
          "Convertir el valor comercial disponible",
        description:
          "Concentra la ejecución en las oportunidades que pueden transformarse más rápido en ingreso confirmado.",
        actionLabel:
          "Revisar oportunidades",
      },
    };
  }

  if (
    status === "excellent" &&
    trend === "improving"
  ) {
    return {
      title:
        "La empresa está preparada para crecer sin perder control",
      summary:
        `La ejecución alcanza ${Math.round(
          signals.executionStrength,
        )}/100 y la fortaleza comercial ${Math.round(
          signals.commercialStrength,
        )}/100. ` +
        "No existe una presión dominante que obligue al founder a intervenir defensivamente.",
      decision: {
        type:
          "continue-growth",
        title:
          "Acelerar con disciplina",
        description:
          "Amplía oportunidades manteniendo el mismo nivel de seguimiento, calidad de ejecución y control operativo.",
        actionLabel:
          "Continuar crecimiento",
      },
    };
  }

  if (
    trend === "improving"
  ) {
    return {
      title:
        "La salud de la empresa está mejorando",
      summary:
        "El ritmo comercial y la calidad de ejecución superan actualmente la presión operativa. La prioridad es sostener esta mejora sin dispersar el foco.",
      decision: {
        type:
          "continue-growth",
        title:
          "Sostener la mejora comercial",
        description:
          "Continúa ejecutando sobre las oportunidades actuales y protege la disciplina que está fortaleciendo el negocio.",
        actionLabel:
          "Mantener el ritmo",
      },
    };
  }

  return {
    title:
      status === "excellent"
        ? "La empresa está en excelente estado ejecutivo"
        : "La empresa está saludable y bajo control",
    summary:
      "Los ingresos, la ejecución y el pipeline mantienen una base equilibrada. No existe una señal crítica que requiera desviar el foco del crecimiento.",
    decision: {
      type:
        "continue-growth",
      title:
        "Mantener crecimiento bajo control",
      description:
        "Continúa desarrollando oportunidades sin aumentar innecesariamente la presión operativa.",
      actionLabel:
        "Continuar crecimiento",
    },
  };
}

function buildNarrative(
  status: ExecutiveHealthStatus,
  trend: ExecutiveHealthTrend,
  input: Required<ExecutiveHealthInput>,
  signals: ExecutiveHealthSignals,
  revenue: RevenueSnapshot,
): ExecutiveHealthNarrative {
  if (
    status === "critical"
  ) {
    return buildCriticalNarrative(
      input,
      signals,
      revenue,
    );
  }

  if (
    status === "attention"
  ) {
    return buildAttentionNarrative(
      input,
      signals,
      revenue,
    );
  }

  return buildHealthyNarrative(
    status,
    trend,
    input,
    signals,
    revenue,
  );
}

function buildDriverCandidates(
  input: Required<ExecutiveHealthInput>,
  signals: ExecutiveHealthSignals,
  revenue: RevenueSnapshot,
): ExecutiveHealthDriverCandidate[] {
  const revenueValue =
    revenue.hasRevenueEvidence
      ? `${signals.revenueExposure}% abierto`
      : "Sin ingresos";

  return [
    {
      id:
        "followup-debt",
      title:
        input.overdueFollowups > 0
          ? "La deuda de seguimiento está creciendo"
          : "La disciplina de seguimiento está protegida",
      description:
        input.overdueFollowups > 0
          ? `${formatCount(
              input.overdueFollowups,
              "relación",
              "relaciones",
            )} superaron su momento de seguimiento y pueden perder temperatura comercial.`
          : input.dueSoonFollowups > 0
            ? `${formatCount(
                input.dueSoonFollowups,
                "seguimiento",
                "seguimientos",
              )} requieren atención próximamente, pero todavía no existe atraso.`
            : "No existen seguimientos vencidos que amenacen la continuidad de las relaciones.",
      tone:
        input.overdueFollowups >= 3
          ? "critical"
          : input.overdueFollowups > 0
            ? "warning"
            : "positive",
      value:
        input.overdueFollowups > 0
          ? formatCount(
              input.overdueFollowups,
              "vencido",
              "vencidos",
            )
          : "Sin atrasos",
      weight:
        input.overdueFollowups *
          24 +
        input.dueSoonFollowups *
          5,
    },

    {
      id:
        "revenue-conversion",
      title:
        signals.revenueExposure >= 55
          ? "El valor abierto domina los ingresos"
          : "Los ingresos mantienen una base protegida",
      description:
        revenue.hasRevenueEvidence
          ? buildRevenuePositionText(
              revenue,
            )
          : "Todavía no existe valor comercial suficiente para evaluar la conversión de ingresos.",
      tone:
        signals.revenueExposure >= 70
          ? "critical"
          : signals.revenueExposure >= 55
            ? "warning"
            : revenue.hasRevenueEvidence
              ? "positive"
              : "neutral",
      value:
        revenueValue,
      weight:
        revenue.hasRevenueEvidence
          ? signals.revenueExposure
          : 15,
    },

    {
      id:
        "operational-capacity",
      title:
        input.operationalPressure >= 70
          ? "La presión operativa limita la capacidad ejecutiva"
          : input.operationalPressure >= 45
            ? "La capacidad ejecutiva necesita protección"
            : "La operación conserva capacidad para ejecutar",
      description:
        input.operationalPressure >= 70
          ? "Existen demasiadas señales abiertas para mantener velocidad y calidad simultáneamente."
          : input.operationalPressure >= 45
            ? "La presión sigue siendo manejable, pero nuevos frentes pueden reducir la calidad de ejecución."
            : "La operación puede absorber las prioridades actuales sin presión dominante.",
      tone:
        input.operationalPressure >= 70
          ? "critical"
          : input.operationalPressure >= 45
            ? "warning"
            : "positive",
      value:
        `${Math.round(
          input.operationalPressure,
        )}/100`,
      weight:
        input.operationalPressure,
    },

    {
      id:
        "stalled-relationships",
      title:
        input.stalledRelationships > 0
          ? "Las relaciones estancadas reducen velocidad"
          : "Las relaciones mantienen movimiento",
      description:
        input.stalledRelationships > 0
          ? `${formatCount(
              input.stalledRelationships,
              "relación",
              "relaciones",
            )} dejaron de avanzar y necesitan recuperación o una decisión de cierre.`
          : "No existen relaciones estancadas que estén frenando el pipeline.",
      tone:
        input.stalledRelationships >= 3
          ? "critical"
          : input.stalledRelationships > 0
            ? "warning"
            : "positive",
      value:
        input.stalledRelationships > 0
          ? formatCount(
              input.stalledRelationships,
              "estancada",
              "estancadas",
            )
          : "Sin estancamiento",
      weight:
        input.stalledRelationships *
          20 +
        signals.stalledPressure,
    },

    {
      id:
        "commercial-momentum",
      title:
        signals.commercialStrength >= 70
          ? "El ritmo comercial sostiene el crecimiento"
          : signals.commercialStrength >= 50
            ? "El ritmo comercial necesita mayor consistencia"
            : "La debilidad comercial limita el crecimiento",
      description:
        signals.commercialStrength >= 70
          ? "Pipeline, momentum de ingresos y ejecución avanzan con una fuerza comercial equilibrada."
          : signals.commercialStrength >= 50
            ? "La empresa mantiene movimiento, pero todavía no con la consistencia necesaria para acelerar."
            : "La combinación de baja velocidad, momentum y ejecución reduce la capacidad de convertir oportunidades.",
      tone:
        signals.commercialStrength >= 70
          ? "positive"
          : signals.commercialStrength >= 50
            ? "warning"
            : "critical",
      value:
        `${signals.commercialStrength}/100`,
      weight:
        signals.commercialStrength >= 70
          ? 42
          : 100 -
            signals.commercialStrength,
    },

    {
      id:
        "execution-discipline",
      title:
        signals.executionStrength >= 70
          ? "La ejecución protege la salud del negocio"
          : signals.executionStrength >= 50
            ? "La ejecución necesita más disciplina"
            : "La ejecución está amplificando la presión",
      description:
        signals.executionStrength >= 70
          ? "La calidad de ejecución y el control operativo sostienen una base confiable."
          : signals.executionStrength >= 50
            ? "La ejecución todavía funciona, pero necesita menos dispersión y mayor consistencia."
            : "La capacidad actual de ejecución no es suficiente para absorber la presión comercial existente.",
      tone:
        signals.executionStrength >= 70
          ? "positive"
          : signals.executionStrength >= 50
            ? "warning"
            : "critical",
      value:
        `${signals.executionStrength}/100`,
      weight:
        signals.executionStrength >= 70
          ? 40
          : 100 -
            signals.executionStrength,
    },

    {
      id:
        "commercial-risk",
      title:
        input.riskCount >
        input.opportunityCount
          ? "Los riesgos superan las oportunidades activas"
          : "Las oportunidades compensan el riesgo comercial",
      description:
        input.riskCount >
        input.opportunityCount
          ? `${formatCount(
              input.riskCount,
              "riesgo",
              "riesgos",
            )} compiten actualmente con ${formatCount(
              input.opportunityCount,
              "oportunidad",
              "oportunidades",
            )}.`
          : `${formatCount(
              input.opportunityCount,
              "oportunidad",
              "oportunidades",
            )} mantienen una base superior o equivalente a los riesgos activos.`,
      tone:
        input.riskCount >
        input.opportunityCount
          ? "warning"
          : input.opportunityCount > 0
            ? "positive"
            : "neutral",
      value:
        `${Math.round(
          input.opportunityCount,
        )} / ${Math.round(
          input.riskCount,
        )}`,
      weight:
        input.riskCount >
        input.opportunityCount
          ? 75 +
            Math.min(
              20,
              (
                input.riskCount -
                input.opportunityCount
              ) *
                5,
            )
          : 35,
    },
  ];
}

function buildDrivers(
  input: Required<ExecutiveHealthInput>,
  signals: ExecutiveHealthSignals,
  revenue: RevenueSnapshot,
): ExecutiveHealthDriver[] {
  const candidates =
    buildDriverCandidates(
      input,
      signals,
      revenue,
    );

  const pressureDrivers =
    candidates
      .filter(
        (
          candidate,
        ) =>
          candidate.tone ===
            "critical" ||
          candidate.tone ===
            "warning",
      )
      .sort(
        (
          first,
          second,
        ) =>
          second.weight -
          first.weight,
      );

  const positiveDrivers =
    candidates
      .filter(
        (
          candidate,
        ) =>
          candidate.tone ===
            "positive" ||
          candidate.tone ===
            "neutral",
      )
      .sort(
        (
          first,
          second,
        ) =>
          second.weight -
          first.weight,
      );

  const selectedDrivers = [
    ...pressureDrivers,
    ...positiveDrivers,
  ].slice(0, 4);

  return selectedDrivers.map(
    ({
      weight,
      ...driver
    }) => driver,
  );
}

export function buildExecutiveHealthReport(
  input: ExecutiveHealthInput,
): ExecutiveHealthReport {
  const normalizedInput =
    normalizeInput(
      input,
    );

  const revenue =
    buildRevenueSnapshot(
      normalizedInput,
    );

  const signals =
    buildSignals(
      normalizedInput,
      revenue,
    );

  const score =
    buildHealthScore(
      normalizedInput,
      signals,
    );

  const status =
    getStatus(
      score,
    );

  const trend =
    getTrend(
      normalizedInput,
      signals,
    );

  const narrative =
    buildNarrative(
      status,
      trend,
      normalizedInput,
      signals,
      revenue,
    );

  return {
    question:
      "¿Qué limita hoy la salud de mi empresa?",

    score,
    status,
    trend,

    title:
      narrative.title,

    summary:
      narrative.summary,

    drivers:
      buildDrivers(
        normalizedInput,
        signals,
        revenue,
      ),

    decision:
      narrative.decision,
  };
}