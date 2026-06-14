export type ClienteForAICockpit = {
  id: string;
  nombre?: string | null;
  estado?: string | null;
  telefono?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  pagado?: boolean | null;
  monto?: number | null;
  created_at?: string | null;
};

export type AICockpitPriority = "urgent" | "high" | "medium" | "low";

export type AICockpitInsightType =
  | "risk"
  | "opportunity"
  | "followup"
  | "payment"
  | "growth"
  | "summary";

export type ExecutiveTrendTone = "critical" | "warning" | "stable" | "strong";

export type ExecutiveTrend = {
  label: string;
  value: string;
  description: string;
  tone: ExecutiveTrendTone;
};

export type FounderPriorityLevel = "critical" | "high" | "medium" | "low";

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
  clienteId?: string;
  actionLabel?: string;
  actionHref?: string;
};

export type FounderTimelineCategory =
  | "critical"
  | "followup"
  | "revenue"
  | "growth"
  | "ai";

export type FounderTimelineUrgency = "now" | "today" | "week";

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

export type FounderDecisionImpact = "critical" | "high" | "medium" | "low";

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
  clienteId?: string;
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

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(value);
}

function daysUntil(date: string | null | undefined) {
  if (!date) return null;

  const today = new Date();
  const target = new Date(date);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();

  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function daysSince(date: string | null | undefined) {
  if (!date) return null;

  const today = new Date();
  const target = new Date(date);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = today.getTime() - target.getTime();

  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function isWarmLead(cliente: ClienteForAICockpit) {
  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);

  return (
    estado.includes("interes") ||
    estado.includes("lead") ||
    estado.includes("nuevo") ||
    notas.includes("interesado") ||
    notas.includes("presupuesto") ||
    notas.includes("cotización") ||
    notas.includes("cotizacion")
  );
}

function isRiskClient(cliente: ClienteForAICockpit) {
  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);

  return (
    estado.includes("riesgo") ||
    estado.includes("inactivo") ||
    estado.includes("perdido") ||
    notas.includes("no responde") ||
    notas.includes("frío") ||
    notas.includes("frio") ||
    notas.includes("cancelar") ||
    notas.includes("problema")
  );
}

function isPaidClient(cliente: ClienteForAICockpit) {
  const estado = normalize(cliente.estado);

  return (
    cliente.pagado === true ||
    estado.includes("pagó") ||
    estado.includes("pago") ||
    estado.includes("pagado")
  );
}

function buildFounderPriorities(
  clientes: ClienteForAICockpit[]
): FounderPriority[] {
  const priorities: FounderPriority[] = [];

  clientes.forEach((cliente) => {
    const nextContact = daysUntil(cliente.proximo_contacto);
    const monto = cliente.monto || 0;
    const name = cliente.nombre || "Cliente";

    if (isWarmLead(cliente) && nextContact !== null && nextContact <= 0) {
      priorities.push({
        id: "followup-" + cliente.id,
        type: "followup",
        priority: "critical",
        title: "Seguimiento urgente: " + name,
        description:
          "Lead caliente sin seguimiento activo. Riesgo de perder oportunidad comercial.",
        score: 92,
        clienteId: cliente.id,
        actionLabel: "Abrir cliente",
        actionHref: "/dashboard/clientes/" + cliente.id,
      });
    }

    if (isRiskClient(cliente)) {
      priorities.push({
        id: "risk-" + cliente.id,
        type: "risk",
        priority: "high",
        title: "Cliente en riesgo: " + name,
        description:
          "Cliente detectado con señales de riesgo operacional o comercial.",
        score: 84,
        clienteId: cliente.id,
        actionLabel: "Revisar cliente",
        actionHref: "/dashboard/clientes/" + cliente.id,
      });
    }

    if (!cliente.pagado && monto >= 500000) {
      priorities.push({
        id: "revenue-" + cliente.id,
        type: "revenue",
        priority: "high",
        title: "Ingreso pendiente importante",
        description:
          "Hay Gs. " +
          monto.toLocaleString("es-PY") +
          " pendientes por cobrar.",
        score: 88,
        clienteId: cliente.id,
        actionLabel: "Ver pagos",
        actionHref: "/dashboard/clientes/" + cliente.id,
      });
    }
  });

  return priorities.sort((a, b) => b.score - a.score).slice(0, 8);
}

