import type {
  FounderConclusion,
  FounderDecision,
  FounderEvidence,
  FounderInsight,
  FounderIntelligenceDomain,
} from "../models/founder-model";

export type FounderInsightInput = {
  id: string;
  domain: FounderIntelligenceDomain;
  title: string;
  conclusion: FounderConclusion;
  decision?: FounderDecision | null;
  evidence: FounderEvidence[];
  createdAt?: string;
  updatedAt?: string;
};

export function buildFounderInsight(
  input: FounderInsightInput
): FounderInsight {
  const now = new Date().toISOString();

  return {
    id: input.id,
    domain: input.domain,
    title: input.title,
    conclusion: input.conclusion,
    decision: input.decision ?? null,
    evidence: input.evidence,
    status: "open",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}