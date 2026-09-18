import type { FounderEvidence } from "../models/founder-model";
import { evaluateFounderSystemHealth } from "./founder-system-health-engine";
import { resolveFounderSystemStatus } from "./founder-system-status-engine";

export type FounderSystemSummary = {
  status: "healthy" | "warning" | "critical";
  totalEvidence: number;
  activeEvidence: number;
  summary: string;
};

export function buildFounderSystemSummary(
  evidence: FounderEvidence[]
): FounderSystemSummary {
  const health = evaluateFounderSystemHealth(evidence);
  const status = resolveFounderSystemStatus(evidence);

  return {
    status,
    totalEvidence: health.totalEvidence,
    activeEvidence: health.activeEvidence,
    summary: `${health.activeEvidence} of ${health.totalEvidence} evidence sources are active.`,
  };
}