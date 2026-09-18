import type { FounderEvidence } from "../models/founder-model";

export async function collectUserFeedbackEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  return [
    {
      id: "user-feedback-not-connected",
      domain: "users",
      source: "user-feedback",
      title: "User feedback provider not connected",
      description:
        "Founder Center is not currently connected to a user feedback provider.",
      value: {
        connected: false,
      },
      strength: "conclusive",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "User feedback configuration",
      metadata: {
        liveData: false,
        configured: false,
        feedbackStatus: "not-connected",
      },
    },
  ];
}