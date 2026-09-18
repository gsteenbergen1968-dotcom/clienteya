export type WhatsAppMemoryEventType =
  | "message_sent"
  | "message_received"
  | "promise"
  | "followup"
  | "price_request"
  | "payment"
  | "meeting"
  | "silence"
  | "note";

export type WhatsAppMemoryRiskLevel = "low" | "medium" | "high" | "critical";

export type WhatsAppMemoryActionType =
  | "send_whatsapp"
  | "ask_decision"
  | "schedule_followup"
  | "request_payment"
  | "close_opportunity"
  | "no_action";

export type WhatsAppMemoryEvent = {
  id: string;
  relationshipId: string;
  date: string;
  type: WhatsAppMemoryEventType;
  summary: string;
};

export type WhatsAppMemoryInsight = {
  id: string;
  title: string;
  description: string;
  riskLevel: WhatsAppMemoryRiskLevel;
  actionType: WhatsAppMemoryActionType;
  actionLabel: string;
};

export type WhatsAppMemoryProfile = {
  relationshipId: string;
  timeline: WhatsAppMemoryEvent[];
  totalInteractions: number;
  promisesMade: number;
  ignoredFollowups: number;
  silenceDays: number;
  relationshipScore: number;
  insights: WhatsAppMemoryInsight[];
};

function toDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();

  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function countPromiseSignals(events: WhatsAppMemoryEvent[]) {
  return events.filter((event) => {
    const text = normalize(event.summary);

    return (
      event.type === "promise" ||
      text.includes("volgende week") ||
      text.includes("mañana") ||
      text.includes("después") ||
      text.includes("luego") ||
      text.includes("más tarde") ||
      text.includes("te aviso")
    );
  }).length;
}

function countIgnoredFollowups(events: WhatsAppMemoryEvent[]) {
  return events.filter((event) => event.type === "followup").length;
}

function calculateSilenceDays(events: WhatsAppMemoryEvent[]) {
  if (events.length === 0) return 0;

  const latest = [...events]
    .map((event) => toDate(event.date))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!latest) return 0;

  return daysBetween(latest, new Date());
}

function calculateRelationshipScore(params: {
  totalInteractions: number;
  promisesMade: number;
  ignoredFollowups: number;
  silenceDays: number;
}) {
  let score = 100;

  score -= params.promisesMade * 8;
  score -= params.ignoredFollowups * 10;

  if (params.silenceDays >= 7) score -= 15;
  if (params.silenceDays >= 14) score -= 25;
  if (params.silenceDays >= 30) score -= 40;

  if (params.totalInteractions >= 3) score += 8;
  if (params.totalInteractions >= 6) score += 12;

  return Math.max(0, Math.min(100, score));
}

function buildInsights(params: {
  relationshipId: string;
  timeline: WhatsAppMemoryEvent[];
  promisesMade: number;
  ignoredFollowups: number;
  silenceDays: number;
  relationshipScore: number;
}): WhatsAppMemoryInsight[] {
  const insights: WhatsAppMemoryInsight[] = [];

  const hasPriceRequest = params.timeline.some(
    (event) => event.type === "price_request"
  );

  const hasMeeting = params.timeline.some((event) => event.type === "meeting");

  if (params.promisesMade >= 3) {
    insights.push({
      id: `${params.relationshipId}-third-delay`,
      title: "Tercer aplazamiento detectado",
      description:
        "Esta relación ya pospuso varias veces. El riesgo comercial está subiendo.",
      riskLevel: "high",
      actionType: "send_whatsapp",
      actionLabel: "Hacer seguimiento hoy por WhatsApp",
    });
  }

  if (hasPriceRequest && params.silenceDays >= 7) {
    insights.push({
      id: `${params.relationshipId}-price-silence`,
      title: "Interés sin respuesta",
      description:
        "La relación pidió precio, pero no respondió después. El momentum puede estar bajando.",
      riskLevel: "medium",
      actionType: "send_whatsapp",
      actionLabel: "Enviar recordatorio amable",
    });
  }

  if (params.timeline.length >= 4 && !hasMeeting) {
    insights.push({
      id: `${params.relationshipId}-no-next-step`,
      title: "Conversación sin próximo paso",
      description:
        "Hay varias interacciones, pero todavía no hay una acción concreta acordada.",
      riskLevel: "medium",
      actionType: "ask_decision",
      actionLabel: "Pedir una decisión concreta",
    });
  }

  if (params.silenceDays >= 14) {
    insights.push({
      id: `${params.relationshipId}-long-silence`,
      title: "Silencio prolongado",
      description:
        "No hay interacción reciente. Conviene recuperar la relación antes de que se enfríe.",
      riskLevel: "high",
      actionType: "send_whatsapp",
      actionLabel: "Reactivar conversación",
    });
  }

  if (params.relationshipScore <= 35) {
    insights.push({
      id: `${params.relationshipId}-relationship-risk`,
      title: "Relación en riesgo",
      description:
        "La combinación de silencio, aplazamientos y falta de avance indica riesgo comercial.",
      riskLevel: "critical",
      actionType: "send_whatsapp",
      actionLabel: "Contactar hoy",
    });
  }

  return insights;
}

export function buildWhatsAppMemoryProfile(params: {
  relationshipId: string;
  events: WhatsAppMemoryEvent[];
}): WhatsAppMemoryProfile {
  const timeline = [...params.events].sort((a, b) => {
    const dateA = toDate(a.date)?.getTime() ?? 0;
    const dateB = toDate(b.date)?.getTime() ?? 0;

    return dateB - dateA;
  });

  const totalInteractions = timeline.length;
  const promisesMade = countPromiseSignals(timeline);
  const ignoredFollowups = countIgnoredFollowups(timeline);
  const silenceDays = calculateSilenceDays(timeline);

  const relationshipScore = calculateRelationshipScore({
    totalInteractions,
    promisesMade,
    ignoredFollowups,
    silenceDays,
  });

  const insights = buildInsights({
    relationshipId: params.relationshipId,
    timeline,
    promisesMade,
    ignoredFollowups,
    silenceDays,
    relationshipScore,
  });

  return {
    relationshipId: params.relationshipId,
    timeline,
    totalInteractions,
    promisesMade,
    ignoredFollowups,
    silenceDays,
    relationshipScore,
    insights,
  };
}

export function getWhatsAppMemoryRiskLabel(risk: WhatsAppMemoryRiskLevel) {
  if (risk === "critical") return "Crítico";
  if (risk === "high") return "Alto";
  if (risk === "medium") return "Medio";

  return "Bajo";
}

export function getWhatsAppMemoryEventLabel(type: WhatsAppMemoryEventType) {
  const labels: Record<WhatsAppMemoryEventType, string> = {
    message_sent: "WhatsApp enviado",
    message_received: "Respuesta recibida",
    promise: "Promesa",
    followup: "Seguimiento",
    price_request: "Precio solicitado",
    payment: "Pago",
    meeting: "Reunión",
    silence: "Silencio",
    note: "Nota",
  };

  return labels[type];
}