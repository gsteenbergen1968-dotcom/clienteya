import type { FounderEvidence } from "../models/founder-model";

export async function collectTestEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "test-baseline",
      domain: "operations",
      source: "manual",
      title: "Testing baseline established",
      description:
        "The testing evidence pipeline has been prepared for automated test result collection.",
      value: {
        status: "baseline",
      },
      strength: "strong",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Founder Testing",
      metadata: {
        baseline: true,
        automationReady: true,
      },
    },
  ];
}