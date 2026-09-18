import type { FounderEvidence } from "../models/founder-model";

export async function collectPerformanceEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "performance-not-connected",
      domain: "operations",
      source: "performance",
      title: "Performance monitoring not connected",
      description:
        "Founder Center is not currently connected to a performance monitoring provider.",
      value: {
        connected: false,
      },
      strength: "conclusive",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Performance configuration",
      metadata: {
        liveData: false,
        configured: false,
        monitoringStatus: "not-connected",
      },
    },
  ];
}