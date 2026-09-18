import type { FounderEvidence } from "../models/founder-model";

export type FounderSystemStatus =
  | "healthy"
  | "warning"
  | "critical";

export function resolveFounderSystemStatus(
  evidence: FounderEvidence[]
): FounderSystemStatus {
  const total = evidence.length;
  const active = evidence.filter(
    (item) => item.status === "active"
  ).length;

  if (total === 0 || active === 0) {
    return "critical";
  }

  if (active < total) {
    return "warning";
  }

  return "healthy";
}