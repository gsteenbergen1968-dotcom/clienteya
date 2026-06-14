export type FounderBriefingTone = "good" | "warning" | "critical";

export type FounderBriefingClient = {
  id?: string | number;
  nombre?: string | null;
  name?: string | null;
  telefono?: string | null;
  phone?: string | null;
  estado?: string | null;
  status?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
};

export type FounderBriefingItem = {
  id: string;
  title: string;
  description: string;
  tone: FounderBriefingTone;
};

export type PipelineRiskItem = {
  id: string;
  clientName: string;
  riskType: "ghosting" | "stalled" | "hot" | "revenue";
  title: string;
  description: string;
  tone: FounderBriefingTone;
  value?: number;
};

export type RevenueForecastItem = {
  id: string;
  clientName: string;
  probability: number;
  expectedValue: number;
  pipelineValue: number;
  category: "hot" | "likely" | "delayed" | "risk";
  title: string;
  description: string;
  tone: FounderBriefingTone;
};

export type FounderBriefing = {
  score: number;
  tone: FounderBriefingTone;
  headline: string;
  summary: string;
  insight: string;
  founderFocus: string;
  statusLabel: string;
  operationalPressure: "Baja" | "Media" | "Alta";
  commercialMomentum: "Débil" | "Estable" | "Fuerte";
  executionRisk: "Bajo" | "Elevado" | "Crítico";
  riskScore: number;
  revenueAtRisk: number;
  hotLeadCount: number;
  ghostingRiskCount: number;
  stalledCount: number;
  projectedRevenue: number;
  likelyRevenue: number;
  delayedRevenue: number;
  forecastConfidence: "Baja" | "Media" | "Alta";
  averageConversionProbability: number;
  revenueForecast: RevenueForecastItem[];
  pipelineRisks: PipelineRiskItem[];
  priorities: FounderBriefingItem[];
  opportunities: FounderBriefingItem[];
  risks: FounderBriefingItem[];
  recommendations: FounderBriefingItem[];
};

function normalizeDate(value?: string | null): Date | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysSince(date?: string | null) {
  const parsed = normalizeDate(date);
  if (!parsed) return null;

  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.floor((startOfToday().getTime() - parsed.getTime()) / msPerDay);
}

function daysUntil(date?: string | null) {
  const parsed = normalizeDate(date);
  if (!parsed) return null;

  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.floor((parsed.getTime() - startOfToday().getTime()) / msPerDay);
}

function getClientName(client: FounderBriefingClient) {
  return client.nombre || client.name || "Cliente sin nombre";
}

function getStatus(client: FounderBriefingClient) {
  return (client.estado || client.status || "").toLowerCase().trim();
}

function getClientValue(client: FounderBriefingClient) {
  return Number(client.monto || 50000);
}

function isPaid(client: FounderBriefingClient) {
  const status = getStatus(client);

  return (
    client.pagado === true ||
    status.includes("pagó") ||
    status.includes("pago") ||
    status.includes("pagado")
  );
}

function isWarm(client: FounderBriefingClient) {
  const status = getStatus(client);

  return (
    status.includes("warm") ||
    status.includes("caliente") ||
    status.includes("interesado") ||
    status.includes("interested") ||
    status.includes("propuesta") ||
    status.includes("proposal") ||
    status.includes("lead")
  );
}

function isColdOrLost(client: FounderBriefingClient) {
  const status = getStatus(client);

  return (
    status.includes("cold") ||
    status.includes("frio") ||
    status.includes("frío") ||
    status.includes("lost") ||
    status.includes("perdido") ||
    status.includes("cerrado")
  );
}

function buildItem(
  id: string,
  title: string,
  description: string,
  tone: FounderBriefingTone
): FounderBriefingItem {
  return { id, title, description, tone };
}

function buildPipelineRisk(
  id: string,
  clientName: string,
  riskType: PipelineRiskItem["riskType"],
  title: string,
  description: string,
  tone: FounderBriefingTone,
  value?: number
): PipelineRiskItem {
  return {
    id,
    clientName,
    riskType,
    title,
    description,
    tone,
    value,
  };
}

