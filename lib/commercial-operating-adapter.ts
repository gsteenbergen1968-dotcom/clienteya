import {
  buildCommercialOperatingSystem,
  type CommercialOperatingRelationship,
  type CommercialOperatingResult,
  type CommercialOperatingUrgency,
  type CommercialOperatingPriority,
} from "./commercial-operating-system";

export type CommercialAdapterPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export type CommercialAutomationReminder = {
  relationship: CommercialOperatingRelationship;
  priority: CommercialAdapterPriority;
  score: number;
  title: string;
  description: string;
  reason: string;
  nextActionLabel: string;
  nextDate: string | null;
  urgency: CommercialOperatingUrgency;
  operatingPriority: CommercialOperatingPriority;
  memoryScore: number;
  relationshipScore: number;
  commercialScore: number;
  daysUntilNextContact: number | null;
};

export type CommercialDashboardAction = {
  relationship: CommercialOperatingRelationship;
  priority: CommercialAdapterPriority;
  score: number;
  title: string;
  reason: string;
  nextActionLabel: string;
  nextDate: string | null;
  urgency: CommercialOperatingUrgency;
  memoryScore: number;
  relationshipScore: number;
  commercialScore: number;
};

export type CommercialCalendarAction = {
  relationship: CommercialOperatingRelationship;
  priority: CommercialAdapterPriority;
  score: number;
  title: string;
  reason: string;
  nextActionLabel: string;
  nextDate: string | null;
  daysUntilNextContact: number | null;
  urgency: CommercialOperatingUrgency;
  memoryScore: number;
  relationshipScore: number;
  commercialScore: number;
};

export type CommercialCockpitSignal = {
  relationship: CommercialOperatingRelationship;
  priority: CommercialAdapterPriority;
  score: number;
  title: string;
  reason: string;
  nextActionLabel: string;
  nextDate: string | null;
  urgency: CommercialOperatingUrgency;
  operatingPriority: CommercialOperatingPriority;
  memoryScore: number;
  relationshipScore: number;
  commercialScore: number;
};

