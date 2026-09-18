import type {
  SupportConversation,
  SupportMessage,
  SupportRequest,
} from "../models";

export type ConversationContext = {
  request: SupportRequest;
  conversation: SupportConversation;
  messages: SupportMessage[];
};

export type ConversationState = {
  context: ConversationContext;
  latestMessage: SupportMessage | null;
  messageCount: number;
  hasUserMessage: boolean;
  hasSupportMessage: boolean;
  requiresResponse: boolean;
};

export type ConversationEngine = {
  buildState(
    context: ConversationContext,
  ): Promise<ConversationState>;

  getLatestMessage(
    messages: SupportMessage[],
  ): SupportMessage | null;

  requiresResponse(
    messages: SupportMessage[],
  ): boolean;
};