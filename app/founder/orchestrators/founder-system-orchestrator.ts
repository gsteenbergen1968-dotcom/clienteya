import type { FounderIntelligenceSnapshot } from "../models/founder-model";

import { founderEvidenceAdapters } from "../adapters/founder-adapter-registry";
import { collectFounderRelationshipsEvidence } from "../adapters/founder-relationships-adapter";
import { buildFounderSnapshot } from "./founder-orchestrator";

export async function buildFounderSystemSnapshot(): Promise<FounderIntelligenceSnapshot> {
  const [technicalEvidenceCollections, relationshipsEvidence] =
    await Promise.all([
      Promise.all(
        founderEvidenceAdapters.map((adapter) => adapter())
      ),
      collectFounderRelationshipsEvidence(),
    ]);

  const technicalEvidence = technicalEvidenceCollections.flat();

  const technicalSnapshot = buildFounderSnapshot({
    domain: "architecture",
    title: "Founder Center system is operational",
    summary:
      "Multiple independent technical evidence sources confirm that the Founder Center foundation is operating correctly.",
    evidence: technicalEvidence,
    decision: {
      title: "Replace baseline evidence with verified system data",
      reason:
        "The complete evidence collection architecture is operational. Prepared baseline signals can now be progressively replaced with verified technical evidence.",
      priority: "high",
      impact: {
        description:
          "Founder Center will move from architecture validation to continuous, evidence-based system intelligence.",
        expectedOutcome:
          "Automatic founder conclusions supported by verified technical evidence.",
        measurableBy:
          "Every baseline adapter is progressively replaced by a real technical integration without changing the engines or user interface.",
      },
    },
  });

  const relationshipsSnapshot = buildFounderSnapshot({
    domain: "business",
    title: "Relationship intelligence is operational",
    summary:
      "Verified relationship data provides direct evidence about activity, growth, follow-up and commercial value.",
    evidence: relationshipsEvidence,
    decision: {
      title: "Strengthen relationship follow-up",
      reason:
        "Relationship data now makes it possible to identify active relationships, missing next actions and commercial development.",
      priority: "high",
      impact: {
        description:
          "Founder decisions can now be based on verified relationship activity instead of assumptions.",
        expectedOutcome:
          "More relationships receive a clear next action and remain commercially active.",
        measurableBy:
          "The number and percentage of active relationships with a planned next action.",
      },
    },
  });

  return {
    generatedAt: new Date().toISOString(),
    primaryInsightId:
      relationshipsSnapshot.primaryInsightId ??
      technicalSnapshot.primaryInsightId,
    insights: [
      ...relationshipsSnapshot.insights,
      ...technicalSnapshot.insights,
    ],
  };
}