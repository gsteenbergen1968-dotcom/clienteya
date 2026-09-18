import {
  buildSupportRepository,
} from "../repositories";

import {
  buildSupportOrchestrator,
} from "../orchestrators";

import type {
  SupportOrchestrator,
} from "../orchestrators";

import type {
  SupportAdapter,
} from "../adapters";

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
} from ".";

export type BuildSupportIntelligenceDependencies = {
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

export type SupportIntelligence = {
  orchestrator: SupportOrchestrator;
};

export function buildSupportIntelligence(
  dependencies: BuildSupportIntelligenceDependencies,
): SupportIntelligence {
  const repository = buildSupportRepository(
    dependencies.adapter,
  );

  const orchestrator = buildSupportOrchestrator({
    repository,
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

  return {
    orchestrator,
  };
}