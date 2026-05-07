import { createAdminClient } from "./supabase/server";

export type SuggestionActionType = "contactado" | "listo" | "schedule";

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function addDays(base: string, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export async function applySuggestionAction(params: {
  userId: string;
  clienteId: string;
  actionType: SuggestionActionType;
}) {
  const { userId, clienteId, actionType } = params;
  const admin = createAdminClient();

  if (actionType === "contactado") {
    await admin
      .from("clientes")
      .update({
        estado: "Interesado",
        proximo_contacto: addDays(todayIsoDate(), 2),
        recordatorio: "Seguimiento automático",
      })
      .eq("id", clienteId)
      .eq("user_id", userId);

    return;
  }

  if (actionType === "listo") {
    await admin
      .from("clientes")
      .update({
        estado: "Entregado",
        proximo_contacto: null,
      })
      .eq("id", clienteId)
      .eq("user_id", userId);

    return;
  }

  await admin
    .from("clientes")
    .update({
      estado: "Interesado",
      proximo_contacto: addDays(todayIsoDate(), 3),
      recordatorio: "Seguimiento automático",
    })
    .eq("id", clienteId)
    .eq("user_id", userId);
}