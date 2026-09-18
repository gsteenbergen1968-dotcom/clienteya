import type {
  LearningSignal,
  SupportEscalation,
  SupportRequest,
} from "../models";

export type FounderInsight = {
  title: string;
  description: string;

  impact: "low" | "medium" | "high" | "critical";

  occurrenceCount: number;
  affectedUserCount: number;

  requiresProductChange: boolean;
  requiresKnowledgeUpdate: boolean;
};

export type FounderInsightContext = {
  requests: SupportRequest[];
  learningSignals: LearningSignal[];
  escalations: SupportEscalation[];
};

export type FounderInsightResult = {
  insights: FounderInsight[];

  recommendedActions: string[];

  generatedAt: string;
};

export interface FounderInsightEngine {
  evaluate(
    context: FounderInsightContext,
  ): Promise<FounderInsightResult>;
}