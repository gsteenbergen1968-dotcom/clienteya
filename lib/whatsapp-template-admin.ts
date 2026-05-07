import { createAdminClient } from "./supabase/server";
import type { WhatsAppTemplateKey } from "./ai-whatsapp";

export async function getUserWhatsAppTemplates(userId: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("whatsapp_templates")
    .select("key, content")
    .eq("user_id", userId);

  if (error || !data) {
    return {
      nuevo: "",
      hoy: "",
      pendiente: "",
      proximo: "",
      postventa: "",
    };
  }

  const map: Record<WhatsAppTemplateKey, string> = {
    nuevo: "",
    hoy: "",
    pendiente: "",
    proximo: "",
    postventa: "",
  };

  for (const row of data) {
    const key = row.key as WhatsAppTemplateKey;
    if (key in map) {
      map[key] = row.content || "";
    }
  }

  return map;
}

export async function saveUserWhatsAppTemplate(params: {
  userId: string;
  key: WhatsAppTemplateKey;
  content: string;
}) {
  const admin = createAdminClient();

  const { error } = await admin.from("whatsapp_templates").upsert(
    {
      user_id: params.userId,
      key: params.key,
      content: params.content,
    },
    {
      onConflict: "user_id,key",
    }
  );

  return { error };
}

export async function deleteUserWhatsAppTemplate(params: {
  userId: string;
  key: WhatsAppTemplateKey;
}) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("whatsapp_templates")
    .delete()
    .eq("user_id", params.userId)
    .eq("key", params.key);

  return { error };
}