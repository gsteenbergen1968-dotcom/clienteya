import type {
  AuditEvent,
  SupportConversation,
  SupportMessage,
  SupportRequest,
} from "../models";

import type {
  FounderInsightResult,
  LearningDecision,
} from "../engines";

import type { SupportOrchestrator } from "./support-orchestrator";

export type ProcessSupportResponseInput = {
  request: SupportRequest;
  conversation: SupportConversation;
  message: SupportMessage;
};

export type ProcessSupportResponseResult = {
  request: SupportRequest;
  conversation: SupportConversation;
  message: SupportMessage;
  learning: LearningDecision;
  founderInsight: FounderInsightResult;
};

function buildUpdatedConversation(
  conversation: SupportConversation,
  message: SupportMessage,
): SupportConversation {
  const now = new Date().toISOString();

  return {
    ...conversation,
    messageIds: conversation.messageIds.includes(message.id)
      ? conversation.messageIds
      : [...conversation.messageIds, message.id],
    lastMessageAt: message.createdAt,
    isUnread: false,
    requiresHumanResponse: false,
    updatedAt: now,
  };
}

function buildAuditEvent(
  message: SupportMessage,
  conversation: SupportConversation,
): AuditEvent {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    event: "updated",
    resource: "message",
    resourceId: message.id,
    description: "A human support response was created and processed.",
    metadata: {
      conversationId: conversation.id,
      messageType: message.type,
      actorType: message.actorType,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function processSupportResponse(
  orchestrator: SupportOrchestrator,
  input: ProcessSupportResponseInput,
): Promise<ProcessSupportResponseResult> {
  const { request, conversation, message } = input;

  await orchestrator.saveMessage(message);

  const updatedConversation = buildUpdatedConversation(
    conversation,
    message,
  );

  await orchestrator.saveConversation(updatedConversation);

  const messages = await orchestrator.getMessages(
    updatedConversation.id,
  );

  const learning = await orchestrator.learningEngine.evaluate({
    request,
    conversation: updatedConversation,
    messages,
  });

  await Promise.all(
    learning.signals.map((signal) =>
      orchestrator.saveLearningSignal(signal),
    ),
  );

  const escalations = (
    await orchestrator.getEscalations()
  ).filter(
    (escalation) =>
      escalation.conversationId === updatedConversation.id,
  );

  const founderInsight =
    await orchestrator.founderInsightEngine.evaluate({
      requests: [request],
      learningSignals: learning.signals,
      escalations,
    });

  await orchestrator.saveAuditEvent(
    buildAuditEvent(message, updatedConversation),
  );

  return {
    request,
    conversation: updatedConversation,
    message,
    learning,
    founderInsight,
  };
}