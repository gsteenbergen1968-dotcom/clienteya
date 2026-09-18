import type {
  FounderInsightEngine,
  LearningEngine,
} from "../engines";

import {
  createFounderSupportOrchestrator,
  type FounderSupportOrchestrator,
} from "./founder-support-orchestrator";

export type BuildFounderSupportOrchestratorDependencies = {
  learningEngine: LearningEngine;
  founderInsightEngine: FounderInsightEngine;
};

export function buildFounderSupportOrchestrator(
  dependencies: BuildFounderSupportOrchestratorDependencies,
): FounderSupportOrchestrator {
  return createFounderSupportOrchestrator({
    learningEngine: dependencies.learningEngine,
    founderInsightEngine: dependencies.founderInsightEngine,
  });
}