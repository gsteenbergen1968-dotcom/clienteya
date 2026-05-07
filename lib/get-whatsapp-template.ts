import { createAdminClient } from "./supabase/server";
import {
  buildAssistantTemplate,
  normalizeBusinessTone,
  normalizeBusinessType,
  type WhatsAppTemplateKey,
} from "./ai-whatsapp";

export async function getTemplate(
  userId: string,
  key: WhatsAppTemplateKey
): Promise<string | null> {
  const admin = createAdminClient();

  try {
    const { data: savedTemplate } = await admin
      .from("whatsapp_templates")
      .select("content")
      .eq("user_id", userId)
      .eq("key", key)
      .maybeSingle();

    if (savedTemplate?.content) {
      return savedTemplate.content;
    }
  } catch {
    // ignore missing table or lookup issues
  }

  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("business_type, business_tone")
      .eq("id", userId)
      .maybeSingle();

    const businessType = normalizeBusinessType(profile?.business_type);
    const businessTone = normalizeBusinessTone(profile?.business_tone);

    return buildAssistantTemplate({
      key,
      businessType,
      businessTone,
    });
  } catch {
    return buildAssistantTemplate({
      key,
      businessType: "ventas_generales",
      businessTone: "cercano",
    });
  }
}

export function renderTemplate(
  template: string,
  data: {
    nombre?: string | null;
    nota?: string | null;
    fecha?: string | null;
  }
) {
  return template
    .replaceAll("{{nombre}}", data.nombre || "cliente")
    .replaceAll("{{nota}}", data.nota || "Sin nota")
    .replaceAll("{{fecha}}", data.fecha || "sin fecha");
}