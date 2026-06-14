import { buildWhatsAppLink } from "./whatsapp-link";

export type ActionCenterPriority = "urgent" | "high" | "medium" | "low";

export type ActionCenterType =
  | "whatsapp"
  | "followup"
  | "payment"
  | "risk"
  | "opportunity"
  | "client";

export type ActionCenterClient = {
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
  clienteId: string;
  clienteNombre: string;
  type: ActionCenterType;
  priority: ActionCenterPriority;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function daysBetween(date: string | null | undefined) {
  if (!date) return null;

  const target = new Date(date);

  if (Number.isNaN(target.getTime())) return null;

  target.setHours(0, 0, 0, 0);

  const diff = startOfToday().getTime() - target.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function daysUntil(date: string | null | undefined) {
  if (!date) return null;

  const target = new Date(date);

  if (Number.isNaN(target.getTime())) return null;

  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - startOfToday().getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isWarmLead(cliente: ActionCenterClient) {
  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);
  const recordatorio = normalize(cliente.recordatorio);

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

function isPaid(cliente: ActionCenterClient) {
  const estado = normalize(cliente.estado);

  return (
    cliente.pagado === true ||
    estado.includes("pagó") ||
    estado.includes("pago") ||
    estado.includes("pagado")
  );
}

function clientUrl(clienteId: string) {
  return `/dashboard/clientes/${clienteId}`;
}

function whatsappMessage(cliente: ActionCenterClient, context: string) {
  const nombre = cliente.nombre || "cliente";

  if (context === "overdue") {
    return `Hola ${nombre}, ¿cómo estás? Te escribo para hacer seguimiento y ver si puedo ayudarte con algo pendiente.`;
  }

  if (context === "opportunity") {
    return `Hola ${nombre}, ¿cómo estás? Quería dar seguimiento a nuestra conversación y ver si avanzamos con el próximo paso.`;
  }

  if (context === "payment") {
    return `Hola ${nombre}, ¿cómo estás? Te escribo para confirmar si ya pudiste revisar el pago pendiente.`;
  }

  return `Hola ${nombre}, ¿cómo estás? Te escribo para hacer seguimiento.`;
}

function whatsappUrl(cliente: ActionCenterClient, message: string) {
  if (!cliente.telefono) return clientUrl(cliente.id);

  return buildWhatsAppLink(cliente.telefono, message);
}

function priorityWeight(priority: ActionCenterPriority) {
  if (priority === "urgent") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;

  return 1;
}

export function buildActionCenter(
  clientes: ActionCenterClient[],
  options?: {
    maxItems?: number;
    founderMode?: boolean;
  }
): ActionCenterItem[] {
  const maxItems = options?.maxItems ?? 6;

  const items: ActionCenterItem[] = [];

  for (const cliente of clientes) {
    const nombre = cliente.nombre || "Cliente sin nombre";
    const overdueDays = daysUntil(cliente.proximo_contacto);
    const inactiveDays = daysBetween(cliente.updated_at || cliente.created_at);
    const warmLead = isWarmLead(cliente);
    const paid = isPaid(cliente);

    if (overdueDays !== null && overdueDays < 0) {
      const days = Math.abs(overdueDays);
      const message = whatsappMessage(cliente, "overdue");

      items.push({
        id: `overdue-${cliente.id}`,
        clienteId: cliente.id,
        clienteNombre: nombre,
        type: "followup",
        priority: days >= 3 ? "urgent" : "high",
        title: `${nombre} necesita seguimiento`,
        description:
          days === 1
            ? "El contacto estaba programado para ayer."
            : `El contacto está vencido hace ${days} días.`,
        actionLabel: cliente.telefono ? "Enviar WhatsApp" : "Ver cliente",
        actionHref: whatsappUrl(cliente, message),
        secondaryLabel: "Ver ficha",
        secondaryHref: clientUrl(cliente.id),
      });

      continue;
    }

    if (overdueDays === 0) {
      const message = whatsappMessage(cliente, "today");

      items.push({
        id: `today-${cliente.id}`,
        clienteId: cliente.id,
        clienteNombre: nombre,
        type: "whatsapp",
        priority: warmLead ? "high" : "medium",
        title: `${nombre} está programado para hoy`,
        description: warmLead
          ? "Cliente con señales comerciales positivas. Buen momento para avanzar."
          : "Seguimiento recomendado para mantener el ritmo comercial.",
        actionLabel: cliente.telefono ? "Enviar WhatsApp" : "Ver cliente",
        actionHref: whatsappUrl(cliente, message),
        secondaryLabel: "Ver ficha",
        secondaryHref: clientUrl(cliente.id),
      });

      continue;
    }

    if (warmLead && !paid) {
      const message = whatsappMessage(cliente, "opportunity");

      items.push({
        id: `opportunity-${cliente.id}`,
        clienteId: cliente.id,
        clienteNombre: nombre,
        type: "opportunity",
        priority: "high",
        title: `${nombre} parece una oportunidad activa`,
        description:
          "Hay señales de interés. Conviene hacer contacto antes de que pierda temperatura.",
        actionLabel: cliente.telefono ? "Enviar WhatsApp" : "Ver cliente",
        actionHref: whatsappUrl(cliente, message),
        secondaryLabel: "Ver ficha",
        secondaryHref: clientUrl(cliente.id),
      });

      continue;
    }

    if (!paid && cliente.monto && cliente.monto > 0) {
      const message = whatsappMessage(cliente, "payment");

      items.push({
        id: `payment-${cliente.id}`,
        clienteId: cliente.id,
        clienteNombre: nombre,
        type: "payment",
        priority: "medium",
        title: `${nombre} tiene pago pendiente`,
        description:
          "Hay un monto registrado, pero todavía no aparece como pagado.",
        actionLabel: cliente.telefono ? "Enviar WhatsApp" : "Ver cliente",
        actionHref: whatsappUrl(cliente, message),
        secondaryLabel: "Ver ficha",
        secondaryHref: clientUrl(cliente.id),
      });

      continue;
    }

    if (inactiveDays !== null && inactiveDays >= 7 && !paid) {
      const message = whatsappMessage(cliente, "overdue");

      items.push({
        id: `inactive-${cliente.id}`,
        clienteId: cliente.id,
        clienteNombre: nombre,
        type: "risk",
        priority: inactiveDays >= 14 ? "high" : "medium",
        title: `${nombre} está perdiendo actividad`,
        description: `Sin movimiento visible hace ${inactiveDays} días.`,
        actionLabel: cliente.telefono ? "Reactivar por WhatsApp" : "Ver cliente",
        actionHref: whatsappUrl(cliente, message),
        secondaryLabel: "Ver ficha",
        secondaryHref: clientUrl(cliente.id),
      });
    }
  }

  return items
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))
    .slice(0, maxItems);
}

export function getActionCenterSummary(items: ActionCenterItem[]) {
  const urgent = items.filter((item) => item.priority === "urgent").length;
  const high = items.filter((item) => item.priority === "high").length;
  const opportunities = items.filter(
    (item) => item.type === "opportunity"
  ).length;

  return {
    total: items.length,
    urgent,
    high,
    opportunities,
    hasCriticalFocus: urgent > 0 || high >= 3,
  };
}