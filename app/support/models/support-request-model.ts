import type {
  KnowledgeItemId,
  SupportChannel,
  SupportConversationId,
  SupportEntity,
  SupportPriority,
  SupportResolutionType,
  SupportScope,
  SupportStatus,
  SupportTeamId,
  SupportUserId,
} from "./support-model";

export type SupportRequestSource =
  | "user"
  | "system"
  | "import"
  | "corporate";

export type SupportRequestIntent =
  | "account"
  | "import"
  | "whatsapp"
  | "billing"
  | "company_data"
  | "technical"
  | "product"
  | "other";

export type SupportRequest = SupportEntity & {
  scope: SupportScope;

  conversationId: SupportConversationId;

  source: SupportRequestSource;
  channel: SupportChannel;
  intent: SupportRequestIntent;

  subject?: string;
  originalMessage: string;
  detectedLanguage: string;

  status: SupportStatus;
  priority: SupportPriority;

  assignedUserId?: SupportUserId;
  assignedTeamId?: SupportTeamId;

  matchedKnowledgeItemId?: KnowledgeItemId;
  matchConfidence?: number;

  resolutionType?: SupportResolutionType;
  resolvedAt?: string;

  requiresFounderReview: boolean;
};