import { createAdminClient } from "./supabase/server";

export type ClienteForAutomation = {
  id: string;
  nombre: string;
  telefono?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
};

export type AutomationReminder = {
  cliente: ClienteForAutomation;
  clienteId: string;
  nombre: string;
  type: "overdue" | "today" | "tomorrow" | "interested" | "no_response" | "general";
  score: number;
  priority: "urgent" | "high" | "medium" | "low";
  title: string;
  description: string;
  nextBestAction: string;
  actionLabel: string;
  actionType: "contactado" | "listo" | "schedule";
};

export type DashboardAlert = {
  id: string;
  tone: "red" | "amber" | "sky" | "emerald";
  title: string;
  description: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function tomorrowISO() {
  return addDaysISO(1);
}

function normalizeDate(value?: string | null) {
  if (!value) return "";

  return value.slice(0, 10);
}

function daysBetweenISO(from: string, to: string) {
  const fromDate = new Date(`${normalizeDate(from)}T00:00:00`);
  const toDate = new Date(`${normalizeDate(to)}T00:00:00`);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return 0;
  }

  return Math.floor(
    (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function normalize(value?: string | null) {
  return (value || "").toLowerCase().trim();
}

function getSafeCliente(cliente: ClienteForAutomation): ClienteForAutomation {
  return {
    id: cliente.id || "",
    nombre: cliente.nombre || "Cliente sin nombre",
    telefono: cliente.telefono || "",
    estado: cliente.estado || "Nuevo",
    notas: cliente.notas || null,
    recordatorio: cliente.recordatorio || null,
    proximo_contacto: normalizeDate(cliente.proximo_contacto) || null,
  };
}

function isPaid(cliente: ClienteForAutomation) {
  const estado = normalize(cliente.estado);

  return estado.includes("pag") || estado.includes("pagó");
}

function isInterested(cliente: ClienteForAutomation) {
  const estado = normalize(cliente.estado);

  return estado.includes("interes") || estado.includes("interés");
}

function isNoResponse(cliente: ClienteForAutomation) {
  const estado = normalize(cliente.estado);

  return estado.includes("sin");
}

function isClosed(cliente: ClienteForAutomation) {
  const estado = normalize(cliente.estado);

  return estado.includes("cerr");
}

function buildReminder(
  cliente: ClienteForAutomation,
  data: Omit<AutomationReminder, "cliente" | "clienteId" | "nombre">
): AutomationReminder {
  const safeCliente = getSafeCliente(cliente);

  return {
    cliente: safeCliente,
    clienteId: safeCliente.id,
    nombre: safeCliente.nombre,
    ...data,
  };
}

export function applyAutomationRules<T extends ClienteForAutomation>(
  clientes: T[]
): T[] {
  const safeClientes = Array.isArray(clientes) ? clientes : [];

  return safeClientes.map((cliente) => {
    const safeCliente = getSafeCliente(cliente);

    if (isPaid(safeCliente) || isClosed(safeCliente)) {
      return cliente;
    }

    if (!safeCliente.proximo_contacto) {
      let nextDate = addDaysISO(3);
      let reminder = "Seguimiento automático en 3 días";

      if (isInterested(safeCliente)) {
        nextDate = addDaysISO(1);
        reminder = "Cliente interesado: responder rápido";
      }

      if (isNoResponse(safeCliente)) {
        nextDate = addDaysISO(3);
        reminder = "Reintentar contacto en 3 días";
      }

      return {
        ...cliente,
        proximo_contacto: nextDate,
        recordatorio: cliente.recordatorio || reminder,
      };
    }

    return cliente;
  });
}

export function buildAutomationReminders(
  clientes: ClienteForAutomation[]
): AutomationReminder[] {
  const safeClientes = Array.isArray(clientes) ? clientes : [];
  const today = todayISO();
  const tomorrow = tomorrowISO();

  return safeClientes
    .map((cliente) => {
      const safeCliente = getSafeCliente(cliente);
      const proximoContacto = normalizeDate(safeCliente.proximo_contacto);

      if (!safeCliente.id) return null;

      if (isPaid(safeCliente) || isClosed(safeCliente)) {
        return null;
      }

      if (proximoContacto && proximoContacto < today) {
        const overdueDays = daysBetweenISO(proximoContacto, today);

        return buildReminder(safeCliente, {
          type: "overdue",
          score: 100 + overdueDays,
          priority: overdueDays >= 7 ? "urgent" : "high",
          title:
            overdueDays >= 7
              ? "🚨 Cliente muy atrasado"
              : "🔴 Seguimiento atrasado",
          description:
            overdueDays >= 7
              ? "Este cliente necesita atención urgente inmediata."
              : "Este cliente ya pasó su fecha de contacto.",
          nextBestAction:
            overdueDays >= 7
              ? "Llamar directamente al cliente"
              : "Enviar mensaje hoy",
          actionLabel: "Contactar ahora",
          actionType: "contactado",
        });
      }

      if (proximoContacto === today) {
        return buildReminder(safeCliente, {
          type: "today",
          score: 90,
          priority: "high",
          title: "📅 Seguimiento para hoy",
          description:
            "Este cliente está programado para hoy. Conviene cerrar el contacto.",
          nextBestAction: "Abrir WhatsApp y hacer seguimiento",
          actionLabel: "Marcar listo",
          actionType: "listo",
        });
      }

      if (proximoContacto === tomorrow) {
        return buildReminder(safeCliente, {
          type: "tomorrow",
          score: 75,
          priority: "medium",
          title: "🕒 Seguimiento mañana",
          description:
            "Puedes dejar listo el mensaje o preparar el siguiente paso.",
          nextBestAction: "Preparar mensaje automático",
          actionLabel: "Agendar siguiente",
          actionType: "schedule",
        });
      }

      if (isInterested(safeCliente)) {
        return buildReminder(safeCliente, {
          type: "interested",
          score: 85,
          priority: "high",
          title: "🔥 Cliente interesado",
          description:
            "Este cliente mostró interés y necesita seguimiento rápido.",
          nextBestAction: "Enviar propuesta o cerrar venta",
          actionLabel: "Responder ahora",
          actionType: "contactado",
        });
      }

      if (isNoResponse(safeCliente)) {
        return buildReminder(safeCliente, {
          type: "no_response",
          score: 60,
          priority: "medium",
          title: "📨 Cliente sin respuesta",
          description: "Este cliente no respondió el último contacto.",
          nextBestAction: "Reintentar contacto en horario distinto",
          actionLabel: "Reintentar",
          actionType: "schedule",
        });
      }

      return buildReminder(safeCliente, {
        type: "general",
        score: 40,
        priority: "low",
        title: "Seguimiento general",
        description: "Cliente activo sin prioridad urgente.",
        nextBestAction: "Mantener contacto semanal",
        actionLabel: "Abrir cliente",
        actionType: "schedule",
      });
    })
    .filter((reminder): reminder is AutomationReminder => Boolean(reminder))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export function buildDashboardAlerts(
  clientes: ClienteForAutomation[]
): DashboardAlert[] {
  const safeClientes = Array.isArray(clientes) ? clientes : [];
  const today = todayISO();
  const tomorrow = tomorrowISO();

  const activeClientes = safeClientes
    .map(getSafeCliente)
    .filter((c) => c.id && !isPaid(c) && !isClosed(c));

  const atrasados = activeClientes.filter((c) => {
    const date = normalizeDate(c.proximo_contacto);

    return date && date < today;
  });

  const muyAtrasados = atrasados.filter((c) => {
    const date = normalizeDate(c.proximo_contacto);

    return date && daysBetweenISO(date, today) >= 7;
  });

  const hoy = activeClientes.filter(
    (c) => normalizeDate(c.proximo_contacto) === today
  );

  const manana = activeClientes.filter(
    (c) => normalizeDate(c.proximo_contacto) === tomorrow
  );

  const interesados = activeClientes.filter((c) => isInterested(c));

  const alerts: DashboardAlert[] = [];

  if (muyAtrasados.length > 0) {
    alerts.push({
      id: "very-overdue",
      tone: "red",
      title: `🚨 ${muyAtrasados.length} cliente(s) críticos`,
      description: "Estos clientes llevan más de 7 días sin seguimiento.",
    });
  }

  if (atrasados.length > 0) {
    alerts.push({
      id: "overdue",
      tone: "red",
      title: `🔥 ${atrasados.length} seguimiento(s) atrasado(s)`,
      description: "Hay clientes que requieren atención inmediata.",
    });
  }

  if (hoy.length > 0) {
    alerts.push({
      id: "today",
      tone: "amber",
      title: `📅 ${hoy.length} seguimiento(s) para hoy`,
      description: "Clientes programados para contactar hoy.",
    });
  }

  if (manana.length > 0) {
    alerts.push({
      id: "tomorrow",
      tone: "sky",
      title: `🕒 ${manana.length} seguimiento(s) mañana`,
      description: "Puedes preparar mensajes hoy.",
    });
  }

  if (interesados.length > 0) {
    alerts.push({
      id: "interested",
      tone: "emerald",
      title: `💡 ${interesados.length} cliente(s) interesados`,
      description: "Clientes con potencial alto de conversión.",
    });
  }

  return alerts.slice(0, 4);
}

export function getAlertClasses(tone: DashboardAlert["tone"] | null | undefined) {
  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (tone === "sky") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export async function runDueAutomations(userId: string) {
  if (!userId) {
    return {
      processed: 0,
    };
  }

  const admin = createAdminClient();
  const today = todayISO();

  const { data: dueFollowups } = await admin
    .from("scheduled_followups")
    .select("id, cliente_id, due_date, status")
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .lte("due_date", today);

  const due = Array.isArray(dueFollowups) ? dueFollowups : [];

  for (const followup of due) {
    if (!followup.id || !followup.cliente_id) continue;

    await admin
      .from("scheduled_followups")
      .update({ status: "due" })
      .eq("id", followup.id)
      .eq("user_id", userId);

    await admin
      .from("clientes")
      .update({
        recordatorio: "Follow-up automático listo para enviar",
      })
      .eq("id", followup.cliente_id)
      .eq("user_id", userId);

    await admin.from("activity_logs").insert({
      user_id: userId,
      cliente_id: followup.cliente_id,
      type: "followup",
    });
  }

  return {
    processed: due.length,
  };
}