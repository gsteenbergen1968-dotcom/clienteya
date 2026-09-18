import type {
  SupportConversation,
  SupportEscalation,
  SupportRequest,
  LearningSignal,
} from "../models";

import type {
  FounderSupportRepositorySnapshot,
} from "../repositories/founder-support-repository";

export interface FounderSupportAdapter {
  getFounderSupportSnapshot(): Promise<FounderSupportRepositorySnapshot>;
}

export function createFounderSupportAdapter(): FounderSupportAdapter {
  return {
    async getFounderSupportSnapshot() {
      const snapshot: FounderSupportRepositorySnapshot = {
        requests: [] as SupportRequest[],
        conversations: [] as SupportConversation[],
        escalations: [] as SupportEscalation[],
        learningSignals: [] as LearningSignal[],
      };

      return snapshot;
    },
  };
}