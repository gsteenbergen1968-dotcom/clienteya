import type {
  SupportEscalation,
  SupportPriority,
  SupportRequest,
  SupportTeamId,
  SupportUserId,
} from "../models";

export type EscalationContext = {
  request: SupportRequest;

  confidence?: number;

  hasKnowledgeMatch: boolean;
  automaticAnswerAvailable: boolean;

  negativeFeedback: boolean;
  securityRelevant: boolean;
  billingRelevant: boolean;
};

export type EscalationDecision = {
  shouldEscalate: boolean;

  reason?: SupportEscalation["reason"];
  priority: SupportPriority;

  assignedUserId?: SupportUserId;
  assignedTeamId?: SupportTeamId;

  requiresFounderReview: boolean;
};

export interface EscalationEngine {
  evaluate(
    context: EscalationContext,
  ): Promise<EscalationDecision>;
}