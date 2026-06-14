type Cliente = {
  id: string;
  nombre: string;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TimelineMomentum = "strong" | "stable" | "slow" | "stalled";

export type TimelineInsight = {
  daysInPipeline: number;
  daysUntilNextContact: number | null;
  momentum: TimelineMomentum;
  label: string;
  description: string;
  recommendation: string;
  tone: "green" | "blue" | "amber" | "red";
};

function normalize(value?: string | null) {
  return value?.toLowerCase().trim() || "";
}

function daysBetween(from?: string | null, to = new Date()) {
  if (!from) return 0;

  const start = new Date(from);
  const diff = to.getTime() - start.getTime();

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function daysUntil(date?: string | null) {
  if (!date) return null;

  const now = new Date();
  const target = new Date(date);

  return Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function buildTimelineInsight(cliente: Cliente): TimelineInsight {
  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);
  const recordatorio = normalize(cliente.recordatorio);
  const text = `${estado} ${notas} ${recordatorio}`;

  const daysInPipeline = daysBetween(cliente.created_at || cliente.updated_at);
  const daysToContact = daysUntil(cliente.proximo_contacto);

  if (
    text.includes("pagado") ||
    text.includes("cerrado") ||
    text.includes("convertido")
  ) {
    return {
      daysInPipeline,
      daysUntilNextContact: daysToContact,
      momentum: "strong",
      label: "Cliente convertido",
      description: "La oportunidad ya fue cerrada o convertida.",
      recommendation: "Mantener relación y buscar oportunidad futura.",
      tone: "green",
    };
  }

  if (daysToContact !== null && daysToContact < 0) {
    const overdueDays = Math.abs(daysToContact);

    return {
      daysInPipeline,
      daysUntilNextContact: daysToContact,
      momentum: overdueDays >= 7 ? "stalled" : "slow",
      label: overdueDays >= 7 ? "Lead estancado" : "Follow-up vencido",
      description:
        overdueDays >= 7
          ? `Este lead lleva ${overdueDays} día(s) vencido. Riesgo alto de enfriarse.`
          : `Este lead tiene ${overdueDays} día(s) de atraso en seguimiento.`,
      recommendation:
        overdueDays >= 7
          ? "Enviar mensaje directo y breve hoy."
          : "Contactar antes de que pierda interés.",
      tone: overdueDays >= 7 ? "red" : "amber",
    };
  }

  if (
    text.includes("interesado") ||
    text.includes("precio") ||
    text.includes("propuesta") ||
    text.includes("cotización") ||
    text.includes("comprobante")
  ) {
    return {
      daysInPipeline,
      daysUntilNextContact: daysToContact,
      momentum: "strong",
      label: "Momentum comercial fuerte",
      description: "El cliente muestra señales activas de avance comercial.",
      recommendation: "Acelerar el cierre con una propuesta clara.",
      tone: "green",
    };
  }

  if (
    text.includes("sin respuesta") ||
    text.includes("no responde") ||
    text.includes("reintentar")
  ) {
    return {
      daysInPipeline,
      daysUntilNextContact: daysToContact,
      momentum: "slow",
      label: "Respuesta lenta",
      description: "El cliente necesita reactivación con mensaje simple.",
      recommendation: "Usar una pregunta corta y fácil de responder.",
      tone: "amber",
    };
  }

  if (daysInPipeline >= 14) {
    return {
      daysInPipeline,
      daysUntilNextContact: daysToContact,
      momentum: "stalled",
      label: "Lead antiguo",
      description: "Este lead lleva bastante tiempo abierto sin señales fuertes.",
      recommendation: "Decidir si vale la pena reactivar o cerrar.",
      tone: "red",
    };
  }

  return {
    daysInPipeline,
    daysUntilNextContact: daysToContact,
    momentum: "stable",
    label: "Momentum estable",
    description: "El lead no muestra señales críticas por ahora.",
    recommendation: "Mantener seguimiento normal.",
    tone: "blue",
  };
}

export function getTimelineClasses(tone: TimelineInsight["tone"]) {
  if (tone === "green") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}