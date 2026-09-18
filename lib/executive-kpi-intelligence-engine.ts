export type ExecutiveKpiStatus =
  | "critical"
  | "risk"
  | "attention"
  | "healthy";

export type ExecutiveKpiEvidence = {
  label: string;
  value: string | number;
  meaning: string;
};

export type ExecutiveKpiDecision = {
  title: string;
  description: string;
  actionLabel: string;
};

export type ExecutiveKpiChapter = {
  title: string;
  summary: string;
  status: ExecutiveKpiStatus;
  decision: ExecutiveKpiDecision;
  evidence: ExecutiveKpiEvidence[];
  question: "¿Qué KPI requiere hoy mi atención?";
  executionPressure: ExecutiveKpiStatus;
  revenuePressure: ExecutiveKpiStatus;
};

export type ExecutiveKpiInput = {
  totalRelationships: number;
  activeRelationships: number;
  overdueRelationships: number;
  relationshipsToContactToday: number;
  paidRelationships: number;
  unpaidRelationships: number;
  totalRevenue: number;
  totalRevenueUsd?: number;
};

type ExecutiveKpiMetrics = {
  activeRate: number;
  overdueRate: number;
  todayContactRate: number;
  paidRate: number;
  openRate: number;
  executionPressure: number;
  commercialContinuity: number;
  kpiHealth: number;
  hasConfirmedRevenue: boolean;
};

type ExecutiveKpiNarrative = {
  title: string;
  summary: string;
  decision: ExecutiveKpiDecision;
};

