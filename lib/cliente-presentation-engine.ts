import {
  buildCommercialActions,
  type CommercialAction,
  type CommercialRelationship,
  type CommercialActionPriority,
  type CommercialActionBucket,
  type CommercialActionTone,
} from "./commercial-action-engine";

import {
  buildDecisionPresentation,
  type DecisionPresentationItem,
} from "./decision-presentation-engine";

export type RelationshipPresentationRelationship = {
  id: string;
  owner_id?: string | null;
  name: string;
  phone?: string | null;
  status?: string | null;
  notes?: string | null;
  reminder?: string | null;
  next_contact_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  amount?: number | string | null;
  paid?: boolean | null;
  paid_at?: string | null;
  memory?: string | null;
};

export type RelationshipDecisionPresentation = {
  relationship: RelationshipPresentationRelationship;

  relationshipId: string;
  nombre: string;
  telefono: string;
  estado: string;

  title: string;
  summary: string;
  recommendation: string;

  priority: CommercialActionPriority;
  bucket: CommercialActionBucket;
  tone: CommercialActionTone;

  actionLabel: string;
  actionType: CommercialAction["actionType"];
  whatsappKey: CommercialAction["whatsappKey"];

  commercialScore: number;
  urgencyScore: number;
  memoryScore: number;
  relationshipScore: number;

  monto: number;
  pagado: boolean;
  proximoContacto: string | null;
  daysUntilContact: number | null;
  daysSinceCreated: number;
};

export type BuildRelationshipDecisionPresentationInput = {
  relationships: RelationshipPresentationRelationship[];
  relationshipId: string;
  today?: string;
};

function normalizeText(
  value: string | null | undefined,
): string {
  return (value || "")
    .toLowerCase()
    .trim();
}

function normalizeAmount(
  value: number | string | null | undefined,
): number {
  const amount = Number(value ?? 0);

  return Number.isFinite(amount)
    ? amount
    : 0;
}

function getRelationshipScore(
  action: CommercialAction,
): number {
  let score = 40;

  score += Math.round(
    action.memoryScore * 0.35,
  );

  if (action.phone) {
    score += 10;
  }

  if (action.reminder) {
    score += 10;
  }

  if (action.notes) {
    score += 10;
  }

  if (action.nextContactAt) {
    score += 10;
  }

  if (
    normalizeText(
      action.status,
    ).includes("pag")
  ) {
    score += 10;
  }

  if (
    normalizeText(
      action.status,
    ).includes("cerr")
  ) {
    score -= 20;
  }

  return Math.max(
    0,
    Math.min(
      100,
      score,
    ),
  );
}

function toRelationshipPresentationRelationship(
  action: CommercialAction,
): RelationshipPresentationRelationship {
  return {
    id:
      action.id,

    owner_id:
      action.ownerId,

    name:
      action.name,

    phone:
      action.phone,

    status:
      action.status,

    notes:
      action.notes,

    reminder:
      action.reminder,

    next_contact_at:
      action.nextContactAt,

    updated_at:
      action.updatedAt,

    created_at:
      action.createdAt,

    amount:
      action.amount,

    paid:
      action.paid,

    paid_at:
      action.paidAt,

    memory:
      action.memory,
  };
}

function toCommercialRelationship(
  relationship: RelationshipPresentationRelationship,
): CommercialRelationship {
  return {
    id:
      relationship.id,

    owner_id:
      relationship.owner_id ||
      null,

    name:
      relationship.name,

    phone:
      relationship.phone ||
      null,

    status:
      relationship.status ||
      null,

    notes:
      relationship.notes ||
      null,

    created_at:
      relationship.created_at ||
      null,

    reminder:
      relationship.reminder ||
      null,

    next_contact_at:
      relationship.next_contact_at ||
      null,

    updated_at:
      relationship.updated_at ||
      null,

    amount:
      normalizeAmount(
        relationship.amount,
      ),

    paid:
      relationship.paid === true,

    paid_at:
      relationship.paid_at ||
      null,

    memory:
      relationship.memory ||
      null,
  } as CommercialRelationship;
}

function findDecisionPresentation(
  action: CommercialAction,
  presentations: DecisionPresentationItem[],
) {
  return presentations.find(
    (
      presentation,
    ) =>
      presentation.relationshipId ===
      action.relationshipId,
  );
}

function toRelationshipDecisionPresentation({
  action,
  presentation,
}: {
  action: CommercialAction;
  presentation: DecisionPresentationItem;
}): RelationshipDecisionPresentation {
  return {
    relationship:
      toRelationshipPresentationRelationship(
        action,
      ),

    relationshipId:
      action.relationshipId,

    nombre:
      action.name,

    telefono:
      action.phone,

    estado:
      action.status,

    title:
      presentation.title,

    summary:
      presentation.summary,

    recommendation:
      presentation.recommendation,

    priority:
      presentation.priority,

    bucket:
      presentation.bucket,

    tone:
      action.tone,

    actionLabel:
      action.actionLabel,

    actionType:
      action.actionType,

    whatsappKey:
      action.whatsappKey,

    commercialScore:
      presentation.commercialScore,

    urgencyScore:
      presentation.urgencyScore,

    memoryScore:
      presentation.memoryScore,

    relationshipScore:
      getRelationshipScore(
        action,
      ),

    monto:
      action.amount,

    pagado:
      action.paid,

    proximoContacto:
      action.nextContactAt,

    daysUntilContact:
      action.daysUntilContact,

    daysSinceCreated:
      action.daysSinceCreated,
  };
}

export function buildRelationshipDecisionPresentation({
  relationships,
  relationshipId,
  today,
}: BuildRelationshipDecisionPresentationInput): RelationshipDecisionPresentation | null {
  const safeRelationships =
    Array.isArray(
      relationships,
    )
      ? relationships
      : [];

  const actions =
    buildCommercialActions({
      relationships:
        safeRelationships.map(
          toCommercialRelationship,
        ),
      today,
    });

  const action =
    actions.find(
      (
        item,
      ) =>
        item.relationshipId ===
        relationshipId,
    );

  if (!action) {
    return null;
  }

  const presentationResult =
    buildDecisionPresentation({
      actions,
    });

  const presentation =
    findDecisionPresentation(
      action,
      presentationResult.relationships,
    );

  if (!presentation) {
    return null;
  }

  return toRelationshipDecisionPresentation({
    action,
    presentation,
  });
}

export function buildRelationshipDecisionPresentations({
  relationships,
  today,
}: {
  relationships: RelationshipPresentationRelationship[];
  today?: string;
}): RelationshipDecisionPresentation[] {
  const safeRelationships =
    Array.isArray(
      relationships,
    )
      ? relationships
      : [];

  const actions =
    buildCommercialActions({
      relationships:
        safeRelationships.map(
          toCommercialRelationship,
        ),
      today,
    });

  const presentationResult =
    buildDecisionPresentation({
      actions,
    });

  return actions
    .map(
      (
        action,
      ) => {
        const presentation =
          findDecisionPresentation(
            action,
            presentationResult.relationships,
          );

        if (!presentation) {
          return null;
        }

        return toRelationshipDecisionPresentation({
          action,
          presentation,
        });
      },
    )
    .filter(
      (
        presentation,
      ): presentation is RelationshipDecisionPresentation =>
        Boolean(
          presentation,
        ),
    );
}