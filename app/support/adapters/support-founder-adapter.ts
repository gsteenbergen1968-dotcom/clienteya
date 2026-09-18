import type {
  LearningSignal,
  SupportEscalation,
  SupportRequest,
} from "../models";

import type { SupportListOptions } from "./support-adapter";

export interface SupportFounderAdapter {
  getFounderRequests(
    options?: SupportListOptions,
  ): Promise<SupportRequest[]>;

  getFounderLearningSignals(
    options?: SupportListOptions,
  ): Promise<LearningSignal[]>;

  getFounderEscalations(
    options?: SupportListOptions,
  ): Promise<SupportEscalation[]>;
}