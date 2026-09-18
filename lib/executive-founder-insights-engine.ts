export type ExecutiveFounderInsightStatus =
  | "healthy"
  | "attention"
  | "risk"
  | "critical";

export type ExecutiveFounderInsight = {
  title: string;
  description: string;
  impact: string;
};

export type ExecutiveFounderInsightsChapter = {
  question: "¿Qué patrón no debo ignorar?";
  title: string;
  summary: string;
  status: ExecutiveFounderInsightStatus;
  decision: {
    title: string;
    description: string;
    actionLabel: string;
  };
  insights: ExecutiveFounderInsight[];
};

export type ExecutiveFounderInsightsInput = {
  activeRelationships: number;
  overdueRelationships: number;
  opportunities: number;
  responseRate: number;
  conversionRate: number;
};

type FounderInsightMetrics = {
  activeRelationships: number;
  overdueRelationships: number;
  opportunities: number;
  responseRate: number;
  conversionRate: number;
  overduePressure: number;
  opportunityStrength: number;
  executionPressure: number;
  relationshipDiscipline: number;
  commercialEfficiency: number;
  founderHealth: number;
  hasResponseEvidence: boolean;
  hasCommercialBase: boolean;
};

type FounderPatternType =
  | "protect-before-growth"
  | "activity-without-conversion"
  | "opportunity-without-response"
  | "relationship-discipline"
  | "conversion-strength"
  | "balanced-growth"
  | "insufficient-commercial-base";

type FounderPattern = {
  type: FounderPatternType;
  title: string;
  description: string;
  impact: string;
  status: ExecutiveFounderInsightStatus;
  weight: number;
};

