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

export async function markClientContacted(
  userId: string,
  clienteId: string
): Promise<ClientActionResult> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("clientes")
    .update({
      estado: "contactado",
      proximo_contacto: addDaysISO(3),
      recordatorio: "Revisar respuesta en 3 días",
    })
    .eq("id", clienteId)
    .eq("user_id", userId);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  await admin.from("activity_logs").insert({
    user_id: userId,
    cliente_id: clienteId,
    type: "contactado",
  });

  return {
    ok: true,
    message: "Cliente marcado como contactado.",
  };
}

export async function scheduleNextFollowup(
  userId: string,
  clienteId: string,
  days = 3
): Promise<ClientActionResult> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("clientes")
    .update({
      proximo_contacto: addDaysISO(days),
      recordatorio: `Seguimiento automático en ${days} días`,
    })
    .eq("id", clienteId)
    .eq("user_id", userId);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  await admin.from("activity_logs").insert({
    user_id: userId,
    cliente_id: clienteId,
    type: "followup_scheduled",
  });

  return {
    ok: true,
    message: `Seguimiento agendado en ${days} días.`,
  };
}

export async function closeOpportunity(
  userId: string,
  clienteId: string
): Promise<ClientActionResult> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("clientes")
    .update({
      estado: "cerrado",
      proximo_contacto: null,
      recordatorio: "Oportunidad cerrada",
    })
    .eq("id", clienteId)
    .eq("user_id", userId);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  await admin.from("activity_logs").insert({
    user_id: userId,
    cliente_id: clienteId,
    type: "closed",
  });

  return {
    ok: true,
    message: "Oportunidad cerrada.",
  };
}

export async function markNoResponse(
  userId: string,
  clienteId: string
): Promise<ClientActionResult> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("clientes")
    .update({
      estado: "sin respuesta",
      proximo_contacto: addDaysISO(3),
      recordatorio: "Reintentar contacto en 3 días",
    })
    .eq("id", clienteId)
    .eq("user_id", userId);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  await admin.from("activity_logs").insert({
    user_id: userId,
    cliente_id: clienteId,
    type: "no_response",
  });

  return {
    ok: true,
    message: "Cliente marcado como sin respuesta.",
  };
}