import type { FounderEvidence } from "../models/founder-model";

export type FounderSystemMetrics = {
  total: number;
  active: number;
  inactive: number;
  strong: number;
  conclusive: number;
};

export function buildFounderSystemMetrics(
  evidence: FounderEvidence[]
): FounderSystemMetrics {
  const active = evidence.filter(
    (item) => item.status === "active"
  ).length;

  const strong = evidence.filter(
    (item) =>
      item.strength === "strong" ||
      item.strength === "conclusive"
  ).length;

  const conclusive = evidence.filter(
    (item) => item.strength === "conclusive"
  ).length;

  return {
    total: evidence.length,
    active,
    inactive: evidence.length - active,
    strong,
    conclusive,
  };
}