type FounderNarrative = {
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

function safePercentage(
  value: number | null | undefined,
) {
  return clamp(
    safeNumber(value),
  );
}

function normalizeInput(
  input: ExecutiveFounderInsightsInput,
): ExecutiveFounderInsightsInput {
  return {
    activeRelationships:
      safeNumber(
        input.activeRelationships,
      ),

    overdueRelationships:
      safeNumber(
        input.overdueRelationships,
      ),

    opportunities:
      safeNumber(
        input.opportunities,
      ),

    responseRate:
      safePercentage(
        input.responseRate,
      ),

    conversionRate:
      safePercentage(
        input.conversionRate,
      ),
  };
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

function buildMetrics(
  input: ExecutiveFounderInsightsInput,
): FounderInsightMetrics {
  const hasCommercialBase =
    input.activeRelationships > 0 ||
    input.overdueRelationships > 0 ||
    input.opportunities > 0;

  const hasResponseEvidence =
    input.responseRate > 0 ||
    input.opportunities > 0 ||
    input.activeRelationships > 0;

  const overdueBase =
    Math.max(
      1,
      input.activeRelationships,
      input.overdueRelationships,
    );

  const overduePressure =
    clamp(
      Math.round(
        (
          input.overdueRelationships /
          overdueBase
        ) *
          100,
      ),
    );

  const opportunityBase =
    Math.max(
      1,
      input.activeRelationships,
    );

  const opportunityStrength =
    clamp(
      Math.round(
        (
          input.opportunities /
          opportunityBase
        ) *
          100,
      ),
    );

  const responseStrength =
    hasResponseEvidence
      ? input.responseRate
      : 50;

  const conversionStrength =
    hasCommercialBase
      ? input.conversionRate
      : 50;

  const executionPressure =
    clamp(
      Math.round(
        overduePressure *
          0.7 +
        (
          hasResponseEvidence
            ? 100 -
              responseStrength
            : 0
        ) *
          0.3,
      ),
    );

  const relationshipDiscipline =
    clamp(
      Math.round(
        (
          100 -
          overduePressure
        ) *
          0.6 +
        responseStrength *
          0.4,
      ),
    );

  const commercialEfficiency =
    clamp(
      Math.round(
        responseStrength *
          0.4 +
        conversionStrength *
          0.45 +
        opportunityStrength *
          0.15,
      ),
    );

  const founderHealth =
    clamp(
      Math.round(
        relationshipDiscipline *
          0.4 +
        commercialEfficiency *
          0.35 +
        (
          100 -
          executionPressure
        ) *
          0.25,
      ),
    );

  return {
    activeRelationships:
      input.activeRelationships,

    overdueRelationships:
      input.overdueRelationships,

    opportunities:
      input.opportunities,

    responseRate:
      input.responseRate,

    conversionRate:
      input.conversionRate,

    overduePressure,
    opportunityStrength,
    executionPressure,
    relationshipDiscipline,
    commercialEfficiency,
    founderHealth,
    hasResponseEvidence,
    hasCommercialBase,
  };
}

function getStatus(
  metrics: FounderInsightMetrics,
): ExecutiveFounderInsightStatus {
  if (
    !metrics.hasCommercialBase
  ) {
    return "attention";
  }

  if (
    metrics.overdueRelationships >= 5 ||
    metrics.overduePressure >= 60 ||
    metrics.executionPressure >= 70 ||
    metrics.founderHealth < 35
  ) {
    return "critical";
  }

  if (
    metrics.overdueRelationships >= 3 ||
    metrics.overduePressure >= 35 ||
    metrics.executionPressure >= 50 ||
    metrics.founderHealth < 55
  ) {
    return "risk";
  }

  if (
    metrics.overdueRelationships > 0 ||
    metrics.relationshipDiscipline < 65 ||
    metrics.founderHealth < 70 ||
    (
      metrics.opportunities > 0 &&
      metrics.hasResponseEvidence &&
      metrics.responseRate < 60
    )
  ) {
    return "attention";
  }

  return "healthy";
}

function buildPatternCandidates(
  metrics: FounderInsightMetrics,
): FounderPattern[] {
  const patterns:
    FounderPattern[] = [];

  if (
    !metrics.hasCommercialBase
  ) {
    patterns.push({
      type:
        "insufficient-commercial-base",

      title:
        "Todavía no existe suficiente evidencia para detectar un patrón ejecutivo",

      description:
        "La base comercial aún no contiene suficiente actividad, atraso u oportunidades para construir una lectura confiable.",

      impact:
        "El founder necesita más comportamiento real antes de sacar conclusiones estructurales.",

      status:
        "attention",

      weight:
        100,
    });
  }

  if (
    metrics.overdueRelationships > 0
  ) {
    patterns.push({
      type:
        "protect-before-growth",

      title:
        metrics.overdueRelationships >= 3
          ? "Los atrasos están desplazando la atención del founder"
          : "El seguimiento vencido empieza a consumir atención ejecutiva",

      description:
        `${formatCount(
          metrics.overdueRelationships,
          "relación vencida",
          "relaciones vencidas",
        )} necesitan recuperación. ` +
        "El patrón relevante es la pérdida de continuidad sobre relaciones ya creadas.",

      impact:
        "Abrir más actividad sin resolver el atraso puede aumentar presión sin mejorar resultados.",

      status:
        metrics.overdueRelationships >= 5
          ? "critical"
          : metrics.overdueRelationships >= 3
            ? "risk"
            : "attention",

      weight:
        metrics.overduePressure +
        metrics.overdueRelationships *
          12,
    });
  }

  if (
    metrics.opportunities > 0 &&
    metrics.hasResponseEvidence &&
    metrics.responseRate < 60
  ) {
    patterns.push({
      type:
        "opportunity-without-response",

      title:
        "Las oportunidades existen, pero la respuesta no las protege",

      description:
        `${formatCount(
          metrics.opportunities,
          "oportunidad",
          "oportunidades",
        )} están activas mientras la respuesta comercial está en ${metrics.responseRate}%.`,

      impact:
        "La intención comercial puede perderse por falta de velocidad o continuidad.",

      status:
        metrics.responseRate < 40
          ? "risk"
          : "attention",

      weight:
        (
          100 -
          metrics.responseRate
        ) +
        metrics.opportunities *
          8,
    });
  }

  if (
    metrics.hasResponseEvidence &&
    metrics.responseRate >= 60 &&
    metrics.conversionRate < 30 &&
    metrics.opportunities > 0
  ) {
    patterns.push({
      type:
        "activity-without-conversion",

      title:
        "La actividad comercial todavía no se convierte con suficiente consistencia",

      description:
        `La respuesta comercial alcanza ${metrics.responseRate}%, mientras la conversión registrada está en ${metrics.conversionRate}%.`,

      impact:
        "Movimiento comercial no equivale automáticamente a resultado; conviene revisar dónde se pierde intención.",

      status:
        metrics.conversionRate < 15
          ? "risk"
          : "attention",

      weight:
        (
          100 -
          metrics.conversionRate
        ) +
        metrics.responseRate *
          0.2,
    });
  }

  if (
    metrics.relationshipDiscipline < 65
  ) {
    patterns.push({
      type:
        "relationship-discipline",

      title:
        "La disciplina relacional está condicionando el resultado",

      description:
        `La disciplina de seguimiento y respuesta alcanza ${metrics.relationshipDiscipline}/100.`,

      impact:
        "El founder necesita proteger próximos pasos y reducir atrasos antes de aumentar complejidad.",

      status:
        metrics.relationshipDiscipline < 45
          ? "risk"
          : "attention",

      weight:
        100 -
        metrics.relationshipDiscipline,
    });
  }

  if (
    metrics.conversionRate >= 40 &&
    metrics.responseRate >= 60 &&
    metrics.overdueRelationships === 0
  ) {
    patterns.push({
      type:
        "conversion-strength",

      title:
        "La ejecución comercial está convirtiendo intención en resultado",

      description:
        `La respuesta está en ${metrics.responseRate}% y la conversión registrada en ${metrics.conversionRate}%.`,

      impact:
        "El founder puede concentrarse más en dirección y crecimiento que en recuperación.",

      status:
        "healthy",

      weight:
        metrics.responseRate +
        metrics.conversionRate,
    });
  }

  if (
    metrics.founderHealth >= 70 &&
    metrics.executionPressure < 40 &&
    metrics.overdueRelationships === 0
  ) {
    patterns.push({
      type:
        "balanced-growth",

      title:
        "La operación permite al founder mantener dirección estratégica",

      description:
        `La salud ejecutiva alcanza ${metrics.founderHealth}/100 y la presión de ejecución se mantiene en ${metrics.executionPressure}/100.`,

      impact:
        "Existe espacio para crecer sin introducir una intervención defensiva dominante.",

      status:
        "healthy",

      weight:
        metrics.founderHealth +
        (
          100 -
          metrics.executionPressure
        ),
    });
  }

  if (
    patterns.length === 0
  ) {
    patterns.push({
      type:
        "balanced-growth",

      title:
        "No existe un patrón dominante que requiera intervención",

      description:
        "Las señales disponibles mantienen un equilibrio razonable entre seguimiento, respuesta y conversión.",

      impact:
        "El founder puede mantener dirección sin introducir cambios innecesarios.",

      status:
        "healthy",

      weight:
        50,
    });
  }

  return patterns.sort(
    (
      first,
      second,
    ) =>
      second.weight -
      first.weight,
  );
}

function buildCriticalNarrative(
  dominantPattern: FounderPattern,
  metrics: FounderInsightMetrics,
): FounderNarrative {
  if (
    dominantPattern.type ===
    "protect-before-growth"
  ) {
    return {
      title:
        "Los atrasos están obligando al founder a reaccionar",

      summary:
        `${formatCount(
          metrics.overdueRelationships,
          "relación vencida",
          "relaciones vencidas",
        )} concentran la principal presión ejecutiva. ` +
        "El patrón que no debe ignorarse es que la recuperación está desplazando la dirección.",

      decision: {
        title:
          "Recuperar control antes de ampliar actividad",

        description:
          "Resuelve primero los seguimientos vencidos y vuelve a definir próximos pasos antes de abrir nuevos frentes.",

        actionLabel:
          "Recuperar control relacional",
      },
    };
  }

  return {
    title:
      "La presión operativa está debilitando la capacidad de dirección",

    summary:
      `La presión ejecutiva alcanza ${metrics.executionPressure}/100 y la salud del founder ${metrics.founderHealth}/100.`,

    decision: {
      title:
        "Recuperar claridad ejecutiva",

      description:
        "Atiende primero la causa dominante y evita reaccionar simultáneamente a todos los síntomas comerciales.",

      actionLabel:
        "Resolver patrón crítico",
    },
  };
}

function buildRiskNarrative(
  dominantPattern: FounderPattern,
  metrics: FounderInsightMetrics,
): FounderNarrative {
  if (
    dominantPattern.type ===
    "activity-without-conversion"
  ) {
    return {
      title:
        "El founder puede estar confundiendo movimiento con progreso",

      summary:
        `La respuesta comercial alcanza ${metrics.responseRate}%, pero la conversión registrada permanece en ${metrics.conversionRate}%.`,

      decision: {
        title:
          "Mejorar conversión antes de generar más actividad",

        description:
          "Revisa dónde se pierde intención entre respuesta, seguimiento y decisión.",

        actionLabel:
          "Mejorar conversión",
      },
    };
  }

  if (
    dominantPattern.type ===
    "opportunity-without-response"
  ) {
    return {
      title:
        "Las oportunidades existen, pero necesitan más velocidad relacional",

      summary:
        `${formatCount(
          metrics.opportunities,
          "oportunidad activa",
          "oportunidades activas",
        )} dependen de una respuesta comercial de ${metrics.responseRate}%.`,

      decision: {
        title:
          "Proteger oportunidades con respuesta más rápida",

        description:
          "Prioriza las relaciones interesadas y evita que la falta de seguimiento reduzca su intención.",

        actionLabel:
          "Revisar oportunidades sensibles",
      },
    };
  }

  return {
    title:
      "La disciplina relacional está limitando la capacidad ejecutiva",

    summary:
      `La disciplina relacional está en ${metrics.relationshipDiscipline}/100 y la presión de ejecución en ${metrics.executionPressure}/100.`,

    decision: {
      title:
        "Reducir fricción antes de acelerar",

      description:
        "Cumple próximos pasos y reduce atrasos antes de ampliar el volumen comercial.",

      actionLabel:
        "Mejorar disciplina relacional",
    },
  };
}

function buildAttentionNarrative(
  dominantPattern: FounderPattern,
  metrics: FounderInsightMetrics,
): FounderNarrative {
  if (
    dominantPattern.type ===
    "insufficient-commercial-base"
  ) {
    return {
      title:
        "Todavía falta evidencia para una lectura ejecutiva fuerte",

      summary:
        "La base actual no permite distinguir con suficiente confianza entre oportunidad, presión y patrón estructural.",

      decision: {
        title:
          "Construir evidencia comercial útil",

        description:
          "Registra estados y próximos contactos para que ClienteYA pueda detectar comportamiento real.",

        actionLabel:
          "Construir base comercial",
      },
    };
  }

  if (
    dominantPattern.type ===
    "opportunity-without-response"
  ) {
    return {
      title:
        "Las oportunidades necesitan más velocidad de respuesta",

      summary:
        `${formatCount(
          metrics.opportunities,
          "oportunidad",
          "oportunidades",
        )} permanecen activas con una respuesta comercial de ${metrics.responseRate}%.`,

      decision: {
        title:
          "Acelerar las oportunidades con intención real",

        description:
          "Concentra el contacto en relaciones interesadas y mantén próximos pasos claros.",

        actionLabel:
          "Priorizar oportunidades",
      },
    };
  }

  if (
    dominantPattern.type ===
    "activity-without-conversion"
  ) {
    return {
      title:
        "La ejecución genera movimiento, pero todavía no suficiente conversión",

      summary:
        `La respuesta comercial está en ${metrics.responseRate}% y la conversión registrada en ${metrics.conversionRate}%.`,

      decision: {
        title:
          "Mejorar calidad comercial",

        description:
          "Identifica dónde se pierde intención entre contacto, seguimiento y decisión.",

        actionLabel:
          "Optimizar conversión",
      },
    };
  }

  return {
    title:
      "El founder necesita más disciplina, no más información",

    summary:
      `La salud ejecutiva alcanza ${metrics.founderHealth}/100. ` +
      "No existe una señal crítica dominante, pero sí margen para mejorar foco y continuidad.",

    decision: {
      title:
        "Concentrar la atención en el patrón dominante",

      description:
        "Actúa sobre seguimiento, respuesta o conversión según la señal con mayor presión.",

      actionLabel:
        "Revisar prioridad ejecutiva",
    },
  };
}

function buildHealthyNarrative(
  dominantPattern: FounderPattern,
  metrics: FounderInsightMetrics,
): FounderNarrative {
  if (
    dominantPattern.type ===
    "conversion-strength"
  ) {
    return {
      title:
        "La calidad comercial permite al founder dirigir crecimiento",

      summary:
        `La respuesta alcanza ${metrics.responseRate}% y la conversión registrada ${metrics.conversionRate}%. ` +
        "La ejecución transforma intención en resultado sin una presión defensiva dominante.",

      decision: {
        title:
          "Ampliar oportunidades sin perder calidad",

        description:
          "Incrementa actividad manteniendo la misma disciplina de respuesta y seguimiento.",

        actionLabel:
          "Continuar crecimiento",
      },
    };
  }

  return {
    title:
      "La operación permite mantener dirección estratégica",

    summary:
      `La salud ejecutiva alcanza ${metrics.founderHealth}/100 y la presión de ejecución se mantiene en ${metrics.executionPressure}/100.`,

    decision: {
      title:
        "Mantener dirección estratégica",

      description:
        "Protege el equilibrio actual y evita intervenir donde el sistema ya está funcionando.",

      actionLabel:
        "Mantener dirección",
    },
  };
}

function buildNarrative(
  status: ExecutiveFounderInsightStatus,
  dominantPattern: FounderPattern,
  metrics: FounderInsightMetrics,
): FounderNarrative {
  if (
    status === "critical"
  ) {
    return buildCriticalNarrative(
      dominantPattern,
      metrics,
    );
  }

  if (
    status === "risk"
  ) {
    return buildRiskNarrative(
      dominantPattern,
      metrics,
    );
  }

  if (
    status === "attention"
  ) {
    return buildAttentionNarrative(
      dominantPattern,
      metrics,
    );
  }

  return buildHealthyNarrative(
    dominantPattern,
    metrics,
  );
}

function buildInsights(
  patterns: FounderPattern[],
  metrics: FounderInsightMetrics,
): ExecutiveFounderInsight[] {
  const insights =
    patterns
      .slice(
        0,
        4,
      )
      .map(
        (
          pattern,
        ) => ({
          title:
            pattern.title,

          description:
            pattern.description,

          impact:
            pattern.impact,
        }),
      );

  if (
    insights.length < 5
  ) {
    insights.push({
      title:
        metrics.executionPressure >= 50
          ? "La presión de ejecución compite con la dirección"
          : "La capacidad ejecutiva está protegida",

      description:
        `La presión de ejecución alcanza ${metrics.executionPressure}/100.`,

      impact:
        metrics.executionPressure >= 50
          ? "Conviene reducir atrasos y fricción antes de ampliar responsabilidades."
          : "Existe espacio para trabajar sobre crecimiento y dirección.",
    });
  }

  if (
    insights.length < 5
  ) {
    insights.push({
      title:
        metrics.commercialEfficiency >= 65
          ? "La eficiencia comercial sostiene el resultado"
          : "La eficiencia comercial todavía necesita madurez",

      description:
        `La eficiencia comercial alcanza ${metrics.commercialEfficiency}/100.`,

      impact:
        metrics.commercialEfficiency >= 65
          ? "La operación puede crecer sin aumentar proporcionalmente la presión."
          : "Más actividad no garantiza todavía mejores resultados.",
    });
  }

  return insights.slice(
    0,
    5,
  );
}

export function buildExecutiveFounderInsightsChapter(
  input: ExecutiveFounderInsightsInput,
): ExecutiveFounderInsightsChapter {
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
      metrics,
    );

  const patterns =
    buildPatternCandidates(
      metrics,
    );

  const dominantPattern =
    patterns[0];

  const narrative =
    buildNarrative(
      status,
      dominantPattern,
      metrics,
    );

  return {
    question:
      "¿Qué patrón no debo ignorar?",

    title:
      "Inteligencia del Founder",

    summary:
      narrative.summary,

    status,

    decision:
      narrative.decision,

    insights:
      buildInsights(
        patterns,
        metrics,
      ),
  };
}