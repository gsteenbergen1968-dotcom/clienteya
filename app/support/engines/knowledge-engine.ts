import type {
  KnowledgeAnswer,
  KnowledgeItem,
  SupportLocale,
} from "../models";

export type KnowledgeMatch = {
  item: KnowledgeItem;
  answer?: KnowledgeAnswer;

  confidence: number;

  exactMatch: boolean;
  automaticResponse: boolean;
};

export type KnowledgeSearchResult = {
  matches: KnowledgeMatch[];

  bestMatch?: KnowledgeMatch;

  requiresHumanReview: boolean;

  requiresNewKnowledge: boolean;
};

export interface KnowledgeEngine {
  findKnowledge(
    question: string,
    locale: SupportLocale,
  ): Promise<KnowledgeSearchResult>;

  findKnowledgeById(
    knowledgeItemId: string,
  ): Promise<KnowledgeItem | null>;

  getAnswer(
    knowledgeItemId: string,
    locale: SupportLocale,
  ): Promise<KnowledgeAnswer | null>;
}