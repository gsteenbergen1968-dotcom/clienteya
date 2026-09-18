import {
  buildCommercialActions,
  type CommercialRelationship,
} from "./commercial-action-engine";

import {
  buildCalendarDecisionPresentation,
  type CalendarDecisionPresentation,
} from "./decision-presentation-engine";

import type { RelationshipRecord } from "./relationship-repository";

export type CalendarCommercialTone =
  | "red"
  | "amber"
  | "emerald"
  | "violet"
  | "sky"
  | "slate";

export type CalendarCommercialBucketKey =
  | "atrasados"
  | "hoy"
  | "manana"
  | "pasadoManana"
  | "proximos14"
  | "sinFecha";

export type CalendarCommercialUrgency =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "none";

export type CalendarCommercialItem = {
  relationship: RelationshipRecord;
  id: string;
  nombre: string;
  telefono: string;
  estado: string;
  notas: string | null;
  recordatorio: string | null;
  proximo_contacto: string | null;
  monto: number | null;
  pagado: boolean;
  fecha_pago: string | null;
  tone: CalendarCommercialTone;
  actionType:
    | "contactado"
    | "listo"
    | "schedule";
  actionLabel: string;
  reason: string;
  nextActionLabel: string;
  score: number;
  urgency: CalendarCommercialUrgency;
  commercialScore: number;
  memoryScore: number;
  relationshipScore: number;
  daysUntilNextContact: number | null;
};

export type CalendarCommercialOverview = {
  atrasados: CalendarCommercialItem[];
  hoy: CalendarCommercialItem[];
  manana: CalendarCommercialItem[];
  pasadoManana: CalendarCommercialItem[];
  proximos14: CalendarCommercialItem[];
  sinFecha: CalendarCommercialItem[];
  all: CalendarCommercialItem[];
  counts: {
    atrasados: number;
    hoy: number;
    manana: number;
    pasadoManana: number;
    proximos14: number;
    sinFecha: number;
    total: number;
  };
};

function normalizeDate(
  value?: string | null,
): string | null {
  if (!value) {
    return null;
  }

  const clean = value.slice(
    0,
    10,
  );

  return /^\d{4}-\d{2}-\d{2}$/.test(
    clean,
  )
    ? clean
    : null;
}

