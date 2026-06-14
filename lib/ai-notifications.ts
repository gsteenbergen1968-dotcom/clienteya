type Cliente = {
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

export type AINotificationPriority = "urgent" | "high" | "medium" | "low";

export type AINotificationType =
  | "followup"
  | "risk"
  | "opportunity"
  | "payment"
  | "inactive";

export type AINotification = {
  id: string;
  clienteId: string;
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
  tone: "red" | "amber" | "emerald" | "sky" | "slate";
  label: string;
};

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function daysUntil(date: string | null | undefined) {
  if (!date) return null;

  const today = new Date();
  const target = new Date(date);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function buildId(clienteId: string, type: string) {
  return `${clienteId}-${type}`;
}

function createNotification({
  id,
  clienteId,
  title,
  description,
  priority,
  type,
  actionLabel,
  actionHref,
  category,
}: {
  id: string;
  clienteId: string;
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
    clienteId,
    title,
    description,
    message: description,
    category,
    priority,
    tone: priority,
    type,
    actionLabel,
    actionHref,
    href: actionHref,
  };
}

export function buildAINotifications(clientes: Cliente[]): AINotification[] {
  const notifications: AINotification[] = [];

  for (const cliente of clientes) {
    const estado = normalize(cliente.estado);
    const notas = normalize(cliente.notas);
    const recordatorio = normalize(cliente.recordatorio);
    const combined = `${estado} ${notas} ${recordatorio}`;
    const delta = daysUntil(cliente.proximo_contacto);
    const clienteName = cliente.nombre || "Cliente";

    const isPaid =
      cliente.pagado === true ||
      estado.includes("pag") ||
      estado.includes("cerr");

    const interested =
      estado.includes("interes") ||
      combined.includes("precio") ||
      combined.includes("quiero") ||
      combined.includes("info");

    const noResponse =
      estado.includes("sin respuesta") || combined.includes("sin respuesta");

    if (delta !== null && delta < 0 && !isPaid) {
      notifications.push(
        createNotification({
          id: buildId(cliente.id, "urgent-followup"),
          clienteId: cliente.id,
          title: `Follow-up vencido: ${clienteName}`,
          description:
            "El cliente necesita seguimiento inmediato para evitar perder la oportunidad.",
          priority: "urgent",
          type: "followup",
          actionLabel: "Abrir cliente",
          actionHref: `/dashboard/editar?id=${cliente.id}`,
          category: "Seguimiento vencido",
        })
      );
    }

    if (delta === 0 && !isPaid) {
      notifications.push(
        createNotification({
          id: buildId(cliente.id, "today-followup"),
          clienteId: cliente.id,
          title: `Seguimiento hoy: ${clienteName}`,
          description: "Hoy es el mejor momento para contactar este cliente.",
          priority: "high",
          type: "followup",
          actionLabel: "Enviar WhatsApp",
          actionHref: `/dashboard/whatsapp?id=${cliente.id}`,
          category: "Seguimiento hoy",
        })
      );
    }

    if (interested && !isPaid) {
      notifications.push(
        createNotification({
          id: buildId(cliente.id, "hot-opportunity"),
          clienteId: cliente.id,
          title: `Oportunidad activa: ${clienteName}`,
          description: "El cliente mostró señales de interés comercial.",
          priority: "high",
          type: "opportunity",
          actionLabel: "Ver oportunidad",
          actionHref: `/dashboard/editar?id=${cliente.id}`,
          category: "Oportunidad",
        })
      );
    }

    if (noResponse && !isPaid) {
      notifications.push(
        createNotification({
          id: buildId(cliente.id, "no-response"),
          clienteId: cliente.id,
          title: `Cliente sin respuesta: ${clienteName}`,
          description:
            "La conversación está perdiendo ritmo y necesita reactivación.",
          priority: "medium",
          type: "risk",
          actionLabel: "Reactivar cliente",
          actionHref: `/dashboard/whatsapp?id=${cliente.id}`,
          category: "Riesgo",
        })
      );
    }

    if (cliente.monto && cliente.monto > 0 && !cliente.pagado) {
      notifications.push(
        createNotification({
          id: buildId(cliente.id, "payment"),
          clienteId: cliente.id,
          title: `Pago pendiente: ${clienteName}`,
          description:
            "Existe monto registrado pero el cliente todavía no figura como pagado.",
          priority: "medium",
          type: "payment",
          actionLabel: "Revisar pago",
          actionHref: `/dashboard/editar?id=${cliente.id}`,
          category: "Pago",
        })
      );
    }

    if (delta !== null && delta <= -14 && !isPaid) {
      notifications.push(
        createNotification({
          id: buildId(cliente.id, "inactive"),
          clienteId: cliente.id,
          title: `Cliente inactivo: ${clienteName}`,
          description: "El cliente lleva mucho tiempo sin seguimiento.",
          priority: "low",
          type: "inactive",
          actionLabel: "Revisar cliente",
          actionHref: `/dashboard/editar?id=${cliente.id}`,
          category: "Inactivo",
        })
      );
    }
  }

  return notifications.sort((a, b) => {
    const priorityOrder = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export function buildExecutiveAlerts(clientes: Cliente[]): ExecutiveAlert[] {
  const notifications = buildAINotifications(clientes);

  const urgentCount = notifications.filter((n) => n.priority === "urgent").length;
  const highCount = notifications.filter((n) => n.priority === "high").length;
  const opportunityCount = notifications.filter(
    (n) => n.type === "opportunity"
  ).length;
  const riskCount = notifications.filter((n) => n.type === "risk").length;

  const alerts: ExecutiveAlert[] = [];

  if (urgentCount > 0) {
    alerts.push({
      id: "urgent-pressure",
      title: "Presión de seguimiento",
      description:
        "Hay clientes que necesitan atención inmediata para evitar pérdida de oportunidad.",
      metric: urgentCount,
      tone: "red",
      label: "Urgente",
    });
  }

  if (opportunityCount > 0) {
    alerts.push({
      id: "opportunity-momentum",
      title: "Momentum comercial",
      description:
        "ClienteYA detectó oportunidades activas dentro del pipeline actual.",
      metric: opportunityCount,
      tone: "emerald",
      label: "Oportunidades",
    });
  }

  if (riskCount > 0) {
    alerts.push({
      id: "risk-watch",
      title: "Riesgo de enfriamiento",
      description:
        "Algunas conversaciones están perdiendo ritmo y requieren reactivación.",
      metric: riskCount,
      tone: "amber",
      label: "Riesgo",
    });
  }

  if (highCount > 0) {
    alerts.push({
      id: "high-priority",
      title: "Prioridad alta",
      description:
        "Existen acciones comerciales importantes que pueden mejorar conversión.",
      metric: highCount,
      tone: "sky",
      label: "Alta prioridad",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "stable-operation",
      title: "Operación estable",
      description:
        "No se detectan alertas críticas. Mantener el ritmo de seguimiento.",
      metric: "OK",
      tone: "slate",
      label: "Estable",
    });
  }

  return alerts;
}

export function getAINotificationClasses(priority: AINotification["priority"]) {
  if (priority === "urgent") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (priority === "high") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (priority === "medium") {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}

export function getAINotificationBadge(priority: AINotification["priority"]) {
  if (priority === "urgent") return "Urgente";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";

  return "Normal";
}