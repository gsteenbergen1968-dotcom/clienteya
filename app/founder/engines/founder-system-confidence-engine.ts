import type { FounderEvidence } from "../models/founder-model";

export type FounderSystemConfidence = {
  score: number;
  level: "low" | "medium" | "high";
};

export function evaluateFounderSystemConfidence(
  evidence: FounderEvidence[]
): FounderSystemConfidence {
  const total = evidence.length;

  if (total === 0) {
    return {
      score: 0,
      level: "low",
    };
  }

  const active = evidence.filter(
    (item) => item.status === "active"
  ).length;

  const score = Math.round((active / total) * 100);

  return {
    score,
    level:
      score >= 90
        ? "high"
        : score >= 70
          ? "medium"
          : "low",
  };
}