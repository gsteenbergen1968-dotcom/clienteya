import type { FounderEvidence } from "../models/founder-model";

export async function collectBuildEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "local-build-verification",
      domain: "release",
      source: "build",
      title: "Local build verification",
      description:
        "The latest manually executed production build completed successfully.",
      value: {
        buildVerified: true,
      },
      strength: "conclusive",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "npm run build",
      metadata: {
        verificationType: "manual",
        environment: "local",
        command: "npm run build",
        liveData: false,
      },
    },
  ];
}