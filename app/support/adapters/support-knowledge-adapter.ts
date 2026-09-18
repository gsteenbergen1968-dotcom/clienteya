import type {
  KnowledgeAnswer,
  KnowledgeCategory,
  KnowledgeFeedback,
  KnowledgeItem,
} from "../models";

import type { SupportListOptions } from "./support-adapter";

export interface SupportKnowledgeAdapter {
  getKnowledgeItems(
    options?: SupportListOptions,
  ): Promise<KnowledgeItem[]>;

  getKnowledgeItemById(
    id: string,
  ): Promise<KnowledgeItem | null>;

  saveKnowledgeItem(
    item: KnowledgeItem,
  ): Promise<KnowledgeItem>;

  getKnowledgeAnswersByItemId(
    knowledgeItemId: string,
  ): Promise<KnowledgeAnswer[]>;

  saveKnowledgeAnswer(
    answer: KnowledgeAnswer,
  ): Promise<KnowledgeAnswer>;

  getKnowledgeCategories(): Promise<KnowledgeCategory[]>;

  saveKnowledgeCategory(
    category: KnowledgeCategory,
  ): Promise<KnowledgeCategory>;

  getKnowledgeFeedbackByItemId(
    knowledgeItemId: string,
  ): Promise<KnowledgeFeedback[]>;

  saveKnowledgeFeedback(
    feedback: KnowledgeFeedback,
  ): Promise<KnowledgeFeedback>;
}