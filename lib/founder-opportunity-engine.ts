import type { CommercialMemoryRelationship } from "./commercial-memory-signals";

export type FounderOpportunityPriority =
  | "critical"
  | "high"
  | "medium";

export type FounderOpportunityMomentum =
  | "accelerating"
  | "stable"
  | "cooling";

export type FounderOpportunity = {
  id: string;
  relationshipId: string;
  relationshipName: string;

  title: string;
  description: string;
  recommendation: string;

  probability: number;
  potentialRevenue: number;

  priority: FounderOpportunityPriority;

  momentum: FounderOpportunityMomentum;
  momentumReason: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function hasOpportunitySignal(
  relationship: CommercialMemoryRelationship
) {
  const text = normalizeText(
    `${relationship.estado ?? ""} ${relationship.notas ?? ""} ${
      relationship.recordatorio ?? ""
    }`
  );

  return (
    text.includes("interes") ||
    text.includes("interés") ||
    text.includes("presupuesto") ||
    text.includes("cotizacion") ||
    text.includes("cotización") ||
    text.includes("reunion") ||
    text.includes("reunión") ||
    text.includes("visita") ||
    text.includes("confirm")
  );
}

function daysSince(dateString?: string | null) {
  if (!dateString) return null;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.floor(
    (Date.now() - date.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function buildMomentum(
  relationship: CommercialMemoryRelationship
) {
  const updatedDays = daysSince(
    relationship.updated_at
  );

  if (
    updatedDays !== null &&
    updatedDays <= 3
  ) {
    return {
      momentum: "accelerating" as const,
      reason: "Actividad reciente detectada.",
    };
  }

  if (
    updatedDays !== null &&
    updatedDays <= 14
  ) {
    return {
      momentum: "stable" as const,
      reason: "Seguimiento dentro del ciclo comercial.",
    };
  }

  return {
    momentum: "cooling" as const,
    reason: "Sin actividad reciente.",
  };
}

function buildOpportunity(
  relationship: CommercialMemoryRelationship
): FounderOpportunity | null {
  const amount = Number(
    relationship.monto ?? 0
  );

  if (Boolean(relationship.pagado)) {
    return null;
  }

  let probability = 35;

  if (hasOpportunitySignal(relationship)) {
    probability += 25;
  }

  const updatedDays = daysSince(
    relationship.updated_at
  );

  if (updatedDays !== null) {
    if (updatedDays <= 7) {
      probability += 20;
    } else if (updatedDays <= 14) {
      probability += 10;
    }
  }

  if (amount > 0) {
    probability += 10;
  }

  probability = clamp(probability);

  if (
    probability < 50 &&
    amount <= 0
  ) {
    return null;
  }

  const priority: FounderOpportunityPriority =
    probability >= 80
      ? "critical"
      : probability >= 65
        ? "high"
        : "medium";

  const momentumData =
    buildMomentum(relationship);

  return {
    id: `opportunity-${relationship.id}`,

    relationshipId: relationship.id,

    relationshipName:
      relationship.nombre?.trim() ||
      "Relación sin nombre",

    title:
      probability >= 80
        ? "Oportunidad lista para avanzar"
        : probability >= 65
          ? "Oportunidad activa"
          : "Oportunidad potencial",

    description:
      amount > 0
        ? `Relación con potencial comercial estimado de Gs. ${amount.toLocaleString(
            "es-PY"
          )}.`
        : "Relación con señales de interés y posibilidad de avance.",

    recommendation:
      probability >= 80
        ? "Contactar hoy y proponer siguiente paso concreto."
        : probability >= 65
          ? "Realizar seguimiento esta semana."
          : "Mantener relación y confirmar interés.",

    probability,

    potentialRevenue: amount,

    priority,

    momentum:
      momentumData.momentum,

    momentumReason:
      momentumData.reason,
  };
}

export function buildFounderOpportunities(
  relationships: CommercialMemoryRelationship[]
): FounderOpportunity[] {
  return relationships
    .map(buildOpportunity)
    .filter(
      (
        item
      ): item is FounderOpportunity =>
        item !== null
    )
    .sort(
      (a, b) =>
        b.probability -
          a.probability ||
        b.potentialRevenue -
          a.potentialRevenue
    );
}

export function getFounderOpportunityPriorityLabel(
  priority: FounderOpportunityPriority
) {
  if (priority === "critical") {
    return "Crítica";
  }

  if (priority === "high") {
    return "Alta";
  }

  return "Media";
}

export function getFounderOpportunityPriorityClasses(
  priority: FounderOpportunityPriority
) {
  if (priority === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "high") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

export function getFounderOpportunityMomentumLabel(
  momentum: FounderOpportunityMomentum
) {
  if (
    momentum ===
    "accelerating"
  ) {
    return "Acelerando";
  }

  if (momentum === "stable") {
    return "Estable";
  }

  return "Enfriándose";
}

export function getFounderOpportunityMomentumClasses(
  momentum: FounderOpportunityMomentum
) {
  if (
    momentum ===
    "accelerating"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (momentum === "stable") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}