function buildFounderTimeline(
  clientes: ClienteForAICockpit[],
  insights: AICockpitInsight[],
  priorities: FounderPriority[]
): FounderTimelineItem[] {
  const timeline: FounderTimelineItem[] = [];

  const criticalCount = priorities.filter(
    (item) => item.priority === "critical"
  ).length;

  const overdueCount = insights.filter(
    (item) => item.type === "followup" && item.priority === "urgent"
  ).length;

  const revenueCount = priorities.filter(
    (item) => item.type === "revenue"
  ).length;

  const opportunityCount = insights.filter(
    (item) => item.type === "opportunity"
  ).length;

  const riskCount = insights.filter((item) => item.type === "risk").length;

  if (criticalCount > 0) {
    timeline.push({
      id: "timeline-critical-now",
      category: "critical",
      urgency: "now",
      title: "Atención ejecutiva inmediata",
      description:
        String(criticalCount) +
        " prioridad(es) crítica(s) requieren decisión o acción directa del founder.",
      score: 96,
      actionLabel: "Revisar prioridades",
      actionHref: "/dashboard/cockpit",
    });
  }

  if (overdueCount > 0) {
    timeline.push({
      id: "timeline-followup-today",
      category: "followup",
      urgency: "today",
      title: "Seguimientos vencidos",
      description:
        String(overdueCount) +
        " cliente(s) necesitan contacto hoy para evitar pérdida de oportunidad.",
      score: 88,
      actionLabel: "Ver seguimientos",
      actionHref: "/dashboard",
    });
  }

  if (revenueCount > 0) {
    timeline.push({
      id: "timeline-revenue-today",
      category: "revenue",
      urgency: "today",
      title: "Control de ingresos pendientes",
      description:
        String(revenueCount) +
        " ingreso(s) importante(s) pueden afectar el flujo comercial si no se gestionan.",
      score: 84,
      actionLabel: "Revisar cobros",
      actionHref: "/dashboard/cockpit",
    });
  }

  if (opportunityCount > 0) {
    timeline.push({
      id: "timeline-growth-week",
      category: "growth",
      urgency: "week",
      title: "Momentum comercial activo",
      description:
        String(opportunityCount) +
        " oportunidad(es) muestran señales comerciales positivas para avanzar esta semana.",
      score: 76,
      actionLabel: "Ver oportunidades",
      actionHref: "/dashboard/cockpit",
    });
  }

  timeline.push({
    id: "timeline-ai-recommendation",
    category: "ai",
    urgency: riskCount > 0 || criticalCount > 0 ? "now" : "today",
    title:
      riskCount > 0 || criticalCount > 0
        ? "Recomendación AI: reducir presión antes de vender más"
        : "Recomendación AI: mantener velocidad comercial",
    description:
      riskCount > 0 || criticalCount > 0
        ? "Prioriza riesgos, seguimientos vencidos y cobros antes de abrir nuevas acciones comerciales."
        : "La operación está estable. Conviene mantener contacto activo y avanzar oportunidades calientes.",
    score: riskCount > 0 || criticalCount > 0 ? 90 : 70,
    actionLabel: "Abrir cockpit",
    actionHref: "/dashboard/cockpit",
  });

  if (clientes.length === 0) {
    timeline.push({
      id: "timeline-empty-start",
      category: "growth",
      urgency: "today",
      title: "Construir primera base comercial",
      description:
        "Carga tus primeros clientes para que ClienteYA pueda generar prioridades, timeline y recomendaciones AI.",
      score: 100,
      actionLabel: "Crear cliente",
      actionHref: "/dashboard/nuevo",
    });
  }

  return timeline.sort((a, b) => b.score - a.score).slice(0, 6);
}

