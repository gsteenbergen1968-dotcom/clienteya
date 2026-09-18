import { createAdminClient } from "./supabase/server";
import { buildAssistantMessage } from "./whatsapp-assistant";

export async function scheduleAutoFollowup({
  userId,
  relationshipId,
  days = 3,
}: {
  userId: string;
  relationshipId: string;
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

  const { data: relationship } = await admin
    .from("relationships")
    .select("*")
    .eq("id", relationshipId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!relationship) return null;

  const ai = await buildAssistantMessage({
    userId,
    relationship: {
      ...relationship,
      estado: "Sin respuesta",
      proximo_contacto: dueDate,
      recordatorio: "Seguimiento automático pendiente",
    },
  });

  await admin.from("scheduled_followups").insert({
    user_id: userId,
    relationship_id: relationshipId,
    due_date: dueDate,
    status: "scheduled",
    message: ai.message,
  });

  return {
    dueDate,
    message: ai.message,
  };
}