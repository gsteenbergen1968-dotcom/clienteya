import { getRevenueScore } from "./revenue-scoring";

export type RelationshipForRevenueForecast = {
  id: string;
  nombre?: string | null;
  estado?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  proximo_contacto?: string | null;
  created_at?: string | null;
};

export type RevenueForecastOpportunity = {
  id: string;
  nombre: string;
  estado: string;
  monto: number;
  probability: number;
  expectedRevenue: number;
  timing: "30d" | "90d" | "later";
  riskLevel: "low" | "medium" | "high";
  reason: string;
};

export type RevenueForecast = {
  pipelineValue: number;
  confirmedRevenue: number;
  forecast30Days: number;
  forecast90Days: number;
  expectedRevenue: number;
  expectedConversion: number;
  revenueAtRisk: number;
  openOpportunities: number;
  paidRelationships: number;
  unpaidRelationships: number;
  topOpportunities: RevenueForecastOpportunity[];
  atRiskOpportunities: RevenueForecastOpportunity[];
  summary: string;
  recommendation: string;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function toNumber(value: number | null | undefined) {
  const numberValue = Number(value || 0);

  if (Number.isNaN(numberValue)) return 0;

  return Math.max(0, numberValue);
}

function todayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

function daysUntil(dateValue: string | null | undefined) {
  if (!dateValue) return null;

  const target = new Date(`${dateValue.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(target.getTime())) return null;

  const today = todayStart();

  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getBaseProbability(
  relationship: RelationshipForRevenueForecast
) {
  const estado = normalizeText(relationship.estado);

  const score = getRevenueScore(
    relationship.estado,
    relationship.monto
  );

  if (relationship.pagado || estado.includes("pag")) return 100;

  if (
    estado.includes("cerr") ||
    estado.includes("perdido")
  ) {
    return 0;
  }

  return score.probability;
}

function getEstimatedValue(
  relationship: RelationshipForRevenueForecast
) {
  const estado = normalizeText(relationship.estado);
  const currentMonto = toNumber(relationship.monto);

  if (relationship.pagado || estado.includes("pag")) {
    return currentMonto;
  }

  const score = getRevenueScore(
    relationship.estado,
    relationship.monto
  );

  return score.estimatedValue;
}

function getProbability(
  relationship: RelationshipForRevenueForecast
) {
  const base = getBaseProbability(relationship);
  const days = daysUntil(relationship.proximo_contacto);

  if (base === 0 || base === 100) return base;

  let probability = base;

  if (typeof days === "number") {
    if (days < 0) probability -= 15;
    if (days === 0) probability += 10;
    if (days > 0 && days <= 7) probability += 8;
    if (days > 30) probability -= 5;
  }

  return Math.max(
    0,
    Math.min(95, Math.round(probability))
  );
}

function getTiming(
  relationship: RelationshipForRevenueForecast
): "30d" | "90d" | "later" {
  if (
    relationship.pagado ||
    normalizeText(relationship.estado).includes("pag")
  ) {
    return "30d";
  }

  const days = daysUntil(relationship.proximo_contacto);

  if (typeof days !== "number") return "90d";
  if (days <= 30) return "30d";
  if (days <= 90) return "90d";

  return "later";
}

function getRiskLevel(
  relationship: RelationshipForRevenueForecast,
  probability: number
): "low" | "medium" | "high" {
  const estado = normalizeText(relationship.estado);
  const days = daysUntil(relationship.proximo_contacto);

  if (
    estado.includes("cerr") ||
    estado.includes("perdido")
  ) {
    return "high";
  }

  if (typeof days === "number" && days < 0) return "high";
  if (estado.includes("sin")) return "high";
  if (probability < 35) return "high";
  if (probability < 60) return "medium";

  return "low";
}

function getReason(
  relationship: RelationshipForRevenueForecast,
  probability: number,
  riskLevel: "low" | "medium" | "high"
) {
  const estado = relationship.estado || "Sin estado";
  const days = daysUntil(relationship.proximo_contacto);
  const estimatedValue = getEstimatedValue(relationship);
  const hasManualMonto = toNumber(relationship.monto) > 0;

  if (
    relationship.pagado ||
    normalizeText(estado).includes("pag")
  ) {
    return "Ingreso confirmado.";
  }

  if (
    riskLevel === "high" &&
    typeof days === "number" &&
    days < 0
  ) {
    return `Seguimiento vencido hace ${Math.abs(days)} día(s).`;
  }

  if (riskLevel === "high") {
    return "Oportunidad con riesgo comercial elevado.";
  }

  if (!hasManualMonto && estimatedValue > 0) {
    return `Valor estimado por ClienteYA según estado: ${estado}.`;
  }

  if (probability >= 70) {
    return "Alta probabilidad de cierre según estado comercial.";
  }

  if (probability >= 50) {
    return "Oportunidad activa con avance comercial.";
  }

  return `Estado actual: ${estado}.`;
}

function buildOpportunity(
  relationship: RelationshipForRevenueForecast
): RevenueForecastOpportunity {
  const monto = getEstimatedValue(relationship);
  const probability = getProbability(relationship);

  const expectedRevenue = Math.round(
    monto * (probability / 100)
  );

  const timing = getTiming(relationship);

  const riskLevel = getRiskLevel(
    relationship,
    probability
  );

  return {
    id: relationship.id,
    nombre: relationship.nombre || "Relación sin nombre",
    estado: relationship.estado || "Sin estado",
    monto,
    probability,
    expectedRevenue,
    timing,
    riskLevel,
    reason: getReason(
      relationship,
      probability,
      riskLevel
    ),
  };
}

function buildSummary(forecast: {
  forecast30Days: number;
  forecast90Days: number;
  pipelineValue: number;
  revenueAtRisk: number;
}) {
  if (forecast.pipelineValue <= 0) {
    return "Todavía no hay pipeline comercial suficiente para proyectar ingresos.";
  }

  if (forecast.revenueAtRisk > forecast.forecast30Days) {
    return "Hay valor comercial importante en riesgo. Prioriza seguimientos vencidos.";
  }

  if (forecast.forecast30Days > 0) {
    return "Hay ingresos esperados en los próximos 30 días. Enfócate en cerrar oportunidades activas.";
  }

  if (forecast.forecast90Days > 0) {
    return "El pipeline tiene potencial a 90 días. Conviene acelerar próximos contactos.";
  }

  return "El forecast necesita más datos comerciales para mejorar precisión.";
}

function buildRecommendation(forecast: {
  forecast30Days: number;
  revenueAtRisk: number;
  atRiskCount: number;
  topOpportunityName?: string;
}) {
  if (
    forecast.revenueAtRisk > 0 &&
    forecast.atRiskCount > 0
  ) {
    return "Revisa primero las oportunidades en riesgo y agenda seguimiento por WhatsApp hoy.";
  }

  if (forecast.topOpportunityName) {
    return `Prioriza a ${forecast.topOpportunityName}: es la oportunidad con mayor valor esperado.`;
  }

  if (forecast.forecast30Days > 0) {
    return "Trabaja primero las oportunidades con próximo seguimiento dentro de 30 días.";
  }

  return "Actualiza montos, estados y próximos contactos para activar un forecast más preciso.";
}

export function buildRevenueForecast(
  relationships: RelationshipForRevenueForecast[]
): RevenueForecast {
  const opportunities = relationships.map(buildOpportunity);

  const paidOpportunities = opportunities.filter(
    (item) => item.probability === 100
  );

  const openOpportunities = opportunities.filter(
    (item) =>
      item.probability > 0 &&
      item.probability < 100
  );

  const confirmedRevenue = paidOpportunities.reduce(
    (total, item) => total + item.monto,
    0
  );

  const pipelineValue = openOpportunities.reduce(
    (total, item) => total + item.monto,
    0
  );

  const forecast30Days = openOpportunities
    .filter((item) => item.timing === "30d")
    .reduce(
      (total, item) => total + item.expectedRevenue,
      0
    );

  const forecast90Days = openOpportunities
    .filter(
      (item) =>
        item.timing === "30d" ||
        item.timing === "90d"
    )
    .reduce(
      (total, item) => total + item.expectedRevenue,
      0
    );

  const expectedRevenue = openOpportunities.reduce(
    (total, item) => total + item.expectedRevenue,
    0
  );

  const revenueAtRisk = openOpportunities
    .filter((item) => item.riskLevel === "high")
    .reduce(
      (total, item) => total + item.monto,
      0
    );

  const expectedConversion =
    openOpportunities.length > 0
      ? Math.round(
          openOpportunities.reduce(
            (total, item) =>
              total + item.probability,
            0
          ) / openOpportunities.length
        )
      : 0;

  const topOpportunities = [...openOpportunities]
    .sort(
      (first, second) =>
        second.expectedRevenue -
        first.expectedRevenue
    )
    .slice(0, 5);

  const atRiskOpportunities = [...openOpportunities]
    .filter((item) => item.riskLevel === "high")
    .sort(
      (first, second) =>
        second.monto - first.monto
    )
    .slice(0, 5);

  const summary = buildSummary({
    forecast30Days,
    forecast90Days,
    pipelineValue,
    revenueAtRisk,
  });

  const recommendation = buildRecommendation({
    forecast30Days,
    revenueAtRisk,
    atRiskCount: atRiskOpportunities.length,
    topOpportunityName: topOpportunities[0]?.nombre,
  });

  return {
    pipelineValue,
    confirmedRevenue,
    forecast30Days,
    forecast90Days,
    expectedRevenue,
    expectedConversion,
    revenueAtRisk,
    openOpportunities: openOpportunities.length,
    paidRelationships: paidOpportunities.length,
    unpaidRelationships:
      relationships.length - paidOpportunities.length,
    topOpportunities,
    atRiskOpportunities,
    summary,
    recommendation,
  };
}

export function getRevenueForecastHealth(
  forecast: RevenueForecast
) {
  if (forecast.pipelineValue <= 0) {
    return {
      label: "Sin pipeline",
      tone: "slate" as const,
    };
  }

  if (
    forecast.revenueAtRisk >
    forecast.expectedRevenue
  ) {
    return {
      label: "En riesgo",
      tone: "red" as const,
    };
  }

  if (forecast.expectedConversion >= 65) {
    return {
      label: "Fuerte",
      tone: "emerald" as const,
    };
  }

  if (forecast.expectedConversion >= 40) {
    return {
      label: "Estable",
      tone: "amber" as const,
    };
  }

  return {
    label: "Débil",
    tone: "red" as const,
  };
}