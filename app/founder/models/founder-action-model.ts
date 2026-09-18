import type {
  FounderDecisionPriority,
  FounderDecisionStatus,
  FounderIntelligenceDomain,
} from "./founder-model";

export type FounderActionStatus =
  | "proposed"
  | "accepted"
  | "in-progress"
  | "completed"
  | "dismissed";

export type FounderActionType =
  | "review"
  | "investigate"
  | "decide"
  | "implement"
  | "verify"
  | "communicate"
  | "monitor";

export type FounderActionEffort =
  | "small"
  | "medium"
  | "large";

export type FounderActionOwner =
  | "founder"
  | "team"
  | "system";

export type FounderActionOutcome = {
  expectedResult: string;
  measurableBy?: string | null;
  successCriteria?: string | null;
};

export type FounderAction = {
  id: string;
  decisionId: string;
  domain: FounderIntelligenceDomain;
  title: string;
  description: string;
  type: FounderActionType;
  priority: FounderDecisionPriority;
  status: FounderActionStatus;
  owner: FounderActionOwner;
  effort: FounderActionEffort;

  /**
   * Overall action score (0–100).
   * Used for prioritization, executive briefings and AI ranking.
   */
  score: number;

  outcome: FounderActionOutcome;
  createdAt: string;
  updatedAt: string;
  dueAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type FounderActionQueue = {
  generatedAt: string;
  actions: FounderAction[];
  primaryActionId?: string | null;
};

export function canCreateFounderAction(
  decisionStatus: FounderDecisionStatus
): boolean {
  return (
    decisionStatus === "accepted" ||
    decisionStatus === "in-progress"
  );
}

export function isFounderActionOpen(
  action: FounderAction
): boolean {
  return (
    action.status === "proposed" ||
    action.status === "accepted" ||
    action.status === "in-progress"
  );
}

export function getPrimaryFounderAction(
  queue: FounderActionQueue
): FounderAction | null {
  if (!queue.primaryActionId) {
    return queue.actions.find(isFounderActionOpen) ?? null;
  }

  return (
    queue.actions.find(
      (action) => action.id === queue.primaryActionId
    ) ?? null
  );
}