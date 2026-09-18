import type { FounderEvidence } from "../models/founder-model";

export async function collectDeploymentEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "deployment-not-connected",
      domain: "release",
      source: "deployment",
      title: "Deployment provider not connected",
      description:
        "Founder Center is not currently connected to a deployment provider.",
      value: {
        connected: false,
      },
      strength: "conclusive",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Deployment configuration",
      metadata: {
        liveData: false,
        configured: false,
        verificationStatus: "not-available",
      },
    },
  ];
}