function normalizeText(
  value?: string | null,
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

    created_at:
      relationship.created_at,

    reminder:
      relationship.reminder,

    next_contact_at:
      normalizeDate(
        relationship.next_contact_at,
      ),

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

function toCalendarItem(
  item: CalendarDecisionPresentation,
  relationship: RelationshipRecord,
): CalendarCommercialItem {
  return {
    relationship,

    id:
      item.id,

    nombre:
      getRelationshipName(
        relationship,
      ) ||
      item.name ||
      "Relación sin nombre",

    telefono:
      relationship.phone ||
      item.phone ||
      "",

    estado:
      relationship.status ||
      item.status ||
      "Sin estado",

    notas:
      relationship.notes ??
      item.notes ??
      null,

    recordatorio:
      relationship.reminder ??
      item.reminder ??
      null,

    proximo_contacto:
      relationship.next_contact_at ??
      item.nextContactAt ??
      null,

    monto:
      getRelationshipAmount(
        relationship,
      ) ||
      item.amount ||
      null,

    pagado:
      getRelationshipPaid(
        relationship,
      ) ||
      item.paid,

    fecha_pago:
      item.paidAt ??
      null,

    tone:
      item.tone,

    actionType:
      item.actionType,

    actionLabel:
      item.actionLabel,

    reason:
      item.summary,

    nextActionLabel:
      item.nextActionLabel,

    score:
      item.score,

    urgency:
      item.urgency,

    commercialScore:
      item.commercialScore,

    memoryScore:
      item.memoryScore,

    relationshipScore:
      item.relationshipScore,

    daysUntilNextContact:
      item.daysUntilNextContact,
  };
}

function sortCalendarItems(
  a: CalendarCommercialItem,
  b: CalendarCommercialItem,
): number {
  const dayA =
    a.daysUntilNextContact ??
    999;

  const dayB =
    b.daysUntilNextContact ??
    999;

  if (
    dayA !== dayB
  ) {
    return dayA - dayB;
  }

  return (
    b.score -
    a.score
  );
}

function sortUpcomingItems(
  a: CalendarCommercialItem,
  b: CalendarCommercialItem,
): number {
  const scoreDifference =
    b.score -
    a.score;

  if (
    scoreDifference !== 0
  ) {
    return scoreDifference;
  }

  return sortCalendarItems(
    a,
    b,
  );
}

export function buildCalendarCommercialOverview(
  relationships: RelationshipRecord[],
): CalendarCommercialOverview {
  const safeRelationships =
    Array.isArray(
      relationships,
    )
      ? relationships.filter(
          (relationship) =>
            relationship.id,
        )
      : [];

  const relationshipById =
    new Map(
      safeRelationships.map(
        (relationship) => [
          relationship.id,
          relationship,
        ],
      ),
    );

  const actions =
    buildCommercialActions({
      relationships:
        safeRelationships.map(
          toCommercialRelationship,
        ),
    });

  const presentations =
    buildCalendarDecisionPresentation({
      actions,
    });

  const items =
    presentations
      .map(
        (item) => {
          const relationship =
            relationshipById.get(
              item.id,
            );

          if (
            !relationship
          ) {
            return null;
          }

          return toCalendarItem(
            item,
            relationship,
          );
        },
      )
      .filter(
        (
          item,
        ): item is CalendarCommercialItem =>
          item !== null,
      );

  const atrasados =
    items
      .filter(
        (item) =>
          item.daysUntilNextContact !==
            null &&
          item.daysUntilNextContact <
            0,
      )
      .sort(
        sortCalendarItems,
      );

  const hoy =
    items
      .filter(
        (item) =>
          item.daysUntilNextContact ===
          0,
      )
      .sort(
        sortCalendarItems,
      );

  const manana =
    items
      .filter(
        (item) =>
          item.daysUntilNextContact ===
          1,
      )
      .sort(
        sortCalendarItems,
      );

  const pasadoManana =
    items
      .filter(
        (item) =>
          item.daysUntilNextContact ===
          2,
      )
      .sort(
        sortCalendarItems,
      );

  const proximos14 =
    items
      .filter(
        (item) =>
          item.daysUntilNextContact !==
            null &&
          item.daysUntilNextContact >
            2 &&
          item.daysUntilNextContact <=
            14,
      )
      .sort(
        sortUpcomingItems,
      );

  const sinFecha =
    items
      .filter(
        (item) =>
          item.daysUntilNextContact ===
          null,
      )
      .sort(
        (a, b) =>
          a.nombre.localeCompare(
            b.nombre,
          ),
      );

  const all = [
    ...atrasados,
    ...hoy,
    ...manana,
    ...pasadoManana,
    ...proximos14,
    ...sinFecha,
  ];

  return {
    atrasados,
    hoy,
    manana,
    pasadoManana,
    proximos14,
    sinFecha,
    all,

    counts: {
      atrasados:
        atrasados.length,

      hoy:
        hoy.length,

      manana:
        manana.length,

      pasadoManana:
        pasadoManana.length,

      proximos14:
        proximos14.length,

      sinFecha:
        sinFecha.length,

      total:
        all.length,
    },
  };
}

export function getCalendarCommercialWhatsAppKey(
  item: CalendarCommercialItem,
):
  | "nuevo"
  | "hoy"
  | "pendiente"
  | "proximo"
  | "postventa" {
  if (
    item.pagado
  ) {
    return "postventa";
  }

  if (
    item.daysUntilNextContact !==
      null &&
    item.daysUntilNextContact <
      0
  ) {
    return "pendiente";
  }

  if (
    item.daysUntilNextContact ===
    0
  ) {
    return "hoy";
  }

  if (
    item.daysUntilNextContact !==
      null &&
    item.daysUntilNextContact >
      0
  ) {
    return "proximo";
  }

  return "nuevo";
}

export function getCalendarCommercialEmptyText(
  bucket: CalendarCommercialBucketKey,
) {
  if (
    bucket === "atrasados"
  ) {
    return {
      title:
        "Nada urgente",

      text:
        "No tienes seguimientos atrasados.",
    };
  }

  if (
    bucket === "hoy"
  ) {
    return {
      title:
        "Todo despejado",

      text:
        "No tienes seguimientos para hoy.",
    };
  }

  if (
    bucket === "manana"
  ) {
    return {
      title:
        "Mañana está libre",

      text:
        "No tienes seguimientos programados para mañana.",
    };
  }

  if (
    bucket ===
    "pasadoManana"
  ) {
    return {
      title:
        "Sin presión inmediata",

      text:
        "No tienes seguimientos para pasado mañana.",
    };
  }

  if (
    bucket ===
    "proximos14"
  ) {
    return {
      title:
        "Sin próximos contactos",

      text:
        "No tienes seguimientos programados para los próximos 14 días.",
    };
  }

  return {
    title:
      "Todas tienen fecha",

    text:
      "No hay relaciones sin próximo contacto.",
  };
}