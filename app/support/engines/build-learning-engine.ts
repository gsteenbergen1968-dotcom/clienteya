import type {
  KnowledgeFeedback,
  LearningSignal,
  SupportMessage,
} from "../models";

import type {
  LearningContext,
  LearningDecision,
  LearningEngine,
} from "./learning-engine";

export type BuildLearningEngineOptions = {
  founderReviewThreshold?: number;
};

function createSignalId(): string {
  return `learning-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function hasNegativeFeedback(
  feedback: KnowledgeFeedback[],
): boolean {
  return feedback.some(
    (item) =>
      item.type === "not_helpful" ||
      item.type === "incorrect" ||
      item.type === "outdated" ||
      item.type === "improvement" ||
      (item.rating !== undefined && item.rating <= 2) ||
      item.requiresReview,
  );
}

function hasRepeatedQuestion(
  messages: SupportMessage[],
): boolean {
  const userMessages = messages.filter(
    (message) => message.type === "user_message",
  );

  const normalizedMessages = userMessages.map((message) =>
    message.content.trim().toLowerCase(),
  );

  const uniqueMessages = new Set(normalizedMessages);

  return normalizedMessages.length > uniqueMessages.size;
}

function createLearningSignal(
  input: Pick<
    LearningSignal,
    | "type"
    | "source"
    | "title"
    | "description"
    | "confidence"
    | "conversationId"
    | "requiresFounderReview"
  >,
): LearningSignal {
  const now = new Date().toISOString();

  return {
    id: createSignalId(),
    createdAt: now,
    updatedAt: now,

    type: input.type,
    status: "new",
    source: input.source,

    title: input.title,
    description: input.description,

    conversationId: input.conversationId,

    confidence: input.confidence,
    occurrenceCount: 1,
    affectedUserCount: 1,

    requiresFounderReview:
      input.requiresFounderReview,
  } as LearningSignal;
}

function buildSignals(
  context: LearningContext,
  founderReviewThreshold: number,
): LearningSignal[] {
  const signals: LearningSignal[] = [];

  if (hasRepeatedQuestion(context.messages)) {
    const confidence = 0.9;

    signals.push(
      createLearningSignal({
        type: "missing_knowledge",
        source: "system",
        title: "Repeated support question",
        description:
          "The same user question appeared more than once in the conversation.",
        confidence,
        conversationId: context.conversation.id,
        requiresFounderReview:
          confidence >= founderReviewThreshold,
      }),
    );
  }

  if (
    context.feedback &&
    hasNegativeFeedback(context.feedback)
  ) {
    const confidence = 0.85;

    signals.push(
      createLearningSignal({
        type: "negative_feedback",
        source: "customer",
        title: "Negative knowledge feedback",
        description:
          "Existing knowledge received negative feedback or requires review.",
        confidence,
        conversationId: context.conversation.id,
        requiresFounderReview:
          confidence >= founderReviewThreshold,
      }),
    );
  }

  return signals;
}

export function buildLearningEngine(
  options: BuildLearningEngineOptions = {},
): LearningEngine {
  const founderReviewThreshold =
    options.founderReviewThreshold ?? 0.85;

  return {
    async evaluate(
      context: LearningContext,
    ): Promise<LearningDecision> {
      const signals = buildSignals(
        context,
        founderReviewThreshold,
      );

      return {
        signals,

        shouldCreateKnowledge: signals.some(
          (signal) =>
            signal.type === "missing_knowledge" ||
            signal.type === "new_question",
        ),

        shouldUpdateKnowledge: signals.some(
          (signal) =>
            signal.type === "negative_feedback" ||
            signal.type === "low_confidence",
        ),

        shouldCreateProductInsight: signals.some(
          (signal) =>
            signal.type === "product_friction" ||
            signal.type === "product_improvement",
        ),

        requiresFounderReview: signals.some(
          (signal) => signal.requiresFounderReview,
        ),
      };
    },
  };
}