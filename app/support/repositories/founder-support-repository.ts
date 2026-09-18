import type {
  SupportConversation,
  SupportEscalation,
  SupportRequest,
  LearningSignal,
} from "../models";

export type FounderSupportRepositorySnapshot = {
  requests: SupportRequest[];
  conversations: SupportConversation[];
  escalations: SupportEscalation[];
  learningSignals: LearningSignal[];
};

export interface FounderSupportRepository {
  getSnapshot(): Promise<FounderSupportRepositorySnapshot>;
}

export function createFounderSupportRepository(): FounderSupportRepository {
  return {
    async getSnapshot(): Promise<FounderSupportRepositorySnapshot> {
      return {
        requests: [],
        conversations: [],
        escalations: [],
        learningSignals: [],
      };
    },
  };
}