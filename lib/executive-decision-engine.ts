import type {
  CommercialAction,
  CommercialActionBucket,
  CommercialActionPriority,
} from "./commercial-action-engine";

export type ExecutiveDecision = {
  relationshipId: string;

  priority: CommercialActionPriority;
  bucket: CommercialActionBucket;

  title: string;
  summary: string;
  recommendation: string;

  dashboard: boolean;
  calendar: boolean;
  automation: boolean;
  cockpit: boolean;
  relationship: boolean;

  commercialScore: number;
  urgencyScore: number;
  memoryScore: number;
};

export type ExecutiveDecisionResult = {
  decisions: ExecutiveDecision[];

  dashboard: ExecutiveDecision[];
  calendar: ExecutiveDecision[];
  automations: ExecutiveDecision[];
  cockpit: ExecutiveDecision[];
  relationships: ExecutiveDecision[];
};

function buildDecision(
  action: CommercialAction
): ExecutiveDecision {
  return {
    relationshipId: action.relationshipId,

    priority: action.priority,
    bucket: action.bucket,

    title: action.headline,
    summary: action.reason,
    recommendation: action.actionPhrase,

    dashboard:
      action.bucket === "today" ||
      action.bucket === "overdue",

    calendar:
      action.bucket !== "future",

    automation:
      action.priority === "critical" ||
      action.priority === "high",

    cockpit: true,

    relationship: true,

    commercialScore: action.commercialScore,
    urgencyScore: action.urgencyScore,
    memoryScore: action.memoryScore,
  };
}

export function buildExecutiveDecisionEngine(
  actions: CommercialAction[]
): ExecutiveDecisionResult {
  const decisions =
    actions.map(buildDecision);

  return {
    decisions,

    dashboard:
      decisions.filter(
        (decision) =>
          decision.dashboard
      ),

    calendar:
      decisions.filter(
        (decision) =>
          decision.calendar
      ),

    automations:
      decisions.filter(
        (decision) =>
          decision.automation
      ),

    cockpit:
      decisions.filter(
        (decision) =>
          decision.cockpit
      ),

    relationships:
      decisions.filter(
        (decision) =>
          decision.relationship
      ),
  };
}