type ExecutiveKpiEvidenceCandidate =
  ExecutiveKpiEvidence & {
    id: string;
    status: ExecutiveKpiStatus;
    weight: number;
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
  input: ExecutiveKpiInput,
): ExecutiveKpiInput {
  return {
    totalRelationships:
      safeNumber(
        input.totalRelationships,
      ),

    activeRelationships:
      safeNumber(
        input.activeRelationships,
      ),

    overdueRelationships:
      safeNumber(
        input.overdueRelationships,
      ),

    relationshipsToContactToday:
      safeNumber(
        input.relationshipsToContactToday,
      ),

    paidRelationships:
      safeNumber(
        input.paidRelationships,
      ),

    unpaidRelationships:
      safeNumber(
        input.unpaidRelationships,
      ),

    totalRevenue:
      safeNumber(
        input.totalRevenue,
      ),

    totalRevenueUsd:
      safeNumber(
        input.totalRevenueUsd,
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

function formatConfirmedRevenue(
  input: ExecutiveKpiInput,
) {
  const values: string[] = [];

  if (
    input.totalRevenue > 0
  ) {
    values.push(
      formatGs(
        input.totalRevenue,
      ),
    );
  }

  if (
    safeNumber(
      input.totalRevenueUsd,
    ) > 0
  ) {
    values.push(
      formatUsd(
        safeNumber(
          input.totalRevenueUsd,
        ),
      ),
    );
  }

  if (
    values.length === 0
  ) {
    return "Sin ingresos confirmados";
  }

  return values.join(
    " · ",
  );
}

function buildMetrics(
  input: ExecutiveKpiInput,
): ExecutiveKpiMetrics {
  const activeRate =
    percentage(
      input.activeRelationships,
      input.totalRelationships,
    );

  const overdueRate =
    percentage(
      input.overdueRelationships,
      input.totalRelationships,
    );

  const todayContactRate =
    percentage(
      input.relationshipsToContactToday,
      input.totalRelationships,
    );

  const conversionBase =
    Math.max(
      input.totalRelationships,
      input.paidRelationships +
        input.unpaidRelationships,
    );

  const paidRate =
    percentage(
      input.paidRelationships,
      conversionBase,
    );

  const openRate =
    percentage(
      input.unpaidRelationships,
      conversionBase,
    );

  const executionPressure =
    clamp(
      Math.round(
        overdueRate *
          0.65 +
        todayContactRate *
          0.35,
      ),
    );

  const commercialContinuity =
    clamp(
      Math.round(
        activeRate *
          0.4 +
        paidRate *
          0.25 +
        (
          100 -
          overdueRate
        ) *
          0.35,
      ),
    );

  const kpiHealth =
    clamp(
      Math.round(
        activeRate *
          0.3 +
        paidRate *
          0.25 +
        (
          100 -
          overdueRate
        ) *
          0.3 +
        (
          100 -
          executionPressure
        ) *
          0.15,
      ),
    );

  const hasConfirmedRevenue =
    input.totalRevenue > 0 ||
    safeNumber(
      input.totalRevenueUsd,
    ) > 0;

  return {
    activeRate,
    overdueRate,
    todayContactRate,
    paidRate,
    openRate,
    executionPressure,
    commercialContinuity,
    kpiHealth,
    hasConfirmedRevenue,
  };
}

function getStatus(
  input: ExecutiveKpiInput,
  metrics: ExecutiveKpiMetrics,
): ExecutiveKpiStatus {
  if (
    input.totalRelationships === 0
  ) {
    return "attention";
  }

  if (
    metrics.overdueRate >= 40 ||
    metrics.executionPressure >= 65 ||
    metrics.kpiHealth < 35
  ) {
    return "critical";
  }

  if (
    metrics.overdueRate >= 25 ||
    metrics.executionPressure >= 45 ||
    metrics.kpiHealth < 55
  ) {
    return "risk";
  }

  if (
    metrics.activeRate < 45 ||
    metrics.todayContactRate >= 25 ||
    metrics.paidRate < 20 ||
    metrics.kpiHealth < 70
  ) {
    return "attention";
  }

  return "healthy";
}

function getRevenuePressure(
  input: ExecutiveKpiInput,
  metrics: ExecutiveKpiMetrics,
): ExecutiveKpiStatus {
  if (
    input.totalRelationships === 0
  ) {
    return "attention";
  }

  if (
    input.paidRelationships === 0 &&
    input.unpaidRelationships > 0 &&
    !metrics.hasConfirmedRevenue
  ) {
    return "attention";
  }

  if (
    metrics.paidRate < 20 &&
    input.unpaidRelationships >= 5
  ) {
    return "risk";
  }

  if (
    metrics.paidRate < 40
  ) {
    return "attention";
  }

  return "healthy";
}

function buildCriticalNarrative(
  input: ExecutiveKpiInput,
  metrics: ExecutiveKpiMetrics,
): ExecutiveKpiNarrative {
  if (
    metrics.overdueRate >= 40
  ) {
    return {
      title:
        "Los seguimientos vencidos explican la principal presión operativa",

      summary:
        `${metrics.overdueRate}% de la cartera está vencida. ` +
        `${formatCount(
          input.overdueRelationships,
          "relación",
          "relaciones",
        )} requieren recuperación antes de que la falta de ejecución afecte la continuidad comercial.`,

      decision: {
        title:
          "Eliminar primero la deuda de seguimiento",

        description:
          "Recupera las relaciones vencidas antes de ampliar actividad o crear nuevos frentes.",

        actionLabel:
          "Resolver seguimientos vencidos",
      },
    };
  }

  if (
    metrics.executionPressure >= 65
  ) {
    return {
      title:
        "La presión de ejecución está limitando el rendimiento comercial",

      summary:
        `La presión combinada de atrasos y contactos del día alcanza ${metrics.executionPressure}/100. ` +
        "La operación necesita menos frentes abiertos y una secuencia de ejecución más estricta.",

      decision: {
        title:
          "Reducir presión de ejecución",

        description:
          "Ordena el trabajo por continuidad relacional y resuelve primero lo que ya tiene fecha o atraso.",

        actionLabel:
          "Ordenar presión operativa",
      },
    };
  }

  return {
    title:
      "Los KPIs muestran una pérdida de control ejecutivo",

    summary:
      `La salud KPI cayó a ${metrics.kpiHealth}/100. ` +
      "Actividad, seguimiento y conversión ya no sostienen una operación comercial equilibrada.",

    decision: {
      title:
        "Recuperar control de los indicadores críticos",

      description:
        "Concentra la ejecución en seguimiento, actividad y conversión antes de ampliar el volumen comercial.",

      actionLabel:
        "Revisar KPI crítico",
    },
  };
}

function buildRiskNarrative(
  input: ExecutiveKpiInput,
  metrics: ExecutiveKpiMetrics,
): ExecutiveKpiNarrative {
  if (
    metrics.overdueRate >= 25
  ) {
    return {
      title:
        "El atraso comercial está empezando a explicar la pérdida de rendimiento",

      summary:
        `${metrics.overdueRate}% de la cartera necesita recuperación. ` +
        "El problema todavía es reversible, pero ya está reduciendo continuidad y disciplina operativa.",

      decision: {
        title:
          "Recuperar ejecución antes de perder continuidad",

        description:
          `Atiende primero ${formatCount(
            input.overdueRelationships,
            "relación vencida",
            "relaciones vencidas",
          )} y protege después los contactos previstos para hoy.`,

        actionLabel:
          "Recuperar relaciones vencidas",
      },
    };
  }

  if (
    metrics.activeRate < 35
  ) {
    return {
      title:
        "La baja actividad está reduciendo la continuidad comercial",

      summary:
        `Solo ${metrics.activeRate}% de las relaciones muestra movimiento visible. ` +
        "La cantidad total de relaciones todavía no se traduce en suficiente actividad comercial.",

      decision: {
        title:
          "Reactivar la base con intención",

        description:
          "Concentra la atención en relaciones con estado comercial claro o próximo contacto definido.",

        actionLabel:
          "Reactivar relaciones prioritarias",
      },
    };
  }

  return {
    title:
      "Los KPIs conservan equilibrio parcial, pero necesitan más disciplina",

    summary:
      `La salud KPI está en ${metrics.kpiHealth}/100 y la presión de ejecución en ${metrics.executionPressure}/100. ` +
      "La operación todavía puede corregirse sin una intervención estructural.",

    decision: {
      title:
        "Restablecer equilibrio operativo",

      description:
        "Reduce atrasos y fortalece la actividad antes de aumentar presión sobre la cartera.",

      actionLabel:
        "Equilibrar KPIs",
    },
  };
}

function buildAttentionNarrative(
  input: ExecutiveKpiInput,
  metrics: ExecutiveKpiMetrics,
): ExecutiveKpiNarrative {
  if (
    input.relationshipsToContactToday > 0
  ) {
    return {
      title:
        "La ejecución de hoy determinará la continuidad comercial",

      summary:
        `${formatCount(
          input.relationshipsToContactToday,
          "relación",
          "relaciones",
        )} requieren contacto hoy. ` +
        "El KPI dominante no exige más análisis, sino ejecución puntual.",

      decision: {
        title:
          "Completar las acciones que protegen continuidad",

        description:
          "Resuelve primero los contactos del día y evita que se conviertan en nueva deuda operativa.",

        actionLabel:
          "Ejecutar contactos de hoy",
      },
    };
  }

  if (
    metrics.activeRate < 45
  ) {
    return {
      title:
        "La actividad comercial necesita mayor profundidad",

      summary:
        `${metrics.activeRate}% de la cartera mantiene movimiento visible. ` +
        "La operación está estable, pero todavía depende de una base activa limitada.",

      decision: {
        title:
          "Fortalecer actividad con intención",

        description:
          "Activa relaciones con interés, contacto previo o un próximo paso definido.",

        actionLabel:
          "Fortalecer relaciones activas",
      },
    };
  }

  if (
    metrics.paidRate < 20
  ) {
    return {
      title:
        "La conversión registrada todavía es limitada",

      summary:
        `${metrics.paidRate}% de la cartera visible está marcada como pagada. ` +
        `Los ingresos confirmados registrados alcanzan ${formatConfirmedRevenue(
          input,
        )}.`,

      decision: {
        title:
          "Mejorar conversión registrada",

        description:
          "Prioriza relaciones interesadas y registra el pago real cuando exista una conversión.",

        actionLabel:
          "Revisar conversión",
      },
    };
  }

  return {
    title:
      "Los KPIs necesitan una prioridad ejecutiva más clara",

    summary:
      `La salud KPI alcanza ${metrics.kpiHealth}/100. ` +
      "No existe una señal crítica dominante, aunque todavía hay margen para ganar disciplina.",

    decision: {
      title:
        "Concentrar la ejecución en el KPI dominante",

      description:
        "Atiende primero el indicador que más afecta seguimiento, actividad o conversión.",

      actionLabel:
        "Revisar KPI prioritario",
    },
  };
}

function buildHealthyNarrative(
  input: ExecutiveKpiInput,
  metrics: ExecutiveKpiMetrics,
): ExecutiveKpiNarrative {
  if (
    input.relationshipsToContactToday > 0
  ) {
    return {
      title:
        "Los KPIs están bajo control y la prioridad está en ejecutar hoy",

      summary:
        `La salud KPI alcanza ${metrics.kpiHealth}/100. ` +
        `${formatCount(
          input.relationshipsToContactToday,
          "contacto",
          "contactos",
        )} deben completarse hoy para mantener el equilibrio actual.`,

      decision: {
        title:
          "Mantener disciplina de ejecución",

        description:
          "Completa las acciones previstas y evita introducir nueva presión mientras los indicadores están equilibrados.",

        actionLabel:
          "Ejecutar acciones de hoy",
      },
    };
  }

  return {
    title:
      "Los KPIs principales están saludables y bajo control",

    summary:
      `La salud KPI alcanza ${metrics.kpiHealth}/100, la continuidad comercial ${metrics.commercialContinuity}/100 y ${metrics.paidRate}% de la cartera está marcada como pagada. ` +
      `Ingresos confirmados: ${formatConfirmedRevenue(
        input,
      )}.`,

    decision: {
      title:
        "Sostener el equilibrio actual",

      description:
        "Mantén disciplina de seguimiento, actividad y conversión mientras desarrollas nuevas oportunidades.",

      actionLabel:
        "Mantener control",
    },
  };
}

function buildNarrative(
  input: ExecutiveKpiInput,
  metrics: ExecutiveKpiMetrics,
  status: ExecutiveKpiStatus,
): ExecutiveKpiNarrative {
  if (
    status === "critical"
  ) {
    return buildCriticalNarrative(
      input,
      metrics,
    );
  }

  if (
    status === "risk"
  ) {
    return buildRiskNarrative(
      input,
      metrics,
    );
  }

  if (
    status === "attention"
  ) {
    return buildAttentionNarrative(
      input,
      metrics,
    );
  }

  return buildHealthyNarrative(
    input,
    metrics,
  );
}

function buildEvidenceCandidates(
  input: ExecutiveKpiInput,
  metrics: ExecutiveKpiMetrics,
): ExecutiveKpiEvidenceCandidate[] {
  return [
    {
      id:
        "followup-debt",

      label:
        metrics.overdueRate > 0
          ? "La deuda de seguimiento reduce la ejecución"
          : "La disciplina de seguimiento está protegida",

      value:
        `${metrics.overdueRate}%`,

      meaning:
        metrics.overdueRate > 0
          ? `${formatCount(
              input.overdueRelationships,
              "relación",
              "relaciones",
            )} necesitan recuperación antes de perder continuidad comercial.`
          : "No existen relaciones vencidas que generen presión operativa inmediata.",

      status:
        metrics.overdueRate >= 40
          ? "critical"
          : metrics.overdueRate >= 25
            ? "risk"
            : metrics.overdueRate > 0
              ? "attention"
              : "healthy",

      weight:
        metrics.overdueRate +
        input.overdueRelationships *
          8,
    },

    {
      id:
        "active-relationships",

      label:
        metrics.activeRate >= 60
          ? "La actividad sostiene continuidad comercial"
          : "La actividad comercial necesita mayor profundidad",

      value:
        `${metrics.activeRate}%`,

      meaning:
        `${formatCount(
          input.activeRelationships,
          "relación activa",
          "relaciones activas",
        )} de ${formatCount(
          input.totalRelationships,
          "relación visible",
          "relaciones visibles",
        )} mantienen movimiento.`,

      status:
        metrics.activeRate >= 60
          ? "healthy"
          : metrics.activeRate >= 45
            ? "attention"
            : metrics.activeRate >= 30
              ? "risk"
              : "critical",

      weight:
        metrics.activeRate >= 60
          ? 35
          : 100 -
            metrics.activeRate,
    },

    {
      id:
        "today-contacts",

      label:
        input.relationshipsToContactToday > 0
          ? "La ejecución de hoy protege continuidad"
          : "No existe presión de contacto para hoy",

      value:
        input.relationshipsToContactToday,

      meaning:
        input.relationshipsToContactToday > 0
          ? `${formatCount(
              input.relationshipsToContactToday,
              "acción",
              "acciones",
            )} deben completarse para evitar nueva deuda operativa.`
          : "La operación no tiene contactos previstos que requieran atención inmediata.",

      status:
        metrics.todayContactRate >= 35
          ? "risk"
          : input.relationshipsToContactToday > 0
            ? "attention"
            : "healthy",

      weight:
        metrics.todayContactRate +
        input.relationshipsToContactToday *
          7,
    },

    {
      id:
        "paid-conversion",

      label:
        metrics.paidRate >= 40
          ? "La conversión registrada es visible"
          : "La conversión registrada todavía es limitada",

      value:
        formatCount(
          input.paidRelationships,
          "relación pagada",
          "relaciones pagadas",
        ),

      meaning:
        `${metrics.paidRate}% de la cartera visible está marcada como pagada en Relaciones.`,

      status:
        metrics.paidRate >= 40
          ? "healthy"
          : metrics.paidRate >= 20
            ? "attention"
            : input.paidRelationships > 0
              ? "risk"
              : "attention",

      weight:
        metrics.paidRate >= 40
          ? 30
          : 100 -
            metrics.paidRate,
    },

    {
      id:
        "open-relationships",

      label:
        "Relaciones todavía abiertas",

      value:
        formatCount(
          input.unpaidRelationships,
          "relación abierta",
          "relaciones abiertas",
        ),

      meaning:
        `${metrics.openRate}% de la cartera todavía no está marcada como pagada. Una relación abierta no se interpreta automáticamente como deuda o pago pendiente.`,

      status:
        "attention",

      weight:
        35,
    },

    {
      id:
        "execution-pressure",

      label:
        metrics.executionPressure >= 45
          ? "La presión operativa condiciona el rendimiento"
          : "La presión operativa está controlada",

      value:
        `${metrics.executionPressure}/100`,

      meaning:
        metrics.executionPressure >= 45
          ? "Atrasos y contactos inmediatos compiten por la misma capacidad de ejecución."
          : "La operación puede absorber las prioridades actuales sin presión dominante.",

      status:
        metrics.executionPressure >= 65
          ? "critical"
          : metrics.executionPressure >= 45
            ? "risk"
            : metrics.executionPressure >= 25
              ? "attention"
              : "healthy",

      weight:
        metrics.executionPressure,
    },

    {
      id:
        "kpi-health",

      label:
        metrics.kpiHealth >= 70
          ? "Los KPIs mantienen equilibrio ejecutivo"
          : metrics.kpiHealth >= 50
            ? "Los KPIs necesitan mayor disciplina"
            : "Los KPIs han perdido equilibrio",

      value:
        `${metrics.kpiHealth}/100`,

      meaning:
        "La puntuación combina actividad, seguimiento, conversión y presión de ejecución usando datos disponibles en Relaciones.",

      status:
        metrics.kpiHealth >= 70
          ? "healthy"
          : metrics.kpiHealth >= 55
            ? "attention"
            : metrics.kpiHealth >= 35
              ? "risk"
              : "critical",

      weight:
        metrics.kpiHealth >= 70
          ? 30
          : 100 -
            metrics.kpiHealth,
    },

    {
      id:
        "confirmed-revenue",

      label:
        metrics.hasConfirmedRevenue
          ? "Los ingresos confirmados ya son medibles"
          : "Todavía no hay ingresos confirmados registrados",

      value:
        formatConfirmedRevenue(
          input,
        ),

      meaning:
        metrics.hasConfirmedRevenue
          ? "El valor proviene de los importes pagados registrados por relación y mantiene PYG y USD separados."
          : "ClienteYA todavía no dispone de pagos con importe confirmado dentro de Relaciones.",

      status:
        metrics.hasConfirmedRevenue
          ? "healthy"
          : input.totalRelationships > 0
            ? "attention"
            : "attention",

      weight:
        metrics.hasConfirmedRevenue
          ? 25
          : 45,
    },
  ];
}

function buildEvidence(
  input: ExecutiveKpiInput,
  metrics: ExecutiveKpiMetrics,
): ExecutiveKpiEvidence[] {
  const candidates =
    buildEvidenceCandidates(
      input,
      metrics,
    );

  const paidEvidence =
    candidates.find(
      (
        candidate,
      ) =>
        candidate.id ===
        "paid-conversion",
    );

  const revenueEvidence =
    candidates.find(
      (
        candidate,
      ) =>
        candidate.id ===
        "confirmed-revenue",
    );

  const remainingCandidates =
    candidates.filter(
      (
        candidate,
      ) =>
        candidate.id !==
          "paid-conversion" &&
        candidate.id !==
          "confirmed-revenue",
    );

  const pressureEvidence =
    remainingCandidates
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
    remainingCandidates
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

  const selectedEvidence = [
    ...(
      paidEvidence
        ? [paidEvidence]
        : []
    ),
    ...(
      revenueEvidence
        ? [revenueEvidence]
        : []
    ),
    ...pressureEvidence,
    ...remainingEvidence,
  ].slice(
    0,
    6,
  );

  return selectedEvidence.map(
    (
      {
        id,
        status,
        weight,
        ...evidence
      },
    ) =>
      evidence,
  );
}

export function buildExecutiveKpiIntelligenceChapter(
  input: ExecutiveKpiInput,
): ExecutiveKpiChapter {
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

  const narrative =
    buildNarrative(
      normalizedInput,
      metrics,
      status,
    );

  return {
    question:
      "¿Qué KPI requiere hoy mi atención?",

    title:
      narrative.title,

    summary:
      narrative.summary,

    status,

    executionPressure:
      metrics.executionPressure >= 65
        ? "critical"
        : metrics.executionPressure >= 45
          ? "risk"
          : metrics.executionPressure >= 25
            ? "attention"
            : "healthy",

    revenuePressure:
      getRevenuePressure(
        normalizedInput,
        metrics,
      ),

    decision:
      narrative.decision,

    evidence:
      buildEvidence(
        normalizedInput,
        metrics,
      ),
  };
}