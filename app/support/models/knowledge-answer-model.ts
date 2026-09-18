import type {
  KnowledgeItemId,
  SupportEntity,
  SupportLocale,
  SupportUserId,
} from "./support-model";

export type KnowledgeAnswerStatus =
  | "draft"
  | "approved"
  | "archived";

export type KnowledgeAnswerSource =
  | "human"
  | "ai"
  | "human_reviewed";

export type KnowledgeAnswer = SupportEntity & {
  knowledgeItemId: KnowledgeItemId;

  locale: SupportLocale;

  title: string;
  answer: string;

  status: KnowledgeAnswerStatus;
  source: KnowledgeAnswerSource;

  version: number;

  createdByUserId?: SupportUserId;
  approvedByUserId?: SupportUserId;

  approvedAt?: string;
  publishedAt?: string;

  usageCount: number;
  averageSatisfaction?: number;

  isDefault: boolean;
};