import type {
  AutoAnswerResult,
  EscalationContext,
  EscalationDecision,
  KnowledgeSearchResult,
  LanguageDetectionResult,
  LearningDecision,
  PriorityContext,
  PriorityDecision,
  SimilarityResult,
  TranslationResult,
} from "../engines";

import type {
  AuditEvent,
  KnowledgeAnswer,
  SupportConversation,
  SupportConversationId,
  SupportEscalation,
  SupportMessage,
  SupportRequest,
} from "../models";

import type { SupportOrchestrator } from "./support-orchestrator";

export type ProcessSupportRequestResult = {
  request: SupportRequest | null;
  conversation: SupportConversation | null;
  messages: SupportMessage[];

  languageDetection: LanguageDetectionResult | null;
  knowledgeResult: KnowledgeSearchResult | null;
  similarityResult: SimilarityResult | null;
  translationResult: TranslationResult | null;
  autoAnswerResult: AutoAnswerResult | null;
  priorityDecision: PriorityDecision | null;
  escalationDecision: EscalationDecision | null;
  learningDecision: LearningDecision | null;
};

function findLatestUserMessage(
  messages: SupportMessage[],
): SupportMessage | null {
  const userMessages = messages.filter(
    (message) =>
      message.type === "user_message" &&
      !message.isInternal &&
      message.content.trim().length > 0,
  );

  return userMessages.at(-1) ?? null;
}

function getKnowledgeAnswer(
  knowledgeResult: KnowledgeSearchResult | null,
): KnowledgeAnswer | null {
  return knowledgeResult?.bestMatch?.answer ?? null;
}

async function safeTranslate(
  orchestrator: SupportOrchestrator,
  input: {
    sourceText: string;
    sourceLocale: string;
    targetLocale: string;
  },
): Promise<TranslationResult | null> {
  try {
    return await orchestrator.translationEngine.translate(
      input,
    );
  } catch (error) {
    console.error(
      "SIP translation unavailable; continuing without translation.",
      error,
    );

    return null;
  }
}

function buildPriorityContext(
  request: SupportRequest,
): PriorityContext {
  return {
    request,
    securityRelevant: false,
    billingRelevant: request.intent === "billing",
    productBlocked: false,
    repeatedIssue: false,
  };
}

function buildEscalationContext(
  request: SupportRequest,
  knowledgeResult: KnowledgeSearchResult | null,
  autoAnswerResult: AutoAnswerResult | null,
): EscalationContext {
  return {
    request,

    confidence:
      knowledgeResult?.bestMatch?.confidence,

    hasKnowledgeMatch:
      (knowledgeResult?.matches.length ?? 0) > 0,

    automaticAnswerAvailable:
      autoAnswerResult?.answered ?? false,

    negativeFeedback: false,
    securityRelevant: false,
    billingRelevant:
      request.intent === "billing",
  };
}

function buildAutomaticAnswerMessage(
  conversationId: SupportConversationId,
  languageDetection: LanguageDetectionResult,
  knowledgeResult: KnowledgeSearchResult | null,
  autoAnswerResult: AutoAnswerResult,
  now: string,
): SupportMessage | null {
  const content =
    autoAnswerResult.generatedResponse ??
    autoAnswerResult.answer?.answer;

  if (!autoAnswerResult.answered || !content) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    conversationId,
    type: "automatic_answer",
    actorType: "system",
    content,
    language: languageDetection.locale,
    deliveryStatus: "sent",
    knowledgeItemId:
      knowledgeResult?.bestMatch?.item.id,
    confidence: autoAnswerResult.confidence,
    isInternal: false,
    isEdited: false,
    sentAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function buildEscalation(
  conversationId: SupportConversationId,
  latestUserMessage: SupportMessage | null,
  decision: EscalationDecision,
  now: string,
): SupportEscalation | null {
  if (!decision.shouldEscalate || !decision.reason) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    conversationId,
    reason: decision.reason,
    status:
      decision.assignedUserId ||
      decision.assignedTeamId
        ? "assigned"
        : "open",
    priority: decision.priority,
    title: "Support request escalated",
    description:
      latestUserMessage?.content ??
      "Support request requires human review.",
    assignedUserId: decision.assignedUserId,
    assignedTeamId: decision.assignedTeamId,
    requiresFounderReview:
      decision.requiresFounderReview,
    assignedAt:
      decision.assignedUserId ||
      decision.assignedTeamId
        ? now
        : undefined,
    createdAt: now,
    updatedAt: now,
  };
}

function buildAuditEvent(
  event: AuditEvent["event"],
  resource: AuditEvent["resource"],
  resourceId: string,
  description: string,
  now: string,
  metadata?: Record<string, unknown>,
): AuditEvent {
  return {
    id: crypto.randomUUID(),
    event,
    resource,
    resourceId,
    description,
    metadata,
    createdAt: now,
    updatedAt: now,
  };
}

