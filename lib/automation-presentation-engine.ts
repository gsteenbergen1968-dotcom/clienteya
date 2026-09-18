import type {
  CommercialAction,
} from "./commercial-action-engine";

import {
  buildExecutiveDecisionEngine,
  type ExecutiveDecision,
} from "./executive-decision-engine";

export type AutomationPresentationRelationship = {
  id: string;
  owner_id: string | null;
  name: string;
  phone: string;
  status: string;
  notes: string | null;
  memory: string | null;
  reminder: string | null;
  next_contact_at: string | null;
  created_at: string;
  updated_at: string | null;
  amount: number;
  paid: boolean;
  paid_at: string | null;
};

export type AutomationPresentationType =
  | "overdue"
  | "today"
  | "tomorrow"
  | "interested"
  | "no_response"
  | "general";

export type AutomationPresentationPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export type AutomationPresentationActionType =
  | "contactado"
  | "listo"
  | "schedule";

export type AutomationDecisionPresentation = {
  relationship: AutomationPresentationRelationship;
  relationshipId: string;
  name: string;

  type: AutomationPresentationType;
  score: number;
  priority: AutomationPresentationPriority;

  title: string;
  description: string;
  nextBestAction: string;

  actionLabel: string;
  actionType: AutomationPresentationActionType;

  commercialScore: number;
  urgencyScore: number;
  memoryScore: number;

  bucket: ExecutiveDecision["bucket"];
};

export type BuildAutomationDecisionPresentationInput = {
  actions: CommercialAction[];
  limit?: number;
};

function normalizeText(
  value: string | null | undefined,
): string {
  return (value || "")
    .toLowerCase()
    .trim();
}

function getAutomationPriority(
  decision: ExecutiveDecision,
): AutomationPresentationPriority {
  if (
    decision.bucket === "overdue" &&
    decision.commercialScore >= 90
  ) {
    return "urgent";
  }

  if (
    decision.priority === "critical"
  ) {
    return "urgent";
  }

  if (
    decision.priority === "high"
  ) {
    return "high";
  }

  if (
    decision.priority === "medium"
  ) {
    return "medium";
  }

  return "low";
}

function getAutomationType(
  decision: ExecutiveDecision,
  action: CommercialAction,
): AutomationPresentationType {
  const status =
    normalizeText(
      action.status,
    );

  if (
    decision.bucket === "overdue"
  ) {
    return "overdue";
  }

  if (
    decision.bucket === "today"
  ) {
    return "today";
  }

  if (
    decision.bucket === "tomorrow"
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

function getAutomationActionType(
  decision: ExecutiveDecision,
): AutomationPresentationActionType {
  if (
    decision.bucket === "overdue"
  ) {
    return "contactado";
  }

  if (
    decision.bucket === "today"
  ) {
    return "listo";
  }

  return "schedule";
}

function getAutomationCopy(
  decision: ExecutiveDecision,
) {
  if (
    decision.bucket === "overdue"
  ) {
    const isCritical =
      decision.commercialScore >= 90;

    return {
      title: isCritical
        ? "🚨 Relación muy atrasada"
        : "🔴 Seguimiento atrasado",

      description: isCritical
        ? "Esta relación necesita atención comercial inmediata."
        : "Esta relación ya pasó su fecha de contacto.",

      nextBestAction: isCritical
        ? "Llamar directamente o enviar WhatsApp ahora"
        : "Enviar mensaje de seguimiento hoy",

      actionLabel:
        "Contactar ahora",
    };
  }

  if (
    decision.bucket === "today"
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
    decision.bucket === "tomorrow"
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
    decision.bucket ===
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
    decision.bucket ===
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
    decision.bucket === "no_date"
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

function toAutomationRelationship(
  action: CommercialAction,
): AutomationPresentationRelationship {
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

    memory:
      action.memory,

    reminder:
      action.reminder,

    next_contact_at:
      action.nextContactAt,

    created_at:
      action.createdAt,

    updated_at:
      action.updatedAt,

    amount:
      action.amount,

    paid:
      action.paid,

    paid_at:
      action.paidAt,
  };
}

function findActionForDecision(
  decision: ExecutiveDecision,
  actions: CommercialAction[],
) {
  return actions.find(
    (
      action,
    ) =>
      action.relationshipId ===
      decision.relationshipId,
  );
}

function toAutomationPresentation({
  decision,
  action,
}: {
  decision: ExecutiveDecision;
  action: CommercialAction;
}): AutomationDecisionPresentation {
  const copy =
    getAutomationCopy(
      decision,
    );

  return {
    relationship:
      toAutomationRelationship(
        action,
      ),

    relationshipId:
      action.relationshipId,

    name:
      action.name,

    type:
      getAutomationType(
        decision,
        action,
      ),

    score:
      decision.commercialScore,

    priority:
      getAutomationPriority(
        decision,
      ),

    title:
      copy.title,

    description:
      decision.summary ||
      copy.description,

    nextBestAction:
      copy.nextBestAction,

    actionLabel:
      copy.actionLabel,

    actionType:
      getAutomationActionType(
        decision,
      ),

    commercialScore:
      decision.commercialScore,

    urgencyScore:
      decision.urgencyScore,

    memoryScore:
      decision.memoryScore,

    bucket:
      decision.bucket,
  };
}

export function buildAutomationDecisionPresentation({
  actions,
  limit = 6,
}: BuildAutomationDecisionPresentationInput): AutomationDecisionPresentation[] {
  const safeActions =
    Array.isArray(actions)
      ? actions
      : [];

  const activeActions =
    safeActions
      .filter(
        (
          action,
        ) =>
          !action.paid,
      )
      .filter(
        (
          action,
        ) =>
          !normalizeText(
            action.status,
          ).includes("cerr"),
      )
      .filter(
        (
          action,
        ) =>
          action.bucket !==
          "future",
      );

  const decisionResult =
    buildExecutiveDecisionEngine(
      activeActions,
    );

  return decisionResult.automations
    .map(
      (
        decision,
      ) => {
        const action =
          findActionForDecision(
            decision,
            activeActions,
          );

        if (
          !action
        ) {
          return null;
        }

        return toAutomationPresentation({
          decision,
          action,
        });
      },
    )
    .filter(
      (
        presentation,
      ): presentation is AutomationDecisionPresentation =>
        Boolean(
          presentation,
        ),
    )
    .sort(
      (
        a,
        b,
      ) =>
        b.score -
        a.score,
    )
    .slice(
      0,
      Math.max(
        0,
        limit,
      ),
    );
}