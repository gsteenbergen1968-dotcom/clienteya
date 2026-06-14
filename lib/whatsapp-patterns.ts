import { type WhatsAppMemoryEvent } from "./whatsapp-memory";

export type WhatsAppPatternRisk =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type WhatsAppPattern = {
  id: string;
  title: string;
  description: string;
  risk: WhatsAppPatternRisk;
  action: string;
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export function detectWhatsAppPatterns(
  events: WhatsAppMemoryEvent[],
): WhatsAppPattern[] {
  const patterns: WhatsAppPattern[] = [];

  const promises = events.filter(
    (event) => event.type === "promise",
  );

  const followups = events.filter(
    (event) => event.type === "followup",
  );

  const priceRequests = events.filter(
    (event) => event.type === "price_request",
  );

  const meetings = events.filter(
    (event) => event.type === "meeting",
  );

  const payments = events.filter(
    (event) => event.type === "payment",
  );

  const lastEvent = events[0];

  // Pattern 1
  if (promises.length >= 3) {
    patterns.push({
      id: "third-delay",
      title: "Tercer aplazamiento detectado",
      description:
        "El cliente ya pospuso varias veces la conversación o decisión.",
      risk: "high",
      action: "Contactar hoy por WhatsApp",
    });
  }

  // Pattern 2
  if (
    priceRequests.length >= 1 &&
    payments.length === 0
  ) {
    patterns.push({
      id: "interest-no-response",
      title: "Interés sin respuesta",
      description:
        "El cliente pidió información o precio, pero todavía no avanzó.",
      risk: "medium",
      action: "Enviar recordatorio",
    });
  }

  // Pattern 3
  if (
    followups.length >= 3 &&
    meetings.length === 0 &&
    payments.length === 0
  ) {
    patterns.push({
      id: "conversation-no-progress",
      title: "Conversación sin avance",
      description:
        "Hay interacción, pero no existe una decisión o siguiente paso claro.",
      risk: "medium",
      action: "Solicitar decisión concreta",
    });
  }

  // Pattern 4
  if (
    priceRequests.length > 0 &&
    followups.length > 0 &&
    payments.length === 0
  ) {
    patterns.push({
      id: "hot-client",
      title: "Cliente caliente",
      description:
        "Existe interés activo y seguimiento reciente.",
      risk: "low",
      action: "Llamar hoy",
    });
  }

  // Pattern 5
  if (
    lastEvent &&
    normalize(lastEvent.summary).includes("pago")
  ) {
    patterns.push({
      id: "converted-client",
      title: "Cliente convertido",
      description:
        "La relación ya generó ingreso confirmado.",
      risk: "low",
      action: "Mantener relación activa",
    });
  }

  return patterns;
}