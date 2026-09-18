import type { FounderBriefingRelationship } from "./founder-briefing";

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

function getStatus(relationship: FounderBriefingRelationship) {
  return (relationship.estado || relationship.status || "")
    .toLowerCase()
    .trim();
}

function getRelationshipValue(relationship: FounderBriefingRelationship) {
  return Number(relationship.monto || 50000);
}

function isWarm(relationship: FounderBriefingRelationship) {
  const status = getStatus(relationship);

  return (
    status.includes("warm") ||
    status.includes("caliente") ||
    status.includes("lead") ||
    status.includes("proposal") ||
    status.includes("propuesta") ||
    status.includes("interesado")
  );
}

function isCold(relationship: FounderBriefingRelationship) {
  const status = getStatus(relationship);

  return (
    status.includes("cold") ||
    status.includes("frio") ||
    status.includes("frío") ||
    status.includes("lost") ||
    status.includes("perdido") ||
    status.includes("cerrado")
  );
}

function estimateProbability(relationship: FounderBriefingRelationship) {
  let probability = 40;

  if (isWarm(relationship)) probability += 30;

  const activity =
    daysSince(relationship.updated_at || relationship.created_at) || 0;

  if (activity <= 2) probability += 20;
  if (activity >= 7) probability -= 25;

  const followUp =
    daysUntil(relationship.proximo_contacto) ??
    daysUntil(relationship.recordatorio);

  if (followUp === 0) probability += 10;

  if (followUp !== null && followUp < 0) {
    probability -= 20;
  }

  if (isCold(relationship)) {
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
  relationships: FounderBriefingRelationship[] = []
): StrategicAdvisorReport {
  const totalRelationships = relationships.length;

  const forecast = relationships.map((relationship) => {
    const probability = estimateProbability(relationship);
    const value = getRelationshipValue(relationship);

    return {
      relationship,
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

  const overdueCount = relationships.filter((relationship) => {
    const followUp =
      daysUntil(relationship.proximo_contacto) ??
      daysUntil(relationship.recordatorio);

    return followUp !== null && followUp < 0;
  }).length;

  const inactiveCount = relationships.filter((relationship) => {
    const activity = daysSince(
      relationship.updated_at || relationship.created_at
    );

    return activity !== null && activity >= 7;
  }).length;

  const ghostingCount = relationships.filter((relationship) => {
    const activity = daysSince(
      relationship.updated_at || relationship.created_at
    );

    return isWarm(relationship) && activity !== null && activity >= 5;
  }).length;

  const weakProbability = forecast.filter(
    (item) => item.probability <= 35
  ).length;

  const warmRelationships = relationships.filter(isWarm).length;

  const commercialMomentum =
    warmRelationships >= 5 ? 80 : warmRelationships >= 2 ? 55 : 30;

  const executionPressure = Math.min(
    100,
    overdueCount * 15 + inactiveCount * 8
  );

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
        `${concentrationRisk}% del ingreso proyectado depende de un grupo pequeño de relaciones.`,
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
        "ghosting-relationships",
        "Se detectó pérdida de momentum comercial",
        `${ghostingCount} oportunidad${
          ghostingCount === 1 ? "" : "es"
        } caliente${ghostingCount === 1 ? "" : "s"} muestra${
          ghostingCount === 1 ? "" : "n"
        } señales de enfriamiento.`,
        "Reactiva primero las relaciones con mayor intención antes de que pierdan temperatura comercial.",
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
    totalRelationships === 0
      ? "ClienteYA necesita datos activos del pipeline para generar inteligencia estratégica."
      : `ClienteYA analizó ${totalRelationships} relación${
          totalRelationships === 1 ? "" : "es"
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