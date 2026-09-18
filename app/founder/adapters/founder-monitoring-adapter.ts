import type { FounderEvidence } from "../models/founder-model";

export async function collectMonitoringEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "monitoring-baseline",
      domain: "operations",
      source: "performance",
      title: "Monitoring integration ready",
      description:
        "The monitoring adapter is prepared to collect operational health and performance evidence.",
      value: {
        monitoringStatus: "ready",
      },
      strength: "strong",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Monitoring",
      metadata: {
        integrationReady: true,
        liveData: false,
      },
    },
  ];
}