import type { SupportPriority } from "../models";

import type {
  PriorityContext,
  PriorityDecision,
  PriorityEngine,
} from "./priority-engine";

export type BuildPriorityEngineOptions = {
  highPriorityThreshold?: number;
  urgentPriorityThreshold?: number;
};

export function buildPriorityEngine(
  options: BuildPriorityEngineOptions = {},
): PriorityEngine {
  const highPriorityThreshold =
    options.highPriorityThreshold ?? 50;

  const urgentPriorityThreshold =
    options.urgentPriorityThreshold ?? 80;

  return {
    async evaluate(
      context: PriorityContext,
    ): Promise<PriorityDecision> {
      let score = 0;
      const reasons: string[] = [];

      if (context.securityRelevant) {
        score += 50;
        reasons.push("Security related");
      }

      if (context.billingRelevant) {
        score += 30;
        reasons.push("Billing related");
      }

      if (context.productBlocked) {
        score += 25;
        reasons.push("Customer blocked");
      }

      if (context.repeatedIssue) {
        score += 15;
        reasons.push("Repeated issue");
      }

      if (
        context.affectedUserCount !== undefined
      ) {
        if (context.affectedUserCount >= 100) {
          score += 30;
          reasons.push("Large customer impact");
        } else if (
          context.affectedUserCount >= 10
        ) {
          score += 15;
          reasons.push("Multiple users affected");
        }
      }

      if (
        context.occurrenceCount !== undefined
      ) {
        if (context.occurrenceCount >= 20) {
          score += 20;
          reasons.push("Frequently reported");
        } else if (
          context.occurrenceCount >= 5
        ) {
          score += 10;
          reasons.push("Recurring issue");
        }
      }

      let priority: SupportPriority = "normal";

      if (score >= urgentPriorityThreshold) {
        priority = "urgent";
      } else if (
        score >= highPriorityThreshold
      ) {
        priority = "high";
      }

      return {
        priority,
        score,
        reasons,
        requiresImmediateAttention:
          priority === "urgent",
      };
    },
  };
}