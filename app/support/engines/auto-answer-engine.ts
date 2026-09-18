import type {
  KnowledgeAnswer,
  SupportLocale,
} from "../models";

import type { KnowledgeMatch } from "./knowledge-engine";

export type AutoAnswerRequest = {
  question: string;
  locale: SupportLocale;

  knowledgeMatch?: KnowledgeMatch;
};

export type AutoAnswerResult = {
  answered: boolean;

  answer?: KnowledgeAnswer;

  confidence: number;

  requiresHumanReview: boolean;
  requiresNewKnowledge: boolean;

  generatedResponse?: string;
};

export interface AutoAnswerEngine {
  answer(
    request: AutoAnswerRequest,
  ): Promise<AutoAnswerResult>;
}