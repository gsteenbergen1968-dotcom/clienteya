import { createAdminClient } from "./supabase/server";

function addDaysISO(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type ClientActionResult = {
  ok: boolean;
  message: string;
};

type ClienteActionRow = {
  id: string;
  user_id?: string | null;
  estado?: string | null;
  proximo_contacto?: string | null;
  recordatorio?: string | null;
};

function logAction(label: string, payload: unknown) {
  console.log(`[CLIENT ACTION] ${label}:`, payload);
}

async function insertActivityLog({
  actorUserId,
  cliente,
  type,
}: {
  actorUserId: string;
  cliente: ClienteActionRow;
  type: string;
}) {
  const admin = createAdminClient();

  const { error } = await admin.from("activity_logs").insert({
    user_id: cliente.user_id || actorUserId,
    cliente_id: cliente.id,
    type,
  });

  if (error) {
    logAction("activity_log_error", error.message);
  }
}

function emptyUpdateResult(action: string): ClientActionResult {
  return {
    ok: false,
    message: `${action}: no se actualizó ningún cliente.`,
  };
}

export async function markClientContacted(
  userId: string,
  clienteId: string,
): Promise<ClientActionResult> {
  const admin = createAdminClient();

  logAction("contactado_input", {
    userId,
    clienteId,
    nextDate: addDaysISO(3),
  });

  const { data, error } = await admin
    .from("clientes")
    .update({
      estado: "Contactado",
      proximo_contacto: addDaysISO(3),
      recordatorio: "Revisar respuesta en 3 días",
    })
    .eq("id", clienteId)
    .select("id,user_id,estado,proximo_contacto,recordatorio")
    .maybeSingle();

  logAction("contactado_result", {
    data,
    error: error?.message || null,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  const cliente = data as ClienteActionRow | null;

  if (!cliente) {
    return emptyUpdateResult("Contactado");
  }

  await insertActivityLog({
    actorUserId: userId,
    cliente,
    type: "contactado",
  });

  return {
    ok: true,
    message: `Cliente marcado como Contactado. Próximo contacto: ${
      cliente.proximo_contacto || "—"
    }`,
  };
}

export async function scheduleNextFollowup(
  userId: string,
  clienteId: string,
  days = 3,
): Promise<ClientActionResult> {
  const admin = createAdminClient();

  logAction("schedule_input", {
    userId,
    clienteId,
    days,
    nextDate: addDaysISO(days),
  });

  const { data, error } = await admin
    .from("clientes")
    .update({
      proximo_contacto: addDaysISO(days),
      recordatorio: `Seguimiento automático en ${days} días`,
    })
    .eq("id", clienteId)
    .select("id,user_id,estado,proximo_contacto,recordatorio")
    .maybeSingle();

  logAction("schedule_result", {
    data,
    error: error?.message || null,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  const cliente = data as ClienteActionRow | null;

  if (!cliente) {
    return emptyUpdateResult(`+${days} días`);
  }

  await insertActivityLog({
    actorUserId: userId,
    cliente,
    type: "followup_scheduled",
  });

  return {
    ok: true,
    message: `Seguimiento agendado en ${days} días. Próximo contacto: ${
      cliente.proximo_contacto || "—"
    }`,
  };
}

export async function closeOpportunity(
  userId: string,
  clienteId: string,
): Promise<ClientActionResult> {
  const admin = createAdminClient();

  logAction("close_input", {
    userId,
    clienteId,
  });

  const { data, error } = await admin
    .from("clientes")
    .update({
      estado: "Cerrado",
      proximo_contacto: null,
      recordatorio: "Oportunidad cerrada",
    })
    .eq("id", clienteId)
    .select("id,user_id,estado,proximo_contacto,recordatorio")
    .maybeSingle();

  logAction("close_result", {
    data,
    error: error?.message || null,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  const cliente = data as ClienteActionRow | null;

  if (!cliente) {
    return emptyUpdateResult("Cerrado");
  }

  await insertActivityLog({
    actorUserId: userId,
    cliente,
    type: "closed",
  });

  return {
    ok: true,
    message: "Oportunidad cerrada.",
  };
}

export async function markNoResponse(
  userId: string,
  clienteId: string,
): Promise<ClientActionResult> {
  const admin = createAdminClient();

  logAction("no_response_input", {
    userId,
    clienteId,
    nextDate: addDaysISO(3),
  });

  const { data, error } = await admin
    .from("clientes")
    .update({
      estado: "Sin respuesta",
      proximo_contacto: addDaysISO(3),
      recordatorio: "Reintentar contacto en 3 días",
    })
    .eq("id", clienteId)
    .select("id,user_id,estado,proximo_contacto,recordatorio")
    .maybeSingle();

  logAction("no_response_result", {
    data,
    error: error?.message || null,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  const cliente = data as ClienteActionRow | null;

  if (!cliente) {
    return emptyUpdateResult("Sin respuesta");
  }

  await insertActivityLog({
    actorUserId: userId,
    cliente,
    type: "no_response",
  });

  return {
    ok: true,
    message: `Cliente marcado como Sin respuesta. Próximo contacto: ${
      cliente.proximo_contacto || "—"
    }`,
  };
}