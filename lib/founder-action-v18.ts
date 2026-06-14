import { type WhatsAppPattern } from "./whatsapp-patterns";

export type FounderActionV18Urgency = "Crítica" | "Alta" | "Media" | "Baja";

export type FounderActionV18 = {
  title: string;
  description: string;
  urgency: FounderActionV18Urgency;
  actionLabel: string;
  reason: string;
};

export function buildFounderActionFromPatterns(
  patterns: WhatsAppPattern[],
): FounderActionV18 | null {
  const critical = patterns.find((pattern) => pattern.risk === "critical");
  const high = patterns.find((pattern) => pattern.risk === "high");
  const medium = patterns.find((pattern) => pattern.risk === "medium");
  const low = patterns.find((pattern) => pattern.risk === "low");

  const selected = critical ?? high ?? medium ?? low;

  if (!selected) return null;

  if (selected.id === "third-delay") {
    return {
      title: "Contactar hoy",
      description:
        "El cliente ya aplazó varias veces. La relación necesita una acción directa antes de perder momentum.",
      urgency: "Alta",
      actionLabel: "Enviar WhatsApp hoy",
      reason: selected.title,
    };
  }

  if (selected.id === "interest-no-response") {
    return {
      title: "Enviar recordatorio",
      description:
        "El cliente mostró interés, pero todavía no avanzó. Conviene recuperar la conversación con un mensaje corto.",
      urgency: "Media",
      actionLabel: "Enviar recordatorio por WhatsApp",
      reason: selected.title,
    };
  }

  if (selected.id === "conversation-no-progress") {
    return {
      title: "Pedir decisión concreta",
      description:
        "Hay interacción, pero falta un siguiente paso claro. La acción correcta es pedir una decisión simple.",
      urgency: "Media",
      actionLabel: "Solicitar próximo paso",
      reason: selected.title,
    };
  }

  if (selected.id === "hot-client") {
    return {
      title: "Llamar hoy",
      description:
        "El cliente muestra señales activas de interés. Es buen momento para avanzar hacia cierre.",
      urgency: "Alta",
      actionLabel: "Llamar o enviar WhatsApp",
      reason: selected.title,
    };
  }

  if (selected.id === "converted-client") {
    return {
      title: "Mantener relación activa",
      description:
        "El cliente ya generó ingreso. La prioridad es cuidar la relación y abrir recompra o recomendación.",
      urgency: "Baja",
      actionLabel: "Enviar mensaje de seguimiento",
      reason: selected.title,
    };
  }

  return {
    title: selected.action,
    description: selected.description,
    urgency:
      selected.risk === "critical"
        ? "Crítica"
        : selected.risk === "high"
          ? "Alta"
          : selected.risk === "medium"
            ? "Media"
            : "Baja",
    actionLabel: selected.action,
    reason: selected.title,
  };
}