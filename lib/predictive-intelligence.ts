export type PredictiveTrend = "up" | "stable" | "down" | "risk";

export type PredictiveInput = {
  score?: number | null;
  temperature?: "hot" | "warm" | "cold" | "inactive" | string | null;
  temperatureScore?: number | null;
  value?: number | null;
  isPaid?: boolean | null;
  daysUntilContact?: number | null;
  pipelineDays?: number | null;
  followupCount?: number | null;
  opportunityCount?: number | null;
  riskCount?: number | null;
  paymentCount?: number | null;
};

export type PredictiveInsight = {
  closeProbability: number;
  responseProbability: number;
  paymentProbability: number;
  churnRisk: number;
  successProbability: number;
  trend: PredictiveTrend;
  trendLabel: string;
  churnLabel: "Bajo" | "Medio" | "Alto" | "Crítico";
  summary: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(Math.round(value), min), max);
}

function normalizeTemperature(value: PredictiveInput["temperature"]) {
  return (value || "").toLowerCase().trim();
}

function getTemperatureWeight(input: PredictiveInput) {
  const temperature = normalizeTemperature(input.temperature);

  if (temperature === "hot") return 24;
  if (temperature === "warm") return 16;
  if (temperature === "cold") return 7;
  if (temperature === "inactive") return -8;

  return clamp(Number(input.temperatureScore || 0) / 5, -8, 20);
}

function getActivityWeight(daysUntilContact: number | null | undefined) {
  if (typeof daysUntilContact !== "number") return -5;

  if (daysUntilContact < -14) return -18;
  if (daysUntilContact < -7) return -10;
  if (daysUntilContact < 0) return 8;
  if (daysUntilContact <= 2) return 10;
  if (daysUntilContact <= 7) return 4;

  return 0;
}

function getPipelineWeight(pipelineDays: number | null | undefined) {
  if (typeof pipelineDays !== "number") return 0;

  if (pipelineDays <= 7) return 10;
  if (pipelineDays <= 21) return 6;
  if (pipelineDays <= 45) return 0;
  if (pipelineDays <= 75) return -8;

  return -14;
}

function getValueWeight(value: number | null | undefined) {
  const numericValue = Number(value || 0);

  if (numericValue >= 3000000) return 12;
  if (numericValue >= 1500000) return 8;
  if (numericValue > 0) return 4;

  return 0;
}

export function buildCloseProbability(input: PredictiveInput) {
  const baseScore = Number(input.score || 0);

  return clamp(
    35 +
      baseScore * 0.22 +
      getTemperatureWeight(input) +
      getValueWeight(input.value) +
      Number(input.opportunityCount || 0) * 9 +
      Number(input.followupCount || 0) * 3 -
      Number(input.riskCount || 0) * 9 +
      getPipelineWeight(input.pipelineDays)
  );
}

export function buildResponseProbability(input: PredictiveInput) {
  const baseScore = Number(input.score || 0);

  return clamp(
    38 +
      baseScore * 0.18 +
      getTemperatureWeight(input) +
      getActivityWeight(input.daysUntilContact) +
      Number(input.followupCount || 0) * 7 -
      Number(input.riskCount || 0) * 6
  );
}

export function buildPaymentProbability(input: PredictiveInput) {
  if (input.isPaid) return 96;

  return clamp(
    32 +
      Number(input.score || 0) * 0.16 +
      getValueWeight(input.value) +
      Number(input.paymentCount || 0) * 12 +
      Number(input.opportunityCount || 0) * 5 -
      Number(input.riskCount || 0) * 8 +
      getActivityWeight(input.daysUntilContact) * 0.5
  );
}

export function buildChurnRisk(input: PredictiveInput) {
  const daysUntilContact = input.daysUntilContact;
  const pipelineDays = input.pipelineDays;

  return clamp(
    18 +
      Number(input.riskCount || 0) * 18 +
      Number(input.followupCount || 0) * 4 -
      getTemperatureWeight(input) * 0.45 +
      (typeof daysUntilContact === "number" && daysUntilContact < -7 ? 18 : 0) +
      (typeof daysUntilContact === "number" && daysUntilContact < -14 ? 12 : 0) +
      (typeof pipelineDays === "number" && pipelineDays > 60 ? 10 : 0) +
      (normalizeTemperature(input.temperature) === "inactive" ? 18 : 0)
  );
}

export function buildSuccessProbability(input: PredictiveInput) {
  const closeProbability = buildCloseProbability(input);
  const responseProbability = buildResponseProbability(input);
  const paymentProbability = buildPaymentProbability(input);
  const churnRisk = buildChurnRisk(input);

  return clamp(
    closeProbability * 0.38 +
      responseProbability * 0.28 +
      paymentProbability * 0.22 +
      (100 - churnRisk) * 0.12
  );
}

export function buildPredictiveTrend(input: PredictiveInput): PredictiveTrend {
  const churnRisk = buildChurnRisk(input);
  const closeProbability = buildCloseProbability(input);
  const responseProbability = buildResponseProbability(input);

  if (churnRisk >= 68) return "risk";
  if (closeProbability >= 72 && responseProbability >= 65) return "up";
  if (churnRisk >= 45 || closeProbability < 42) return "down";

  return "stable";
}

export function getPredictiveTrendLabel(trend: PredictiveTrend) {
  if (trend === "up") return "↗ Creciendo";
  if (trend === "down") return "↘ Enfriándose";
  if (trend === "risk") return "⚠ Riesgo de pérdida";

  return "→ Estable";
}

export function getChurnLabel(
  churnRisk: number
): "Bajo" | "Medio" | "Alto" | "Crítico" {
  if (churnRisk >= 75) return "Crítico";
  if (churnRisk >= 55) return "Alto";
  if (churnRisk >= 35) return "Medio";

  return "Bajo";
}

export function buildPredictiveInsight(
  input: PredictiveInput
): PredictiveInsight {
  const closeProbability = buildCloseProbability(input);
  const responseProbability = buildResponseProbability(input);
  const paymentProbability = buildPaymentProbability(input);
  const churnRisk = buildChurnRisk(input);
  const successProbability = buildSuccessProbability(input);

  const trend = buildPredictiveTrend(input);
  const trendLabel = getPredictiveTrendLabel(trend);
  const churnLabel = getChurnLabel(churnRisk);

  let summary = `${successProbability}% éxito esperado`;

  if (trend === "risk") {
    summary = `${churnLabel} abandono · actuar pronto`;
  }

  if (closeProbability >= 75) {
    summary = `${closeProbability}% cierre · oportunidad fuerte`;
  }

  return {
    closeProbability,
    responseProbability,
    paymentProbability,
    churnRisk,
    successProbability,
    trend,
    trendLabel,
    churnLabel,
    summary,
  };
}