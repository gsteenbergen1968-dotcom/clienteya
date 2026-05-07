import { createAdminClient } from "./supabase/server";

type Cliente = {
  id: string;
  user_id: string | null;
  estado: string;
  proximo_contacto: string | null;
  recordatorio: string | null;
};

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function addDays(base: string, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export async function runAutoActionsForUser(userId: string) {
  const admin = createAdminClient();
  const today = todayIsoDate();

  const { data: clientes } = await admin
    .from("clientes")
    .select("id,user_id,estado,proximo_contacto,recordatorio")
    .eq("user_id", userId);

  const rows = (clientes || []) as Cliente[];

  for (const cliente of rows) {
    const estado = cliente.estado?.toLowerCase?.() || "";

    if (estado === "pagó" || estado === "pagado" || estado === "entregado") {
      continue;
    }

    if (cliente.proximo_contacto && cliente.proximo_contacto < today) {
      await admin
        .from("clientes")
        .update({
          estado: "Interesado",
          proximo_contacto: addDays(today, 2),
          recordatorio: "Seguimiento automático",
        })
        .eq("id", cliente.id)
        .eq("user_id", userId);

      continue;
    }

    if (
      (estado === "interesado" || estado === "nuevo") &&
      !cliente.proximo_contacto
    ) {
      await admin
        .from("clientes")
        .update({
          estado: estado === "nuevo" ? "Nuevo" : "Interesado",
          proximo_contacto: addDays(today, 3),
          recordatorio: cliente.recordatorio || "Seguimiento automático",
        })
        .eq("id", cliente.id)
        .eq("user_id", userId);
    }
  }
}