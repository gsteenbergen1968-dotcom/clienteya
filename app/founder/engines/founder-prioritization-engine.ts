import type {
  FounderAction,
  FounderActionQueue,
  FounderActionStatus,
  FounderDecisionPriority,
} from "../models";

const priorityWeight: Record<FounderDecisionPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const statusWeight: Record<FounderActionStatus, number> = {
  "in-progress": 5,
  accepted: 4,
  proposed: 3,
  completed: 2,
  dismissed: 1,
};

function compareFounderActions(
  left: FounderAction,
  right: FounderAction
): number {
  const priorityDifference =
    priorityWeight[right.priority] - priorityWeight[left.priority];

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const statusDifference =
    statusWeight[right.status] - statusWeight[left.status];

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return (
    new Date(right.createdAt).getTime() -
    new Date(left.createdAt).getTime()
  );
}

export function prioritizeFounderActions(
  queue: FounderActionQueue
): FounderActionQueue {
  const actions = [...queue.actions].sort(compareFounderActions);

  return {
    generatedAt: queue.generatedAt,
    actions,
    primaryActionId: actions[0]?.id ?? null,
  };
}