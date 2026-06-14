import type { FounderBriefingClient } from "./founder-briefing";

export type WeeklyReportTone = "good" | "warning" | "critical";

export type WeeklyReportItem = {
  id: string;
  title: string;
  description: string;
  tone: WeeklyReportTone;
};

export type WeeklyRevenueMovement = {
  projectedRevenue: number;
  likelyRevenue: number;
  revenueAtRisk: number;
  averageProbability: number;
};

export type WeeklyFounderReport = {
  score: number;
  tone: WeeklyReportTone;

  headline: string;
  summary: string;

  momentum: "Fuerte" | "Estable" | "Débil";
  executionDiscipline: "Alta" | "Media" | "Baja";
  pipelineHealth: "Saludable" | "En observación" | "Crítico";

  totalClients: number;
  activeClients: number;
  inactiveClients: number;

  overdueCount: number;
  ghostingCount: number;
  stalledCount: number;

  weeklyRevenue: WeeklyRevenueMovement;

  topOpportunities: WeeklyReportItem[];
  risks: WeeklyReportItem[];
  recommendations: WeeklyReportItem[];
};

function normalizeDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

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

function isWarm(client: FounderBriefingClient) {
  const status = getStatus(client);

  return (
    status.includes("warm") ||
    status.includes("caliente") ||
    status.includes("interesado") ||
    status.includes("proposal") ||
    status.includes("propuesta") ||
    status.includes("lead")
  );
}

function isCold(client: FounderBriefingClient) {
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
  tone: WeeklyReportTone
): WeeklyReportItem {
  return {
    id,
    title,
    description,
    tone,
  };
}

function estimateProbability(client: FounderBriefingClient) {
  const followUpDelta =
    daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);

  const activityDays = daysSince(client.updated_at || client.created_at);

  let probability = 35;

  if (isWarm(client)) probability += 30;

  if (followUpDelta === 0) probability += 15;
  if (followUpDelta === 1) probability += 10;

  if (followUpDelta !== null && followUpDelta < 0) {
    probability -= 20;
  }

  if (activityDays !== null && activityDays <= 2) {
    probability += 15;
  }

  if (activityDays !== null && activityDays >= 7) {
    probability -= 20;
  }

  if (isCold(client)) {
    probability -= 25;
  }

  return Math.max(5, Math.min(95, probability));
}

function formatGs(value: number) {
  return `Gs. ${value.toLocaleString("es-ES")}`;
}

