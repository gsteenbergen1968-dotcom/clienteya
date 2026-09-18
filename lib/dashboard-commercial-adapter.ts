import {
  buildCommercialActions,
  type CommercialAction,
  type CommercialRelationship,
} from "./commercial-action-engine";

import {
  buildDashboardDecisionPresentation,
  type DashboardDecisionPresentation,
  type DecisionPresentationBusinessSettings,
} from "./decision-presentation-engine";

import type { RelationshipRecord } from "./relationship-repository";

export type DashboardCommercialBusinessSettings =
  DecisionPresentationBusinessSettings;

export type DashboardPriorityTone =
  | "red"
  | "amber"
  | "emerald"
  | "sky"
  | "slate";

export type DashboardTodayPriority =
  DashboardDecisionPresentation;

function normalizeText(
  value: string | null | undefined,
): string {
  return (value || "")
    .trim()
    .toLowerCase();
}

function getRelationshipName(
  relationship: RelationshipRecord,
): string {
  return (
    relationship.name?.trim() ||
    relationship.company?.trim() ||
    "Relación sin nombre"
  );
}

function getRelationshipAmount(
  relationship: RelationshipRecord,
): number {
  void relationship;
  return 0;
}

function getRelationshipPaid(
  relationship: RelationshipRecord,
): boolean {
  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("pag") ||
    status.includes("convert")
  );
}

function toCommercialRelationship(
  relationship: RelationshipRecord,
): CommercialRelationship {
  return {
    id:
      relationship.id,

    owner_id:
      relationship.owner_id,

    name:
      getRelationshipName(
        relationship,
      ),

    phone:
      relationship.phone,

    status:
      relationship.status,

    notes:
      relationship.notes,

    reminder:
      relationship.reminder,

    next_contact_at:
      relationship.next_contact_at,

    created_at:
      relationship.created_at,

    updated_at:
      relationship.updated_at,

    amount:
      getRelationshipAmount(
        relationship,
      ),

    paid:
      getRelationshipPaid(
        relationship,
      ),

    paid_at:
      null,

    memory:
      null,
  };
}

export function buildDashboardCommercialPriorities({
  relationships,
  businessType,
  businessSettings,
  companyName,
  limit = 3,
}: {
  relationships: RelationshipRecord[];
  businessType?: string | null;
  businessSettings?: DashboardCommercialBusinessSettings | null;
  companyName?: string | null;
  limit?: number;
}): DashboardTodayPriority[] {
  const commercialRelationships =
    relationships.map(
      toCommercialRelationship,
    );

  const actions:
    CommercialAction[] =
      buildCommercialActions({
        relationships:
          commercialRelationships,
      });

  return buildDashboardDecisionPresentation({
    actions,
    businessType,
    businessSettings,
    companyName,
    limit,
  });
}

export function getDashboardCommercialRevenuePotential(
  priorities: DashboardTodayPriority[],
): number {
  return priorities.reduce(
    (
      sum,
      priority,
    ) =>
      sum +
      Number(
        priority.amount ||
          0,
      ),
    0,
  );
}

export function getDashboardCommercialActionSummary(
  priorities: DashboardTodayPriority[],
): string {
  const critical =
    priorities.filter(
      (item) =>
        item.tone ===
        "red",
    ).length;

  const high =
    priorities.filter(
      (item) =>
        item.tone ===
        "amber",
    ).length;

  const medium =
    priorities.filter(
      (item) =>
        item.tone ===
        "sky",
    ).length;

  if (
    priorities.length ===
    0
  ) {
    return "Todo está bajo control.";
  }

  if (
    critical > 0
  ) {
    return `${critical} acción(es) críticas para hoy.`;
  }

  if (
    high > 0
  ) {
    return `${high} acción(es) de alta prioridad para hoy.`;
  }

  if (
    medium > 0
  ) {
    return `${medium} acción(es) recomendadas para hoy.`;
  }

  return `${priorities.length} acción(es) comerciales para revisar.`;
}

export function formatDashboardCommercialGs(
  value: number | null | undefined,
): string {
  return `Gs.\u00A0${Number(
    value || 0,
  ).toLocaleString(
    "es-PY",
  )}`;
}