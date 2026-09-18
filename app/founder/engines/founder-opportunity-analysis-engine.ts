import type {
  FounderDecisionPriority,
  FounderInsight,
} from "../models";

export type FounderOpportunityAnalysis = {
  insightId: string;
  domain: FounderInsight["domain"];
  title: string;
  summary: string;
  priority: FounderDecisionPriority;
} | null;

const opportunityPriorityOrder: Record<FounderDecisionPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function analyzeFounderOpportunity(
  insights: FounderInsight[]
): FounderOpportunityAnalysis {
  const opportunityInsights = insights
    .filter((insight) => insight.decision !== undefined)
    .sort((firstInsight, secondInsight) => {
      const firstPriority = firstInsight.decision?.priority ?? "low";
      const secondPriority = secondInsight.decision?.priority ?? "low";

      return (
        opportunityPriorityOrder[secondPriority] -
        opportunityPriorityOrder[firstPriority]
      );
    });

  const topOpportunityInsight = opportunityInsights[0];
  const decision = topOpportunityInsight?.decision;

  if (!topOpportunityInsight || !decision) {
    return null;
  }

  return {
    insightId: topOpportunityInsight.id,
    domain: topOpportunityInsight.domain,
    title: decision.title,
    summary: decision.reason,
    priority: decision.priority,
  };
}