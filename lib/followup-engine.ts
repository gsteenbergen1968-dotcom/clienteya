import { createAdminClient } from "./supabase/server";
import { buildAssistantMessage } from "./whatsapp-assistant";

export async function scheduleAutoFollowup({
  userId,
  clienteId,
  days = 3,
}: {
  userId: string;
  clienteId: string;
  days?: number;
}) {
  const admin = createAdminClient();

  const due = new Date();
  due.setDate(due.getDate() + days);

  const dueDate = [
    due.getFullYear(),
    String(due.getMonth() + 1).padStart(2, "0"),
    String(due.getDate()).padStart(2, "0"),
  ].join("-");

  const { data: cliente } = await admin
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!cliente) return null;

  const ai = await buildAssistantMessage({
    userId,
    cliente: {
      ...cliente,
      estado: "Sin respuesta",
      proximo_contacto: dueDate,
      recordatorio: "Seguimiento automático pendiente",
    },
  });

  await admin.from("scheduled_followups").insert({
    user_id: userId,
    cliente_id: clienteId,
    due_date: dueDate,
    status: "scheduled",
    message: ai.message,
  });

  return {
    dueDate,
    message: ai.message,
  };
}