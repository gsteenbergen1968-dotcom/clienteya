import {
  buildCommercialActions,
  type CommercialAction,
  type CommercialRelationship,
} from "./commercial-action-engine";
import type { RelationshipRecord } from "./relationship-repository";
import { createAdminClient } from "./supabase/server";

export type AutomationReminderV2 = {
  relationship: RelationshipRecord;
  relationshipId: string;
  name: string;
  type:
    | "overdue"
    | "today"
    | "tomorrow"
    | "interested"
    | "no_response"
    | "general";
  score: number;
  priority: "urgent" | "high" | "medium" | "low";
  title: string;
  description: string;
  nextBestAction: string;
  actionLabel: string;
  actionType: "contacted" | "done" | "schedule";
};

export type DashboardAlertV2 = {
  id: string;
  tone: "red" | "amber" | "sky" | "emerald";
  title: string;
  description: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

function normalizeDate(
  value?: string | null,
): string | null {
  if (!value) return null;

  const clean = value.slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(clean)
    ? clean
    : null;
}

function normalizeText(
  value?: string | null,
): string {
  return (value || "")
    .toLowerCase()
    .trim();
}

function isPaidStatus(
  status?: string | null,
): boolean {
  const value = normalizeText(status);

  return (
    value.includes("pag") ||
    value.includes("convert")
  );
}

function getSafeRelationship(
  relationship: RelationshipRecord,
): RelationshipRecord {
  return {
    ...relationship,

    id:
      String(
        relationship.id || "",
      ),

    owner_id:
      String(
        relationship.owner_id || "",
      ),

    name:
      relationship.name ||
      relationship.company ||
      "Relación sin nombre",

    company:
      relationship.company ??
      null,

    phone:
      relationship.phone ||
      "",

    email:
      relationship.email ??
      null,

    status:
      relationship.status ||
      "Nuevo",

    notes:
      relationship.notes ??
      null,

    reminder:
      relationship.reminder ??
      null,

    next_contact_at:
      normalizeDate(
        relationship.next_contact_at,
      ),

    last_contact_at:
      relationship.last_contact_at ??
      null,

    created_at:
      relationship.created_at ||
      new Date().toISOString(),

    updated_at:
      relationship.updated_at ??
      null,
  };
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
      relationship.name ||
      relationship.company ||
      "Relación sin nombre",

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
      relationship.next_contact_at,

    updated_at:
      relationship.updated_at,

    amount:
      0,

    paid:
      isPaidStatus(
        relationship.status,
      ),

    paid_at:
      null,

    memory:
      null,
  };
}

function isPaidOrClosed(
  relationship: RelationshipRecord,
): boolean {
  const status =
    normalizeText(
      relationship.status,
    );

  return (
    isPaidStatus(
      relationship.status,
    ) ||
    status.includes("cerr")
  );
}

function getPriority(
  action: CommercialAction,
): AutomationReminderV2["priority"] {
  if (
    action.bucket === "overdue" &&
    action.commercialScore >= 90
  ) {
    return "urgent";
  }

  if (
    action.priority === "critical"
  ) {
    return "urgent";
  }

  if (
    action.priority === "high"
  ) {
    return "high";
  }

  if (
    action.priority === "medium"
  ) {
    return "medium";
  }

  return "low";
}

function getReminderType(
  action: CommercialAction,
): AutomationReminderV2["type"] {
  const status =
    normalizeText(
      action.status,
    );

  if (
    action.bucket === "overdue"
  ) {
    return "overdue";
  }

  if (
    action.bucket === "today"
  ) {
    return "today";
  }

  if (
    action.bucket === "tomorrow"
  ) {
    return "tomorrow";
  }

  if (
    status.includes("interes")
  ) {
    return "interested";
  }

  if (
    status.includes("sin")
  ) {
    return "no_response";
  }

  return "general";
}

function getActionType(
  action: CommercialAction,
): AutomationReminderV2["actionType"] {
  if (
    action.bucket === "overdue"
  ) {
    return "contacted";
  }

  if (
    action.bucket === "today"
  ) {
    return "done";
  }

  return "schedule";
}