function buildFounderDecisions({
  founderScore,
  executionPressure,
  revenueMomentum,
  riskCount,
  opportunityCount,
  followupCount,
  unpaidCount,
  totalRevenue,
}: {
  founderScore: number;
  executionPressure: number;
  revenueMomentum: number;
  riskCount: number;
  opportunityCount: number;
  followupCount: number;
  unpaidCount: number;
  totalRevenue: number;
}): FounderDecision[] {
  const decisions: FounderDecision[] = [];

  decisions.push({
    id: "decision-main-action",
    type: "main_action",
    impact:
      followupCount > 0 || riskCount > 0 || executionPressure >= 75
        ? "critical"
        : "high",
    label: "Acción principal",
    title:
      followupCount > 0
        ? "Resolver seguimientos críticos primero"
        : riskCount > 0
          ? "Reducir riesgo comercial antes de crecer"
          : "Mantener velocidad comercial",
    description:
      followupCount > 0
        ? String(followupCount) +
          " seguimiento(s) requieren acción para proteger oportunidades activas."
        : riskCount > 0
          ? String(riskCount) +
            " riesgo(s) comerciales necesitan atención antes de abrir más pipeline."
          : "La operación está estable. Mantén ritmo de contacto y avance comercial.",
    score: followupCount > 0 || riskCount > 0 ? 96 : 78,
    actionLabel: "Ver prioridad",
    actionHref: "/dashboard/cockpit",
  });

  decisions.push({
    id: "decision-risk",
    type: "risk",
    impact: riskCount > 0 || executionPressure >= 75 ? "critical" : "medium",
    label: "Riesgo principal",
    title:
      riskCount > 0
        ? "Riesgo de pérdida o enfriamiento comercial"
        : "Riesgo bajo control",
    description:
      riskCount > 0
        ? String(riskCount) +
          " señal(es) de riesgo están activas. Conviene actuar antes de que afecten cierres."
        : "No hay señales críticas de riesgo comercial en este momento.",
    score: riskCount > 0 ? 90 : 58,
    actionLabel: "Analizar riesgo",
    actionHref: "/dashboard/cockpit",
  });

  decisions.push({
    id: "decision-financial",
    type: "financial",
    impact: unpaidCount > 0 || revenueMomentum < 45 ? "high" : "medium",
    label: "Impacto financiero",
    title:
      unpaidCount > 0
        ? "Cobros pendientes afectan momentum"
        : "Flujo financiero sin fricción crítica",
    description:
      unpaidCount > 0
        ? String(unpaidCount) +
          " pago(s) pendiente(s) deben revisarse para proteger caja y ejecución."
        : "Ingresos confirmados detectados: " +
          formatMoney(totalRevenue) +
          ". Mantén control semanal.",
    score: unpaidCount > 0 ? 86 : 64,
    actionLabel: "Revisar ingresos",
    actionHref: "/dashboard/cockpit",
  });

  decisions.push({
    id: "decision-opportunity",
    type: "opportunity",
    impact: opportunityCount > 0 ? "high" : "low",
    label: "Oportunidad principal",
    title:
      opportunityCount > 0
        ? "Convertir oportunidades calientes"
        : "Crear más señales comerciales",
    description:
      opportunityCount > 0
        ? String(opportunityCount) +
          " oportunidad(es) muestran intención comercial y pueden avanzar esta semana."
        : "Todavía faltan oportunidades fuertes. Conviene activar prospección y seguimiento.",
    score: opportunityCount > 0 ? 82 : 52,
    actionLabel: "Ver oportunidades",
    actionHref: "/dashboard/cockpit",
  });

  decisions.push({
    id: "decision-ai-recommendation",
    type: "ai_recommendation",
    impact: founderScore < 60 || executionPressure >= 75 ? "critical" : "high",
    label: "Recomendación AI",
    title:
      founderScore < 60 || executionPressure >= 75
        ? "Bajar presión operativa antes de escalar"
        : "Mantener foco ejecutivo y acelerar cierres",
    description:
      founderScore < 60 || executionPressure >= 75
        ? "ClienteYA recomienda priorizar seguimientos, riesgos y cobros antes de agregar nuevas iniciativas."
        : "ClienteYA recomienda mantener ritmo comercial, avanzar oportunidades y revisar métricas diariamente.",
    score: founderScore < 60 || executionPressure >= 75 ? 94 : 74,
    actionLabel: "Abrir cockpit",
    actionHref: "/dashboard/cockpit",
  });

  return decisions.sort((a, b) => b.score - a.score);
}

