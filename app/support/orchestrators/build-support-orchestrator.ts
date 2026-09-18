import type {
  AutoAnswerEngine,
  ConversationEngine,
  EscalationEngine,
  FounderInsightEngine,
  KnowledgeEngine,
  LanguageDetectionEngine,
  LearningEngine,
  PriorityEngine,
  SimilarityEngine,
  TranslationEngine,
} from "../engines";

import type { SupportRepository } from "../repositories";

import {
  createSupportOrchestrator,
  type SupportOrchestrator,
} from "./support-orchestrator";

export type BuildSupportOrchestratorDependencies = {
  repository: SupportRepository;

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

export function buildSupportOrchestrator(
  dependencies: BuildSupportOrchestratorDependencies,
): SupportOrchestrator {
  return createSupportOrchestrator({
    repository: dependencies.repository,
    knowledgeEngine: dependencies.knowledgeEngine,
    similarityEngine: dependencies.similarityEngine,
    languageDetectionEngine: dependencies.languageDetectionEngine,
    translationEngine: dependencies.translationEngine,
    autoAnswerEngine: dependencies.autoAnswerEngine,
    conversationEngine: dependencies.conversationEngine,
    learningEngine: dependencies.learningEngine,
    escalationEngine: dependencies.escalationEngine,
    priorityEngine: dependencies.priorityEngine,
    founderInsightEngine: dependencies.founderInsightEngine,
  });
}