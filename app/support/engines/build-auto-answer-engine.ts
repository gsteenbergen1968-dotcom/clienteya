import type {
  KnowledgeAnswer,
  SupportLocale,
} from "../models";

import type {
  AutoAnswerEngine,
  AutoAnswerRequest,
  AutoAnswerResult,
} from "./auto-answer-engine";

export type AutoAnswerProvider = {
  generateResponse(input: {
    question: string;
    locale: SupportLocale;
    knowledgeAnswer: KnowledgeAnswer;
  }): Promise<{
    response: string;
    confidence: number;
  }>;
};

export type BuildAutoAnswerEngineOptions = {
  automaticAnswerThreshold?: number;
  humanReviewThreshold?: number;
};

export function buildAutoAnswerEngine(
  provider: AutoAnswerProvider,
  options: BuildAutoAnswerEngineOptions = {},
): AutoAnswerEngine {
  const automaticAnswerThreshold =
    options.automaticAnswerThreshold ?? 0.85;

  const humanReviewThreshold =
    options.humanReviewThreshold ?? 0.7;

  return {
    async answer(
      request: AutoAnswerRequest,
    ): Promise<AutoAnswerResult> {
      const match = request.knowledgeMatch;

      if (!match?.answer) {
        return {
          answered: false,
          confidence: match?.confidence ?? 0,
          requiresHumanReview: true,
          requiresNewKnowledge: !match,
        };
      }

      if (
        !match.automaticResponse ||
        match.confidence < automaticAnswerThreshold
      ) {
        return {
          answered: false,
          answer: match.answer,
          confidence: match.confidence,
          requiresHumanReview: true,
          requiresNewKnowledge: false,
        };
      }

      const generated = await provider.generateResponse({
        question: request.question,
        locale: request.locale,
        knowledgeAnswer: match.answer,
      });

      const confidence = Math.min(
        match.confidence,
        generated.confidence,
      );

      return {
        answered: confidence >= automaticAnswerThreshold,
        answer: match.answer,
        confidence,
        requiresHumanReview:
          confidence < humanReviewThreshold,
        requiresNewKnowledge: false,
        generatedResponse: generated.response,
      };
    },
  };
}