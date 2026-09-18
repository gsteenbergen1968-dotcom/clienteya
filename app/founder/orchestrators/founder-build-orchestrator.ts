import type { FounderIntelligenceSnapshot } from "../models/founder-model";

import { collectBuildEvidence } from "../adapters/founder-build-adapter";
import { buildFounderSnapshot } from "./founder-orchestrator";

export async function buildAutomaticFounderSnapshot(): Promise<FounderIntelligenceSnapshot> {
  const evidence = await collectBuildEvidence();

  return buildFounderSnapshot({
    domain: "release",
    title: "The latest production build is healthy",
    summary:
      "The available technical evidence confirms that the latest production build completed successfully.",
    evidence,
    decision: {
      title: "Connect the next automatic evidence source",
      reason:
        "Build health is now available as automatic evidence. A second independent source is needed before Founder Center can assess broader release readiness.",
      priority: "high",
      impact: {
        description:
          "Founder Center will compare multiple technical signals instead of relying on one build result.",
        expectedOutcome:
          "A release conclusion supported by build and deployment evidence.",
        measurableBy:
          "At least two automatic evidence sources processed through the intelligence chain.",
      },
    },
  });
}