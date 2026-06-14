export type FounderRevenueInput = {
  estimatedValue: number;
  closeProbability: number;
  abandonmentRisk: number;
  responseProbability: number;
  relationshipScore: number;
  memoryScore: number;
  isPaid: boolean;
};

export type FounderRevenuePriority = "Crítica" | "Alta" | "Media" | "Baja";

export type FounderRevenueResult = {
  expectedRevenue: number;
  revenueAtRisk: number;
  protectedRevenue: number;
  impactScore: number;
  priorityLabel: FounderRevenuePriority;
  recommendation: string;
  reasoning: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatGs(value: number) {
  return `Gs. ${Number(value || 0).toLocaleString("es-PY")}`;
}

export function buildFounderRevenueIntelligence(
  input: FounderRevenueInput,
): FounderRevenueResult {
  const value = Math.max(0, Number(input.estimatedValue || 0));

  const closeProbability = clamp(input.closeProbability);
  const abandonmentRisk = clamp(input.abandonmentRisk);
  const responseProbability = clamp(input.responseProbability);
  const relationshipScore = clamp(input.relationshipScore);
  const memoryScore = clamp(input.memoryScore);

  const expectedRevenue = input.isPaid
    ? value
    : Math.round(value * (closeProbability / 100));

  const revenueAtRisk = input.isPaid
    ? 0
    : Math.round(value * (abandonmentRisk / 100));

  const protectedRevenue = Math.max(0, expectedRevenue - revenueAtRisk);

  let impactScore =
    closeProbability * 0.26 +
    responseProbability * 0.18 +
    relationshipScore * 0.18 +
    memoryScore * 0.16 +
    abandonmentRisk * 0.22;

  if (value > 0) {
    impactScore += 8;
  }

  if (input.isPaid) {
    impactScore = Math.max(35, impactScore - 18);
  }

  impactScore = clamp(Math.round(impactScore));

  let priorityLabel: FounderRevenuePriority = "Baja";

  if (!input.isPaid && revenueAtRisk > 0 && impactScore >= 80) {
    priorityLabel = "Crítica";
  } else if (!input.isPaid && impactScore >= 65) {
    priorityLabel = "Alta";
  } else if (impactScore >= 45) {
    priorityLabel = "Media";
  }

  let recommendation = "Mantener seguimiento normal.";
  let reasoning = "El impacto comercial es estable y no requiere prioridad urgente.";

  if (input.isPaid) {
    recommendation = "Cuidar relación y buscar recompra.";
    reasoning =
      "El ingreso ya fue confirmado. La prioridad es mantener confianza, recompra o recomendación.";
  } else if (priorityLabel === "Crítica") {
    recommendation = "Contactar hoy para proteger ingreso.";
    reasoning = `Hay ${formatGs(
      revenueAtRisk,
    )} en riesgo. Conviene actuar antes de que la oportunidad se enfríe.`;
  } else if (priorityLabel === "Alta") {
    recommendation = "Priorizar seguimiento comercial.";
    reasoning = `La oportunidad tiene potencial de ${formatGs(
      expectedRevenue,
    )} y señales suficientes para avanzar.`;
  } else if (priorityLabel === "Media") {
    recommendation = "Mantener momentum.";
    reasoning =
      "La relación tiene valor, pero necesita más contexto o una próxima acción clara.";
  }

  return {
    expectedRevenue,
    revenueAtRisk,
    protectedRevenue,
    impactScore,
    priorityLabel,
    recommendation,
    reasoning,
  };
}