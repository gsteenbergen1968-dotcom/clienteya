import type { FounderEvidence } from "../models/founder-model";

export async function collectSecurityEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "security-baseline",
      domain: "operations",
      source: "manual",
      title: "Security baseline established",
      description:
        "The security evidence pipeline has been prepared and is ready for automated verification.",
      value: {
        status: "baseline",
      },
      strength: "strong",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Founder Security",
      metadata: {
        baseline: true,
        automationReady: true,
      },
    },
  ];
}