import type {
  SupportEscalation,
  SupportPriority,
} from "../models";

import type {
  EscalationContext,
  EscalationDecision,
  EscalationEngine,
} from "./escalation-engine";

export type BuildEscalationEngineOptions = {
  lowConfidenceThreshold?: number;
  founderReviewThreshold?: number;
};

export function buildEscalationEngine(
  options: BuildEscalationEngineOptions = {},
): EscalationEngine {
  const lowConfidenceThreshold =
    options.lowConfidenceThreshold ?? 0.7;

  const founderReviewThreshold =
    options.founderReviewThreshold ?? 0.4;

  return {
    async evaluate(
      context: EscalationContext,
    ): Promise<EscalationDecision> {
      let shouldEscalate = false;

      let reason:
        | SupportEscalation["reason"]
        | undefined;

      let priority: SupportPriority = "normal";

      let requiresFounderReview = false;

      if (context.securityRelevant) {
        shouldEscalate = true;
        reason = "security_issue";
        priority = "urgent";
        requiresFounderReview = true;
      } else if (context.billingRelevant) {
        shouldEscalate = true;
        reason = "billing_issue";
        priority = "high";
      } else if (context.negativeFeedback) {
        shouldEscalate = true;
        reason = "negative_feedback";
        priority = "high";
      } else if (!context.hasKnowledgeMatch) {
        shouldEscalate = true;
        reason = "missing_knowledge";
        priority = "high";
      } else if (
        context.confidence !== undefined &&
        context.confidence <
          lowConfidenceThreshold
      ) {
        shouldEscalate = true;
        reason = "low_confidence";
        priority = "high";
      } else if (
        !context.automaticAnswerAvailable
      ) {
        shouldEscalate = true;
        reason = "customer_request";
        priority = "normal";
      }

      if (
        context.confidence !== undefined &&
        context.confidence <
          founderReviewThreshold
      ) {
        requiresFounderReview = true;

        if (!reason) {
          reason = "founder_review";
          shouldEscalate = true;
        }
      }

      return {
        shouldEscalate,
        reason,
        priority,
        assignedUserId: undefined,
        assignedTeamId: undefined,
        requiresFounderReview,
      };
    },
  };
}