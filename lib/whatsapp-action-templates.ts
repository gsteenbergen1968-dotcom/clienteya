import { type WhatsAppPattern } from "./whatsapp-patterns";

export type WhatsAppActionTemplateType =
  | "followup"
  | "reminder"
  | "decision"
  | "reactivation"
  | "closing"
  | "relationship";

export type WhatsAppActionTemplate = {
  id: string;
  type: WhatsAppActionTemplateType;
  title: string;
  description: string;
  message: string;
};

export type WhatsAppActionTemplateInput = {
  clienteNombre?: string | null;
  pattern?: WhatsAppPattern | null;
};

function getName(value: string | null | undefined) {
  return value?.trim() || "cliente";
}

export function buildWhatsAppActionTemplate({
  clienteNombre,
  pattern,
}: WhatsAppActionTemplateInput): WhatsAppActionTemplate {
  const name = getName(clienteNombre);

  if (pattern?.id === "third-delay") {
    return {
      id: "third-delay-template",
      type: "reactivation",
      title: "Recuperar conversación",
      description:
        "Mensaje corto para recuperar una conversación que fue aplazada varias veces.",
      message: `Hola ${name}, ¿seguimos con esto esta semana?

Te escribo para confirmar si todavía te interesa avanzar o si prefieres que lo dejemos para más adelante.`,
    };
  }

  if (pattern?.id === "interest-no-response") {
    return {
      id: "interest-no-response-template",
      type: "reminder",
      title: "Enviar recordatorio",
      description:
        "Mensaje amable para recuperar momentum después de una consulta de precio o información.",
      message: `Hola ${name}, ¿cómo estás?

Solo quería saber si todavía te interesa la información que vimos.

Quedo atento.`,
    };
  }

  if (pattern?.id === "conversation-no-progress") {
    return {
      id: "conversation-no-progress-template",
      type: "decision",
      title: "Pedir decisión concreta",
      description:
        "Mensaje para convertir conversación en próximo paso claro.",
      message: `Hola ${name}, para avanzar de forma ordenada, ¿te parece si definimos el próximo paso?

Puede ser una llamada corta o una confirmación por aquí.`,
    };
  }

  if (pattern?.id === "hot-client") {
    return {
      id: "hot-client-template",
      type: "closing",
      title: "Avanzar al cierre",
      description:
        "Mensaje directo para un cliente con señales activas de interés.",
      message: `Hola ${name}, creo que estamos en buen momento para avanzar.

¿Te parece si cerramos el próximo paso hoy?`,
    };
  }

  if (pattern?.id === "converted-client") {
    return {
      id: "converted-client-template",
      type: "relationship",
      title: "Mantener relación activa",
      description:
        "Mensaje para cuidar la relación después de una conversión o pago.",
      message: `Hola ${name}, gracias nuevamente por la confianza.

Quedo atento por si necesitas algo más.`,
    };
  }

  return {
    id: "default-followup-template",
    type: "followup",
    title: "Seguimiento amable",
    description:
      "Mensaje simple para retomar una conversación comercial sin presión.",
    message: `Hola ${name}, ¿cómo estás?

Te escribo para dar seguimiento y ver si puedo ayudarte con algo más.`,
  };
}

export function buildWhatsAppShareUrl(params: {
  telefono?: string | null;
  message: string;
}) {
  const raw = String(params.telefono || "").replace(/\D/g, "");

  let phone = raw;

  if (phone.startsWith("00")) phone = phone.slice(2);
  if (phone.startsWith("0")) phone = phone.slice(1);
  if (phone && !phone.startsWith("595")) phone = `595${phone}`;

  const encodedMessage = encodeURIComponent(params.message);

  if (!phone) {
    return `https://wa.me/?text=${encodedMessage}`;
  }

  return `https://wa.me/${phone}?text=${encodedMessage}`;
}