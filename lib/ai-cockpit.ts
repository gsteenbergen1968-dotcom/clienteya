export type RelationshipForAICockpit = {
  id: string;
  name?: string | null;
  company?: string | null;
  status?: string | null;
  phone?: string | null;
  notes?: string | null;
  reminder?: string | null;
  next_contact_at?: string | null;
  paid?: boolean | null;
  created_at?: string | null;
};

export type AICockpitPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export type AICockpitInsightType =
  | "risk"
  | "opportunity"
  | "followup"
  | "payment"
  | "growth"
  | "summary";

export type ExecutiveTrendTone =
  | "critical"
  | "warning"
  | "stable"
  | "strong";

export type ExecutiveTrend = {
  label: string;
  value: string;
  description: string;
  tone: ExecutiveTrendTone;
};

export type FounderPriorityLevel =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type FounderPriorityType =
  | "revenue"
  | "risk"
  | "followup"
  | "growth"
  | "pipeline"
  | "team";

export type FounderPriority = {
  id: string;
  type: FounderPriorityType;
  priority: FounderPriorityLevel;
  title: string;
  description: string;
  score: number;
  relationshipId?: string;
  actionLabel?: string;
  actionHref?: string;
};

export type FounderTimelineCategory =
  | "critical"
  | "followup"
  | "revenue"
  | "growth"
  | "ai";

export type FounderTimelineUrgency =
  | "now"
  | "today"
  | "week";

export type FounderTimelineItem = {
  id: string;
  category: FounderTimelineCategory;
  urgency: FounderTimelineUrgency;
  title: string;
  description: string;
  score: number;
  actionLabel?: string;
  actionHref?: string;
};

export type FounderDecisionType =
  | "main_action"
  | "risk"
  | "financial"
  | "opportunity"
  | "ai_recommendation";

export type FounderDecisionImpact =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type FounderDecision = {
  id: string;
  type: FounderDecisionType;
  impact: FounderDecisionImpact;
  label: string;
  title: string;
  description: string;
  score: number;
  actionLabel?: string;
  actionHref?: string;
};

export type AICockpitInsight = {
  id: string;
  relationshipId?: string;
  title: string;
  description: string;
  type: AICockpitInsightType;
  priority: AICockpitPriority;
  actionLabel: string;
  actionHref: string;
};

export type FounderBriefing = {
  title: string;
  summary: string;
  focus: string;
  founderScore: number;
  commercialHealth: number;
  executionPressure: number;
  revenueMomentum: number;
  riskCount: number;
  opportunityCount: number;
  followupCount: number;
  unpaidCount: number;
  totalRevenue: number;
  executiveTrends: ExecutiveTrend[];
  founderPriorities: FounderPriority[];
  founderTimeline: FounderTimelineItem[];
  founderDecisions: FounderDecision[];
  insights: AICockpitInsight[];
};

function normalize(
  value: string | null | undefined,
) {
  return (value || "")
    .toLowerCase()
    .trim();
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    Math.max(
      value,
      min,
    ),
    max,
  );
}

