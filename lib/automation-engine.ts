import { createAdminClient } from "./supabase/server";

export type ClienteForAutomation = {
  id: string;
  nombre: string;
  telefono: string;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
};

export type AutomationReminder = {
  cliente: ClienteForAutomation;
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

function daysBetweenISO(from: string, to: string) {
  return Math.floor(
    (new Date(to).getTime() - new Date(from).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function normalize(value?: string | null) {
  return value?.toLowerCase().trim() || "";
}

function isPaid(cliente: ClienteForAutomation) {
  return normalize(cliente.estado).includes("pagado");
}

function isInterested(cliente: ClienteForAutomation) {
  return normalize(cliente.estado).includes("interes");
}

function isNoResponse(cliente: ClienteForAutomation) {
  return normalize(cliente.estado).includes("sin respuesta");
}

function isClosed(cliente: ClienteForAutomation) {
  return normalize(cliente.estado).includes("cerrado");
}

export function applyAutomationRules<T extends ClienteForAutomation>(
  clientes: T[]
): T[] {
  return clientes.map((cliente) => {
    if (isPaid(cliente) || isClosed(cliente)) {
      return cliente;
    }

    if (!cliente.proximo_contacto) {
      let nextDate = addDaysISO(3);
      let reminder = "Seguimiento automático en 3 días";

      if (isInterested(cliente)) {
        nextDate = addDaysISO(1);
        reminder = "Cliente interesado: responder rápido";
      }

      if (isNoResponse(cliente)) {
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
  const today = todayISO();
  const tomorrow = tomorrowISO();

  return clientes
    .map((cliente) => {
      if (isPaid(cliente) || isClosed(cliente)) {
        return null;
      }

      if (cliente.proximo_contacto && cliente.proximo_contacto < today) {
        const overdueDays = daysBetweenISO(cliente.proximo_contacto, today);

        return {
          cliente,
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
          actionType: "contactado" as const,
        };
      }

      if (cliente.proximo_contacto === today) {
        return {
          cliente,
          score: 90,
          priority: "high",
          title: "📅 Seguimiento para hoy",
          description:
            "Este cliente está programado para hoy. Conviene cerrar el contacto.",
          nextBestAction: "Abrir WhatsApp y hacer seguimiento",
          actionLabel: "Marcar listo",
          actionType: "listo" as const,
        };
      }

      if (cliente.proximo_contacto === tomorrow) {
        return {
          cliente,
          score: 75,
          priority: "medium",
          title: "🕒 Seguimiento mañana",
          description:
            "Puedes dejar listo el mensaje o preparar el siguiente paso.",
          nextBestAction: "Preparar mensaje automático",
          actionLabel: "Agendar siguiente",
          actionType: "schedule" as const,
        };
      }

      if (isInterested(cliente)) {
        return {
          cliente,
          score: 85,
          priority: "high",
          title: "🔥 Cliente interesado",
          description:
            "Este cliente mostró interés y necesita seguimiento rápido.",
          nextBestAction: "Enviar propuesta o cerrar venta",
          actionLabel: "Responder ahora",
          actionType: "contactado" as const,
        };
      }

      if (isNoResponse(cliente)) {
        return {
          cliente,
          score: 60,
          priority: "medium",
          title: "📨 Cliente sin respuesta",
          description:
            "Este cliente no respondió el último contacto.",
          nextBestAction: "Reintentar contacto en horario distinto",
          actionLabel: "Reintentar",
          actionType: "schedule" as const,
        };
      }

      return {
        cliente,
        score: 40,
        priority: "low",
        title: "Seguimiento general",
        description:
          "Cliente activo sin prioridad urgente.",
        nextBestAction: "Mantener contacto semanal",
        actionLabel: "Abrir cliente",
        actionType: "schedule" as const,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6) as AutomationReminder[];
}

export function buildDashboardAlerts(
  clientes: ClienteForAutomation[]
): DashboardAlert[] {
  const today = todayISO();
  const tomorrow = tomorrowISO();

  const activeClientes = clientes.filter(
    (c) => !isPaid(c) && !isClosed(c)
  );

  const atrasados = activeClientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto < today
  );

  const muyAtrasados = atrasados.filter(
    (c) =>
      c.proximo_contacto &&
      daysBetweenISO(c.proximo_contacto, today) >= 7
  );

  const hoy = activeClientes.filter(
    (c) => c.proximo_contacto === today
  );

  const manana = activeClientes.filter(
    (c) => c.proximo_contacto === tomorrow
  );

  const interesados = activeClientes.filter((c) =>
    isInterested(c)
  );

  const alerts: DashboardAlert[] = [];

  if (muyAtrasados.length > 0) {
    alerts.push({
      id: "very-overdue",
      tone: "red",
      title: `🚨 ${muyAtrasados.length} cliente(s) críticos`,
      description:
        "Estos clientes llevan más de 7 días sin seguimiento.",
    });
  }

  if (atrasados.length > 0) {
    alerts.push({
      id: "overdue",
      tone: "red",
      title: `🔥 ${atrasados.length} seguimiento(s) atrasado(s)`,
      description:
        "Hay clientes que requieren atención inmediata.",
    });
  }

  if (hoy.length > 0) {
    alerts.push({
      id: "today",
      tone: "amber",
      title: `📅 ${hoy.length} seguimiento(s) para hoy`,
      description:
        "Clientes programados para contactar hoy.",
    });
  }

  if (manana.length > 0) {
    alerts.push({
      id: "tomorrow",
      tone: "sky",
      title: `🕒 ${manana.length} seguimiento(s) mañana`,
      description:
        "Puedes preparar mensajes hoy.",
    });
  }

  if (interesados.length > 0) {
    alerts.push({
      id: "interested",
      tone: "emerald",
      title: `💡 ${interesados.length} cliente(s) interesados`,
      description:
        "Clientes con potencial alto de conversión.",
    });
  }

  return alerts.slice(0, 4);
}

export function getAlertClasses(tone: DashboardAlert["tone"]) {
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
  const admin = createAdminClient();
  const today = todayISO();

  const { data: dueFollowups } = await admin
    .from("scheduled_followups")
    .select("id, cliente_id, due_date, status")
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .lte("due_date", today);

  const due = dueFollowups || [];

  for (const followup of due) {
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