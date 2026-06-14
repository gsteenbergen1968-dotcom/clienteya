type Cliente = {
  id: string;
  nombre: string;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

export type OpportunityScore = {
  score: number;
  probability: number;
  label: string;
  risk: "low" | "medium" | "high";
  description: string;
  recommendation: string;
};

function normalize(value?: string | null) {
  return value?.toLowerCase().trim() || "";
}

function daysSince(dateString?: string | null) {
  if (!dateString) return 0;

  const now = new Date();
  const target = new Date(dateString);

  const diff = now.getTime() - target.getTime();

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function calculateOpportunityScore(
  cliente: Cliente
): OpportunityScore {
  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);
  const recordatorio = normalize(cliente.recordatorio);

  const text = `${estado} ${notas} ${recordatorio}`;
  const inactiveDays = daysSince(cliente.proximo_contacto);

  let score = 40;

  if (cliente.pagado || text.includes("pagado") || text.includes("cerrado")) {
    return {
      score: 100,
      probability: 100,
      label: "Won",
      risk: "low",
      description: "Cliente ya convertido o cerrado.",
      recommendation: "Mantener relación y buscar upsell futuro.",
    };
  }

  if (
    text.includes("interesado") ||
    text.includes("interés") ||
    text.includes("consulta") ||
    text.includes("quiere")
  ) {
    score += 20;
  }

  if (
    text.includes("precio") ||
    text.includes("propuesta") ||
    text.includes("presupuesto") ||
    text.includes("cotización")
  ) {
    score += 20;
  }

  if (
    text.includes("pago") ||
    text.includes("transferencia") ||
    text.includes("comprobante")
  ) {
    score += 25;
  }

  if (
    text.includes("sin respuesta") ||
    text.includes("no responde") ||
    text.includes("reintentar")
  ) {
    score -= 20;
  }

  if (
    text.includes("perdido") ||
    text.includes("no interesado") ||
    text.includes("cancelado")
  ) {
    score -= 35;
  }

  if (inactiveDays >= 7) {
    score -= 20;
  } else if (inactiveDays >= 3) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  const probability = score;

  if (score >= 80) {
    return {
      score,
      probability,
      label: "Hot lead",
      risk: "low",
      description: "Alta probabilidad de conversión.",
      recommendation: "Contactar hoy y cerrar siguiente paso.",
    };
  }

  if (score >= 60) {
    return {
      score,
      probability,
      label: "Warm lead",
      risk: "medium",
      description: "Cliente con señales comerciales positivas.",
      recommendation: "Enviar seguimiento con propuesta clara.",
    };
  }

  if (score >= 35) {
    return {
      score,
      probability,
      label: "Cold lead",
      risk: "medium",
      description: "Cliente activo pero sin señales fuertes de cierre.",
      recommendation: "Nutrir con prueba social o beneficio concreto.",
    };
  }

  return {
    score,
    probability,
    label: "Ghosting risk",
    risk: "high",
    description: "Riesgo alto de perder la oportunidad.",
    recommendation: "Enviar mensaje corto, directo y fácil de responder.",
  };
}

export function getOpportunityClasses(risk: OpportunityScore["risk"]) {
  if (risk === "low") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (risk === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-red-200 bg-red-50 text-red-800";
}