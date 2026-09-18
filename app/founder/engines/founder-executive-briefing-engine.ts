import type {
  FounderAction,
  FounderActionQueue,
  FounderInsight,
} from "../models";

import { analyzeFounderOpportunity } from "./founder-opportunity-analysis-engine";
import { analyzeFounderRisk } from "./founder-risk-analysis-engine";

export type FounderExecutiveBriefing = {
  generatedAt: string;
  title: string;
  summary: string;
  focus: string | null;
  topRisk: string | null;
  topOpportunity: string | null;
  nextAction: string | null;
  primaryAction: FounderAction | null;
  supportingInsights: FounderInsight[];
};

export function buildFounderExecutiveBriefing(
  actionQueue: FounderActionQueue,
  insights: FounderInsight[]
): FounderExecutiveBriefing {
  const primaryAction =
    actionQueue.actions.find(
      (action) => action.id === actionQueue.primaryActionId
    ) ??
    actionQueue.actions[0] ??
    null;

  const risk = analyzeFounderRisk(insights);
  const opportunity = analyzeFounderOpportunity(insights);

  if (!primaryAction) {
    return {
      generatedAt: new Date().toISOString(),
      title: "No executive actions",
      summary:
        "The system currently has no prioritized founder actions.",
      focus: risk?.domain ?? opportunity?.domain ?? null,
      topRisk: risk?.summary ?? null,
      topOpportunity: opportunity?.summary ?? null,
      nextAction: null,
      primaryAction: null,
      supportingInsights: [],
    };
  }

  const supportingInsights = insights.filter(
    (insight) => insight.domain === primaryAction.domain
  );

  return {
    generatedAt: new Date().toISOString(),
    title: primaryAction.title,
    summary: primaryAction.description,
    focus:
      risk?.domain ??
      opportunity?.domain ??
      primaryAction.domain,
    topRisk: risk?.summary ?? null,
    topOpportunity: opportunity?.summary ?? null,
    nextAction: primaryAction.title,
    primaryAction,
    supportingInsights,
  };
}