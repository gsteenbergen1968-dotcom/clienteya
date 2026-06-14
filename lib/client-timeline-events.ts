export type ClientTimelineEventType =
  | "created"
  | "status"
  | "followup"
  | "payment"
  | "note"
  | "risk"
  | "opportunity";

export type ClientTimelineEventTone =
  | "slate"
  | "blue"
  | "amber"
  | "emerald"
  | "red"
  | "violet";

export type ClientTimelineEvent = {
  id: string;
  clienteId: string;
  title: string;
  description: string;
  type: ClientTimelineEventType;
  tone: ClientTimelineEventTone;
  date?: string | null;
};

export type ClienteForClientTimeline = {
  id: string;
  nombre?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function formatGs(value: number) {
  return `Gs.\u00A0${value.toLocaleString("es-PY")}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "sin fecha";

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function isRiskSignal(cliente: ClienteForClientTimeline) {
  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);

  return (
    estado.includes("riesgo") ||
    estado.includes("inactivo") ||
    estado.includes("sin respuesta") ||
    notas.includes("no responde") ||
    notas.includes("problema") ||
    notas.includes("cancelar")
  );
}

function isOpportunitySignal(cliente: ClienteForClientTimeline) {
  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);

  return (
    estado.includes("interes") ||
    estado.includes("lead") ||
    estado.includes("nuevo") ||
    notas.includes("interesado") ||
    notas.includes("precio") ||
    notas.includes("presupuesto") ||
    notas.includes("cotización") ||
    notas.includes("cotizacion")
  );
}

export function buildClientTimelineEvents(
  cliente: ClienteForClientTimeline
): ClientTimelineEvent[] {
  const events: ClientTimelineEvent[] = [];
  const name = cliente.nombre || "Cliente sin nombre";

  if (cliente.created_at) {
    events.push({
      id: `created-${cliente.id}`,
      clienteId: cliente.id,
      title: "Cliente creado",
      description: `${name} fue agregado al sistema el ${formatDate(
        cliente.created_at
      )}.`,
      type: "created",
      tone: "slate",
      date: cliente.created_at,
    });
  }

  if (cliente.estado) {
    events.push({
      id: `status-${cliente.id}`,
      clienteId: cliente.id,
      title: "Estado comercial actual",
      description: `Estado actual: ${cliente.estado}.`,
      type: "status",
      tone: cliente.pagado ? "emerald" : "blue",
      date: cliente.updated_at || cliente.created_at,
    });
  }

  if (cliente.notas) {
    events.push({
      id: `note-${cliente.id}`,
      clienteId: cliente.id,
      title: "Contexto comercial registrado",
      description: cliente.notas,
      type: "note",
      tone: "violet",
      date: cliente.updated_at || cliente.created_at,
    });
  }

  if (cliente.proximo_contacto || cliente.recordatorio) {
    const date = cliente.proximo_contacto || cliente.recordatorio;

    events.push({
      id: `followup-${cliente.id}`,
      clienteId: cliente.id,
      title: "Seguimiento planificado",
      description: `Próximo contacto programado para ${formatDate(date)}.`,
      type: "followup",
      tone: "amber",
      date,
    });
  }

  if (cliente.pagado || cliente.fecha_pago) {
    events.push({
      id: `payment-${cliente.id}`,
      clienteId: cliente.id,
      title: "Pago detectado",
      description: `Pago registrado${
        cliente.monto ? ` por ${formatGs(Number(cliente.monto))}` : ""
      }.`,
      type: "payment",
      tone: "emerald",
      date: cliente.fecha_pago || cliente.updated_at || cliente.created_at,
    });
  }

  if (isRiskSignal(cliente)) {
    events.push({
      id: `risk-${cliente.id}`,
      clienteId: cliente.id,
      title: "Señal de riesgo detectada",
      description:
        "ClienteYA detectó señales de baja respuesta, inactividad o posible pérdida.",
      type: "risk",
      tone: "red",
      date: cliente.updated_at || cliente.created_at,
    });
  }

  if (isOpportunitySignal(cliente)) {
    events.push({
      id: `opportunity-${cliente.id}`,
      clienteId: cliente.id,
      title: "Oportunidad comercial detectada",
      description:
        "ClienteYA detectó señales de interés, presupuesto o avance comercial.",
      type: "opportunity",
      tone: "emerald",
      date: cliente.updated_at || cliente.created_at,
    });
  }

  return events.sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;

    return bTime - aTime;
  });
}

export function buildClientTimelineSummary(cliente: ClienteForClientTimeline) {
  const timeline = buildClientTimelineEvents(cliente);

  const hasRisk = timeline.some((event) => event.type === "risk");
  const hasOpportunity = timeline.some((event) => event.type === "opportunity");
  const hasPayment = timeline.some((event) => event.type === "payment");

  let headline = "Relación comercial en seguimiento";
  let recommendation = "Mantener seguimiento comercial claro y consistente.";

  if (hasRisk) {
    headline = "Relación con riesgo comercial";
    recommendation =
      "Priorizar contacto humano y resolver posibles bloqueos del cliente.";
  } else if (hasOpportunity) {
    headline = "Relación con oportunidad activa";
    recommendation =
      "Avanzar la conversación con una propuesta concreta o próximo paso.";
  } else if (hasPayment) {
    headline = "Cliente convertido";
    recommendation =
      "Mantener relación activa para recompra, referidos o continuidad.";
  }

  return {
    headline,
    recommendation,
    eventCount: timeline.length,
    timeline,
  };
}

export function getClientTimelineToneClasses(tone: ClientTimelineEventTone) {
  if (tone === "blue") return "border-blue-200 bg-blue-50 text-blue-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "emerald")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "red") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "violet")
    return "border-violet-200 bg-violet-50 text-violet-800";

  return "border-slate-200 bg-slate-50 text-slate-700";
}