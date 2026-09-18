import type { FounderEvidence } from "../models/founder-model";

export async function collectEnvironmentEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  const nodeVersion = process.version;
  const environment = process.env.NODE_ENV ?? "unknown";

  return [
    {
      id: "runtime-environment",
      domain: "architecture",
      source: "build",
      title: "Runtime environment detected",
      description:
        "Founder Center successfully detected the current runtime environment.",
      value: {
        nodeVersion,
        environment,
      },
      strength: "strong",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Node.js Runtime",
      metadata: {
        liveData: true,
      },
    },
  ];
}