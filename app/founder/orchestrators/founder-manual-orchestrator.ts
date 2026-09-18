import type {
  FounderDecisionImpact,
  FounderDecisionPriority,
  FounderIntelligenceDomain,
  FounderIntelligenceSnapshot,
} from "../models/founder-model";

import {
  adaptManualFounderEvidence,
  type FounderManualEvidenceInput,
} from "../adapters/founder-manual-evidence-adapter";

import { buildFounderSnapshot } from "./founder-orchestrator";

export type FounderManualSnapshotInput = {
  domain: FounderIntelligenceDomain;
  title: string;
  summary: string;
  evidence: FounderManualEvidenceInput[];
  decision: {
    title: string;
    reason: string;
    priority: FounderDecisionPriority;
    impact: FounderDecisionImpact;
  };
};

export function buildManualFounderSnapshot(
  input: FounderManualSnapshotInput
): FounderIntelligenceSnapshot {
  const evidence = input.evidence.map(adaptManualFounderEvidence);

  return buildFounderSnapshot({
    domain: input.domain,
    title: input.title,
    summary: input.summary,
    evidence,
    decision: input.decision,
  });
}