export function buildWeeklyFounderReport(
  clients: FounderBriefingClient[] = []
): WeeklyFounderReport {
  const totalClients = clients.length;

  const inactiveClients = clients.filter((client) => {
    const days = daysSince(client.updated_at || client.created_at);

    return days !== null && days >= 7;
  });

  const overdueClients = clients.filter((client) => {
    const delta =
      daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);

    return delta !== null && delta < 0;
  });

  const ghostingClients = clients.filter((client) => {
    const activityDays = daysSince(client.updated_at || client.created_at);

    return isWarm(client) && activityDays !== null && activityDays >= 5;
  });

  const stalledClients = clients.filter((client) => {
    const activityDays = daysSince(client.updated_at || client.created_at);

    return activityDays !== null && activityDays >= 10;
  });

  const forecast = clients.map((client) => {
    const probability = estimateProbability(client);
    const value = getClientValue(client);

    return {
      client,
      probability,
      value,
      expectedValue: Math.round((value * probability) / 100),
    };
  });

  const projectedRevenue = forecast.reduce(
    (sum, item) => sum + item.expectedValue,
    0
  );

  const likelyRevenue = forecast
    .filter((item) => item.probability >= 60)
    .reduce((sum, item) => sum + item.expectedValue, 0);

  const revenueAtRisk = forecast
    .filter((item) => item.probability <= 35)
    .reduce((sum, item) => sum + item.value, 0);

  const averageProbability =
    forecast.length > 0
      ? Math.round(
          forecast.reduce((sum, item) => sum + item.probability, 0) /
            forecast.length
        )
      : 0;

  let score = 85;

  score -= overdueClients.length * 6;
  score -= ghostingClients.length * 5;
  score -= stalledClients.length * 4;
  score -= inactiveClients.length * 3;

  if (likelyRevenue > 0) score += 4;

  score = Math.max(0, Math.min(100, score));

  const tone: WeeklyReportTone =
    score < 55 ? "critical" : score < 75 ? "warning" : "good";

  const momentum =
    likelyRevenue >= 300000
      ? "Fuerte"
      : likelyRevenue >= 100000
        ? "Estable"
        : "Débil";

  const executionDiscipline =
    overdueClients.length >= 5
      ? "Baja"
      : overdueClients.length >= 2
        ? "Media"
        : "Alta";

  const pipelineHealth =
    ghostingClients.length >= 4 || stalledClients.length >= 4
      ? "Crítico"
      : ghostingClients.length >= 1 || stalledClients.length >= 1
        ? "En observación"
        : "Saludable";

  const topOpportunities: WeeklyReportItem[] = [];
  const risks: WeeklyReportItem[] = [];
  const recommendations: WeeklyReportItem[] = [];

  forecast
    .sort((a, b) => b.expectedValue - a.expectedValue)
    .slice(0, 3)
    .forEach((item, index) => {
      topOpportunities.push(
        buildItem(
          `opportunity-${index}`,
          getClientName(item.client),
          `${item.probability}% de probabilidad • ${formatGs(
            item.expectedValue
          )} de ingreso esperado`,
          item.probability >= 70
            ? "good"
            : item.probability >= 45
              ? "warning"
              : "critical"
        )
      );
    });

  if (ghostingClients.length > 0) {
    risks.push(
      buildItem(
        "ghosting-risk",
        "Riesgo de pérdida de contacto",
        `${ghostingClients.length} cliente${
          ghostingClients.length === 1 ? "" : "s"
        } muestra${ghostingClients.length === 1 ? "" : "n"} señales de pérdida de momentum.`,
        ghostingClients.length >= 3 ? "critical" : "warning"
      )
    );
  }

  if (overdueClients.length > 0) {
    risks.push(
      buildItem(
        "overdue-followups",
        "Seguimientos vencidos detectados",
        `${overdueClients.length} seguimiento${
          overdueClients.length === 1 ? "" : "s"
        } requiere${overdueClients.length === 1 ? "" : "n"} ejecución inmediata.`,
        overdueClients.length >= 5 ? "critical" : "warning"
      )
    );
  }

  if (stalledClients.length > 0) {
    risks.push(
      buildItem(
        "stalled-pipeline",
        "Oportunidades detenidas en el pipeline",
        `${stalledClients.length} oportunidad${
          stalledClients.length === 1 ? "" : "es"
        } necesita${stalledClients.length === 1 ? "" : "n"} reactivación o cierre.`,
        stalledClients.length >= 3 ? "critical" : "warning"
      )
    );
  }

  if (likelyRevenue > 0) {
    recommendations.push(
      buildItem(
        "protect-revenue",
        "Proteger ingresos de alta probabilidad",
        `Prioriza ${formatGs(
          likelyRevenue
        )} en ingresos probables antes de trabajar leads fríos.`,
        "good"
      )
    );
  }

  if (ghostingClients.length > 0) {
    recommendations.push(
      buildItem(
        "recover-ghosting",
        "Recuperar primero contactos en riesgo",
        "Ejecuta seguimientos rápidos antes de que las oportunidades pierdan más temperatura comercial.",
        ghostingClients.length >= 3 ? "critical" : "warning"
      )
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      buildItem(
        "pipeline-quality",
        "Mejorar calidad del pipeline",
        "Usa esta semana para fortalecer disciplina de seguimiento y claridad comercial por oportunidad.",
        "good"
      )
    );
  }

  const headline =
    tone === "critical"
      ? "La presión operativa semanal es elevada"
      : tone === "warning"
        ? "La semana requiere disciplina comercial"
        : "El momentum comercial se mantiene estable";

  const summary =
    totalClients === 0
      ? "ClientYA necesita datos activos del pipeline para generar inteligencia semanal."
      : `ClientYA analizó ${totalClients} cliente${
          totalClients === 1 ? "" : "s"
        } y proyecta ${formatGs(
          projectedRevenue
        )} de ingreso ponderado con ${averageProbability}% de probabilidad promedio de conversión.`;

  return {
    score,
    tone,

    headline,
    summary,

    momentum,
    executionDiscipline,
    pipelineHealth,

    totalClients,
    activeClients: totalClients - inactiveClients.length,
    inactiveClients: inactiveClients.length,

    overdueCount: overdueClients.length,
    ghostingCount: ghostingClients.length,
    stalledCount: stalledClients.length,

    weeklyRevenue: {
      projectedRevenue,
      likelyRevenue,
      revenueAtRisk,
      averageProbability,
    },

    topOpportunities,
    risks,
    recommendations,
  };
}