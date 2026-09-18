import type { FounderEvidence } from "../models/founder-model";

export async function collectRepositoryEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "repository-not-connected",
      domain: "architecture",
      source: "repository",
      title: "Repository not connected",
      description:
        "No repository provider is currently connected to Founder Center.",
      value: {
        connected: false,
      },
      strength: "conclusive",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Repository configuration",
      metadata: {
        liveData: false,
        configured: false,
        connectionStatus: "not-connected",
      },
    },
  ];
}