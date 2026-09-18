import { buildSupportMemoryAdapter } from "./adapters";

import type {
  SupportTranslationAdapter,
} from "./adapters/support-translation-adapter";

import {
  buildAutoAnswerEngine,
  buildConversationEngine,
  buildEscalationEngine,
  buildFounderInsightEngine,
  buildKnowledgeEngine,
  buildLanguageDetectionEngine,
  buildLearningEngine,
  buildPriorityEngine,
  buildSimilarityEngine,
  buildTranslationEngine,
  type AutoAnswerProvider,
} from "./engines";

import {
  buildSupportIntelligence,
  type SupportIntelligence,
} from "./engines/build-support-intelligence";

import type {
  KnowledgeAnswer,
  SupportLocale,
} from "./models";

import {
  openAITranslationProvider,
} from "./providers/openai-translation-provider";

const autoAnswerProvider: AutoAnswerProvider = {
  async generateResponse(input: {
    question: string;
    locale: SupportLocale;
    knowledgeAnswer: KnowledgeAnswer;
  }) {
    return {
      response: input.knowledgeAnswer.answer,
      confidence: 1,
    };
  },
};

export function createSupportRuntime(): SupportIntelligence {
  const adapter = buildSupportMemoryAdapter();

  const translationAdapter: SupportTranslationAdapter = {
    getTranslationsByItemId(knowledgeItemId) {
      return adapter.getTranslationsByItemId(
        knowledgeItemId,
      );
    },

    async getApprovedTranslation(
      knowledgeItemId,
      targetLocale,
    ) {
      const translations =
        await adapter.getTranslationsByItemId(
          knowledgeItemId,
        );

      return (
        translations
          .filter(
            (translation) =>
              translation.targetLocale === targetLocale &&
              translation.status === "approved",
          )
          .sort(
            (left, right) =>
              right.version - left.version,
          )[0] ?? null
      );
    },

    saveTranslation(translation) {
      return adapter.saveTranslation(translation);
    },
  };

  const knowledgeEngine =
    buildKnowledgeEngine(adapter);

  const similarityEngine =
    buildSimilarityEngine();

  const languageDetectionEngine =
    buildLanguageDetectionEngine({
      fallbackLocale: "es",
    });

  const translationEngine =
    buildTranslationEngine(
      translationAdapter,
      openAITranslationProvider,
    );

  const autoAnswerEngine =
    buildAutoAnswerEngine(
      autoAnswerProvider,
    );

  const conversationEngine =
    buildConversationEngine();

  const learningEngine =
    buildLearningEngine();

  const escalationEngine =
    buildEscalationEngine();

  const priorityEngine =
    buildPriorityEngine();

  const founderInsightEngine =
    buildFounderInsightEngine();

  return buildSupportIntelligence({
    adapter,
    knowledgeEngine,
    similarityEngine,
    languageDetectionEngine,
    translationEngine,
    autoAnswerEngine,
    conversationEngine,
    learningEngine,
    escalationEngine,
    priorityEngine,
    founderInsightEngine,
  });
}