export type ClientMemoryInput = {
  id: string;
  nombre: string;
  telefono?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
  created_at?: string | null;
};

export type ClientMemoryProfile = {
  engagementLevel: "high" | "medium" | "low";
  salesTemperature: "hot" | "warm" | "cold" | "closed";
  ghostingRisk: "high" | "medium" | "low";
  followupFatigue: "high" | "medium" | "low";
  recommendedTone: "direct" | "balanced" | "soft" | "post_sale";
  recommendedAction:
    | "close"
    | "follow_up"
    | "reactivate"
    | "schedule"
    | "maintain_relationship";
  label: string;
  summary: string;
  risk: string;
  nextBestStep: string;
  score: number;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(date: string | null | undefined, today: string) {
  if (!date) return null;

  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);

  return Math.round(
    (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function countSignals(text: string, signals: string[]) {
  return signals.reduce((count, signal) => {
    return text.includes(signal) ? count + 1 : count;
  }, 0);
}

export function buildClientMemory(
  cliente: ClientMemoryInput
): ClientMemoryProfile {
  const today = todayISO();

  const estado = (cliente.estado || "").toLowerCase();
  const notas = (cliente.notas || "").toLowerCase();
  const recordatorio = (cliente.recordatorio || "").toLowerCase();
  const combined = `${estado} ${notas} ${recordatorio}`;

  const delta = daysBetween(cliente.proximo_contacto, today);

  const paid = Boolean(cliente.pagado) || estado.includes("pag");
  const closed = estado.includes("cerr");
  const interested = estado.includes("interes");
  const contacted = estado.includes("contact");
  const noResponse = estado.includes("sin");

  const overdue = delta !== null && delta < 0;
  const todayFollowup = delta === 0;
  const soonFollowup = delta !== null && delta > 0 && delta <= 3;

  const positiveSignals = countSignals(combined, [
    "interes",
    "quiere",
    "decidir",
    "avanzar",
    "confirmar",
    "pagar",
    "cotizar",
    "presupuesto",
    "propuesta",
    "reunión",
    "reunion",
    "llamar",
    "listo",
  ]);

  const negativeSignals = countSignals(combined, [
    "sin respuesta",
    "no responde",
    "frío",
    "frio",
    "pendiente",
    "duda",
    "caro",
    "después",
    "despues",
    "no interesado",
    "esperar",
  ]);

  const followupSignals = countSignals(combined, [
    "seguimiento",
    "reintentar",
    "recordar",
    "volver",
    "contactar",
    "whatsapp",
  ]);

  let score = 45;

  if (paid) score += 35;
  if (interested) score += 25;
  if (contacted) score += 12;
  if (noResponse) score -= 5;
  if (closed) score -= 35;

  if (overdue) score += 12;
  if (todayFollowup) score += 18;
  if (soonFollowup) score += 8;

  score += positiveSignals * 5;
  score -= negativeSignals * 4;

  if (cliente.monto && cliente.monto > 0) score += 8;

  score = Math.max(0, Math.min(100, score));

  const ghostingRisk =
    noResponse || negativeSignals >= 2
      ? "high"
      : negativeSignals === 1 || overdue
      ? "medium"
      : "low";

  const followupFatigue =
    followupSignals >= 3 || (noResponse && overdue)
      ? "high"
      : followupSignals >= 2 || noResponse
      ? "medium"
      : "low";

  const engagementLevel =
    paid || interested || positiveSignals >= 2
      ? "high"
      : contacted || positiveSignals === 1
      ? "medium"
      : "low";

  const salesTemperature = paid
    ? "closed"
    : score >= 75
    ? "hot"
    : score >= 50
    ? "warm"
    : "cold";

  const recommendedTone =
    paid
      ? "post_sale"
      : ghostingRisk === "high" || followupFatigue === "high"
      ? "soft"
      : salesTemperature === "hot"
      ? "direct"
      : "balanced";

  const recommendedAction =
    paid
      ? "maintain_relationship"
      : salesTemperature === "hot"
      ? "close"
      : ghostingRisk === "high"
      ? "reactivate"
      : overdue || todayFollowup
      ? "follow_up"
      : "schedule";

  let label = "Seguimiento normal";
  let summary = "Cliente en seguimiento comercial estándar.";
  let risk = "Riesgo bajo. Mantener seguimiento ordenado.";
  let nextBestStep = "Mantener el cliente actualizado y programar próximo contacto.";

  if (paid) {
    label = "Cliente convertido";
    summary = "Cliente ya pagó. La prioridad es cuidar la relación.";
    risk = "Riesgo bajo, pero puede perderse continuidad si no hay post-venta.";
    nextBestStep = "Enviar mensaje de continuidad o agradecimiento post-venta.";
  } else if (salesTemperature === "hot") {
    label = "Hot lead";
    summary = "Cliente con señales comerciales fuertes y buena probabilidad de avance.";
    risk = "Riesgo de perder oportunidad si no se contacta pronto.";
    nextBestStep = "Enviar mensaje directo con siguiente paso claro.";
  } else if (ghostingRisk === "high") {
    label = "Riesgo de ghosting";
    summary = "Cliente con baja respuesta o señales frías.";
    risk = "Riesgo alto de perder la conversación.";
    nextBestStep = "Enviar mensaje suave, corto y fácil de responder.";
  } else if (followupFatigue === "high") {
    label = "Follow-up sensible";
    summary = "El cliente ya recibió varios seguimientos.";
    risk = "Riesgo de saturar al cliente con demasiada presión.";
    nextBestStep = "Usar tono suave y dejar una salida fácil.";
  } else if (salesTemperature === "warm") {
    label = "Lead tibio";
    summary = "Cliente con señales moderadas. Conviene mantener ritmo.";
    risk = "Riesgo medio si el seguimiento se enfría.";
    nextBestStep = "Enviar mensaje balanceado y programar próximo contacto.";
  } else {
    label = "Lead frío";
    summary = "Cliente con pocas señales comerciales por ahora.";
    risk = "Riesgo medio-bajo. Necesita más contexto antes de insistir.";
    nextBestStep = "Actualizar notas o enviar mensaje de reactivación suave.";
  }

  return {
    engagementLevel,
    salesTemperature,
    ghostingRisk,
    followupFatigue,
    recommendedTone,
    recommendedAction,
    label,
    summary,
    risk,
    nextBestStep,
    score,
  };
}

export function getClientMemoryClasses(memory: ClientMemoryProfile) {
  if (memory.salesTemperature === "closed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (memory.salesTemperature === "hot") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (memory.ghostingRisk === "high") {
    return "border-orange-200 bg-orange-50 text-orange-800";
  }

  if (memory.salesTemperature === "warm") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}