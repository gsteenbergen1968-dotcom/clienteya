import type { SupportMessage } from "../models";

import type {
  ConversationContext,
  ConversationEngine,
  ConversationState,
} from "./conversation-engine";

function sortMessages(
  messages: SupportMessage[],
): SupportMessage[] {
  return [...messages].sort((left, right) => {
    const leftDate =
      left.sentAt ??
      left.createdAt;

    const rightDate =
      right.sentAt ??
      right.createdAt;

    return (
      new Date(leftDate).getTime() -
      new Date(rightDate).getTime()
    );
  });
}

function getLatestMessage(
  messages: SupportMessage[],
): SupportMessage | null {
  const sortedMessages = sortMessages(messages);

  return (
    sortedMessages[
      sortedMessages.length - 1
    ] ?? null
  );
}

function requiresResponse(
  messages: SupportMessage[],
): boolean {
  const latestMessage =
    getLatestMessage(messages);

  if (!latestMessage) {
    return false;
  }

  return latestMessage.type === "user_message";
}

export function buildConversationEngine(): ConversationEngine {
  return {
    async buildState(
      context: ConversationContext,
    ): Promise<ConversationState> {
      const latestMessage =
        getLatestMessage(context.messages);

      const hasUserMessage =
        context.messages.some(
          (message) =>
            message.type === "user_message",
        );

      const hasSupportMessage =
        context.messages.some(
          (message) =>
            message.type === "support_reply" ||
            message.type ===
              "automatic_answer",
        );

      return {
        context,
        latestMessage,
        messageCount:
          context.messages.length,
        hasUserMessage,
        hasSupportMessage,
        requiresResponse:
          requiresResponse(context.messages),
      };
    },

    getLatestMessage,

    requiresResponse,
  };
}