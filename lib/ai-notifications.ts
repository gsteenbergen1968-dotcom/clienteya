type Relationship = {
  id: string;
  nombre?: string | null;
  estado?: string | null;
  telefono?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  pagado?: boolean | null;
  monto?: number | null;
};

export type AINotificationPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export type AINotificationType =
  | "followup"
  | "risk"
  | "opportunity"
  | "payment"
  | "inactive";

export type AINotification = {
  id: string;
  relationshipId: string;
  title: string;
  description: string;
  message: string;
  category: string;
  priority: AINotificationPriority;
  tone: AINotificationPriority;
  type: AINotificationType;
  actionLabel: string;
  actionHref: string;
  href: string;
};

export type ExecutiveAlert = {
  id: string;
  title: string;
  description: string;
  metric: string | number;
  tone:
    | "red"
    | "amber"
    | "emerald"
    | "sky"
    | "slate";
  label: string;
};

function normalize(
  value: string | null | undefined,
) {
  return (value || "")
    .toLowerCase()
    .trim();
}

function daysUntil(
  date: string | null | undefined,
) {
  if (!date) {
    return null;
  }

  const today =
    new Date();

  const target =
    new Date(
      date,
    );

  today.setHours(
    0,
    0,
    0,
    0,
  );

  target.setHours(
    0,
    0,
    0,
    0,
  );

  return Math.round(
    (
      target.getTime() -
      today.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function buildId(
  relationshipId: string,
  type: string,
) {
  return `${relationshipId}-${type}`;
}

function relationshipHref(
  relationshipId: string,
) {
  return `/dashboard/relationships/${relationshipId}`;
}

function createNotification({
  id,
  relationshipId,
  title,
  description,
  priority,
  type,
  actionLabel,
  actionHref,
  category,
}: {
  id: string;
  relationshipId: string;
  title: string;
  description: string;
  priority: AINotificationPriority;
  type: AINotificationType;
  actionLabel: string;
  actionHref: string;
  category: string;
}): AINotification {
  return {
    id,
    relationshipId,
    title,
    description,
    message:
      description,
    category,
    priority,
    tone:
      priority,
    type,
    actionLabel,
    actionHref,
    href:
      actionHref,
  };
}

export function buildAINotifications(
  relationships: Relationship[],
): AINotification[] {
  const notifications:
    AINotification[] = [];

  for (
    const relationship of relationships
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

    const combined =
      `${estado} ${notas} ${recordatorio}`;

    const delta =
      daysUntil(
        relationship.proximo_contacto,
      );

    const relationshipName =
      relationship.nombre ||
      "Relación";

    const isPaid =
      relationship.pagado ===
        true ||
      estado.includes(
        "pag",
      ) ||
      estado.includes(
        "cerr",
      );

    const interested =
      estado.includes(
        "interes",
      ) ||
      combined.includes(
        "precio",
      ) ||
      combined.includes(
        "quiero",
      ) ||
      combined.includes(
        "info",
      );

    const noResponse =
      estado.includes(
        "sin respuesta",
      ) ||
      combined.includes(
        "sin respuesta",
      );

    if (
      delta !== null &&
      delta < 0 &&
      !isPaid
    ) {
      notifications.push(
        createNotification({
          id:
            buildId(
              relationship.id,
              "urgent-followup",
            ),

          relationshipId:
            relationship.id,

          title:
            `Follow-up vencido: ${relationshipName}`,

          description:
            "La relación necesita seguimiento inmediato para evitar perder la oportunidad.",

          priority:
            "urgent",

          type:
            "followup",

          actionLabel:
            "Abrir relación",

          actionHref:
            relationshipHref(
              relationship.id,
            ),

          category:
            "Seguimiento vencido",
        }),
      );
    }

    if (
      delta === 0 &&
      !isPaid
    ) {
      notifications.push(
        createNotification({
          id:
            buildId(
              relationship.id,
              "today-followup",
            ),

          relationshipId:
            relationship.id,

          title:
            `Seguimiento hoy: ${relationshipName}`,

          description:
            "Hoy es el mejor momento para contactar esta relación.",

          priority:
            "high",

          type:
            "followup",

          actionLabel:
            "Enviar WhatsApp",

          actionHref:
            `/dashboard/whatsapp?id=${relationship.id}`,

          category:
            "Seguimiento hoy",
        }),
      );
    }

    if (
      interested &&
      !isPaid
    ) {
      notifications.push(
        createNotification({
          id:
            buildId(
              relationship.id,
              "hot-opportunity",
            ),

          relationshipId:
            relationship.id,

          title:
            `Oportunidad activa: ${relationshipName}`,

          description:
            "La relación mostró señales de interés comercial.",

          priority:
            "high",

          type:
            "opportunity",

          actionLabel:
            "Ver oportunidad",

          actionHref:
            relationshipHref(
              relationship.id,
            ),

          category:
            "Oportunidad",
        }),
      );
    }

    if (
      noResponse &&
      !isPaid
    ) {
      notifications.push(
        createNotification({
          id:
            buildId(
              relationship.id,
              "no-response",
            ),

          relationshipId:
            relationship.id,

          title:
            `Relación sin respuesta: ${relationshipName}`,

          description:
            "La conversación está perdiendo ritmo y necesita reactivación.",

          priority:
            "medium",

          type:
            "risk",

          actionLabel:
            "Reactivar relación",

          actionHref:
            `/dashboard/whatsapp?id=${relationship.id}`,

          category:
            "Riesgo",
        }),
      );
    }

    if (
      relationship.monto &&
      relationship.monto > 0 &&
      !relationship.pagado
    ) {
      notifications.push(
        createNotification({
          id:
            buildId(
              relationship.id,
              "payment",
            ),

          relationshipId:
            relationship.id,

          title:
            `Pago pendiente: ${relationshipName}`,

          description:
            "Existe monto registrado pero la relación todavía no figura como pagada.",

          priority:
            "medium",

          type:
            "payment",

          actionLabel:
            "Revisar pago",

          actionHref:
            relationshipHref(
              relationship.id,
            ),

          category:
            "Pago",
        }),
      );
    }

    if (
      delta !== null &&
      delta <= -14 &&
      !isPaid
    ) {
      notifications.push(
        createNotification({
          id:
            buildId(
              relationship.id,
              "inactive",
            ),

          relationshipId:
            relationship.id,

          title:
            `Relación inactiva: ${relationshipName}`,

          description:
            "La relación lleva mucho tiempo sin seguimiento.",

          priority:
            "low",

          type:
            "inactive",

          actionLabel:
            "Revisar relación",

          actionHref:
            relationshipHref(
              relationship.id,
            ),

          category:
            "Inactiva",
        }),
      );
    }
  }

  return notifications.sort(
    (
      a,
      b,
    ) => {
      const priorityOrder = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3,
      };

      return (
        priorityOrder[a.priority] -
        priorityOrder[b.priority]
      );
    },
  );
}

export function buildExecutiveAlerts(
  relationships: Relationship[],
): ExecutiveAlert[] {
  const notifications =
    buildAINotifications(
      relationships,
    );

  const urgentCount =
    notifications.filter(
      (
        notification,
      ) =>
        notification.priority ===
        "urgent",
    ).length;

  const highCount =
    notifications.filter(
      (
        notification,
      ) =>
        notification.priority ===
        "high",
    ).length;

  const opportunityCount =
    notifications.filter(
      (
        notification,
      ) =>
        notification.type ===
        "opportunity",
    ).length;

  const riskCount =
    notifications.filter(
      (
        notification,
      ) =>
        notification.type ===
        "risk",
    ).length;

  const alerts:
    ExecutiveAlert[] = [];

  if (
    urgentCount > 0
  ) {
    alerts.push({
      id:
        "urgent-pressure",

      title:
        "Presión de seguimiento",

      description:
        "Hay relaciones que necesitan atención inmediata para evitar pérdida de oportunidad.",

      metric:
        urgentCount,

      tone:
        "red",

      label:
        "Urgente",
    });
  }

  if (
    opportunityCount > 0
  ) {
    alerts.push({
      id:
        "opportunity-momentum",

      title:
        "Momentum comercial",

      description:
        "ClienteYA detectó oportunidades activas dentro del pipeline actual.",

      metric:
        opportunityCount,

      tone:
        "emerald",

      label:
        "Oportunidades",
    });
  }

  if (
    riskCount > 0
  ) {
    alerts.push({
      id:
        "risk-watch",

      title:
        "Riesgo de enfriamiento",

      description:
        "Algunas conversaciones están perdiendo ritmo y requieren reactivación.",

      metric:
        riskCount,

      tone:
        "amber",

      label:
        "Riesgo",
    });
  }

  if (
    highCount > 0
  ) {
    alerts.push({
      id:
        "high-priority",

      title:
        "Prioridad alta",

      description:
        "Existen acciones comerciales importantes que pueden mejorar conversión.",

      metric:
        highCount,

      tone:
        "sky",

      label:
        "Alta prioridad",
    });
  }

  if (
    alerts.length === 0
  ) {
    alerts.push({
      id:
        "stable-operation",

      title:
        "Operación estable",

      description:
        "No se detectan alertas críticas. Mantener el ritmo de seguimiento.",

      metric:
        "OK",

      tone:
        "slate",

      label:
        "Estable",
    });
  }

  return alerts;
}

export function getAINotificationClasses(
  priority: AINotification["priority"],
) {
  if (
    priority === "urgent"
  ) {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (
    priority === "high"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (
    priority === "medium"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}

export function getAINotificationBadge(
  priority: AINotification["priority"],
) {
  if (
    priority === "urgent"
  ) {
    return "Urgente";
  }

  if (
    priority === "high"
  ) {
    return "Alta";
  }

  if (
    priority === "medium"
  ) {
    return "Media";
  }

  return "Normal";
}