import type { FounderEvidence } from "../models/founder-model";

export type FounderEvidenceAnalysis = {
  totalEvidence: number;
  activeEvidence: number;
  strongEvidence: number;
  confidence: "low" | "medium" | "high";
};

export function analyzeEvidence(
  evidence: FounderEvidence[],
): FounderEvidenceAnalysis {
  const totalEvidence = evidence.length;

  const activeEvidence = evidence.filter(
    (item) => item.status === "active",
  ).length;

  const strongEvidence = evidence.filter(
    (item) => item.strength === "strong",
  ).length;

  const confidence =
    strongEvidence >= 8
      ? "high"
      : strongEvidence >= 4
        ? "medium"
        : "low";

  return {
    totalEvidence,
    activeEvidence,
    strongEvidence,
    confidence,
  };
}