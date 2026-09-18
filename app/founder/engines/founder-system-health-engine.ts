import type { FounderEvidence } from "../models/founder-model";

export type FounderSystemHealth = {
  totalEvidence: number;
  activeEvidence: number;
  healthy: boolean;
};

export function evaluateFounderSystemHealth(
  evidence: FounderEvidence[]
): FounderSystemHealth {
  const activeEvidence = evidence.filter(
    (item) => item.status === "active"
  ).length;

  return {
    totalEvidence: evidence.length,
    activeEvidence,
    healthy:
      evidence.length > 0 &&
      activeEvidence === evidence.length,
  };
}