import {
  buildWhatsAppMemoryProfile,
  type WhatsAppMemoryEvent,
  type WhatsAppMemoryEventType,
} from "./whatsapp-memory";

export type ClienteMemorySource = {
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

function fallbackDate(cliente: ClienteMemorySource) {
  return cliente.created_at ?? new Date().toISOString();
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

export function buildClienteMemoryProfile(cliente: ClienteMemorySource) {
  const events: WhatsAppMemoryEvent[] = [];

  if (cliente.created_at) {
    events.push({
      id: `${cliente.id}-created`,
      clienteId: cliente.id,
      date: cliente.created_at,
      type: "message_received",
      summary: "Primer contacto registrado",
    });
  }

  splitMemoryLines(cliente.notas).forEach((line, index) => {
    const type = detectEventType(line);

    events.push({
      id: `${cliente.id}-note-${index}`,
      clienteId: cliente.id,
      date: fallbackDate(cliente),
      type,
      summary: buildSummary(line, type),
    });
  });

  splitMemoryLines(cliente.recordatorio).forEach((line, index) => {
    const type = detectEventType(line);

    events.push({
      id: `${cliente.id}-reminder-${index}`,
      clienteId: cliente.id,
      date: fallbackDate(cliente),
      type: type === "note" ? "followup" : type,
      summary: buildSummary(line, type === "note" ? "followup" : type),
    });
  });

  if (cliente.proximo_contacto) {
    events.push({
      id: `${cliente.id}-next-contact`,
      clienteId: cliente.id,
      date: cliente.proximo_contacto,
      type: "promise",
      summary: "Próximo contacto acordado",
    });
  }

  if (cliente.pagado || normalize(cliente.estado).includes("pag")) {
    events.push({
      id: `${cliente.id}-paid`,
      clienteId: cliente.id,
      date: cliente.fecha_pago ?? fallbackDate(cliente),
      type: "payment",
      summary: `Pago confirmado${cliente.monto ? ` · Gs. ${cliente.monto.toLocaleString("es-PY")}` : ""}`,
    });
  }

  return buildWhatsAppMemoryProfile({
    clienteId: cliente.id,
    events,
  });
}