function getConversionProbability(client: FounderBriefingClient) {
  const status = getStatus(client);
  const followUpDelta =
    daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);
  const lastActivityDays = daysSince(client.updated_at || client.created_at);

  let probability = 35;

  if (isPaid(client)) probability = 100;
  if (isWarm(client)) probability += 25;
  if (status.includes("propuesta") || status.includes("proposal")) {
    probability += 20;
  }
  if (status.includes("contact")) probability += 10;
  if (status.includes("nuevo")) probability += 5;

  if (followUpDelta === 0) probability += 15;
  if (followUpDelta === 1) probability += 10;
  if (followUpDelta !== null && followUpDelta < 0) probability -= 15;
  if (followUpDelta !== null && followUpDelta <= -3) probability -= 10;

  if (lastActivityDays !== null && lastActivityDays <= 2) probability += 15;
  if (lastActivityDays !== null && lastActivityDays >= 7) probability -= 15;
  if (lastActivityDays !== null && lastActivityDays >= 14) probability -= 10;

  if (isColdOrLost(client)) probability -= 30;

  return Math.max(5, Math.min(95, probability));
}

function getForecastCategory(
  client: FounderBriefingClient,
  probability: number
): RevenueForecastItem["category"] {
  const followUpDelta =
    daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);
  const lastActivityDays = daysSince(client.updated_at || client.created_at);

  if (
    probability >= 75 &&
    (followUpDelta === 0 ||
      followUpDelta === 1 ||
      (lastActivityDays !== null && lastActivityDays <= 2))
  ) {
    return "hot";
  }

  if (probability >= 60) return "likely";

  if (
    probability >= 35 &&
    ((followUpDelta !== null && followUpDelta < 0) ||
      (lastActivityDays !== null && lastActivityDays >= 7))
  ) {
    return "delayed";
  }

  return "risk";
}

function getForecastTone(
  category: RevenueForecastItem["category"]
): FounderBriefingTone {
  if (category === "hot" || category === "likely") return "good";
  if (category === "delayed") return "warning";
  return "critical";
}

function getForecastTitle(category: RevenueForecastItem["category"]) {
  if (category === "hot") return "Alta probabilidad de cierre";
  if (category === "likely") return "Ingreso probable";
  if (category === "delayed") return "Ingreso retrasado";
  return "Ingreso en riesgo";
}

function getForecastDescription(
  category: RevenueForecastItem["category"],
  probability: number
) {
  if (category === "hot") {
    return `Probabilidad estimada de conversión: ${probability}%. Un contacto rápido puede acelerar el cierre.`;
  }

  if (category === "likely") {
    return `Probabilidad estimada de conversión: ${probability}%. Mantén seguimiento comercial disciplinado.`;
  }

  if (category === "delayed") {
    return `Probabilidad estimada de conversión: ${probability}%. La oportunidad sigue viva, pero necesita movimiento.`;
  }

  return `Probabilidad estimada de conversión: ${probability}%. Existe riesgo alto de pérdida si no hay una acción clara.`;
}

function buildRevenueForecastItem(
  client: FounderBriefingClient
): RevenueForecastItem {
  const probability = getConversionProbability(client);
  const pipelineValue = getClientValue(client);
  const expectedValue = Math.round((pipelineValue * probability) / 100);
  const category = getForecastCategory(client, probability);

  return {
    id: String(client.id || `${getClientName(client)}-${pipelineValue}`),
    clientName: getClientName(client),
    probability,
    expectedValue,
    pipelineValue,
    category,
    title: getForecastTitle(category),
    description: getForecastDescription(category, probability),
    tone: getForecastTone(category),
  };
}

function formatGsInternal(value: number) {
  return `Gs. ${value.toLocaleString("es-ES")}`;
}