function buildExecutiveTrends({
  founderScore,
  commercialHealth,
  executionPressure,
  revenueMomentum,
  riskCount,
  opportunityCount,
  followupCount,
  unpaidCount,
}: {
  founderScore: number;
  commercialHealth: number;
  executionPressure: number;
  revenueMomentum: number;
  riskCount: number;
  opportunityCount: number;
  followupCount: number;
  unpaidCount: number;
}): ExecutiveTrend[] {
  const pressureTone: ExecutiveTrendTone =
    executionPressure >= 75
      ? "critical"
      : executionPressure >= 50
        ? "warning"
        : "stable";

  const healthTone: ExecutiveTrendTone =
    commercialHealth >= 75
      ? "strong"
      : commercialHealth >= 50
        ? "stable"
        : "warning";

  const revenueTone: ExecutiveTrendTone =
    revenueMomentum >= 75
      ? "strong"
      : revenueMomentum >= 45
        ? "stable"
        : "warning";

  const founderTone: ExecutiveTrendTone =
    founderScore >= 80
      ? "strong"
      : founderScore >= 60
        ? "stable"
        : founderScore >= 40
          ? "warning"
          : "critical";

  return [
    {
      label: "Founder Score",
      value: String(founderScore) + "/100",
      description:
        founderScore >= 80
          ? "La operación comercial está bien controlada."
          : founderScore >= 60
            ? "La operación está estable, con puntos claros de mejora."
            : "La operación requiere atención ejecutiva inmediata.",
      tone: founderTone,
    },
    {
      label: "Salud comercial",
      value: String(commercialHealth) + "/100",
      description:
        opportunityCount > 0
          ? String(opportunityCount) + " oportunidad(es) activas detectadas."
          : "Todavía faltan señales comerciales fuertes en la cartera.",
      tone: healthTone,
    },
    {
      label: "Presión operativa",
      value: String(executionPressure) + "/100",
      description:
        followupCount > 0 || riskCount > 0
          ? String(followupCount) +
            " seguimiento(s) y " +
            String(riskCount) +
            " riesgo(s) requieren control."
          : "No hay presión operativa crítica detectada.",
      tone: pressureTone,
    },
    {
      label: "Momentum de ingresos",
      value: String(revenueMomentum) + "/100",
      description:
        unpaidCount > 0
          ? String(unpaidCount) +
            " pago(s) pendiente(s) pueden afectar el flujo."
          : "Los ingresos confirmados no muestran fricción crítica.",
      tone: revenueTone,
    },
  ];
}

export function buildAICockpitInsights(
  clientes: ClienteForAICockpit[]
): AICockpitInsight[] {
  const insights: AICockpitInsight[] = [];

  clientes.forEach((cliente) => {
    const name = cliente.nombre || "Cliente sin nombre";
    const days = daysUntil(cliente.proximo_contacto || cliente.recordatorio);
    const createdDaysAgo = daysSince(cliente.created_at);
    const amount = Number(cliente.monto || 0);

    if (days !== null && days < 0) {
      insights.push({
        id: "overdue-" + cliente.id,
        clienteId: cliente.id,
        title: "Seguimiento vencido: " + name,
        description:
          "Este cliente tenía seguimiento hace " +
          String(Math.abs(days)) +
          " día(s). Conviene contactarlo hoy.",
        type: "followup",
        priority: "urgent",
        actionLabel: "Ver cliente",
        actionHref: "/dashboard/clientes/" + cliente.id,
      });
    }

    if (days === 0) {
      insights.push({
        id: "today-" + cliente.id,
        clienteId: cliente.id,
        title: "Seguimiento para hoy: " + name,
        description:
          "Este cliente está programado para contacto hoy. Es una acción prioritaria del día.",
        type: "followup",
        priority: "high",
        actionLabel: "Abrir cliente",
        actionHref: "/dashboard/clientes/" + cliente.id,
      });
    }

    if (!isPaidClient(cliente) && amount > 0) {
      insights.push({
        id: "payment-" + cliente.id,
        clienteId: cliente.id,
        title: "Pago pendiente: " + name,
        description:
          "Hay un monto pendiente de " +
          formatMoney(amount) +
          ". Revisar estado de cobro.",
        type: "payment",
        priority: "high",
        actionLabel: "Revisar pago",
        actionHref: "/dashboard/clientes/" + cliente.id,
      });
    }

    if (isRiskClient(cliente)) {
      insights.push({
        id: "risk-" + cliente.id,
        clienteId: cliente.id,
        title: "Cliente en riesgo: " + name,
        description:
          "El estado o las notas indican posible riesgo de pérdida, baja respuesta o problema comercial.",
        type: "risk",
        priority: "urgent",
        actionLabel: "Analizar riesgo",
        actionHref: "/dashboard/clientes/" + cliente.id,
      });
    }

    if (isWarmLead(cliente)) {
      insights.push({
        id: "opportunity-" + cliente.id,
        clienteId: cliente.id,
        title: "Oportunidad comercial: " + name,
        description:
          "Este cliente muestra señales de interés. Puede ser buen momento para avanzar la conversación.",
        type: "opportunity",
        priority: "medium",
        actionLabel: "Ver oportunidad",
        actionHref: "/dashboard/clientes/" + cliente.id,
      });
    }

    if (
      createdDaysAgo !== null &&
      createdDaysAgo <= 3 &&
      !isRiskClient(cliente) &&
      !isPaidClient(cliente)
    ) {
      insights.push({
        id: "new-growth-" + cliente.id,
        clienteId: cliente.id,
        title: "Nuevo movimiento comercial: " + name,
        description:
          "Cliente agregado recientemente. Conviene mantener velocidad de contacto durante los primeros días.",
        type: "growth",
        priority: "low",
        actionLabel: "Revisar cliente",
        actionHref: "/dashboard/clientes/" + cliente.id,
      });
    }
  });

  return insights.sort((a, b) => {
    const order: Record<AICockpitPriority, number> = {
      urgent: 1,
      high: 2,
      medium: 3,
      low: 4,
    };

    return order[a.priority] - order[b.priority];
  });
}

