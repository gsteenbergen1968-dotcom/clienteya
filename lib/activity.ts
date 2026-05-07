import { createAdminClient } from "./supabase/server";

export type ActivityType =
  | "ai_message"
  | "contacted"
  | "followup"
  | "whatsapp_opened";

export async function logActivity({
  userId,
  type,
  clienteId,
}: {
  userId: string;
  type: ActivityType;
  clienteId?: string;
}) {
  const admin = createAdminClient();

  await admin.from("activity_logs").insert({
    user_id: userId,
    type,
    cliente_id: clienteId || null,
  });
}

export async function getWeeklyStats(userId: string) {
  const admin = createAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data } = await admin
    .from("activity_logs")
    .select("type")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());

  const stats = {
    ai: 0,
    contacted: 0,
    followup: 0,
    whatsapp: 0,
  };

  (data || []).forEach((row) => {
    if (row.type === "ai_message") stats.ai++;
    if (row.type === "contacted") stats.contacted++;
    if (row.type === "followup") stats.followup++;
    if (row.type === "whatsapp_opened") stats.whatsapp++;
  });

  return stats;
}