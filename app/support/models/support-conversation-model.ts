import type {
  SupportChannel,
  SupportEntity,
  SupportMessageId,
  SupportScope,
  SupportStatus,
  SupportTeamId,
  SupportUserId,
} from "./support-model";

export type SupportConversationParticipantType =
  | "customer"
  | "support_user"
  | "system"
  | "ai";

export type SupportConversationParticipant = {
  id: string;
  type: SupportConversationParticipantType;
  displayName?: string;
  email?: string;
};

export type SupportConversation = SupportEntity & {
  scope: SupportScope;

  channel: SupportChannel;
  status: SupportStatus;

  subject?: string;

  participantIds: string[];
  participants: SupportConversationParticipant[];

  messageIds: SupportMessageId[];

  assignedUserId?: SupportUserId;
  assignedTeamId?: SupportTeamId;

  detectedLanguage: string;

  lastMessageAt?: string;
  resolvedAt?: string;

  isUnread: boolean;
  requiresHumanResponse: boolean;
};