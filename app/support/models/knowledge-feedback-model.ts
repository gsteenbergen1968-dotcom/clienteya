import type {
  KnowledgeItemId,
  SupportEntity,
  SupportLocale,
  SupportUserId,
} from "./support-model";

export type KnowledgeFeedbackType =
  | "helpful"
  | "not_helpful"
  | "incorrect"
  | "outdated"
  | "improvement";

export type KnowledgeFeedbackSource =
  | "customer"
  | "support_user"
  | "system";

export type KnowledgeFeedback = SupportEntity & {
  knowledgeItemId: KnowledgeItemId;

  type: KnowledgeFeedbackType;
  source: KnowledgeFeedbackSource;

  locale: SupportLocale;

  rating?: number;
  comment?: string;

  submittedByUserId?: SupportUserId;

  requiresReview: boolean;
  reviewed: boolean;
  reviewedByUserId?: SupportUserId;
  reviewedAt?: string;
};