import type {
  KnowledgeItemId,
  SupportConversationId,
  SupportEntity,
  SupportPriority,
  SupportTeamId,
  SupportUserId,
} from "./support-model";

export type EscalationReason =
  | "low_confidence"
  | "missing_knowledge"
  | "negative_feedback"
  | "technical_issue"
  | "billing_issue"
  | "security_issue"
  | "product_friction"
  | "customer_request"
  | "founder_review";

export type EscalationStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed";

export type SupportEscalation = SupportEntity & {
  conversationId: SupportConversationId;
  knowledgeItemId?: KnowledgeItemId;

  reason: EscalationReason;
  status: EscalationStatus;
  priority: SupportPriority;

  title: string;
  description: string;

  assignedUserId?: SupportUserId;
  assignedTeamId?: SupportTeamId;

  createdByUserId?: SupportUserId;
  resolvedByUserId?: SupportUserId;

  requiresFounderReview: boolean;

  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
};