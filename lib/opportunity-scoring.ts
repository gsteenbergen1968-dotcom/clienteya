import type { RelationshipRecord } from "./relationship-repository";

export type OpportunityScore = {
  score: number;
  probability: number;
  label: string;
  risk: "low" | "medium" | "high";
  description: string;
  recommendation: string;
};

function normalize(value?: string | null): string {
  return value?.toLowerCase().trim() || "";
}

function daysSince(dateString?: string | null): number {
  if (!dateString) return 0;

  const now = new Date();
  const target = new Date(dateString);

  if (Number.isNaN(target.getTime())) return 0;

  const diff = now.getTime() - target.getTime();

  return Math.max(
    0,
    Math.floor(diff / (1000 * 60 * 60 * 24)),
  );
}

function getRelationshipPaid(
  relationship: RelationshipRecord,
): boolean {
  const status = normalize(relationship.status);

  return (
    status.includes("pag") ||
    status.includes("convert")
  );
}

export function calculateOpportunityScore(
  relationship: RelationshipRecord,
): OpportunityScore {
  const status = normalize(relationship.status);
  const notes = normalize(relationship.notes);
  const reminder = normalize(relationship.reminder);
  const text = `${status} ${notes} ${reminder}`;
  const inactiveDays = daysSince(relationship.next_contact_at);

  let score = 40;

  if (
    getRelationshipPaid(relationship) ||
    text.includes("pagado") ||
    text.includes("cerrado")
  ) {
    return {
      score: 100,
      probability: 100,
      label: "Won",
      risk: "low",
      description: "Relación ya convertida o cerrada.",
      recommendation: "Mantener la relación y buscar upsell futuro.",
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

  if (score >= 80) {
    return {
      score,
      probability: score,
      label: "Hot lead",
      risk: "low",
      description: "Alta probabilidad de conversión.",
      recommendation: "Contactar hoy y cerrar el siguiente paso.",
    };
  }

  if (score >= 60) {
    return {
      score,
      probability: score,
      label: "Warm lead",
      risk: "medium",
      description: "Relación con señales comerciales positivas.",
      recommendation: "Enviar seguimiento con una propuesta clara.",
    };
  }

  if (score >= 35) {
    return {
      score,
      probability: score,
      label: "Cold lead",
      risk: "medium",
      description:
        "Relación activa pero sin señales fuertes de cierre.",
      recommendation:
        "Nutrir con prueba social o un beneficio concreto.",
    };
  }

  return {
    score,
    probability: score,
    label: "Ghosting risk",
    risk: "high",
    description: "Riesgo alto de perder la oportunidad.",
    recommendation:
      "Enviar un mensaje corto, directo y fácil de responder.",
  };
}

export function getOpportunityClasses(
  risk: OpportunityScore["risk"],
): string {
  if (risk === "low") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (risk === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-red-200 bg-red-50 text-red-800";
}