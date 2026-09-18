import type {
  SupportPriority,
  SupportRequest,
} from "../models";

export type PriorityContext = {
  request: SupportRequest;

  securityRelevant: boolean;
  billingRelevant: boolean;
  productBlocked: boolean;
  repeatedIssue: boolean;

  affectedUserCount?: number;
  occurrenceCount?: number;

  customerWaitingSince?: string;
};

export type PriorityDecision = {
  priority: SupportPriority;

  score: number;
  reasons: string[];

  requiresImmediateAttention: boolean;
};

export interface PriorityEngine {
  evaluate(
    context: PriorityContext,
  ): Promise<PriorityDecision>;
}