import type { CommercialMemoryClient } from "./commercial-memory-signals";

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
  clientId: string;
  clientName: string;

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
  client: CommercialMemoryClient,
) {
  const text = normalizeText(
    `${client.estado ?? ""} ${client.notas ?? ""} ${client.recordatorio ?? ""}`,
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

function daysSince(
  dateString?: string | null,
) {
  if (!dateString) return null;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.floor(
    (Date.now() - date.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function buildMomentum(
  client: CommercialMemoryClient,
) {
  const updatedDays = daysSince(
    client.updated_at,
  );

  if (
    updatedDays !== null &&
    updatedDays <= 3
  ) {
    return {
      momentum: "accelerating" as const,
      reason:
        "Actividad reciente detectada.",
    };
  }

  if (
    updatedDays !== null &&
    updatedDays <= 14
  ) {
    return {
      momentum: "stable" as const,
      reason:
        "Seguimiento dentro del ciclo comercial.",
    };
  }

  return {
    momentum: "cooling" as const,
    reason:
      "Sin actividad reciente.",
  };
}

function buildOpportunity(
  client: CommercialMemoryClient,
): FounderOpportunity | null {
  const amount = Number(
    client.monto ?? 0,
  );

  if (Boolean(client.pagado)) {
    return null;
  }

  let probability = 35;

  if (hasOpportunitySignal(client)) {
    probability += 25;
  }

  const updatedDays = daysSince(
    client.updated_at,
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
    buildMomentum(client);

  return {
    id: `opportunity-${client.id}`,

    clientId: client.id,

    clientName:
      client.nombre?.trim() ||
      "Cliente sin nombre",

    title:
      probability >= 80
        ? "Oportunidad lista para avanzar"
        : probability >= 65
          ? "Oportunidad activa"
          : "Oportunidad potencial",

    description:
      amount > 0
        ? `Cliente con potencial comercial estimado de Gs. ${amount.toLocaleString(
            "es-PY",
          )}.`
        : "Cliente con señales de interés y posibilidad de avance.",

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
  clients: CommercialMemoryClient[],
): FounderOpportunity[] {
  return clients
    .map(buildOpportunity)
    .filter(
      (
        item,
      ): item is FounderOpportunity =>
        item !== null,
    )
    .sort(
      (a, b) =>
        b.probability -
          a.probability ||
        b.potentialRevenue -
          a.potentialRevenue,
    );
}

export function getFounderOpportunityPriorityLabel(
  priority: FounderOpportunityPriority,
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
  priority: FounderOpportunityPriority,
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
  momentum: FounderOpportunityMomentum,
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
  momentum: FounderOpportunityMomentum,
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