function getAutomationCopy(
  action: CommercialAction,
) {
  if (
    action.bucket === "overdue"
  ) {
    return {
      title:
        action.commercialScore >= 90
          ? "🚨 Relación muy atrasada"
          : "🔴 Seguimiento atrasado",

      description:
        action.commercialScore >= 90
          ? "Esta relación necesita atención comercial inmediata."
          : "Esta relación ya pasó su fecha de contacto.",

      nextBestAction:
        action.commercialScore >= 90
          ? "Llamar directamente o enviar WhatsApp ahora"
          : "Enviar mensaje de seguimiento hoy",

      actionLabel:
        "Contactar ahora",
    };
  }

  if (
    action.bucket === "today"
  ) {
    return {
      title:
        "📅 Seguimiento para hoy",

      description:
        "Esta relación está programada para hoy. Conviene ejecutar el contacto.",

      nextBestAction:
        "Abrir WhatsApp y hacer seguimiento",

      actionLabel:
        "Marcar listo",
    };
  }

  if (
    action.bucket === "tomorrow"
  ) {
    return {
      title:
        "🕒 Seguimiento mañana",

      description:
        "Puedes dejar preparado el mensaje o revisar el contexto antes del contacto.",

      nextBestAction:
        "Preparar mensaje automático",

      actionLabel:
        "Agendar siguiente",
    };
  }

  if (
    action.bucket ===
    "day_after_tomorrow"
  ) {
    return {
      title:
        "📌 Seguimiento planificado",

      description:
        "Esta relación tiene una acción próxima y debe mantenerse visible.",

      nextBestAction:
        "Preparar el próximo paso",

      actionLabel:
        "Agendar siguiente",
    };
  }

  if (
    action.bucket ===
    "next_14_days"
  ) {
    return {
      title:
        "📆 Próxima oportunidad",

      description:
        "ClienteYA mantiene este seguimiento en la cola comercial.",

      nextBestAction:
        "Mantener planificación activa",

      actionLabel:
        "Agendar siguiente",
    };
  }

  if (
    action.bucket === "no_date"
  ) {
    return {
      title:
        "🧭 Relación sin fecha",

      description:
        "Esta relación necesita una próxima fecha clara para no perder continuidad.",

      nextBestAction:
        "Definir próximo contacto",

      actionLabel:
        "Agendar seguimiento",
    };
  }

  return {
    title:
      "Seguimiento general",

    description:
      "Relación activa sin prioridad urgente, pero visible para proteger la continuidad.",

    nextBestAction:
      "Mantener contacto comercial",

    actionLabel:
      "Abrir relación",
  };
}

function toAutomationReminder(
  action: CommercialAction,
  relationship: RelationshipRecord,
): AutomationReminderV2 {
  const copy =
    getAutomationCopy(
      action,
    );

  return {
    relationship,

    relationshipId:
      relationship.id,

    name:
      relationship.name ||
      relationship.company ||
      "Relación sin nombre",

    type:
      getReminderType(
        action,
      ),

    score:
      action.commercialScore,

    priority:
      getPriority(
        action,
      ),

    title:
      copy.title,

    description:
      action.reason ||
      copy.description,

    nextBestAction:
      copy.nextBestAction,

    actionLabel:
      copy.actionLabel,

    actionType:
      getActionType(
        action,
      ),
  };
}

export function applyAutomationRulesV2<
  T extends RelationshipRecord,
>(
  relationships: T[],
): T[] {
  const safeRelationships =
    Array.isArray(relationships)
      ? relationships
      : [];

  return safeRelationships.map(
    (relationship) => {
      const safeRelationship =
        getSafeRelationship(
          relationship,
        );

      if (
        !safeRelationship.id ||
        isPaidOrClosed(
          safeRelationship,
        )
      ) {
        return relationship;
      }

      if (
        safeRelationship.next_contact_at
      ) {
        return {
          ...relationship,
          next_contact_at:
            safeRelationship.next_contact_at,
        };
      }

      const status =
        normalizeText(
          safeRelationship.status,
        );

      let nextContactAt =
        addDaysISO(3);

      let reminder =
        "Seguimiento automático en 3 días";

      if (
        status.includes("interes")
      ) {
        nextContactAt =
          addDaysISO(1);

        reminder =
          "Relación interesada: responder rápido";
      }

      if (
        status.includes("sin")
      ) {
        nextContactAt =
          addDaysISO(3);

        reminder =
          "Reintentar contacto en 3 días";
      }

      return {
        ...relationship,

        reminder:
          relationship.reminder ||
          reminder,

        next_contact_at:
          nextContactAt,
      };
    },
  );
}

export function buildAutomationRemindersV2(
  relationships: RelationshipRecord[],
): AutomationReminderV2[] {
  const safeRelationships =
    Array.isArray(relationships)
      ? relationships
      : [];

  const normalizedRelationships =
    safeRelationships.map(
      getSafeRelationship,
    );

  const relationshipById =
    new Map(
      normalizedRelationships.map(
        (relationship) => [
          relationship.id,
          relationship,
        ],
      ),
    );

  const actions =
    buildCommercialActions({
      relationships:
        normalizedRelationships.map(
          toCommercialRelationship,
        ),
    });

  return actions
    .map(
      (action) => {
        const relationship =
          relationshipById.get(
            action.id,
          );

        if (!relationship) {
          return null;
        }

        return toAutomationReminder(
          action,
          relationship,
        );
      },
    )
    .filter(
      (
        reminder,
      ): reminder is AutomationReminderV2 =>
        reminder !== null,
    );
}

