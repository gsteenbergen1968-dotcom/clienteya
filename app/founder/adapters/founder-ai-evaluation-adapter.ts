import type { FounderEvidence } from "../models/founder-model";

export async function collectAIEvaluationEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "ai-evaluation-not-connected",
      domain: "ai",
      source: "ai-evaluation",
      title: "AI evaluation not connected",
      description:
        "Founder Center is not currently connected to an AI evaluation provider.",
      value: {
        connected: false,
      },
      strength: "conclusive",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "AI evaluation configuration",
      metadata: {
        liveData: false,
        configured: false,
        evaluationStatus: "not-connected",
      },
    },
  ];
}