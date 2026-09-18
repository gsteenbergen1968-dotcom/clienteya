import type {
  KnowledgeItemId,
  SupportConversationId,
  SupportEntity,
  SupportLocale,
  SupportUserId,
} from "./support-model";

export type LearningSignalType =
  | "new_question"
  | "knowledge_reused"
  | "automatic_resolution"
  | "human_resolution"
  | "low_confidence"
  | "negative_feedback"
  | "missing_knowledge"
  | "product_friction"
  | "product_improvement";

export type LearningSignalStatus =
  | "new"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "implemented"
  | "archived";

export type LearningSignalSource =
  | "customer"
  | "support_user"
  | "system"
  | "ai";

export type LearningSignal = SupportEntity & {
  type: LearningSignalType;
  status: LearningSignalStatus;
  source: LearningSignalSource;

  title: string;
  description: string;

  conversationId?: SupportConversationId;
  knowledgeItemId?: KnowledgeItemId;

  locale?: SupportLocale;

  confidence?: number;
  occurrenceCount: number;
  affectedUserCount: number;

  requiresFounderReview: boolean;
  reviewedByUserId?: SupportUserId;
  reviewedAt?: string;

  implementedAt?: string;
};