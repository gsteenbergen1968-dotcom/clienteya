import type {
  FounderConclusion,
  FounderDecision,
  FounderDecisionImpact,
  FounderDecisionPriority,
} from "../models/founder-model";
import { canCreateFounderDecision } from "../models/founder-model";

export type FounderDecisionInput = {
  id: string;
  conclusion: FounderConclusion;
  title: string;
  reason: string;
  priority: FounderDecisionPriority;
  impact: FounderDecisionImpact;
  createdAt?: string;
  updatedAt?: string;
};

export function buildFounderDecision(
  input: FounderDecisionInput
): FounderDecision | null {
  if (!canCreateFounderDecision(input.conclusion)) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: input.id,
    conclusionId: input.conclusion.id,
    title: input.title,
    reason: input.reason,
    priority: input.priority,
    status: "proposed",
    impact: input.impact,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    completedAt: null,
  };
}