export function buildFounderBriefing(
  clientes: ClienteForAICockpit[]
): FounderBriefing {
  const insights = buildAICockpitInsights(clientes);
  const founderPriorities = buildFounderPriorities(clientes);

  const riskCount = insights.filter((item) => item.type === "risk").length;
  const opportunityCount = insights.filter(
    (item) => item.type === "opportunity"
  ).length;
  const followupCount = insights.filter(
    (item) => item.type === "followup"
  ).length;
  const unpaidCount = insights.filter((item) => item.type === "payment").length;

  const paidClients = clientes.filter(isPaidClient).length;

  const totalRevenue = clientes.reduce((sum, cliente) => {
    if (!isPaidClient(cliente)) return sum;
    return sum + Number(cliente.monto || 0);
  }, 0);

  const clientBase = Math.max(clientes.length, 1);

  const commercialHealth = clamp(
    Math.round(55 + opportunityCount * 8 + paidClients * 4 - riskCount * 10),
    0,
    100
  );

  const executionPressure = clamp(
    Math.round(riskCount * 22 + followupCount * 12 + unpaidCount * 8),
    0,
    100
  );

  const revenueMomentum = clamp(
    Math.round(45 + paidClients * 8 + totalRevenue / 100000 - unpaidCount * 10),
    0,
    100
  );

  const founderScore = clamp(
    Math.round(
      72 +
        opportunityCount * 4 +
        paidClients * 3 -
        riskCount * 12 -
        followupCount * 5 -
        unpaidCount * 4 -
        Math.max(clientBase - paidClients - opportunityCount, 0) * 2
    ),
    0,
    100
  );

  let focus = "Mantener ritmo comercial y revisar oportunidades activas.";

  if (riskCount > 0) {
    focus = "Prioridad máxima: reducir riesgo de pérdida de clientes.";
  } else if (followupCount > 0) {
    focus = "Prioridad del día: completar seguimientos pendientes.";
  } else if (opportunityCount > 0) {
    focus = "Prioridad comercial: convertir oportunidades calientes.";
  } else if (unpaidCount > 0) {
    focus = "Prioridad financiera: revisar pagos pendientes.";
  }

  const executiveTrends = buildExecutiveTrends({
    founderScore,
    commercialHealth,
    executionPressure,
    revenueMomentum,
    riskCount,
    opportunityCount,
    followupCount,
    unpaidCount,
  });

  const founderTimeline = buildFounderTimeline(
    clientes,
    insights,
    founderPriorities
  );

  const founderDecisions = buildFounderDecisions({
    founderScore,
    executionPressure,
    revenueMomentum,
    riskCount,
    opportunityCount,
    followupCount,
    unpaidCount,
    totalRevenue,
  });

  return {
    title: "Briefing ejecutivo AI",
    summary:
      "ClienteYA detectó " +
      String(insights.length) +
      " señal(es) importantes entre " +
      String(clientes.length) +
      " cliente(s).",
    focus,
    founderScore,
    commercialHealth,
    executionPressure,
    revenueMomentum,
    riskCount,
    opportunityCount,
    followupCount,
    unpaidCount,
    totalRevenue,
    executiveTrends,
    founderPriorities,
    founderTimeline,
    founderDecisions,
    insights: insights.slice(0, 8),
  };
}

export function getAICockpitPriorityLabel(priority: AICockpitPriority) {
  if (priority === "urgent") return "Urgente";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";

  return "Baja";
}

export function getAICockpitTypeLabel(type: AICockpitInsightType) {
  if (type === "risk") return "Riesgo";
  if (type === "opportunity") return "Oportunidad";
  if (type === "followup") return "Seguimiento";
  if (type === "payment") return "Pago";
  if (type === "growth") return "Crecimiento";

  return "Resumen";
}

export function getExecutiveTrendLabel(tone: ExecutiveTrendTone) {
  if (tone === "critical") return "Crítico";
  if (tone === "warning") return "Atención";
  if (tone === "strong") return "Fuerte";

  return "Estable";
}