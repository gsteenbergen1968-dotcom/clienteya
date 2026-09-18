import type {
  FounderAction,
  FounderActionEffort,
  FounderActionQueue,
  FounderActionStatus,
  FounderDecision,
  FounderDecisionPriority,
  FounderInsight,
} from "../models";

import { canCreateFounderAction } from "../models";
import { prioritizeFounderActions } from "./founder-prioritization-engine";

const priorityScore: Record<FounderDecisionPriority, number> = {
  critical: 50,
  high: 40,
  medium: 30,
  low: 20,
};

const statusScore: Record<FounderActionStatus, number> = {
  "in-progress": 30,
  accepted: 20,
  proposed: 10,
  completed: 0,
  dismissed: 0,
};

const effortScore: Record<FounderActionEffort, number> = {
  small: 20,
  medium: 10,
  large: 5,
};

function calculateFounderActionScore(
  priority: FounderDecisionPriority,
  status: FounderActionStatus,
  effort: FounderActionEffort
): number {
  return Math.min(
    100,
    priorityScore[priority] +
      statusScore[status] +
      effortScore[effort]
  );
}

function mapDecisionToAction(
  decision: FounderDecision,
  insight: FounderInsight
): FounderAction {
  const now = new Date().toISOString();

  const status: FounderActionStatus =
    decision.status === "in-progress"
      ? "in-progress"
      : "accepted";

  const effort: FounderActionEffort = "medium";

  return {
    id: `action-${decision.id}`,
    decisionId: decision.id,
    domain: insight.domain,
    title: decision.title,
    description: decision.reason,
    type: "implement",
    priority: decision.priority,
    status,
    owner: "founder",
    effort,
    score: calculateFounderActionScore(
      decision.priority,
      status,
      effort
    ),
    outcome: {
      expectedResult:
        decision.impact.expectedOutcome ?? "Decision implemented",
      measurableBy:
        decision.impact.measurableBy ?? null,
      successCriteria: null,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function buildFounderActionQueue(
  insights: FounderInsight[]
): FounderActionQueue {
  const actions: FounderAction[] = [];

  for (const insight of insights) {
    const decision = insight.decision;

    if (!decision) {
      continue;
    }

    if (!canCreateFounderAction(decision.status)) {
      continue;
    }

    actions.push(
      mapDecisionToAction(decision, insight)
    );
  }

  return prioritizeFounderActions({
    generatedAt: new Date().toISOString(),
    actions,
    primaryActionId: actions[0]?.id ?? null,
  });
}