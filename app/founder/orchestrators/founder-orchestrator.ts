import type {
  FounderEvidence,
  FounderIntelligenceDomain,
  FounderIntelligenceSnapshot,
} from "../models/founder-model";

import { buildFounderConclusion } from "../engines/founder-conclusion-engine";
import { buildFounderDecision } from "../engines/founder-decision-engine";
import { buildFounderInsight } from "../engines/founder-insight-engine";

export type FounderOrchestratorInput = {
  domain: FounderIntelligenceDomain;
  title: string;
  summary: string;
  evidence: FounderEvidence[];
  decision: {
    title: string;
    reason: string;
    priority: "critical" | "high" | "medium" | "low";
    impact: {
      description: string;
      expectedOutcome?: string | null;
      measurableBy?: string | null;
    };
  };
};

export function buildFounderSnapshot(
  input: FounderOrchestratorInput
): FounderIntelligenceSnapshot {
  const timestamp = new Date().toISOString();

  const conclusion = buildFounderConclusion({
    id: crypto.randomUUID(),
    domain: input.domain,
    title: input.title,
    summary: input.summary,
    evidence: input.evidence,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const decision = buildFounderDecision({
    id: crypto.randomUUID(),
    conclusion,
    title: input.decision.title,
    reason: input.decision.reason,
    priority: input.decision.priority,
    impact: input.decision.impact,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const insight = buildFounderInsight({
    id: crypto.randomUUID(),
    domain: input.domain,
    title: input.title,
    conclusion,
    decision,
    evidence: input.evidence,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return {
    generatedAt: timestamp,
    primaryInsightId: insight.id,
    insights: [insight],
  };
}