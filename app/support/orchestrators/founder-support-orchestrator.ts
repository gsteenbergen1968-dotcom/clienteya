import type {
  FounderInsightEngine,
  LearningEngine,
} from "../engines";

import type {
  SupportConversation,
  SupportEscalation,
  SupportRequest,
  LearningSignal,
} from "../models";

export type FounderSupportOrchestratorDependencies = {
  learningEngine: LearningEngine;
  founderInsightEngine: FounderInsightEngine;
};

export type FounderSupportInsightContext = {
  requests: SupportRequest[];
  conversations: SupportConversation[];
  escalations: SupportEscalation[];
  learningSignals: LearningSignal[];
};

export type FounderSupportOrchestrator = {
  buildInsights(
    context: FounderSupportInsightContext,
  ): Promise<{
    insights: Awaited<
      ReturnType<FounderInsightEngine["evaluate"]>
    >;
  }>;
};

export function createFounderSupportOrchestrator(
  dependencies: FounderSupportOrchestratorDependencies,
): FounderSupportOrchestrator {
  return {
    async buildInsights(
      context: FounderSupportInsightContext,
    ) {
      const learningResult =
        await dependencies.learningEngine.evaluate({
          conversation: context.conversations[0],
          messages: [],
        });

      const result =
        await dependencies.founderInsightEngine.evaluate({
          requests: context.requests,
          learningSignals: [
            ...context.learningSignals,
            ...learningResult.signals,
          ],
          escalations: context.escalations,
        });

      return {
        insights: result,
      };
    },
  };
}