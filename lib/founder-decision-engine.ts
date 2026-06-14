export type FounderDecisionUrgency =
  | "Crítica"
  | "Alta"
  | "Media"
  | "Baja";

export type FounderDecisionTone =
  | "red"
  | "amber"
  | "emerald"
  | "sky"
  | "slate";

export type FounderDecisionInput = {
  responseProbability: number;
  closeProbability: number;
  revenueAtRisk: number;
  expectedRevenue: number;
  relationshipScore: number;
  memoryScore: number;
  impactScore: number;
  hasWhatsapp: boolean;
  isPaid: boolean;
};

export type FounderDecisionResult = {
  score: number;
  label: string;
  explanation: string;
  actionLabel: string;
  urgency: FounderDecisionUrgency;
  tone: FounderDecisionTone;
};

export type FounderSmartActionLabelInput = {
  decision: FounderDecisionResult;
  responseProbability: number;
  closeProbability: number;
  revenueAtRisk: number;
  expectedRevenue: number;
  relationshipScore: number;
  memoryScore: number;
  impactScore: number;
  hasWhatsapp: boolean;
  isPaid: boolean;
};

export type FounderSmartActionLabelResult = {
  label: string;
  shortLabel: string;
  reason: string;
  tone: FounderDecisionTone;
  urgency: FounderDecisionUrgency;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function buildFounderDecision(
  input: FounderDecisionInput,
): FounderDecisionResult {
  let score = 0;

  score += input.responseProbability * 0.18;
  score += input.closeProbability * 0.2;
  score += input.relationshipScore * 0.12;
  score += input.memoryScore * 0.1;
  score += input.impactScore * 0.2;

  if (input.revenueAtRisk > 0) {
    score += 15;
  }

  if (input.expectedRevenue > 0) {
    score += 10;
  }

  if (input.hasWhatsapp) {
    score += 5;
  }

  if (input.isPaid) {
    score -= 20;
  }

  score = clamp(Math.round(score));

  if (input.isPaid) {
    return {
      score,
      label: "Mantener cliente",
      explanation:
        "Cliente activo. Prioridad principal: confianza, recompra y recomendación.",
      actionLabel: "Mantener relación",
      urgency: "Baja",
      tone: "emerald",
    };
  }

  if (score >= 85) {
    return {
      score,
      label: "Actuar ahora",
      explanation:
        "Existe una combinación fuerte de oportunidad, riesgo e impacto comercial.",
      actionLabel: "Actuar ahora",
      urgency: "Crítica",
      tone: "red",
    };
  }

  if (score >= 70) {
    return {
      score,
      label: "Proteger ingreso",
      explanation:
        "Hay señales suficientes para justificar seguimiento prioritario.",
      actionLabel: "Proteger ingreso",
      urgency: "Alta",
      tone: "amber",
    };
  }

  if (score >= 50) {
    return {
      score,
      label: "Mantener momentum",
      explanation:
        "La relación sigue activa pero necesita seguimiento estructurado.",
      actionLabel: "Mantener momentum",
      urgency: "Media",
      tone: "sky",
    };
  }

  return {
    score,
    label: "Monitorear",
    explanation:
      "No requiere acción inmediata. Mantener observación y contexto.",
    actionLabel: "Abrir cliente",
    urgency: "Baja",
    tone: "slate",
  };
}

export function buildFounderSmartActionLabel(
  input: FounderSmartActionLabelInput,
): FounderSmartActionLabelResult {
  const hasCommercialValue =
    input.expectedRevenue > 0 || input.revenueAtRisk > 0;

  if (!input.hasWhatsapp) {
    return {
      label: "Abrir cliente",
      shortLabel: "Abrir",
      reason: "No hay WhatsApp disponible para este cliente.",
      tone: "slate",
      urgency: "Baja",
    };
  }

  if (input.isPaid) {
    return {
      label: "❤️ Mantener relación",
      shortLabel: "Mantener",
      reason:
        "Cliente convertido. La mejor acción es cuidar confianza, recompra o recomendación.",
      tone: "emerald",
      urgency: "Baja",
    };
  }

  if (input.revenueAtRisk > 0) {
    return {
      label: "💰 Proteger ingreso",
      shortLabel: "Proteger",
      reason:
        "Hay ingreso en riesgo. Conviene actuar antes de que la oportunidad se enfríe.",
      tone: "red",
      urgency: "Crítica",
    };
  }

  if (input.closeProbability >= 75 && hasCommercialValue) {
    return {
      label: "🔥 Cerrar hoy",
      shortLabel: "Cerrar",
      reason:
        "Alta probabilidad de cierre combinada con valor comercial disponible.",
      tone: "amber",
      urgency: "Alta",
    };
  }

  if (input.responseProbability <= 30 && input.memoryScore >= 45) {
    return {
      label: "⚠️ Reactivar ahora",
      shortLabel: "Reactivar",
      reason:
        "La respuesta probable es baja, pero todavía existe memoria comercial para recuperar la relación.",
      tone: "red",
      urgency: "Alta",
    };
  }

  if (input.relationshipScore >= 70 && input.memoryScore >= 65) {
    return {
      label: "📲 Mantener conversación",
      shortLabel: "Conversar",
      reason:
        "La relación y la memoria son fuertes. Conviene mantener el ritmo antes de perder momentum.",
      tone: "sky",
      urgency: "Media",
    };
  }

  if (input.impactScore >= 70) {
    return {
      label: "⚡ Priorizar contacto",
      shortLabel: "Priorizar",
      reason:
        "El impacto comercial es alto. Este cliente merece atención antes que otros.",
      tone: "amber",
      urgency: "Alta",
    };
  }

  if (input.expectedRevenue > 0) {
    return {
      label: "💬 Avanzar oportunidad",
      shortLabel: "Avanzar",
      reason:
        "Hay valor comercial potencial. Conviene mover la conversación al siguiente paso.",
      tone: "sky",
      urgency: "Media",
    };
  }

  if (input.decision.score >= 50) {
    return {
      label: "📅 Seguimiento hoy",
      shortLabel: "Seguir",
      reason:
        "La decisión AI indica que conviene mantener seguimiento estructurado.",
      tone: input.decision.tone,
      urgency: input.decision.urgency,
    };
  }

  return {
    label: "👀 Monitorear",
    shortLabel: "Monitorear",
    reason:
      "No hay presión comercial inmediata. Mantener contexto y observar señales.",
    tone: "slate",
    urgency: "Baja",
  };
}