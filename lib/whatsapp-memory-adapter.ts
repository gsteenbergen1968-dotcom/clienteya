import {
  buildWhatsAppMemoryProfile,
  type WhatsAppMemoryEvent,
  type WhatsAppMemoryEventType,
} from "./whatsapp-memory";

export type RelationshipMemorySource = {
  id: string;
  nombre?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  created_at?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function fallbackDate(relationship: RelationshipMemorySource) {
  return relationship.created_at ?? new Date().toISOString();
}

function detectEventType(text: string): WhatsAppMemoryEventType {
  const value = normalize(text);

  if (
    value.includes("precio") ||
    value.includes("costo") ||
    value.includes("presupuesto") ||
    value.includes("cotización") ||
    value.includes("cotizacion")
  ) {
    return "price_request";
  }

  if (
    value.includes("mañana") ||
    value.includes("manana") ||
    value.includes("próxima semana") ||
    value.includes("proxima semana") ||
    value.includes("siguiente semana") ||
    value.includes("después") ||
    value.includes("despues") ||
    value.includes("luego") ||
    value.includes("te aviso") ||
    value.includes("más tarde") ||
    value.includes("mas tarde")
  ) {
    return "promise";
  }

  if (
    value.includes("whatsapp") ||
    value.includes("mensaje") ||
    value.includes("seguimiento") ||
    value.includes("contactar") ||
    value.includes("llamar")
  ) {
    return "followup";
  }

  if (
    value.includes("pago") ||
    value.includes("pagó") ||
    value.includes("pago recibido") ||
    value.includes("transferencia")
  ) {
    return "payment";
  }

  if (
    value.includes("reunión") ||
    value.includes("reunion") ||
    value.includes("visita") ||
    value.includes("cita")
  ) {
    return "meeting";
  }

  return "note";
}

function buildSummary(text: string, type: WhatsAppMemoryEventType) {
  const clean = text.trim();

  if (!clean) return "Interacción registrada";

  if (type === "price_request") return `Precio solicitado: ${clean}`;
  if (type === "promise") return `Compromiso detectado: ${clean}`;
  if (type === "followup") return `Seguimiento registrado: ${clean}`;
  if (type === "payment") return `Pago registrado: ${clean}`;
  if (type === "meeting") return `Reunión o cita registrada: ${clean}`;

  return clean;
}

function splitMemoryLines(value: string | null | undefined) {
  if (!value?.trim()) return [];

  return value
    .split(/\n|\.|;|\|/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function buildRelationshipMemoryProfile(
  relationship: RelationshipMemorySource
) {
  const events: WhatsAppMemoryEvent[] = [];

  if (relationship.created_at) {
    events.push({
      id: `${relationship.id}-created`,
      relationshipId: relationship.id,
      date: relationship.created_at,
      type: "message_received",
      summary: "Primer contacto registrado",
    });
  }

  splitMemoryLines(relationship.notas).forEach((line, index) => {
    const type = detectEventType(line);

    events.push({
      id: `${relationship.id}-note-${index}`,
      relationshipId: relationship.id,
      date: fallbackDate(relationship),
      type,
      summary: buildSummary(line, type),
    });
  });

  splitMemoryLines(relationship.recordatorio).forEach((line, index) => {
    const type = detectEventType(line);
    const eventType: WhatsAppMemoryEventType =
      type === "note" ? "followup" : type;

    events.push({
      id: `${relationship.id}-reminder-${index}`,
      relationshipId: relationship.id,
      date: fallbackDate(relationship),
      type: eventType,
      summary: buildSummary(line, eventType),
    });
  });

  if (relationship.proximo_contacto) {
    events.push({
      id: `${relationship.id}-next-contact`,
      relationshipId: relationship.id,
      date: relationship.proximo_contacto,
      type: "promise",
      summary: "Próximo contacto acordado",
    });
  }

  if (
    relationship.pagado ||
    normalize(relationship.estado).includes("pag")
  ) {
    events.push({
      id: `${relationship.id}-paid`,
      relationshipId: relationship.id,
      date: relationship.fecha_pago ?? fallbackDate(relationship),
      type: "payment",
      summary: `Pago confirmado${
        relationship.monto
          ? ` · Gs. ${relationship.monto.toLocaleString("es-PY")}`
          : ""
      }`,
    });
  }

  return buildWhatsAppMemoryProfile({
    relationshipId: relationship.id,
    events,
  });
}