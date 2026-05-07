import { createAdminClient } from "./supabase/server";

export type WhatsAppLog = {
  id: string;
  user_id: string;
  cliente_id: string;
  direction: string;
  message: string;
  source: string;
  created_at: string;
};

export async function createWhatsAppLog(params: {
  userId: string;
  clienteId: string;
  message: string;
  direction?: "outgoing" | "incoming";
  source?: "manual" | "ai_preview" | "ai_template";
}) {
  const admin = createAdminClient();

  const { error } = await admin.from("whatsapp_logs").insert({
    user_id: params.userId,
    cliente_id: params.clienteId,
    message: params.message,
    direction: params.direction || "outgoing",
    source: params.source || "manual",
  });

  return { error };
}

export async function getWhatsAppLogsByCliente(params: {
  userId: string;
  clienteId: string;
  limit?: number;
}) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("whatsapp_logs")
    .select("*")
    .eq("user_id", params.userId)
    .eq("cliente_id", params.clienteId)
    .order("created_at", { ascending: false })
    .limit(params.limit || 20);

  if (error || !data) {
    return [] as WhatsAppLog[];
  }

  return data as WhatsAppLog[];
}