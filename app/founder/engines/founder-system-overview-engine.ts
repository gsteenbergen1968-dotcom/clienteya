import type { FounderEvidence } from "../models/founder-model";

import { evaluateFounderSystemConfidence } from "./founder-system-confidence-engine";
import { evaluateFounderSystemHealth } from "./founder-system-health-engine";
import { buildFounderSystemMetrics } from "./founder-system-metrics-engine";
import { evaluateFounderSystemReadiness } from "./founder-system-readiness-engine";
import { buildFounderSystemSummary } from "./founder-system-summary-engine";

export type FounderSystemOverview = {
  health: ReturnType<typeof evaluateFounderSystemHealth>;
  confidence: ReturnType<typeof evaluateFounderSystemConfidence>;
  readiness: ReturnType<typeof evaluateFounderSystemReadiness>;
  metrics: ReturnType<typeof buildFounderSystemMetrics>;
  summary: ReturnType<typeof buildFounderSystemSummary>;
};

export function buildFounderSystemOverview(
  evidence: FounderEvidence[]
): FounderSystemOverview {
  return {
    health: evaluateFounderSystemHealth(evidence),
    confidence: evaluateFounderSystemConfidence(evidence),
    readiness: evaluateFounderSystemReadiness(evidence),
    metrics: buildFounderSystemMetrics(evidence),
    summary: buildFounderSystemSummary(evidence),
  };
}