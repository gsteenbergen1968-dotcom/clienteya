import type { FounderEvidence } from "../models/founder-model";
import { buildFounderSystemSummary } from "./founder-system-summary-engine";

export type FounderSystemReadiness = {
  ready: boolean;
  status: "healthy" | "warning" | "critical";
  message: string;
};

export function evaluateFounderSystemReadiness(
  evidence: FounderEvidence[]
): FounderSystemReadiness {
  const summary = buildFounderSystemSummary(evidence);

  return {
    ready: summary.status === "healthy",
    status: summary.status,
    message:
      summary.status === "healthy"
        ? "Founder Center is ready."
        : "Founder Center requires attention before it is fully ready.",
  };
}