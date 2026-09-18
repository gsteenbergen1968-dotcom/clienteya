import type { RelationshipRecord } from "./relationship-repository";

export type RevenueAnalytics = {
  totalPipelineValue: number;
  wonRevenue: number;
  expectedRevenue: number;
  weightedForecast: number;
  wonRelationships: number;
  openRelationships: number;
  hotRelationships: number;
  riskRelationships: number;
  conversionRate: number;
  forecastConfidence: "Alta" | "Media" | "Baja";
  pipelinePressure: "Alta" | "Media" | "Baja";
  momentumLabel: string;
  executiveSummary: string;
};

function normalize(value?: string | null): string {
  return value?.toLowerCase().trim() || "";
}

function getRelationshipPaid(
  relationship: RelationshipRecord,
): boolean {
  const status = normalize(relationship.status);

  return (
    status.includes("pagado") ||
    status.includes("pagó") ||
    status.includes("cerrado") ||
    status.includes("convert")
  );
}

function isHot(relationship: RelationshipRecord): boolean {
  const status = normalize(relationship.status);

  return (
    status.includes("interes") ||
    status.includes("caliente") ||
    status.includes("hot")
  );
}

function isRisk(relationship: RelationshipRecord): boolean {
  const status = normalize(relationship.status);

  return (
    status.includes("sin") ||
    status.includes("frío") ||
    status.includes("frio") ||
    status.includes("riesgo")
  );
}

function getRelationshipValue(
  relationship: RelationshipRecord,
): number {
  void relationship;

  return 50000;
}

function getForecastWeight(
  relationship: RelationshipRecord,
): number {
  if (getRelationshipPaid(relationship)) return 1;
  if (isHot(relationship)) return 0.65;
  if (isRisk(relationship)) return 0.2;

  return 0.4;
}

function getForecastConfidence(
  conversionRate: number,
  hotRelationships: number,
): RevenueAnalytics["forecastConfidence"] {
  if (
    conversionRate >= 35 ||
    hotRelationships >= 4
  ) {
    return "Alta";
  }

  if (
    conversionRate >= 15 ||
    hotRelationships >= 2
  ) {
    return "Media";
  }

  return "Baja";
}

function getPipelinePressure(
  openRelationships: number,
  riskRelationships: number,
): RevenueAnalytics["pipelinePressure"] {
  if (
    riskRelationships >= 4 ||
    openRelationships >= 8
  ) {
    return "Alta";
  }

  if (
    riskRelationships >= 2 ||
    openRelationships >= 4
  ) {
    return "Media";
  }

  return "Baja";
}

function getMomentumLabel(
  conversionRate: number,
  hotRelationships: number,
): string {
  if (conversionRate >= 40) {
    return "Conversión fuerte";
  }

  if (hotRelationships >= 3) {
    return "Momentum comercial positivo";
  }

  if (conversionRate <= 10) {
    return "Conversión baja";
  }

  return "Pipeline estable";
}

function getExecutiveSummary({
  forecastConfidence,
  pipelinePressure,
  hotRelationships,
  riskRelationships,
}: {
  forecastConfidence: RevenueAnalytics["forecastConfidence"];
  pipelinePressure: RevenueAnalytics["pipelinePressure"];
  hotRelationships: number;
  riskRelationships: number;
}): string {
  if (pipelinePressure === "Alta") {
    return "Hay presión comercial elevada. Conviene priorizar seguimiento y evitar que oportunidades abiertas se enfríen.";
  }

  if (forecastConfidence === "Alta") {
    return "El forecast muestra buena probabilidad de conversión si se mantiene ritmo de contacto.";
  }

  if (hotRelationships > riskRelationships) {
    return "Hay más oportunidades activas que riesgos. El foco debe estar en cerrar antes de generar nuevas relaciones.";
  }

  return "El pipeline está estable, pero necesita seguimiento constante para aumentar conversión.";
}

export function buildRevenueAnalyticsV2(
  relationships: RelationshipRecord[],
): RevenueAnalytics {
  const safeRelationships = Array.isArray(relationships)
    ? relationships
    : [];

  const totalPipelineValue = safeRelationships.reduce(
    (sum, relationship) =>
      sum + getRelationshipValue(relationship),
    0,
  );

  const wonRelationships = safeRelationships.filter(
    getRelationshipPaid,
  );

  const openRelationships = safeRelationships.filter(
    (relationship) => !getRelationshipPaid(relationship),
  );

  const hotRelationships =
    openRelationships.filter(isHot);

  const riskRelationships =
    openRelationships.filter(isRisk);

  const wonRevenue = wonRelationships.reduce(
    (sum, relationship) =>
      sum + getRelationshipValue(relationship),
    0,
  );

  const expectedRevenue = openRelationships.reduce(
    (sum, relationship) =>
      sum + getRelationshipValue(relationship),
    0,
  );

  const weightedForecast = openRelationships.reduce(
    (sum, relationship) =>
      sum +
      getRelationshipValue(relationship) *
        getForecastWeight(relationship),
    0,
  );

  const conversionRate =
    safeRelationships.length === 0
      ? 0
      : Math.round(
          (wonRelationships.length /
            safeRelationships.length) *
            100,
        );

  const hotRelationshipCount =
    hotRelationships.length;

  const riskRelationshipCount =
    riskRelationships.length;

  const forecastConfidence =
    getForecastConfidence(
      conversionRate,
      hotRelationshipCount,
    );

  const pipelinePressure =
    getPipelinePressure(
      openRelationships.length,
      riskRelationshipCount,
    );

  const momentumLabel =
    getMomentumLabel(
      conversionRate,
      hotRelationshipCount,
    );

  return {
    totalPipelineValue,
    wonRevenue,
    expectedRevenue,
    weightedForecast,
    wonRelationships: wonRelationships.length,
    openRelationships: openRelationships.length,
    hotRelationships: hotRelationshipCount,
    riskRelationships: riskRelationshipCount,
    conversionRate,
    forecastConfidence,
    pipelinePressure,
    momentumLabel,
    executiveSummary: getExecutiveSummary({
      forecastConfidence,
      pipelinePressure,
      hotRelationships: hotRelationshipCount,
      riskRelationships: riskRelationshipCount,
    }),
  };
}

export function formatGuaraniV2(value: number): string {
  return `Gs. ${Math.round(value).toLocaleString("es-PY")}`;
}