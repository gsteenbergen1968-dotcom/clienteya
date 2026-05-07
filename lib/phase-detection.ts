type Cliente = {
  id: string;
  nombre: string;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
};

export type ClientPhase =
  | "nuevo_lead"
  | "interesado"
  | "negociacion"
  | "esperando_pago"
  | "cerrado"
  | "perdido"
  | "sin_respuesta";

export type PhaseDetectionResult = {
  phase: ClientPhase;
  label: string;
  description: string;
  confidence: number;
  tone: "blue" | "green" | "amber" | "red" | "slate";
};

function normalize(value?: string | null) {
  return value?.toLowerCase().trim() || "";
}

export function detectClientPhase(cliente: Cliente): PhaseDetectionResult {
  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);
  const recordatorio = normalize(cliente.recordatorio);

  const text = `${estado} ${notas} ${recordatorio}`;

  if (
    text.includes("pagado") ||
    text.includes("pagó") ||
    text.includes("pago confirmado") ||
    text.includes("cerrado") ||
    text.includes("convertido")
  ) {
    return {
      phase: "cerrado",
      label: "Cerrado",
      description: "Cliente convertido o pago confirmado.",
      confidence: 95,
      tone: "green",
    };
  }

  if (
    text.includes("perdido") ||
    text.includes("no interesado") ||
    text.includes("rechazó") ||
    text.includes("cancelado")
  ) {
    return {
      phase: "perdido",
      label: "Perdido",
      description: "Cliente sin oportunidad activa por ahora.",
      confidence: 90,
      tone: "slate",
    };
  }

  if (
    text.includes("comprobante") ||
    text.includes("transferencia") ||
    text.includes("pagar") ||
    text.includes("pago pendiente") ||
    text.includes("esperando pago")
  ) {
    return {
      phase: "esperando_pago",
      label: "Esperando pago",
      description: "Cliente está en fase de pago o confirmación.",
      confidence: 88,
      tone: "amber",
    };
  }

  if (
    text.includes("precio") ||
    text.includes("propuesta") ||
    text.includes("cotización") ||
    text.includes("presupuesto") ||
    text.includes("negociando")
  ) {
    return {
      phase: "negociacion",
      label: "Negociación",
      description: "Cliente está evaluando precio, propuesta o condiciones.",
      confidence: 82,
      tone: "amber",
    };
  }

  if (
    text.includes("interesado") ||
    text.includes("interés") ||
    text.includes("quiere") ||
    text.includes("consulta") ||
    text.includes("preguntó")
  ) {
    return {
      phase: "interesado",
      label: "Interesado",
      description: "Cliente mostró intención o curiosidad comercial.",
      confidence: 80,
      tone: "green",
    };
  }

  if (
    text.includes("sin respuesta") ||
    text.includes("no responde") ||
    text.includes("reintentar")
  ) {
    return {
      phase: "sin_respuesta",
      label: "Sin respuesta",
      description: "Cliente no respondió el último contacto.",
      confidence: 78,
      tone: "red",
    };
  }

  return {
    phase: "nuevo_lead",
    label: "Nuevo lead",
    description: "Cliente nuevo o sin señales suficientes todavía.",
    confidence: 65,
    tone: "blue",
  };
}

export function getPhaseClasses(tone: PhaseDetectionResult["tone"]) {
  if (tone === "green") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (tone === "slate") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}