import { buildWhatsAppLink } from "./whatsapp-link";

export type ActionCenterPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export type ActionCenterType =
  | "whatsapp"
  | "followup"
  | "payment"
  | "risk"
  | "opportunity"
  | "relationship";

export type ActionCenterRelationship = {
  id: string;
  nombre?: string | null;
  telefono?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  pagado?: boolean | null;
  monto?: number | null;
};

export type ActionCenterItem = {
  id: string;
  relationshipId: string;
  relationshipName: string;
  type: ActionCenterType;
  priority: ActionCenterPriority;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

function normalize(
  value: string | null | undefined,
) {
  return (value || "")
    .toLowerCase()
    .trim();
}

function startOfToday() {
  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  return today;
}

function daysBetween(
  date: string | null | undefined,
) {
  if (!date) {
    return null;
  }

  const target = new Date(date);

  if (
    Number.isNaN(
      target.getTime(),
    )
  ) {
    return null;
  }

  target.setHours(
    0,
    0,
    0,
    0,
  );

  const diff =
    startOfToday().getTime() -
    target.getTime();

  return Math.floor(
    diff /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function daysUntil(
  date: string | null | undefined,
) {
  if (!date) {
    return null;
  }

  const target = new Date(date);

  if (
    Number.isNaN(
      target.getTime(),
    )
  ) {
    return null;
  }

  target.setHours(
    0,
    0,
    0,
    0,
  );

  const diff =
    target.getTime() -
    startOfToday().getTime();

  return Math.ceil(
    diff /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function isWarmRelationship(
  relationship: ActionCenterRelationship,
) {
  const estado =
    normalize(
      relationship.estado,
    );

  const notas =
    normalize(
      relationship.notas,
    );

  const recordatorio =
    normalize(
      relationship.recordatorio,
    );

  return (
    estado.includes("interés") ||
    estado.includes("interes") ||
    estado.includes("propuesta") ||
    estado.includes("caliente") ||
    estado.includes("lead") ||
    notas.includes("interés") ||
    notas.includes("interes") ||
    notas.includes("propuesta") ||
    recordatorio.includes("llamar") ||
    recordatorio.includes("whatsapp") ||
    recordatorio.includes("seguimiento")
  );
}

function isPaid(
  relationship: ActionCenterRelationship,
) {
  const estado =
    normalize(
      relationship.estado,
    );

  return (
    relationship.pagado === true ||
    estado.includes("pagó") ||
    estado.includes("pago") ||
    estado.includes("pagado")
  );
}

function relationshipUrl(
  relationshipId: string,
) {
  return `/dashboard/relationships/${relationshipId}`;
}

function whatsappMessage(
  relationship: ActionCenterRelationship,
  context: string,
) {
  const name =
    relationship.nombre ||
    "cliente";

  if (
    context === "overdue"
  ) {
    return `Hola ${name}, ¿cómo estás? Te escribo para hacer seguimiento y ver si puedo ayudarte con algo pendiente.`;
  }

  if (
    context === "opportunity"
  ) {
    return `Hola ${name}, ¿cómo estás? Quería dar seguimiento a nuestra conversación y ver si avanzamos con el próximo paso.`;
  }

  if (
    context === "payment"
  ) {
    return `Hola ${name}, ¿cómo estás? Te escribo para confirmar si ya pudiste revisar el pago pendiente.`;
  }

  return `Hola ${name}, ¿cómo estás? Te escribo para hacer seguimiento.`;
}

function whatsappUrl(
  relationship: ActionCenterRelationship,
  message: string,
) {
  if (
    !relationship.telefono
  ) {
    return relationshipUrl(
      relationship.id,
    );
  }

  return buildWhatsAppLink(
    relationship.telefono,
    message,
  );
}

function priorityWeight(
  priority: ActionCenterPriority,
) {
  if (
    priority === "urgent"
  ) {
    return 4;
  }

  if (
    priority === "high"
  ) {
    return 3;
  }

  if (
    priority === "medium"
  ) {
    return 2;
  }

  return 1;
}

export function buildActionCenter(
  relationships: ActionCenterRelationship[],
  options?: {
    maxItems?: number;
    founderMode?: boolean;
  },
): ActionCenterItem[] {
  const maxItems =
    options?.maxItems ??
    6;

  const items:
    ActionCenterItem[] = [];

  for (
    const relationship of relationships
  ) {
    const name =
      relationship.nombre ||
      "Relación sin nombre";

    const overdueDays =
      daysUntil(
        relationship.proximo_contacto,
      );

    const inactiveDays =
      daysBetween(
        relationship.updated_at ||
          relationship.created_at,
      );

    const warmRelationship =
      isWarmRelationship(
        relationship,
      );

    const paid =
      isPaid(
        relationship,
      );

    if (
      overdueDays !== null &&
      overdueDays < 0
    ) {
      const days =
        Math.abs(
          overdueDays,
        );

      const message =
        whatsappMessage(
          relationship,
          "overdue",
        );

      items.push({
        id:
          `overdue-${relationship.id}`,

        relationshipId:
          relationship.id,

        relationshipName:
          name,

        type:
          "followup",

        priority:
          days >= 3
            ? "urgent"
            : "high",

        title:
          `${name} necesita seguimiento`,

        description:
          days === 1
            ? "El contacto estaba programado para ayer."
            : `El contacto está vencido hace ${days} días.`,

        actionLabel:
          relationship.telefono
            ? "Enviar WhatsApp"
            : "Ver relación",

        actionHref:
          whatsappUrl(
            relationship,
            message,
          ),

        secondaryLabel:
          "Ver ficha",

        secondaryHref:
          relationshipUrl(
            relationship.id,
          ),
      });

      continue;
    }

    if (
      overdueDays === 0
    ) {
      const message =
        whatsappMessage(
          relationship,
          "today",
        );

      items.push({
        id:
          `today-${relationship.id}`,

        relationshipId:
          relationship.id,

        relationshipName:
          name,

        type:
          "whatsapp",

        priority:
          warmRelationship
            ? "high"
            : "medium",

        title:
          `${name} está programado para hoy`,

        description:
          warmRelationship
            ? "Relación con señales comerciales positivas. Buen momento para avanzar."
            : "Seguimiento recomendado para mantener el ritmo comercial.",

        actionLabel:
          relationship.telefono
            ? "Enviar WhatsApp"
            : "Ver relación",

        actionHref:
          whatsappUrl(
            relationship,
            message,
          ),

        secondaryLabel:
          "Ver ficha",

        secondaryHref:
          relationshipUrl(
            relationship.id,
          ),
      });

      continue;
    }

    if (
      warmRelationship &&
      !paid
    ) {
      const message =
        whatsappMessage(
          relationship,
          "opportunity",
        );

      items.push({
        id:
          `opportunity-${relationship.id}`,

        relationshipId:
          relationship.id,

        relationshipName:
          name,

        type:
          "opportunity",

        priority:
          "high",

        title:
          `${name} parece una oportunidad activa`,

        description:
          "Hay señales de interés. Conviene hacer contacto antes de que pierda temperatura.",

        actionLabel:
          relationship.telefono
            ? "Enviar WhatsApp"
            : "Ver relación",

        actionHref:
          whatsappUrl(
            relationship,
            message,
          ),

        secondaryLabel:
          "Ver ficha",

        secondaryHref:
          relationshipUrl(
            relationship.id,
          ),
      });

      continue;
    }

    if (
      !paid &&
      relationship.monto &&
      relationship.monto > 0
    ) {
      const message =
        whatsappMessage(
          relationship,
          "payment",
        );

      items.push({
        id:
          `payment-${relationship.id}`,

        relationshipId:
          relationship.id,

        relationshipName:
          name,

        type:
          "payment",

        priority:
          "medium",

        title:
          `${name} tiene pago pendiente`,

        description:
          "Hay un monto registrado, pero todavía no aparece como pagado.",

        actionLabel:
          relationship.telefono
            ? "Enviar WhatsApp"
            : "Ver relación",

        actionHref:
          whatsappUrl(
            relationship,
            message,
          ),

        secondaryLabel:
          "Ver ficha",

        secondaryHref:
          relationshipUrl(
            relationship.id,
          ),
      });

      continue;
    }

    if (
      inactiveDays !== null &&
      inactiveDays >= 7 &&
      !paid
    ) {
      const message =
        whatsappMessage(
          relationship,
          "overdue",
        );

      items.push({
        id:
          `inactive-${relationship.id}`,

        relationshipId:
          relationship.id,

        relationshipName:
          name,

        type:
          "risk",

        priority:
          inactiveDays >= 14
            ? "high"
            : "medium",

        title:
          `${name} está perdiendo actividad`,

        description:
          `Sin movimiento visible hace ${inactiveDays} días.`,

        actionLabel:
          relationship.telefono
            ? "Reactivar por WhatsApp"
            : "Ver relación",

        actionHref:
          whatsappUrl(
            relationship,
            message,
          ),

        secondaryLabel:
          "Ver ficha",

        secondaryHref:
          relationshipUrl(
            relationship.id,
          ),
      });
    }
  }

  return items
    .sort(
      (
        a,
        b,
      ) =>
        priorityWeight(
          b.priority,
        ) -
        priorityWeight(
          a.priority,
        ),
    )
    .slice(
      0,
      maxItems,
    );
}

export function getActionCenterSummary(
  items: ActionCenterItem[],
) {
  const urgent =
    items.filter(
      (
        item,
      ) =>
        item.priority ===
        "urgent",
    ).length;

  const high =
    items.filter(
      (
        item,
      ) =>
        item.priority ===
        "high",
    ).length;

  const opportunities =
    items.filter(
      (
        item,
      ) =>
        item.type ===
        "opportunity",
    ).length;

  return {
    total:
      items.length,

    urgent,

    high,

    opportunities,

    hasCriticalFocus:
      urgent > 0 ||
      high >= 3,
  };
}