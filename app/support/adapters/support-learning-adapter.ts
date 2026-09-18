import type {
  LearningSignal,
  SupportConversationId,
} from "../models";

import type { SupportListOptions } from "./support-adapter";

export interface SupportLearningAdapter {
  getLearningSignals(
    options?: SupportListOptions,
  ): Promise<LearningSignal[]>;

  getLearningSignalById(
    id: string,
  ): Promise<LearningSignal | null>;

  getLearningSignalsByConversationId(
    conversationId: SupportConversationId,
  ): Promise<LearningSignal[]>;

  saveLearningSignal(
    signal: LearningSignal,
  ): Promise<LearningSignal>;

  updateLearningSignal(
    signal: LearningSignal,
  ): Promise<LearningSignal>;
}