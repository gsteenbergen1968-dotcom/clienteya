import type { FounderEvidence } from "../models/founder-model";

export async function collectManualEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "manual-baseline",
      domain: "business",
      source: "manual",
      title: "Manual evidence ready",
      description:
        "The manual adapter is prepared to collect founder supplied evidence.",
      value: {
        manualStatus: "ready",
      },
      strength: "strong",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Founder Input",
      metadata: {
        integrationReady: true,
        liveData: false,
      },
    },
  ];
}