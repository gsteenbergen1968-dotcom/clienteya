import {
  buildSupportIntelligence,
  type SupportIntelligence,
} from "./engines/build-support-intelligence";

import {
  buildSupportOrchestrator,
} from "./orchestrators";

import {
  buildSupportRepository,
} from "./repositories";

import type {
  SupportAdapter,
} from "./adapters";

import type {
  KnowledgeEngine,
  SimilarityEngine,
  LanguageDetectionEngine,
  TranslationEngine,
  AutoAnswerEngine,
  ConversationEngine,
  LearningEngine,
  EscalationEngine,
  PriorityEngine,
  FounderInsightEngine,
} from "./engines";

export type CreateSupportIntelligenceDependencies = {
  adapter: SupportAdapter;

  knowledgeEngine: KnowledgeEngine;
  similarityEngine: SimilarityEngine;
  languageDetectionEngine: LanguageDetectionEngine;
  translationEngine: TranslationEngine;
  autoAnswerEngine: AutoAnswerEngine;
  conversationEngine: ConversationEngine;
  learningEngine: LearningEngine;
  escalationEngine: EscalationEngine;
  priorityEngine: PriorityEngine;
  founderInsightEngine: FounderInsightEngine;
};

export function createSupportIntelligence(
  dependencies: CreateSupportIntelligenceDependencies,
): SupportIntelligence {
  return buildSupportIntelligence({
    adapter: dependencies.adapter,

    knowledgeEngine: dependencies.knowledgeEngine,
    similarityEngine: dependencies.similarityEngine,
    languageDetectionEngine:
      dependencies.languageDetectionEngine,
    translationEngine:
      dependencies.translationEngine,
    autoAnswerEngine:
      dependencies.autoAnswerEngine,
    conversationEngine:
      dependencies.conversationEngine,
    learningEngine:
      dependencies.learningEngine,
    escalationEngine:
      dependencies.escalationEngine,
    priorityEngine:
      dependencies.priorityEngine,
    founderInsightEngine:
      dependencies.founderInsightEngine,
  });
}