function daysUntil(
  date: string | null | undefined,
) {
  if (!date) {
    return null;
  }

  const target =
    new Date(date);

  if (
    Number.isNaN(
      target.getTime(),
    )
  ) {
    return null;
  }

  const today =
    new Date();

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

function daysSince(
  date: string | null | undefined,
) {
  if (!date) {
    return null;
  }

  const target =
    new Date(date);

  if (
    Number.isNaN(
      target.getTime(),
    )
  ) {
    return null;
  }

  const today =
    new Date();

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
      today.getTime() -
      target.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function getRelationshipName(
  relationship: RelationshipForAICockpit,
) {
  return (
    relationship.name?.trim() ||
    relationship.company?.trim() ||
    "Relación sin nombre"
  );
}

function isPaidRelationship(
  relationship: RelationshipForAICockpit,
) {
  if (
    relationship.paid === true
  ) {
    return true;
  }

  const status =
    normalize(
      relationship.status,
    );

  return (
    status.includes("pag") ||
    status.includes("convert")
  );
}

function isClosedRelationship(
  relationship: RelationshipForAICockpit,
) {
  if (
    isPaidRelationship(
      relationship,
    )
  ) {
    return false;
  }

  return normalize(
    relationship.status,
  ).includes(
    "cerr",
  );
}

function isInterestedRelationship(
  relationship: RelationshipForAICockpit,
) {
  if (
    isPaidRelationship(
      relationship,
    ) ||
    isClosedRelationship(
      relationship,
    )
  ) {
    return false;
  }

  return normalize(
    relationship.status,
  ).includes(
    "interes",
  );
}

function isNoResponseRelationship(
  relationship: RelationshipForAICockpit,
) {
  if (
    isPaidRelationship(
      relationship,
    ) ||
    isClosedRelationship(
      relationship,
    )
  ) {
    return false;
  }

  const status =
    normalize(
      relationship.status,
    );

  const notes =
    normalize(
      relationship.notes,
    );

  return (
    status.includes(
      "sin respuesta",
    ) ||
    notes.includes(
      "no responde",
    )
  );
}

function isOverdueRelationship(
  relationship: RelationshipForAICockpit,
) {
  if (
    isPaidRelationship(
      relationship,
    ) ||
    isClosedRelationship(
      relationship,
    )
  ) {
    return false;
  }

  const days =
    daysUntil(
      relationship.next_contact_at,
    );

  return (
    typeof days === "number" &&
    days < 0
  );
}

function isDueTodayRelationship(
  relationship: RelationshipForAICockpit,
) {
  if (
    isPaidRelationship(
      relationship,
    ) ||
    isClosedRelationship(
      relationship,
    )
  ) {
    return false;
  }

  return (
    daysUntil(
      relationship.next_contact_at,
    ) === 0
  );
}

function getRelationshipHref(
  relationshipId: string,
) {
  return `/dashboard/relationships/${relationshipId}`;
}

function buildFounderPriorities(
  relationships: RelationshipForAICockpit[],
): FounderPriority[] {
  const priorities:
    FounderPriority[] = [];

  relationships.forEach(
    (
      relationship,
    ) => {
      const name =
        getRelationshipName(
          relationship,
        );

      if (
        isOverdueRelationship(
          relationship,
        )
      ) {
        priorities.push({
          id:
            `followup-${relationship.id}`,

          type:
            "followup",

          priority:
            isInterestedRelationship(
              relationship,
            )
              ? "critical"
              : "high",

          title:
            `Seguimiento vencido: ${name}`,

          description:
            isInterestedRelationship(
              relationship,
            )
              ? "Relación interesada con seguimiento vencido. Conviene recuperar continuidad hoy."
              : "La relación superó su fecha de seguimiento y necesita una nueva acción.",

          score:
            isInterestedRelationship(
              relationship,
            )
              ? 94
              : 86,

          relationshipId:
            relationship.id,

          actionLabel:
            "Abrir relación",

          actionHref:
            getRelationshipHref(
              relationship.id,
            ),
        });
      }

      if (
        isNoResponseRelationship(
          relationship,
        )
      ) {
        priorities.push({
          id:
            `risk-${relationship.id}`,

          type:
            "risk",

          priority:
            "high",

          title:
            `Sin respuesta: ${name}`,

          description:
            "La relación está marcada como sin respuesta y necesita un nuevo intento o una decisión de cierre.",

          score:
            82,

          relationshipId:
            relationship.id,

          actionLabel:
            "Revisar relación",

          actionHref:
            getRelationshipHref(
              relationship.id,
            ),
        });
      }

      if (
        isInterestedRelationship(
          relationship,
        ) &&
        !isOverdueRelationship(
          relationship,
        )
      ) {
        priorities.push({
          id:
            `opportunity-${relationship.id}`,

          type:
            "growth",

          priority:
            "medium",

          title:
            `Oportunidad activa: ${name}`,

          description:
            relationship.next_contact_at
              ? "La relación muestra interés y tiene continuidad comercial registrada."
              : "La relación muestra interés, pero todavía necesita un próximo contacto concreto.",

          score:
            relationship.next_contact_at
              ? 72
              : 78,

          relationshipId:
            relationship.id,

          actionLabel:
            "Ver oportunidad",

          actionHref:
            getRelationshipHref(
              relationship.id,
            ),
        });
      }
    },
  );

  return priorities
    .sort(
      (
        first,
        second,
      ) =>
        second.score -
        first.score,
    )
    .slice(
      0,
      8,
    );
}

function buildAICockpitInsights(
  relationships: RelationshipForAICockpit[],
): AICockpitInsight[] {
  const insights:
    AICockpitInsight[] = [];

  relationships.forEach(
    (
      relationship,
    ) => {
      const name =
        getRelationshipName(
          relationship,
        );

      const nextContactDays =
        daysUntil(
          relationship.next_contact_at,
        );

      const createdDaysAgo =
        daysSince(
          relationship.created_at,
        );

      if (
        isOverdueRelationship(
          relationship,
        ) &&
        nextContactDays !== null
      ) {
        insights.push({
          id:
            `overdue-${relationship.id}`,

          relationshipId:
            relationship.id,

          title:
            `Seguimiento vencido: ${name}`,

          description:
            `Esta relación tenía seguimiento hace ${Math.abs(
              nextContactDays,
            )} día(s). Conviene contactarla hoy.`,

          type:
            "followup",

          priority:
            "urgent",

          actionLabel:
            "Ver relación",

          actionHref:
            getRelationshipHref(
              relationship.id,
            ),
        });
      }

      if (
        isDueTodayRelationship(
          relationship,
        )
      ) {
        insights.push({
          id:
            `today-${relationship.id}`,

          relationshipId:
            relationship.id,

          title:
            `Seguimiento para hoy: ${name}`,

          description:
            "Esta relación está programada para contacto hoy.",

          type:
            "followup",

          priority:
            "high",

          actionLabel:
            "Abrir relación",

          actionHref:
            getRelationshipHref(
              relationship.id,
            ),
        });
      }

      if (
        isNoResponseRelationship(
          relationship,
        )
      ) {
        insights.push({
          id:
            `risk-${relationship.id}`,

          relationshipId:
            relationship.id,

          title:
            `Relación sin respuesta: ${name}`,

          description:
            "La relación necesita un nuevo intento de contacto o una decisión clara sobre su continuidad.",

          type:
            "risk",

          priority:
            isOverdueRelationship(
              relationship,
            )
              ? "urgent"
              : "high",

          actionLabel:
            "Revisar relación",

          actionHref:
            getRelationshipHref(
              relationship.id,
            ),
        });
      }

      if (
        isInterestedRelationship(
          relationship,
        )
      ) {
        insights.push({
          id:
            `opportunity-${relationship.id}`,

          relationshipId:
            relationship.id,

          title:
            `Oportunidad comercial: ${name}`,

          description:
            relationship.next_contact_at
              ? "La relación está marcada como interesada y mantiene un próximo contacto definido."
              : "La relación está marcada como interesada, pero necesita un próximo paso concreto.",

          type:
            "opportunity",

          priority:
            relationship.next_contact_at
              ? "medium"
              : "high",

          actionLabel:
            "Ver oportunidad",

          actionHref:
            getRelationshipHref(
              relationship.id,
            ),
        });
      }

      if (
        createdDaysAgo !== null &&
        createdDaysAgo >= 0 &&
        createdDaysAgo <= 3 &&
        !isNoResponseRelationship(
          relationship,
        ) &&
        !isPaidRelationship(
          relationship,
        ) &&
        !isClosedRelationship(
          relationship,
        )
      ) {
        insights.push({
          id:
            `new-growth-${relationship.id}`,

          relationshipId:
            relationship.id,

          title:
            `Nueva relación: ${name}`,

          description:
            "Relación agregada recientemente. Conviene mantener claridad sobre el próximo paso.",

          type:
            "growth",

          priority:
            "low",

          actionLabel:
            "Revisar relación",

          actionHref:
            getRelationshipHref(
              relationship.id,
            ),
        });
      }
    },
  );

  const order:
    Record<
      AICockpitPriority,
      number
    > = {
      urgent: 1,
      high: 2,
      medium: 3,
      low: 4,
    };

  return insights.sort(
    (
      first,
      second,
    ) =>
      order[first.priority] -
      order[second.priority],
  );
}

function buildFounderTimeline(
  relationships: RelationshipForAICockpit[],
  insights: AICockpitInsight[],
  priorities: FounderPriority[],
): FounderTimelineItem[] {
  const timeline:
    FounderTimelineItem[] = [];

  const criticalCount =
    priorities.filter(
      (
        item,
      ) =>
        item.priority ===
        "critical",
    ).length;

  const overdueCount =
    insights.filter(
      (
        item,
      ) =>
        item.type ===
          "followup" &&
        item.priority ===
          "urgent",
    ).length;

  const opportunityCount =
    insights.filter(
      (
        item,
      ) =>
        item.type ===
        "opportunity",
    ).length;

  const riskCount =
    insights.filter(
      (
        item,
      ) =>
        item.type ===
        "risk",
    ).length;

  if (
    criticalCount > 0
  ) {
    timeline.push({
      id:
        "timeline-critical-now",

      category:
        "critical",

      urgency:
        "now",

      title:
        "Atención ejecutiva inmediata",

      description:
        `${criticalCount} prioridad(es) crítica(s) requieren acción directa.`,

      score:
        96,

      actionLabel:
        "Revisar prioridades",

      actionHref:
        "/dashboard/cockpit",
    });
  }

  if (
    overdueCount > 0
  ) {
    timeline.push({
      id:
        "timeline-followup-today",

      category:
        "followup",

      urgency:
        "today",

      title:
        "Seguimientos vencidos",

      description:
        `${overdueCount} relación(es) necesitan contacto para recuperar continuidad.`,

      score:
        88,

      actionLabel:
        "Ver seguimientos",

      actionHref:
        "/dashboard",
    });
  }

  if (
    opportunityCount > 0
  ) {
    timeline.push({
      id:
        "timeline-growth-week",

      category:
        "growth",

      urgency:
        "week",

      title:
        "Oportunidades activas",

      description:
        `${opportunityCount} oportunidad(es) muestran intención comercial registrada.`,

      score:
        76,

      actionLabel:
        "Ver oportunidades",

      actionHref:
        "/dashboard/cockpit",
    });
  }

  timeline.push({
    id:
      "timeline-ai-recommendation",

    category:
      "ai",

    urgency:
      riskCount > 0 ||
      criticalCount > 0
        ? "now"
        : "today",

    title:
      riskCount > 0 ||
      criticalCount > 0
        ? "Recomendación AI: recuperar continuidad primero"
        : "Recomendación AI: mantener disciplina comercial",

    description:
      riskCount > 0 ||
      criticalCount > 0
        ? "Prioriza seguimientos vencidos y relaciones sin respuesta antes de ampliar actividad."
        : "La operación no muestra presión dominante. Mantén próximos contactos y oportunidades claras.",

    score:
      riskCount > 0 ||
      criticalCount > 0
        ? 90
        : 70,

    actionLabel:
      "Abrir Cockpit",

    actionHref:
      "/dashboard/cockpit",
  });

  if (
    relationships.length === 0
  ) {
    timeline.push({
      id:
        "timeline-empty-start",

      category:
        "growth",

      urgency:
        "today",

      title:
        "Construir primera base comercial",

      description:
        "Crea tus primeras relaciones para que ClienteYA pueda generar prioridades y señales.",

      score:
        100,

      actionLabel:
        "Crear relación",

      actionHref:
        "/dashboard/new",
    });
  }

  return timeline
    .sort(
      (
        first,
        second,
      ) =>
        second.score -
        first.score,
    )
    .slice(
      0,
      6,
    );
}

function buildFounderDecisions({
  founderScore,
  executionPressure,
  riskCount,
  opportunityCount,
  followupCount,
  paidCount,
}: {
  founderScore: number;
  executionPressure: number;
  riskCount: number;
  opportunityCount: number;
  followupCount: number;
  paidCount: number;
}): FounderDecision[] {
  const decisions:
    FounderDecision[] = [];

  decisions.push({
    id:
      "decision-main-action",

    type:
      "main_action",

    impact:
      followupCount > 0 ||
      riskCount > 0 ||
      executionPressure >= 75
        ? "critical"
        : "high",

    label:
      "Acción principal",

    title:
      followupCount > 0
        ? "Resolver seguimientos críticos primero"
        : riskCount > 0
          ? "Recuperar relaciones sensibles antes de crecer"
          : opportunityCount > 0
            ? "Convertir oportunidades activas"
            : "Mantener disciplina comercial",

    description:
      followupCount > 0
        ? `${followupCount} seguimiento(s) requieren acción para proteger continuidad.`
        : riskCount > 0
          ? `${riskCount} señal(es) de riesgo necesitan atención.`
          : opportunityCount > 0
            ? `${opportunityCount} oportunidad(es) muestran intención comercial registrada.`
            : "No existe una presión comercial dominante en este momento.",

    score:
      followupCount > 0 ||
      riskCount > 0
        ? 96
        : opportunityCount > 0
          ? 84
          : 72,

    actionLabel:
      "Ver prioridad",

    actionHref:
      "/dashboard/cockpit",
  });

  decisions.push({
    id:
      "decision-risk",

    type:
      "risk",

    impact:
      riskCount > 0 ||
      executionPressure >= 75
        ? "critical"
        : "medium",

    label:
      "Riesgo principal",

    title:
      riskCount > 0
        ? "Relaciones sin respuesta requieren atención"
        : "Riesgo relacional bajo control",

    description:
      riskCount > 0
        ? `${riskCount} señal(es) de riesgo están activas.`
        : "No hay relaciones sin respuesta que dominen la operación.",

    score:
      riskCount > 0
        ? 90
        : 58,

    actionLabel:
      "Analizar riesgo",

    actionHref:
      "/dashboard/cockpit",
  });

  decisions.push({
    id:
      "decision-financial",

    type:
      "financial",

    impact:
      "low",

    label:
      "Ingresos",

    title:
      "Ingresos todavía no medibles desde Relaciones",

    description:
      "Relaciones no contiene actualmente un monto por relación. ClienteYA no debe presentar ingresos o pagos pendientes sin evidencia.",

    score:
      30,

    actionLabel:
      "Ver relaciones pagadas",

    actionHref:
      "/dashboard/relationships",
  });

  decisions.push({
    id:
      "decision-opportunity",

    type:
      "opportunity",

    impact:
      opportunityCount > 0
        ? "high"
        : "low",

    label:
      "Oportunidad principal",

    title:
      opportunityCount > 0
        ? "Convertir relaciones interesadas"
        : "Crear nuevas oportunidades",

    description:
      opportunityCount > 0
        ? `${opportunityCount} oportunidad(es) muestran intención comercial.`
        : "No existen relaciones interesadas activas en este momento.",

    score:
      opportunityCount > 0
        ? 82
        : 52,

    actionLabel:
      "Ver oportunidades",

    actionHref:
      "/dashboard/cockpit",
  });

  decisions.push({
    id:
      "decision-ai-recommendation",

    type:
      "ai_recommendation",

    impact:
      founderScore < 60 ||
      executionPressure >= 75
        ? "critical"
        : "high",

    label:
      "Recomendación AI",

    title:
      founderScore < 60 ||
      executionPressure >= 75
        ? "Reducir presión antes de ampliar actividad"
        : "Mantener foco ejecutivo",

    description:
      founderScore < 60 ||
      executionPressure >= 75
        ? "ClienteYA recomienda resolver seguimientos y relaciones sensibles antes de agregar nuevas iniciativas."
        : paidCount > 0
          ? "Mantén seguimiento, convierte oportunidades y protege las relaciones ya convertidas."
          : "Mantén seguimiento y convierte oportunidades antes de aumentar complejidad.",

    score:
      founderScore < 60 ||
      executionPressure >= 75
        ? 94
        : 74,

    actionLabel:
      "Abrir Cockpit",

    actionHref:
      "/dashboard/cockpit",
  });

  return decisions.sort(
    (
      first,
      second,
    ) =>
      second.score -
      first.score,
  );
}

function buildExecutiveTrends({
  founderScore,
  commercialHealth,
  executionPressure,
  conversionMomentum,
  riskCount,
  opportunityCount,
  followupCount,
  paidCount,
}: {
  founderScore: number;
  commercialHealth: number;
  executionPressure: number;
  conversionMomentum: number;
  riskCount: number;
  opportunityCount: number;
  followupCount: number;
  paidCount: number;
}): ExecutiveTrend[] {
  const pressureTone:
    ExecutiveTrendTone =
      executionPressure >= 75
        ? "critical"
        : executionPressure >= 50
          ? "warning"
          : "stable";

  const healthTone:
    ExecutiveTrendTone =
      commercialHealth >= 75
        ? "strong"
        : commercialHealth >= 50
          ? "stable"
          : "warning";

  const conversionTone:
    ExecutiveTrendTone =
      conversionMomentum >= 75
        ? "strong"
        : conversionMomentum >= 45
          ? "stable"
          : "warning";

  const founderTone:
    ExecutiveTrendTone =
      founderScore >= 80
        ? "strong"
        : founderScore >= 60
          ? "stable"
          : founderScore >= 40
            ? "warning"
            : "critical";

  return [
    {
      label:
        "Puntuación ejecutiva",

      value:
        `${founderScore}/100`,

      description:
        founderScore >= 80
          ? "La operación comercial está bien controlada."
          : founderScore >= 60
            ? "La operación está estable, con puntos claros de mejora."
            : "La operación requiere atención ejecutiva.",

      tone:
        founderTone,
    },
    {
      label:
        "Salud comercial",

      value:
        `${commercialHealth}/100`,

      description:
        opportunityCount > 0
          ? `${opportunityCount} oportunidad(es) activas detectadas.`
          : "No existen relaciones interesadas activas en este momento.",

      tone:
        healthTone,
    },
    {
      label:
        "Presión operativa",

      value:
        `${executionPressure}/100`,

      description:
        followupCount > 0 ||
        riskCount > 0
          ? `${followupCount} seguimiento(s) y ${riskCount} señal(es) de riesgo requieren control.`
          : "No hay presión operativa crítica detectada.",

      tone:
        pressureTone,
    },
    {
      label:
        "Momentum de conversión",

      value:
        `${conversionMomentum}/100`,

      description:
        `${paidCount} relación(es) están marcadas como pagadas. El indicador refleja conversión por estado, no ingresos monetarios.`,

      tone:
        conversionTone,
    },
  ];
}

export function buildFounderBriefing(
  relationships: RelationshipForAICockpit[],
): FounderBriefing {
  const safeRelationships =
    Array.isArray(
      relationships,
    )
      ? relationships
      : [];

  const insights =
    buildAICockpitInsights(
      safeRelationships,
    );

  const founderPriorities =
    buildFounderPriorities(
      safeRelationships,
    );

  const riskCount =
    insights.filter(
      (
        item,
      ) =>
        item.type ===
        "risk",
    ).length;

  const opportunityCount =
    safeRelationships.filter(
      isInterestedRelationship,
    ).length;

  const followupCount =
    safeRelationships.filter(
      isOverdueRelationship,
    ).length;

  const paidRelationships =
    safeRelationships.filter(
      isPaidRelationship,
    ).length;

  const totalRelationships =
    safeRelationships.length;

  const openRelationships =
    safeRelationships.filter(
      (
        relationship,
      ) =>
        !isPaidRelationship(
          relationship,
        ) &&
        !isClosedRelationship(
          relationship,
        ),
    ).length;

  const overdueRate =
    openRelationships > 0
      ? clamp(
          Math.round(
            (
              followupCount /
              openRelationships
            ) *
              100,
          ),
          0,
          100,
        )
      : 0;

  const opportunityRate =
    openRelationships > 0
      ? clamp(
          Math.round(
            (
              opportunityCount /
              openRelationships
            ) *
              100,
          ),
          0,
          100,
        )
      : 0;

  const paidBase =
    paidRelationships +
    openRelationships;

  const conversionRate =
    paidBase > 0
      ? clamp(
          Math.round(
            (
              paidRelationships /
              paidBase
            ) *
              100,
          ),
          0,
          100,
        )
      : 0;

  const commercialHealth =
    clamp(
      Math.round(
        (
          100 -
          overdueRate
        ) *
          0.4 +
        (
          100 -
          Math.min(
            100,
            riskCount * 15,
          )
        ) *
          0.25 +
        opportunityRate *
          0.2 +
        conversionRate *
          0.15,
      ),
      0,
      100,
    );

  const executionPressure =
    clamp(
      Math.round(
        overdueRate *
          0.6 +
        Math.min(
          100,
          riskCount * 18,
        ) *
          0.4,
      ),
      0,
      100,
    );

  const conversionMomentum =
    clamp(
      Math.round(
        conversionRate *
          0.55 +
        opportunityRate *
          0.3 +
        (
          100 -
          overdueRate
        ) *
          0.15,
      ),
      0,
      100,
    );

  const founderScore =
    clamp(
      Math.round(
        commercialHealth *
          0.4 +
        conversionMomentum *
          0.25 +
        (
          100 -
          executionPressure
        ) *
          0.35,
      ),
      0,
      100,
    );

  let focus =
    "Mantener disciplina comercial y revisar próximos pasos.";

  if (
    riskCount > 0
  ) {
    focus =
      "Prioridad máxima: recuperar relaciones sin respuesta.";
  } else if (
    followupCount > 0
  ) {
    focus =
      "Prioridad del día: completar seguimientos vencidos.";
  } else if (
    opportunityCount > 0
  ) {
    focus =
      "Prioridad comercial: convertir relaciones interesadas.";
  } else if (
    totalRelationships === 0
  ) {
    focus =
      "Prioridad: construir la primera base de relaciones.";
  }

  const executiveTrends =
    buildExecutiveTrends({
      founderScore,
      commercialHealth,
      executionPressure,
      conversionMomentum,
      riskCount,
      opportunityCount,
      followupCount,
      paidCount:
        paidRelationships,
    });

  const founderTimeline =
    buildFounderTimeline(
      safeRelationships,
      insights,
      founderPriorities,
    );

  const founderDecisions =
    buildFounderDecisions({
      founderScore,
      executionPressure,
      riskCount,
      opportunityCount,
      followupCount,
      paidCount:
        paidRelationships,
    });

  return {
    title:
      "Briefing ejecutivo AI",

    summary:
      `ClienteYA detectó ${insights.length} señal(es) relevantes entre ${totalRelationships} relación(es).`,

    focus,

    founderScore,
    commercialHealth,
    executionPressure,

    /*
     * Public contract preserved.
     * This value now represents conversion momentum because Relaciones
     * does not store monetary value per relationship.
     */
    revenueMomentum:
      conversionMomentum,

    riskCount,
    opportunityCount,
    followupCount,

    /*
     * Relaciones does not currently distinguish unpaid monetary balances.
     */
    unpaidCount:
      0,

    /*
     * Relaciones does not currently store monetary value per relationship.
     */
    totalRevenue:
      0,

    executiveTrends,
    founderPriorities,
    founderTimeline,
    founderDecisions,

    insights:
      insights.slice(
        0,
        8,
      ),
  };
}

export { buildAICockpitInsights };

export function getAICockpitPriorityLabel(
  priority: AICockpitPriority,
) {
  if (
    priority === "urgent"
  ) {
    return "Urgente";
  }

  if (
    priority === "high"
  ) {
    return "Alta";
  }

  if (
    priority === "medium"
  ) {
    return "Media";
  }

  return "Baja";
}

export function getAICockpitTypeLabel(
  type: AICockpitInsightType,
) {
  if (
    type === "risk"
  ) {
    return "Riesgo";
  }

  if (
    type === "opportunity"
  ) {
    return "Oportunidad";
  }

  if (
    type === "followup"
  ) {
    return "Seguimiento";
  }

  if (
    type === "payment"
  ) {
    return "Pago";
  }

  if (
    type === "growth"
  ) {
    return "Crecimiento";
  }

  return "Resumen";
}

export function getExecutiveTrendLabel(
  tone: ExecutiveTrendTone,
) {
  if (
    tone === "critical"
  ) {
    return "Crítico";
  }

  if (
    tone === "warning"
  ) {
    return "Atención";
  }

  if (
    tone === "strong"
  ) {
    return "Fuerte";
  }

  return "Estable";
}