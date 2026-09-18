import type {
  FounderDecisionPriority,
  FounderInsight,
} from "../models";

export type FounderRiskAnalysis = {
  insightId: string;
  domain: FounderInsight["domain"];
  title: string;
  summary: string;
  priority: FounderDecisionPriority;
} | null;

const riskPriorityOrder: Record<FounderDecisionPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function analyzeFounderRisk(
  insights: FounderInsight[]
): FounderRiskAnalysis {
  const riskInsights = insights
    .filter((insight) => insight.decision !== undefined)
    .sort((firstInsight, secondInsight) => {
      const firstPriority = firstInsight.decision?.priority ?? "low";
      const secondPriority = secondInsight.decision?.priority ?? "low";

      return (
        riskPriorityOrder[secondPriority] -
        riskPriorityOrder[firstPriority]
      );
    });

  const topRiskInsight = riskInsights[0];
  const decision = topRiskInsight?.decision;

  if (!topRiskInsight || !decision) {
    return null;
  }

  return {
    insightId: topRiskInsight.id,
    domain: topRiskInsight.domain,
    title: decision.title,
    summary: decision.reason,
    priority: decision.priority,
  };
}