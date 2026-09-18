import type {
  KnowledgeItemId,
  SupportActorType,
  SupportEntity,
  SupportLocale,
  SupportMessageId,
  SupportUserId,
} from "./support-model";

export type SupportMessageType =
  | "user_message"
  | "support_reply"
  | "automatic_answer"
  | "internal_note"
  | "system_event";

export type SupportMessageDeliveryStatus =
  | "draft"
  | "queued"
  | "sent"
  | "delivered"
  | "failed";

export type SupportMessage = SupportEntity & {
  id: SupportMessageId;

  conversationId: string;

  type: SupportMessageType;
  actorType: SupportActorType;
  actorId?: SupportUserId;

  content: string;
  language: SupportLocale;

  deliveryStatus: SupportMessageDeliveryStatus;

  knowledgeItemId?: KnowledgeItemId;
  confidence?: number;

  isInternal: boolean;
  isEdited: boolean;

  sentAt?: string;
  deliveredAt?: string;
};