export type WhatsAppTemplateKey =
  | "nuevo"
  | "hoy"
  | "pendiente"
  | "proximo"
  | "postventa";

export type BusinessType =
  | "ventas_generales"
  | "inmobiliaria"
  | "servicios"
  | "salud_belleza"
  | "automotriz"
  | "educacion"
  | "otro";

export type BusinessTone = "formal" | "cercano" | "vendedor";

function getBusinessContext(businessType: string | null | undefined) {
  switch (businessType) {
    case "inmobiliaria":
      return {
        subject: "la propiedad",
        CTA: "agendar una visita",
      };
    case "servicios":
      return {
        subject: "el servicio",
        CTA: "coordinar el siguiente paso",
      };
    default:
      return {
        subject: "tu consulta",
        CTA: "avanzar con el siguiente paso",
      };
  }
}

function getToneParts(tone: string | null | undefined) {
  switch (tone) {
    case "formal":
      return {
        hello: "Hola {{nombre}},",
        close: "Quedo atento.",
      };
    case "vendedor":
      return {
        hello: "Hola {{nombre}}!",
        close: "¿Avanzamos hoy?",
      };
    default:
      return {
        hello: "Hola {{nombre}} 👋",
        close: "Quedo atento 😊",
      };
  }
}

/**
 * 🔥 NIEUW: sterke prompt engine
 */
function applyPromptModifiers(
  template: string,
  aiPrompt: string | null | undefined
) {
  const prompt = (aiPrompt || "").toLowerCase();
  let result = template;

  // 🔹 1. BREVE / CORTO
  if (prompt.includes("breve") || prompt.includes("corto")) {
    const lines = result.split("\n").filter((l) => l.trim() !== "");
    result = lines.slice(0, 3).join("\n");
  }

  // 🔹 2. SIN EMOJIS
  if (prompt.includes("sin emojis")) {
    result = result
      .replaceAll("👋", "")
      .replaceAll("😊", "")
      .replaceAll("!", ".");
  }

  // 🔹 3. MAS VENDEDOR
  if (prompt.includes("vendedor") || prompt.includes("ventas")) {
    result += "\n👉 Podemos avanzar ahora si quieres.";
  }

  // 🔹 4. MAS HUMANO
  if (prompt.includes("humano") || prompt.includes("amable")) {
    result = result.replaceAll(
      "Quedo atento.",
      "Quedo atento, con gusto te ayudo."
    );
  }

  // 🔹 5. MAS DIRECTO
  if (prompt.includes("directo")) {
    result = result.replaceAll(
      "Te escribo para ayudarte",
      "Voy directo:"
    );
  }

  // 🔹 6. PROFESIONAL
  if (prompt.includes("profesional")) {
    result = result.replaceAll("Hola", "Estimado");
  }

  return result.trim();
}

export function buildAssistantTemplate(params: {
  key: WhatsAppTemplateKey;
  businessType?: string | null;
  businessTone?: string | null;
  aiPrompt?: string | null;
}) {
  const { key, businessType, businessTone, aiPrompt } = params;

  const context = getBusinessContext(businessType);
  const tone = getToneParts(businessTone);

  let template = "";

  if (key === "nuevo") {
    template = `${tone.hello}

Gracias por tu interés en ${context.subject}.
Te escribo para ayudarte con el siguiente paso.

${tone.close}`;
  }

  if (key === "proximo") {
    template = `${tone.hello}

Te escribo para recordarte el siguiente paso.
Podemos ${context.CTA}.

${tone.close}`;
  }

  if (key === "pendiente") {
    template = `${tone.hello}

Quedó pendiente tu seguimiento.
Si quieres, puedo ayudarte a ${context.CTA}.

${tone.close}`;
  }

  if (key === "hoy") {
    template = `${tone.hello}

Hoy teníamos pendiente el seguimiento.
¿Te viene bien avanzar?

${tone.close}`;
  }

  if (key === "postventa") {
    template = `${tone.hello}

Solo quería confirmar que todo esté correcto.
Estoy disponible si necesitas algo más.

${tone.close}`;
  }

  // 🔥 HIER gebeurt de magie
  return applyPromptModifiers(template, aiPrompt);
}

export function normalizeBusinessType(value: string | null | undefined): BusinessType {
  const allowed: BusinessType[] = [
    "ventas_generales",
    "inmobiliaria",
    "servicios",
    "salud_belleza",
    "automotriz",
    "educacion",
    "otro",
  ];

  if (allowed.includes((value || "") as BusinessType)) {
    return value as BusinessType;
  }

  return "ventas_generales";
}

export function normalizeBusinessTone(value: string | null | undefined): BusinessTone {
  const allowed: BusinessTone[] = ["formal", "cercano", "vendedor"];

  if (allowed.includes((value || "") as BusinessTone)) {
    return value as BusinessTone;
  }

  return "cercano";
}