export function buildDashboardAlertsV2(
  relationships: RelationshipRecord[],
): DashboardAlertV2[] {
  const safeRelationships =
    Array.isArray(relationships)
      ? relationships
      : [];

  const actions =
    buildCommercialActions({
      relationships:
        safeRelationships
          .map(
            getSafeRelationship,
          )
          .map(
            toCommercialRelationship,
          ),
    }).filter(
      (action) =>
        !action.paid,
    );

  const overdue =
    actions.filter(
      (action) =>
        action.bucket ===
        "overdue",
    );

  const critical =
    overdue.filter(
      (action) =>
        action.commercialScore >=
        90,
    );

  const today =
    actions.filter(
      (action) =>
        action.bucket ===
        "today",
    );

  const tomorrow =
    actions.filter(
      (action) =>
        action.bucket ===
        "tomorrow",
    );

  const interested =
    actions.filter(
      (action) =>
        normalizeText(
          action.status,
        ).includes(
          "interes",
        ),
    );

  const alerts:
    DashboardAlertV2[] = [];

  if (
    critical.length > 0
  ) {
    alerts.push({
      id:
        "very-overdue",

      tone:
        "red",

      title:
        `🚨 ${critical.length} relación(es) críticas`,

      description:
        "Estas relaciones requieren atención comercial inmediata.",
    });
  }

  if (
    overdue.length > 0
  ) {
    alerts.push({
      id:
        "overdue",

      tone:
        "red",

      title:
        `🔥 ${overdue.length} seguimiento(s) atrasado(s)`,

      description:
        "Hay relaciones que requieren atención hoy.",
    });
  }

  if (
    today.length > 0
  ) {
    alerts.push({
      id:
        "today",

      tone:
        "amber",

      title:
        `📅 ${today.length} seguimiento(s) para hoy`,

      description:
        "Relaciones programadas para contactar hoy.",
    });
  }

  if (
    tomorrow.length > 0
  ) {
    alerts.push({
      id:
        "tomorrow",

      tone:
        "sky",

      title:
        `🕒 ${tomorrow.length} seguimiento(s) mañana`,

      description:
        "Puedes preparar mensajes hoy.",
    });
  }

  if (
    interested.length > 0
  ) {
    alerts.push({
      id:
        "interested",

      tone:
        "emerald",

      title:
        `💡 ${interested.length} relación(es) interesadas`,

      description:
        "Relaciones con potencial comercial activo.",
    });
  }

  return alerts.slice(
    0,
    4,
  );
}

export function getAlertClassesV2(
  tone:
    | DashboardAlertV2["tone"]
    | null
    | undefined,
): string {
  if (
    tone === "red"
  ) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (
    tone === "amber"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (
    tone === "sky"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export async function runDueAutomationsV2(
  ownerId: string,
) {
  if (!ownerId) {
    return {
      processed: 0,
    };
  }

  const admin =
    createAdminClient();

  const today =
    todayISO();

  const {
    data: dueFollowups,
  } =
    await admin
      .from(
        "scheduled_followups",
      )
      .select(
        "id, relationship_id, due_date, status",
      )
      .eq(
        "user_id",
        ownerId,
      )
      .eq(
        "status",
        "scheduled",
      )
      .lte(
        "due_date",
        today,
      );

  const due =
    Array.isArray(
      dueFollowups,
    )
      ? dueFollowups
      : [];

  for (
    const followup of due
  ) {
    if (
      !followup.id ||
      !followup.relationship_id
    ) {
      continue;
    }

    await admin
      .from(
        "scheduled_followups",
      )
      .update({
        status: "due",
      })
      .eq(
        "id",
        followup.id,
      )
      .eq(
        "user_id",
        ownerId,
      );

    await admin
      .from(
        "relationships",
      )
      .update({
        reminder:
          "Seguimiento automático listo para enviar",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        followup.relationship_id,
      )
      .eq(
        "owner_id",
        ownerId,
      );

    await admin
      .from(
        "activity_logs",
      )
      .insert({
        user_id:
          ownerId,

        relationship_id:
          followup.relationship_id,

        event_type:
          "followup",
      });
  }

  return {
    processed:
      due.length,
  };
}