import type {
  LearningSignal,
  SupportEscalation,
} from "../models";

import type {
  FounderInsight,
  FounderInsightContext,
  FounderInsightEngine,
  FounderInsightResult,
} from "./founder-insight-engine";

export type BuildFounderInsightEngineOptions = {
  minimumOccurrenceCount?: number;
  minimumAffectedUserCount?: number;
};

function determineImpact(
  occurrenceCount: number,
  affectedUserCount: number,
  requiresFounderReview: boolean,
): FounderInsight["impact"] {
  if (
    requiresFounderReview &&
    (occurrenceCount >= 10 ||
      affectedUserCount >= 10)
  ) {
    return "critical";
  }

  if (
    requiresFounderReview ||
    occurrenceCount >= 10 ||
    affectedUserCount >= 10
  ) {
    return "high";
  }

  if (
    occurrenceCount >= 5 ||
    affectedUserCount >= 5
  ) {
    return "medium";
  }

  return "low";
}

function buildLearningInsight(
  signal: LearningSignal,
): FounderInsight {
  const requiresProductChange =
    signal.type === "product_friction" ||
    signal.type === "product_improvement";

  const requiresKnowledgeUpdate =
    signal.type === "missing_knowledge" ||
    signal.type === "negative_feedback" ||
    signal.type === "low_confidence" ||
    signal.type === "new_question";

  return {
    title: signal.title,
    description: signal.description,

    impact: determineImpact(
      signal.occurrenceCount,
      signal.affectedUserCount,
      signal.requiresFounderReview,
    ),

    occurrenceCount: signal.occurrenceCount,
    affectedUserCount: signal.affectedUserCount,

    requiresProductChange,
    requiresKnowledgeUpdate,
  };
}

function buildEscalationInsight(
  escalation: SupportEscalation,
): FounderInsight {
  const requiresProductChange =
    escalation.reason === "technical_issue" ||
    escalation.reason === "product_friction" ||
    escalation.reason === "security_issue";

  const requiresKnowledgeUpdate =
    escalation.reason === "missing_knowledge" ||
    escalation.reason === "negative_feedback" ||
    escalation.reason === "low_confidence";

  const impact: FounderInsight["impact"] =
    escalation.priority === "urgent"
      ? "critical"
      : escalation.priority === "high"
        ? "high"
        : escalation.priority === "normal"
          ? "medium"
          : "low";

  return {
    title: escalation.title,
    description: escalation.description,

    impact,

    occurrenceCount: 1,
    affectedUserCount: 1,

    requiresProductChange,
    requiresKnowledgeUpdate,
  };
}

function buildRecommendedActions(
  insights: FounderInsight[],
): string[] {
  const actions: string[] = [];

  if (
    insights.some(
      (insight) =>
        insight.impact === "critical",
    )
  ) {
    actions.push(
      "Review critical support insights immediately.",
    );
  }

  if (
    insights.some(
      (insight) =>
        insight.requiresProductChange,
    )
  ) {
    actions.push(
      "Evaluate recurring product friction with the product team.",
    );
  }

  if (
    insights.some(
      (insight) =>
        insight.requiresKnowledgeUpdate,
    )
  ) {
    actions.push(
      "Create or update the affected support knowledge.",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "Continue monitoring support activity for emerging patterns.",
    );
  }

  return actions;
}

export function buildFounderInsightEngine(
  options: BuildFounderInsightEngineOptions = {},
): FounderInsightEngine {
  const minimumOccurrenceCount =
    options.minimumOccurrenceCount ?? 1;

  const minimumAffectedUserCount =
    options.minimumAffectedUserCount ?? 1;

  return {
    async evaluate(
      context: FounderInsightContext,
    ): Promise<FounderInsightResult> {
      const learningInsights =
        context.learningSignals
          .filter(
            (signal) =>
              signal.occurrenceCount >=
                minimumOccurrenceCount ||
              signal.affectedUserCount >=
                minimumAffectedUserCount ||
              signal.requiresFounderReview,
          )
          .map(buildLearningInsight);

      const escalationInsights =
        context.escalations
          .filter(
            (escalation) =>
              escalation.status !== "closed" ||
              escalation.requiresFounderReview,
          )
          .map(buildEscalationInsight);

      const insights = [
        ...learningInsights,
        ...escalationInsights,
      ].sort((left, right) => {
        const impactOrder: Record<
          FounderInsight["impact"],
          number
        > = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };

        return (
          impactOrder[right.impact] -
          impactOrder[left.impact]
        );
      });

      return {
        insights,
        recommendedActions:
          buildRecommendedActions(insights),
        generatedAt: new Date().toISOString(),
      };
    },
  };
}