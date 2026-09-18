import type {
  FounderConclusion,
  FounderConclusionStatus,
  FounderEvidence,
  FounderIntelligenceDomain,
} from "../models/founder-model";
import { assessFounderEvidence } from "./founder-evidence-engine";

export type FounderConclusionInput = {
  id: string;
  domain: FounderIntelligenceDomain;
  title: string;
  summary: string;
  evidence: FounderEvidence[];
  createdAt?: string;
  updatedAt?: string;
};

function resolveConclusionStatus(
  sufficient: boolean
): FounderConclusionStatus {
  return sufficient ? "supported" : "insufficient-evidence";
}

export function buildFounderConclusion(
  input: FounderConclusionInput
): FounderConclusion {
  const now = new Date().toISOString();
  const evidenceAssessment = assessFounderEvidence({
    evidence: input.evidence,
    assessedAt: input.updatedAt ?? now,
  });

  return {
    id: input.id,
    domain: input.domain,
    title: input.title,
    summary: evidenceAssessment.sufficient
      ? input.summary
      : "Insufficient evidence to support this conclusion.",
    status: resolveConclusionStatus(
      evidenceAssessment.sufficient
    ),
    evidenceAssessment,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}