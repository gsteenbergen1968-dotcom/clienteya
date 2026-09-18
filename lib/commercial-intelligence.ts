export type CommercialIntelligenceInput = {
  daysSinceLastContact: number;
  followupCount: number;
  memoryScore: number;
  relationshipScore: number;
  hasPromise: boolean;
  hasRecentResponse: boolean;
};

export type CommercialRiskLevel =
  | "low"
  | "medium"
  | "high";

export type CommercialIntelligenceResult = {
  responseProbability: number;
  closeProbability: number;
  abandonmentRisk: number;
  riskLevel: CommercialRiskLevel;
  recommendation: string;
  reasoning: string;
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

export function buildCommercialIntelligence(
  input: CommercialIntelligenceInput,
): CommercialIntelligenceResult {
  let responseProbability = 50;

  responseProbability +=
    input.memoryScore * 0.22;

  responseProbability +=
    input.relationshipScore * 0.18;

  responseProbability -=
    input.daysSinceLastContact * 1.15;

  responseProbability -=
    input.followupCount * 3.5;

  if (
    input.hasPromise
  ) {
    responseProbability += 14;
  }

  if (
    input.hasRecentResponse
  ) {
    responseProbability += 18;
  }

  responseProbability = clamp(
    Math.round(
      responseProbability,
    ),
  );

  let closeProbability =
    Math.round(
      responseProbability * 0.62 +
        input.relationshipScore * 0.23 +
        input.memoryScore * 0.15,
    );

  closeProbability =
    clamp(
      closeProbability,
    );

  let abandonmentRisk =
    100 -
    responseProbability;

  abandonmentRisk +=
    input.daysSinceLastContact * 0.8;

  abandonmentRisk +=
    input.followupCount * 2.5;

  if (
    input.hasRecentResponse
  ) {
    abandonmentRisk -= 18;
  }

  if (
    input.hasPromise
  ) {
    abandonmentRisk -= 10;
  }

  abandonmentRisk = clamp(
    Math.round(
      abandonmentRisk,
    ),
  );

  let riskLevel:
    CommercialRiskLevel =
      "low";

  if (
    abandonmentRisk >= 55 ||
    responseProbability < 40
  ) {
    riskLevel = "high";
  } else if (
    abandonmentRisk >= 30 ||
    responseProbability < 70
  ) {
    riskLevel = "medium";
  }

  let recommendation =
    "Mantener seguimiento normal.";

  let reasoning =
    "Relación estable. No requiere acción urgente.";

  if (
    riskLevel === "high"
  ) {
    recommendation =
      "Enviar WhatsApp hoy.";

    reasoning =
      "La relación muestra señales de enfriamiento comercial.";
  }

  if (
    riskLevel === "medium"
  ) {
    recommendation =
      "Hacer seguimiento breve.";

    reasoning =
      "La relación necesita contacto para mantener momentum.";
  }

  if (
    responseProbability >= 75 &&
    closeProbability >= 60
  ) {
    recommendation =
      "Enviar WhatsApp hoy.";

    reasoning =
      "La relación muestra intención activa.";
  }

  return {
    responseProbability,
    closeProbability,
    abandonmentRisk,
    riskLevel,
    recommendation,
    reasoning,
  };
}