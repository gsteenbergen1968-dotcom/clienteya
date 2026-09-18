import type {
  KnowledgeFeedback,
  LearningSignal,
  SupportConversation,
  SupportMessage,
  SupportRequest,
} from "../models";

export type LearningContext = {
  request?: SupportRequest;
  conversation: SupportConversation;
  messages: SupportMessage[];
  feedback?: KnowledgeFeedback[];
};

export type LearningDecision = {
  signals: LearningSignal[];

  shouldCreateKnowledge: boolean;
  shouldUpdateKnowledge: boolean;
  shouldCreateProductInsight: boolean;
  requiresFounderReview: boolean;
};

export interface LearningEngine {
  evaluate(
    context: LearningContext,
  ): Promise<LearningDecision>;
}