export function buildFounderBriefing(
  clients: FounderBriefingClient[] = []
): FounderBriefing {
  const totalClients = clients.length;

  const openClients = clients.filter((client) => !isPaid(client));
  const warmClients = openClients.filter(isWarm);
  const coldOrLostClients = openClients.filter(isColdOrLost);

  const overdueFollowUps = openClients.filter((client) => {
    const followUpDelta =
      daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);

    return followUpDelta !== null && followUpDelta < 0;
  });

  const todaysFollowUps = openClients.filter((client) => {
    const followUpDelta =
      daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);

    return followUpDelta === 0;
  });

  const inactiveClients = openClients.filter((client) => {
    const lastActivityDays = daysSince(client.updated_at || client.created_at);

    return lastActivityDays !== null && lastActivityDays >= 7;
  });

  const ghostingRiskClients = openClients.filter((client) => {
    const lastActivityDays = daysSince(client.updated_at || client.created_at);
    const followUpDelta =
      daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);

    return (
      !isColdOrLost(client) &&
      ((isWarm(client) && lastActivityDays !== null && lastActivityDays >= 5) ||
        (followUpDelta !== null && followUpDelta <= -2))
    );
  });

  const stalledClients = openClients.filter((client) => {
    const lastActivityDays = daysSince(client.updated_at || client.created_at);
    const followUpDelta =
      daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);

    return (
      !isColdOrLost(client) &&
      lastActivityDays !== null &&
      lastActivityDays >= 10 &&
      (followUpDelta === null || followUpDelta < 0)
    );
  });

  const hotLeadClients = openClients.filter((client) => {
    const followUpDelta =
      daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);
    const lastActivityDays = daysSince(client.updated_at || client.created_at);

    return (
      isWarm(client) &&
      (followUpDelta === 0 ||
        followUpDelta === 1 ||
        (lastActivityDays !== null && lastActivityDays <= 2))
    );
  });

  const revenueForecast = openClients
    .map(buildRevenueForecastItem)
    .sort((a, b) => b.expectedValue - a.expectedValue);

  const projectedRevenue = revenueForecast.reduce(
    (sum, item) => sum + item.expectedValue,
    0
  );

  const likelyRevenue = revenueForecast
    .filter((item) => item.category === "hot" || item.category === "likely")
    .reduce((sum, item) => sum + item.expectedValue, 0);

  const delayedRevenue = revenueForecast
    .filter((item) => item.category === "delayed")
    .reduce((sum, item) => sum + item.expectedValue, 0);

  const revenueAtRisk = revenueForecast
    .filter((item) => item.category === "risk")
    .reduce((sum, item) => sum + item.pipelineValue, 0);

  const averageConversionProbability =
    revenueForecast.length > 0
      ? Math.round(
          revenueForecast.reduce((sum, item) => sum + item.probability, 0) /
            revenueForecast.length
        )
      : 0;

  const forecastConfidence =
    revenueForecast.length >= 10
      ? "Alta"
      : revenueForecast.length >= 4
        ? "Media"
        : "Baja";

  const riskScore = Math.max(
    0,
    Math.min(
      100,
      ghostingRiskClients.length * 18 +
        stalledClients.length * 15 +
        overdueFollowUps.length * 10 +
        inactiveClients.length * 5
    )
  );

  let score = 88;

  score -= overdueFollowUps.length * 7;
  score -= inactiveClients.length * 3;
  score -= coldOrLostClients.length * 2;
  score -= ghostingRiskClients.length * 4;
  score -= stalledClients.length * 4;

  if (todaysFollowUps.length >= 1) score += 3;
  if (hotLeadClients.length >= 1) score += 5;
  if (warmClients.length >= 3) score += 5;
  if (likelyRevenue > 0) score += 3;

  score = Math.max(0, Math.min(100, score));

  const tone: FounderBriefingTone =
    score < 55 ? "critical" : score < 75 ? "warning" : "good";

  const operationalPressure =
    overdueFollowUps.length >= 5 || todaysFollowUps.length >= 8
      ? "Alta"
      : overdueFollowUps.length >= 2 || todaysFollowUps.length >= 4
        ? "Media"
        : "Baja";

  const commercialMomentum =
    hotLeadClients.length >= 3 || warmClients.length >= 5
      ? "Fuerte"
      : hotLeadClients.length >= 1 || warmClients.length >= 2
        ? "Estable"
        : "Débil";

  const executionRisk =
    ghostingRiskClients.length >= 4 || overdueFollowUps.length >= 5
      ? "Crítico"
      : ghostingRiskClients.length >= 1 ||
          overdueFollowUps.length >= 2 ||
          inactiveClients.length >= 5
        ? "Elevado"
        : "Bajo";

  const pipelineRisks: PipelineRiskItem[] = [];

  ghostingRiskClients.slice(0, 3).forEach((client, index) => {
    pipelineRisks.push(
      buildPipelineRisk(
        `ghosting-${client.id || index}`,
        getClientName(client),
        "ghosting",
        "Riesgo de pérdida de contacto",
        "Cliente con señales de interés o seguimiento vencido, pero sin movimiento comercial suficiente.",
        "critical",
        getClientValue(client)
      )
    );
  });

  stalledClients.slice(0, 3).forEach((client, index) => {
    pipelineRisks.push(
      buildPipelineRisk(
        `stalled-${client.id || index}`,
        getClientName(client),
        "stalled",
        "Oportunidad detenida",
        "Oportunidad sin avance comercial claro. Requiere decisión: recuperar, avanzar o cerrar.",
        "warning",
        getClientValue(client)
      )
    );
  });

  hotLeadClients.slice(0, 3).forEach((client, index) => {
    pipelineRisks.push(
      buildPipelineRisk(
        `hot-${client.id || index}`,
        getClientName(client),
        "hot",
        "Oportunidad caliente",
        "Cliente con señales activas. Prioriza contacto rápido para proteger conversión.",
        "good",
        getClientValue(client)
      )
    );
  });

  const priorities: FounderBriefingItem[] = [];
  const opportunities: FounderBriefingItem[] = [];
  const risks: FounderBriefingItem[] = [];
  const recommendations: FounderBriefingItem[] = [];

  if (ghostingRiskClients.length > 0) {
    priorities.push(
      buildItem(
        "ghosting-risk",
        `${ghostingRiskClients.length} cliente${
          ghostingRiskClients.length === 1 ? "" : "s"
        } con riesgo de pérdida de contacto`,
        "Recupera estos contactos antes de que el pipeline pierda velocidad comercial.",
        ghostingRiskClients.length >= 3 ? "critical" : "warning"
      )
    );
  }

  if (overdueFollowUps.length > 0) {
    priorities.push(
      buildItem(
        "overdue-follow-ups",
        `${overdueFollowUps.length} seguimiento${
          overdueFollowUps.length === 1 ? "" : "s"
        } vencido${overdueFollowUps.length === 1 ? "" : "s"}`,
        "Estos clientes necesitan atención inmediata antes de que se pierda el momentum comercial.",
        overdueFollowUps.length >= 5 ? "critical" : "warning"
      )
    );

    risks.push(
      buildItem(
        "pipeline-slippage",
        "Deslizamiento del pipeline",
        "Hay seguimientos planificados que ya vencieron. Esto puede reducir la probabilidad de conversión.",
        overdueFollowUps.length >= 5 ? "critical" : "warning"
      )
    );
  }

  if (likelyRevenue > 0) {
    opportunities.push(
      buildItem(
        "likely-revenue",
        "Ingreso probable detectado",
        `ClientYA estima ${formatGsInternal(
          likelyRevenue
        )} como ingreso con mayor probabilidad de conversión.`,
        "good"
      )
    );
  }

  if (delayedRevenue > 0) {
    risks.push(
      buildItem(
        "delayed-revenue",
        "Ingreso retrasado",
        `Hay ${formatGsInternal(
          delayedRevenue
        )} en oportunidades que siguen vivas, pero necesitan movimiento comercial.`,
        "warning"
      )
    );
  }

  if (stalledClients.length > 0) {
    risks.push(
      buildItem(
        "stalled-pipeline",
        `${stalledClients.length} oportunidad${
          stalledClients.length === 1 ? "" : "es"
        } detenida${stalledClients.length === 1 ? "" : "s"}`,
        "Estas oportunidades necesitan una decisión comercial: avanzar, reactivar o cerrar.",
        stalledClients.length >= 3 ? "critical" : "warning"
      )
    );
  }

  if (todaysFollowUps.length > 0) {
    priorities.push(
      buildItem(
        "today-follow-ups",
        `${todaysFollowUps.length} acción${
          todaysFollowUps.length === 1 ? "" : "es"
        } comercial${todaysFollowUps.length === 1 ? "" : "es"} para hoy`,
        "Completa estos seguimientos antes de abrir nuevos frentes comerciales.",
        todaysFollowUps.length >= 8 ? "warning" : "good"
      )
    );
  }

  if (hotLeadClients.length > 0) {
    opportunities.push(
      buildItem(
        "hot-leads",
        `${hotLeadClients.length} oportunidad${
          hotLeadClients.length === 1 ? "" : "es"
        } caliente${hotLeadClients.length === 1 ? "" : "s"}`,
        "Estos clientes muestran señales recientes. Un contacto rápido puede mejorar la conversión.",
        "good"
      )
    );
  }

  if (warmClients.length > 0) {
    opportunities.push(
      buildItem(
        "warm-pipeline",
        `${warmClients.length} oportunidad${
          warmClients.length === 1 ? "" : "es"
        } comercial${warmClients.length === 1 ? "" : "es"} en pipeline`,
        "Existen señales de intención comercial o movimiento activo.",
        warmClients.length >= 5 ? "good" : "warning"
      )
    );
  }

  if (inactiveClients.length > 0) {
    risks.push(
      buildItem(
        "inactive-clients",
        `${inactiveClients.length} cliente${
          inactiveClients.length === 1 ? "" : "s"
        } inactivo${inactiveClients.length === 1 ? "" : "s"}`,
        "No muestran actividad reciente y pueden necesitar una acción de reactivación.",
        inactiveClients.length >= 8 ? "critical" : "warning"
      )
    );
  }

  if (revenueAtRisk > 0) {
    risks.push(
      buildItem(
        "revenue-at-risk",
        "Ingreso en riesgo detectado",
        `Hay ${formatGsInternal(
          revenueAtRisk
        )} asociado a oportunidades con baja probabilidad o pérdida de momentum.`,
        revenueAtRisk >= 250000 ? "critical" : "warning"
      )
    );
  }

  if (totalClients === 0) {
    priorities.push(
      buildItem(
        "empty-system",
        "Sin datos comerciales todavía",
        "Carga clientes activos para activar la capa de inteligencia founder.",
        "warning"
      )
    );

    recommendations.push(
      buildItem(
        "start-with-input",
        "Carga leads activos primero",
        "La inteligencia del briefing mejora cuando existen estados, seguimientos y actividad registrada.",
        "good"
      )
    );
  }

  if (ghostingRiskClients.length > 0) {
    const examples = ghostingRiskClients
      .slice(0, 3)
      .map((client) => getClientName(client))
      .join(", ");

    recommendations.push(
      buildItem(
        "recover-ghosting",
        "Recupera primero clientes con riesgo de pérdida de contacto",
        examples
          ? `Comienza con: ${examples}. Usa un mensaje corto, directo y orientado a decisión.`
          : "Comienza por los contactos con seguimiento vencido y mayor valor comercial.",
        ghostingRiskClients.length >= 3 ? "critical" : "warning"
      )
    );
  }

  if (likelyRevenue > 0) {
    recommendations.push(
      buildItem(
        "protect-likely-revenue",
        "Protege el ingreso probable",
        "Trabaja primero las oportunidades con mayor probabilidad antes de invertir tiempo en leads fríos.",
        "good"
      )
    );
  }

  if (hotLeadClients.length > 0) {
    recommendations.push(
      buildItem(
        "convert-hot-leads",
        "Convierte oportunidades calientes hoy",
        "Prioriza contacto rápido con leads activos antes de trabajar oportunidades frías.",
        "good"
      )
    );
  }

  if (stalledClients.length > 0) {
    recommendations.push(
      buildItem(
        "clean-stalled",
        "Limpia oportunidades detenidas",
        "Define si cada oportunidad debe avanzar, recibir una última acción o cerrarse.",
        "warning"
      )
    );
  }

  if (priorities.length === 0) {
    priorities.push(
      buildItem(
        "stable-day",
        "Día operativo estable",
        "No se detecta presión crítica. Usa el día para mejorar la calidad del pipeline.",
        "good"
      )
    );
  }

  if (opportunities.length === 0 && totalClients > 0) {
    opportunities.push(
      buildItem(
        "create-momentum",
        "Crear oportunidades comerciales",
        "No se detectaron oportunidades calientes. Enfócate en reactivación o generación de nuevos leads.",
        "warning"
      )
    );
  }

  if (risks.length === 0) {
    risks.push(
      buildItem(
        "no-major-risk",
        "Sin riesgo operativo mayor",
        "La actividad actual no muestra señales críticas.",
        "good"
      )
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      buildItem(
        "focus-quality",
        "Mejora la calidad del pipeline",
        "Actualiza estados, fechas de seguimiento y próximos pasos para mantener control comercial.",
        "good"
      )
    );
  }

  const headline =
    tone === "critical"
      ? "La operación requiere atención inmediata"
      : tone === "warning"
        ? "Disciplina operativa requerida hoy"
        : "Ritmo operativo estable";

  const statusLabel =
    tone === "critical"
      ? "Atención crítica"
      : tone === "warning"
        ? "Requiere atención"
        : "Operación estable";

  const summary =
    totalClients === 0
      ? "ClientYA está listo para generar inteligencia founder cuando exista actividad comercial registrada."
      : `ClientYA analizó ${totalClients} cliente${
          totalClients === 1 ? "" : "s"
        }, proyecta ${formatGsInternal(
          projectedRevenue
        )} en ingreso ponderado y detecta ${averageConversionProbability}% de probabilidad promedio de conversión.`;

  const insight =
    likelyRevenue > 0
      ? `El forecast muestra ingreso probable por ${formatGsInternal(
          likelyRevenue
        )}. La prioridad es proteger estas oportunidades con seguimiento rápido y claro.`
      : ghostingRiskClients.length > 0
        ? "El pipeline muestra riesgo de pérdida de momentum. La prioridad es recuperar clientes con señales de interés antes de que se enfríen."
        : stalledClients.length > 0
          ? "Existen oportunidades detenidas. El foco debe estar en decidir cuáles avanzar, reactivar o cerrar."
          : hotLeadClients.length > 0
            ? "Hay oportunidades calientes activas. El día debe enfocarse en conversión rápida y seguimiento comercial."
            : tone === "critical"
              ? "El sistema muestra señales de pérdida de control comercial. Recupera primero seguimientos vencidos y oportunidades con mayor intención."
              : tone === "warning"
                ? "El pipeline necesita disciplina de seguimiento. Cierra atrasos antes de generar más actividad nueva."
                : "La operación está bajo control. Usa este momento para mejorar calidad de datos y velocidad comercial.";

  const founderFocus =
    likelyRevenue > 0
      ? "Protección de ingreso probable"
      : ghostingRiskClients.length > 0
        ? "Recuperación de clientes en riesgo"
        : hotLeadClients.length > 0
          ? "Conversión de oportunidades calientes"
          : stalledClients.length > 0
            ? "Limpieza del pipeline detenido"
            : overdueFollowUps.length > 0
              ? "Recuperación de seguimientos vencidos"
              : "Generación y reactivación comercial";

  return {
    score,
    tone,
    headline,
    summary,
    insight,
    founderFocus,
    statusLabel,
    operationalPressure,
    commercialMomentum,
    executionRisk,
    riskScore,
    revenueAtRisk,
    hotLeadCount: hotLeadClients.length,
    ghostingRiskCount: ghostingRiskClients.length,
    stalledCount: stalledClients.length,
    projectedRevenue,
    likelyRevenue,
    delayedRevenue,
    forecastConfidence,
    averageConversionProbability,
    revenueForecast,
    pipelineRisks,
    priorities,
    opportunities,
    risks,
    recommendations,
  };
}