export async function processSupportRequest(
  orchestrator: SupportOrchestrator,
  requestId: string,
  conversationId: SupportConversationId,
): Promise<ProcessSupportRequestResult> {
  const request =
    await orchestrator.getRequest(requestId);

  const conversation =
    await orchestrator.getConversation(
      conversationId,
    );

  const messages =
    await orchestrator.getMessages(
      conversationId,
    );

  const latestUserMessage =
    findLatestUserMessage(messages);

  const languageDetection = latestUserMessage
    ? await orchestrator.languageDetectionEngine.detect(
        latestUserMessage.content,
      )
    : null;

  const languageUpdatedAt =
    new Date().toISOString();

  const processedRequest =
    request && languageDetection
      ? {
          ...request,
          scope: {
            ...request.scope,
            locale: languageDetection.locale,
          },
          detectedLanguage:
            languageDetection.locale,
          updatedAt:
            languageUpdatedAt,
        }
      : request;

  const processedConversation =
    conversation && languageDetection
      ? {
          ...conversation,
          scope: {
            ...conversation.scope,
            locale: languageDetection.locale,
          },
          detectedLanguage:
            languageDetection.locale,
          updatedAt:
            languageUpdatedAt,
        }
      : conversation;

  if (
    processedRequest &&
    processedRequest !== request
  ) {
    await orchestrator.saveRequest(
      processedRequest,
    );
  }

  if (
    processedConversation &&
    processedConversation !== conversation
  ) {
    await orchestrator.saveConversation(
      processedConversation,
    );
  }

  const incomingTranslationResult =
    latestUserMessage &&
    languageDetection &&
    languageDetection.locale !== "en"
      ? await safeTranslate(
          orchestrator,
          {
            sourceText: latestUserMessage.content,
            sourceLocale: languageDetection.locale,
            targetLocale: "en",
          },
        )
      : null;

  const sipUserMessage =
    latestUserMessage &&
    incomingTranslationResult?.translatedText
      ? {
          ...latestUserMessage,
          content:
            incomingTranslationResult.translatedText,
          language:
            "en",
          updatedAt:
            languageUpdatedAt,
        }
      : latestUserMessage;

  if (
    sipUserMessage &&
    latestUserMessage &&
    sipUserMessage !== latestUserMessage
  ) {
    await orchestrator.saveMessage(
      sipUserMessage,
    );
  }

  const processedMessages =
    sipUserMessage && latestUserMessage
      ? messages.map(
          (message) =>
            message.id === latestUserMessage.id
              ? sipUserMessage
              : message,
        )
      : messages;

  const knowledgeResult =
    latestUserMessage && languageDetection
      ? await orchestrator.knowledgeEngine.findKnowledge(
          latestUserMessage.content,
          languageDetection.locale,
        )
      : null;

  const knowledgeItems =
    knowledgeResult?.matches.map(
      (match) => match.item,
    ) ?? [];

  const similarityResult =
    latestUserMessage && languageDetection
      ? await orchestrator.similarityEngine.compare(
          latestUserMessage.content,
          knowledgeItems,
          languageDetection.locale,
        )
      : null;

  const knowledgeAnswer =
    getKnowledgeAnswer(knowledgeResult);

  const translationResult =
    knowledgeAnswer && languageDetection
      ? await safeTranslate(
          orchestrator,
          {
            sourceText: knowledgeAnswer.answer,
            sourceLocale: knowledgeAnswer.locale,
            targetLocale: languageDetection.locale,
          },
        )
      : null;

  const autoAnswerResult =
    latestUserMessage && languageDetection
      ? await orchestrator.autoAnswerEngine.answer({
          question: latestUserMessage.content,
          locale: languageDetection.locale,
          knowledgeMatch:
            knowledgeResult?.bestMatch,
        })
      : null;

  const priorityDecision = processedRequest
    ? await orchestrator.priorityEngine.evaluate(
        buildPriorityContext(processedRequest),
      )
    : null;

  const escalationDecision = processedRequest
    ? await orchestrator.escalationEngine.evaluate(
        buildEscalationContext(
          processedRequest,
          knowledgeResult,
          autoAnswerResult,
        ),
      )
    : null;

  const learningDecision = processedConversation
    ? await orchestrator.learningEngine.evaluate({
        request: processedRequest ?? undefined,
        conversation: processedConversation,
        messages: processedMessages,
      })
    : null;

  const now = new Date().toISOString();

  const automaticAnswerMessage =
    languageDetection && autoAnswerResult
      ? buildAutomaticAnswerMessage(
          conversationId,
          languageDetection,
          knowledgeResult,
          autoAnswerResult,
          now,
        )
      : null;

  if (automaticAnswerMessage) {
    await orchestrator.saveMessage(
      automaticAnswerMessage,
    );

    await orchestrator.saveAuditEvent(
      buildAuditEvent(
        "created",
        "message",
        automaticAnswerMessage.id,
        "Automatic support answer created.",
        now,
        {
          requestId,
          conversationId,
          confidence:
            automaticAnswerMessage.confidence,
          knowledgeItemId:
            automaticAnswerMessage.knowledgeItemId,
        },
      ),
    );
  }

  if (learningDecision) {
    await Promise.all(
      learningDecision.signals.map(
        (signal) =>
          orchestrator.saveLearningSignal(signal),
      ),
    );

    await Promise.all(
      learningDecision.signals.map(
        (signal) =>
          orchestrator.saveAuditEvent(
            buildAuditEvent(
              "created",
              "learning_signal",
              signal.id,
              "Support learning signal created.",
              now,
              {
                requestId,
                conversationId,
              },
            ),
          ),
      ),
    );
  }

  const escalation =
    escalationDecision
      ? buildEscalation(
          conversationId,
          sipUserMessage,
          escalationDecision,
          now,
        )
      : null;

  if (escalation) {
    await orchestrator.saveEscalation(escalation);

    await orchestrator.saveAuditEvent(
      buildAuditEvent(
        "escalated",
        "escalation",
        escalation.id,
        "Support request escalated.",
        now,
        {
          requestId,
          conversationId,
          reason: escalation.reason,
          priority: escalation.priority,
          requiresFounderReview:
            escalation.requiresFounderReview,
        },
      ),
    );
  }

  return {
    request: processedRequest,
    conversation: processedConversation,
    messages:
      automaticAnswerMessage
        ? [
            ...processedMessages,
            automaticAnswerMessage,
          ]
        : processedMessages,
    languageDetection,
    knowledgeResult,
    similarityResult,
    translationResult,
    autoAnswerResult,
    priorityDecision,
    escalationDecision,
    learningDecision,
  };
}