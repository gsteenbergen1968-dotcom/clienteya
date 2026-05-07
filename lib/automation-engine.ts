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
  title: string;
  description: string;
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

export function applyAutomationRules<T extends ClienteForAutomation>(
  clientes: T[]
): T[] {
  return clientes.map((cliente) => {
    if (!cliente.proximo_contacto) {
      return {
        ...cliente,
        proximo_contacto: addDaysISO(3),
        recordatorio:
          cliente.recordatorio || "Seguimiento automático en 3 días",
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
      if (cliente.proximo_contacto && cliente.proximo_contacto < today) {
        return {
          cliente,
          score: 100,
          title: "Seguimiento atrasado",
          description:
            "Este cliente ya pasó su fecha de contacto y requiere atención inmediata.",
          actionLabel: "Contactar ahora",
          actionType: "contactado" as const,
        };
      }

      if (cliente.proximo_contacto === today) {
        return {
          cliente,
          score: 90,
          title: "Seguimiento para hoy",
          description:
            "Este cliente está programado para hoy. Conviene cerrar el contacto.",
          actionLabel: "Marcar listo",
          actionType: "listo" as const,
        };
      }

      if (cliente.proximo_contacto === tomorrow) {
        return {
          cliente,
          score: 75,
          title: "Preparar contacto de mañana",
          description:
            "Puedes dejar listo el mensaje o preparar el siguiente paso.",
          actionLabel: "Agendar siguiente",
          actionType: "schedule" as const,
        };
      }

      if (
        cliente.estado?.toLowerCase().includes("interes") &&
        !cliente.proximo_contacto
      ) {
        return {
          cliente,
          score: 70,
          title: "Interesado sin próxima fecha",
          description:
            "Este cliente mostró interés, pero no tiene seguimiento agendado.",
          actionLabel: "Agendar siguiente",
          actionType: "schedule" as const,
        };
      }

      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4) as AutomationReminder[];
}

export function buildDashboardAlerts(
  clientes: ClienteForAutomation[]
): DashboardAlert[] {
  const today = todayISO();
  const tomorrow = tomorrowISO();

  const atrasados = clientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto < today
  );

  const hoy = clientes.filter((c) => c.proximo_contacto === today);
  const manana = clientes.filter((c) => c.proximo_contacto === tomorrow);

  const interesadosSinFecha = clientes.filter(
    (c) => c.estado?.toLowerCase().includes("interes") && !c.proximo_contacto
  );

  const alerts: DashboardAlert[] = [];

  if (atrasados.length > 0) {
    alerts.push({
      id: "overdue",
      tone: "red",
      title: `🔥 ${atrasados.length} seguimiento(s) atrasado(s)`,
      description:
        "Hay clientes que ya pasaron su fecha de contacto. Conviene priorizarlos ahora.",
    });
  }

  if (hoy.length > 0) {
    alerts.push({
      id: "today",
      tone: "amber",
      title: `📅 ${hoy.length} seguimiento(s) para hoy`,
      description:
        "Tienes clientes programados para contactar hoy. Puedes abrir WhatsApp y avanzar rápido.",
    });
  }

  if (manana.length > 0) {
    alerts.push({
      id: "tomorrow",
      tone: "sky",
      title: `🕒 ${manana.length} seguimiento(s) para mañana`,
      description:
        "Puedes preparar mensajes ahora y dejar listo el seguimiento de mañana.",
    });
  }

  if (interesadosSinFecha.length > 0) {
    alerts.push({
      id: "interested-no-date",
      tone: "emerald",
      title: `💡 ${interesadosSinFecha.length} interesado(s) sin próxima fecha`,
      description:
        "Estos clientes mostraron interés, pero aún no tienen un próximo contacto agendado.",
    });
  }

  return alerts.slice(0, 3);
}

export function getAlertClasses(tone: DashboardAlert["tone"]) {
  if (tone === "red") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "sky") return "border-sky-200 bg-sky-50 text-sky-800";

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