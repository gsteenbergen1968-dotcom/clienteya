import type { FounderEvidence } from "../models/founder-model";

export async function collectReleaseEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "release-baseline",
      domain: "release",
      source: "deployment",
      title: "Release monitoring ready",
      description:
        "The release adapter is prepared to collect deployment and release evidence.",
      value: {
        releaseStatus: "ready",
      },
      strength: "strong",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Release Pipeline",
      metadata: {
        integrationReady: true,
        liveData: false,
      },
    },
  ];
}