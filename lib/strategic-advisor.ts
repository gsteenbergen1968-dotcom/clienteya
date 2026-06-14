import type { FounderBriefingClient } from "./founder-briefing";

export type StrategicAdvisorTone = "good" | "warning" | "critical";

export type StrategicInsight = {
  id: string;
  title: string;
  message: string;
  recommendation: string;
  tone: StrategicAdvisorTone;
};

export type StrategicAdvisorReport = {
  score: number;
  tone: StrategicAdvisorTone;

  headline: string;
  summary: string;

  executionPressure: number;
  concentrationRisk: number;
  pipelineHealth: number;
  commercialMomentum: number;

  insights: StrategicInsight[];
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

function daysSince(value?: string | null) {
  const date = normalizeDate(value);

  if (!date) return null;

  const diff = startOfToday().getTime() - date.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function daysUntil(value?: string | null) {
  const date = normalizeDate(value);

  if (!date) return null;

  const diff = date.getTime() - startOfToday().getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24));
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
    status.includes("lead") ||
    status.includes("proposal") ||
    status.includes("propuesta") ||
    status.includes("interesado")
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

function estimateProbability(client: FounderBriefingClient) {
  let probability = 40;

  if (isWarm(client)) probability += 30;

  const activity = daysSince(client.updated_at || client.created_at) || 0;

  if (activity <= 2) probability += 20;
  if (activity >= 7) probability -= 25;

  const followUp =
    daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);

  if (followUp === 0) probability += 10;

  if (followUp !== null && followUp < 0) {
    probability -= 20;
  }

  if (isCold(client)) {
    probability -= 30;
  }

  return Math.max(5, Math.min(95, probability));
}

function buildInsight(
  id: string,
  title: string,
  message: string,
  recommendation: string,
  tone: StrategicAdvisorTone
): StrategicInsight {
  return {
    id,
    title,
    message,
    recommendation,
    tone,
  };
}

export function buildStrategicAdvisorReport(
  clients: FounderBriefingClient[] = []
): StrategicAdvisorReport {
  const totalClients = clients.length;

  const forecast = clients.map((client) => {
    const probability = estimateProbability(client);
    const value = getClientValue(client);

    return {
      client,
      value,
      probability,
      expected: (value * probability) / 100,
    };
  });

  const projectedRevenue = forecast.reduce(
    (sum, item) => sum + item.expected,
    0
  );

  const sorted = [...forecast].sort((a, b) => b.expected - a.expected);

  const topTwoRevenue = sorted
    .slice(0, 2)
    .reduce((sum, item) => sum + item.expected, 0);

  const concentrationRisk =
    projectedRevenue > 0
      ? Math.round((topTwoRevenue / projectedRevenue) * 100)
      : 0;

  const overdueCount = clients.filter((client) => {
    const followUp =
      daysUntil(client.proximo_contacto) ?? daysUntil(client.recordatorio);

    return followUp !== null && followUp < 0;
  }).length;

  const inactiveCount = clients.filter((client) => {
    const activity = daysSince(client.updated_at || client.created_at);

    return activity !== null && activity >= 7;
  }).length;

  const ghostingCount = clients.filter((client) => {
    const activity = daysSince(client.updated_at || client.created_at);

    return isWarm(client) && activity !== null && activity >= 5;
  }).length;

  const weakProbability = forecast.filter((item) => item.probability <= 35).length;

  const warmLeads = clients.filter(isWarm).length;

  const commercialMomentum =
    warmLeads >= 5 ? 80 : warmLeads >= 2 ? 55 : 30;

  const executionPressure = Math.min(100, overdueCount * 15 + inactiveCount * 8);

  const pipelineHealth = Math.max(
    0,
    100 - ghostingCount * 15 - weakProbability * 10
  );

  let score = 85;

  score -= Math.round(executionPressure * 0.25);
  score -= Math.round(concentrationRisk * 0.18);
  score -= Math.round((100 - pipelineHealth) * 0.2);
  score += Math.round(commercialMomentum * 0.08);

  score = Math.max(0, Math.min(100, score));

  const tone: StrategicAdvisorTone =
    score < 55 ? "critical" : score < 75 ? "warning" : "good";

  const insights: StrategicInsight[] = [];

  if (concentrationRisk >= 60) {
    insights.push(
      buildInsight(
        "revenue-concentration",
        "Se detectó concentración de ingresos",
        `${concentrationRisk}% del ingreso proyectado depende de un grupo pequeño de clientes.`,
        "Diversifica el pipeline antes de aumentar inversión en adquisición.",
        concentrationRisk >= 75 ? "critical" : "warning"
      )
    );
  }

  if (executionPressure >= 55) {
    insights.push(
      buildInsight(
        "execution-overload",
        "Se detectó sobrecarga de ejecución",
        `${overdueCount} seguimiento${
          overdueCount === 1 ? "" : "s"
        } vencido${overdueCount === 1 ? "" : "s"} están afectando la disciplina comercial.`,
        "Prioriza recuperación y orden operativo antes de generar nuevos leads.",
        executionPressure >= 75 ? "critical" : "warning"
      )
    );
  }

  if (ghostingCount >= 1) {
    insights.push(
      buildInsight(
        "ghosting-clients",
        "Se detectó pérdida de momentum comercial",
        `${ghostingCount} oportunidad${
          ghostingCount === 1 ? "" : "es"
        } caliente${ghostingCount === 1 ? "" : "s"} muestra${
          ghostingCount === 1 ? "" : "n"
        } señales de enfriamiento.`,
        "Reactiva primero los clientes con mayor intención antes de que pierdan temperatura comercial.",
        ghostingCount >= 3 ? "critical" : "warning"
      )
    );
  }

  if (pipelineHealth <= 45) {
    insights.push(
      buildInsight(
        "pipeline-health",
        "La salud del pipeline se está debilitando",
        `${weakProbability} oportunidad${
          weakProbability === 1 ? "" : "es"
        } tiene${weakProbability === 1 ? "" : "n"} baja probabilidad de conversión.`,
        "Limpia, reactiva o cierra oportunidades débiles para mejorar foco comercial.",
        pipelineHealth <= 25 ? "critical" : "warning"
      )
    );
  }

  if (insights.length === 0) {
    insights.push(
      buildInsight(
        "healthy-system",
        "Sistema comercial estable",
        "Las señales actuales de ejecución y pipeline se mantienen bajo control.",
        "Continúa fortaleciendo calidad del pipeline, seguimiento y conversión.",
        "good"
      )
    );
  }

  const headline =
    tone === "critical"
      ? "Se requiere atención estratégica"
      : tone === "warning"
        ? "La presión del negocio está aumentando"
        : "La estructura comercial se mantiene estable";

  const summary =
    totalClients === 0
      ? "ClientYA necesita datos activos del pipeline para generar inteligencia estratégica."
      : `ClientYA analizó ${totalClients} cliente${
          totalClients === 1 ? "" : "s"
        } y detectó ${insights.length} señal${
          insights.length === 1 ? "" : "es"
        } estratégica${insights.length === 1 ? "" : "s"} del negocio.`;

  return {
    score,
    tone,

    headline,
    summary,

    executionPressure,
    concentrationRisk,
    pipelineHealth,
    commercialMomentum,

    insights,
  };
}