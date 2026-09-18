import type { FounderEvidence } from "../models/founder-model";

export async function collectGitEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "git-baseline",
      domain: "architecture",
      source: "repository",
      title: "Git integration ready",
      description:
        "The Git evidence adapter has been introduced and is prepared to collect repository activity.",
      value: {
        repositoryStatus: "ready",
      },
      strength: "strong",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "Git Repository",
      metadata: {
        provider: "git",
        integrationReady: true,
        liveData: false,
      },
    },
  ];
}