function clamp(
  value: number,
  min = 0,
  max = 100,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

export function getCommercialAdapterPriority(
  result: CommercialOperatingResult,
): CommercialAdapterPriority {
  if (result.urgency === "critical") {
    return "urgent";
  }

  if (result.urgency === "high") {
    return "high";
  }

  if (result.urgency === "medium") {
    return "medium";
  }

  return "low";
}

export function getCommercialAdapterPriorityLabel(
  priority: CommercialAdapterPriority,
) {
  if (priority === "urgent") {
    return "Urgente";
  }

  if (priority === "high") {
    return "Alta";
  }

  if (priority === "medium") {
    return "Media";
  }

  return "Normal";
}

export function getCommercialAdapterPriorityClasses(
  priority: CommercialAdapterPriority,
) {
  if (priority === "urgent") {
    return "border-red-200 bg-red-50";
  }

  if (priority === "high") {
    return "border-amber-200 bg-amber-50";
  }

  if (priority === "medium") {
    return "border-sky-200 bg-sky-50";
  }

  return "border-slate-200 bg-white";
}

export function getCommercialAdapterBadgeClasses(
  priority: CommercialAdapterPriority,
) {
  if (priority === "urgent") {
    return "border border-red-200 bg-red-100 text-red-700";
  }

  if (priority === "high") {
    return "border border-amber-200 bg-amber-100 text-amber-700";
  }

  if (priority === "medium") {
    return "border border-sky-200 bg-sky-100 text-sky-700";
  }

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

export function getCommercialUrgencyWeight(
  urgency: CommercialOperatingUrgency,
) {
  if (urgency === "critical") {
    return 5;
  }

  if (urgency === "high") {
    return 4;
  }

  if (urgency === "medium") {
    return 3;
  }

  if (urgency === "low") {
    return 2;
  }

  return 1;
}

export function getCommercialPriorityWeight(
  priority: CommercialOperatingPriority,
) {
  if (priority === "today") {
    return 5;
  }

  if (priority === "tomorrow") {
    return 4;
  }

  if (priority === "upcoming") {
    return 3;
  }

  if (priority === "watch") {
    return 2;
  }

  return 1;
}

export function getCommercialAdapterScore(
  result: CommercialOperatingResult,
) {
  const urgencyScore =
    getCommercialUrgencyWeight(
      result.urgency,
    ) * 12;

  const priorityScore =
    getCommercialPriorityWeight(
      result.priority,
    ) * 10;

  const blendedScore =
    urgencyScore +
    priorityScore +
    result.commercialScore * 0.45 +
    result.relationshipScore * 0.2 +
    result.memoryScore * 0.15;

  return clamp(
    Math.round(blendedScore),
  );
}

function buildTitle(
  result: CommercialOperatingResult,
) {
  const relationshipName =
    result.relationship.nombre ||
    "Relación";

  if (
    result.priority === "today"
  ) {
    return `${result.nextActionLabel}: ${relationshipName}`;
  }

  if (
    result.priority === "tomorrow"
  ) {
    return `Preparar mañana: ${relationshipName}`;
  }

  if (
    result.priority === "upcoming"
  ) {
    return `Próximo seguimiento: ${relationshipName}`;
  }

  if (
    result.priority === "closed"
  ) {
    return `Cerrado: ${relationshipName}`;
  }

  return `Monitorear: ${relationshipName}`;
}

function toAutomationReminder(
  result: CommercialOperatingResult,
): CommercialAutomationReminder {
  const priority =
    getCommercialAdapterPriority(
      result,
    );

  return {
    relationship:
      result.relationship,

    priority,

    score:
      getCommercialAdapterScore(
        result,
      ),

    title:
      buildTitle(
        result,
      ),

    description:
      result.reason,

    reason:
      result.reason,

    nextActionLabel:
      result.nextActionLabel,

    nextDate:
      result.nextDate,

    urgency:
      result.urgency,

    operatingPriority:
      result.priority,

    memoryScore:
      result.memoryScore,

    relationshipScore:
      result.relationshipScore,

    commercialScore:
      result.commercialScore,

    daysUntilNextContact:
      result.daysUntilNextContact,
  };
}

function toDashboardAction(
  result: CommercialOperatingResult,
): CommercialDashboardAction {
  const priority =
    getCommercialAdapterPriority(
      result,
    );

  return {
    relationship:
      result.relationship,

    priority,

    score:
      getCommercialAdapterScore(
        result,
      ),

    title:
      buildTitle(
        result,
      ),

    reason:
      result.reason,

    nextActionLabel:
      result.nextActionLabel,

    nextDate:
      result.nextDate,

    urgency:
      result.urgency,

    memoryScore:
      result.memoryScore,

    relationshipScore:
      result.relationshipScore,

    commercialScore:
      result.commercialScore,
  };
}

function toCalendarAction(
  result: CommercialOperatingResult,
): CommercialCalendarAction {
  const priority =
    getCommercialAdapterPriority(
      result,
    );

  return {
    relationship:
      result.relationship,

    priority,

    score:
      getCommercialAdapterScore(
        result,
      ),

    title:
      buildTitle(
        result,
      ),

    reason:
      result.reason,

    nextActionLabel:
      result.nextActionLabel,

    nextDate:
      result.nextDate,

    daysUntilNextContact:
      result.daysUntilNextContact,

    urgency:
      result.urgency,

    memoryScore:
      result.memoryScore,

    relationshipScore:
      result.relationshipScore,

    commercialScore:
      result.commercialScore,
  };
}

function toCockpitSignal(
  result: CommercialOperatingResult,
): CommercialCockpitSignal {
  const priority =
    getCommercialAdapterPriority(
      result,
    );

  return {
    relationship:
      result.relationship,

    priority,

    score:
      getCommercialAdapterScore(
        result,
      ),

    title:
      buildTitle(
        result,
      ),

    reason:
      result.reason,

    nextActionLabel:
      result.nextActionLabel,

    nextDate:
      result.nextDate,

    urgency:
      result.urgency,

    operatingPriority:
      result.priority,

    memoryScore:
      result.memoryScore,

    relationshipScore:
      result.relationshipScore,

    commercialScore:
      result.commercialScore,
  };
}

export function buildCommercialAutomationQueue(
  relationships: CommercialOperatingRelationship[],
) {
  return buildCommercialOperatingSystem(
    relationships,
  )
    .filter(
      (result) =>
        result.shouldAppearInAutomations,
    )
    .map(
      toAutomationReminder,
    );
}

export function buildCommercialDashboardActions(
  relationships: CommercialOperatingRelationship[],
) {
  return buildCommercialOperatingSystem(
    relationships,
  )
    .filter(
      (result) =>
        result.shouldAppearToday,
    )
    .map(
      toDashboardAction,
    );
}

export function buildCommercialCalendarActions(
  relationships: CommercialOperatingRelationship[],
) {
  return buildCommercialOperatingSystem(
    relationships,
  )
    .filter(
      (result) =>
        result.shouldAppearInCalendar,
    )
    .map(
      toCalendarAction,
    );
}

export function buildCommercialCockpitSignals(
  relationships: CommercialOperatingRelationship[],
) {
  return buildCommercialOperatingSystem(
    relationships,
  )
    .filter(
      (result) =>
        result.shouldAppearInCockpit,
    )
    .map(
      toCockpitSignal,
    );
}

export function buildCommercialOperatingOverview(
  relationships: CommercialOperatingRelationship[],
) {
  const operatingResults =
    buildCommercialOperatingSystem(
      relationships,
    );

  const automationQueue =
    operatingResults
      .filter(
        (result) =>
          result.shouldAppearInAutomations,
      )
      .map(
        toAutomationReminder,
      );

  const dashboardActions =
    operatingResults
      .filter(
        (result) =>
          result.shouldAppearToday,
      )
      .map(
        toDashboardAction,
      );

  const calendarActions =
    operatingResults
      .filter(
        (result) =>
          result.shouldAppearInCalendar,
      )
      .map(
        toCalendarAction,
      );

  const cockpitSignals =
    operatingResults
      .filter(
        (result) =>
          result.shouldAppearInCockpit,
      )
      .map(
        toCockpitSignal,
      );

  return {
    operatingResults,
    automationQueue,
    dashboardActions,
    calendarActions,
    cockpitSignals,

    counts: {
      total:
        operatingResults.length,

      today:
        dashboardActions.length,

      calendar:
        calendarActions.length,

      automations:
        automationQueue.length,

      cockpit:
        cockpitSignals.length,

      urgent:
        automationQueue.filter(
          (item) =>
            item.priority === "urgent",
        ).length,

      high:
        automationQueue.filter(
          (item) =>
            item.priority === "high",
        ).length,

      medium:
        automationQueue.filter(
          (item) =>
            item.priority === "medium",
        ).length,

      low:
        automationQueue.filter(
          (item) =>
            item.priority === "low",
        ).length,
    },
  };
}