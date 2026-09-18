import type { FounderEvidence } from "../models/founder-model";

export async function collectAnalyticsEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "analytics-not-connected",
      domain: "users",
      source: "analytics",
      title: "Analytics provider not connected",
      description:
        "Founder Center is not currently connected to a product analytics provider.",
      value: {
        connected: false,
      },
      strength: "conclusive",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Analytics configuration",
      metadata: {
        liveData: false,
        configured: false,
        analyticsStatus: "not-connected",
      },
    },
  ];
}