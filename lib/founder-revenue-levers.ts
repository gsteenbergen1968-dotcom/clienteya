import type { CommercialMemoryClient } from "./commercial-memory-signals";

export type FounderRevenueLeverPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type FounderRevenueLeverActionType =
  | "close"
  | "followup"
  | "reactivate"
  | "protect"
  | "maintain";

export type FounderRevenueLever = {
  clienteId: string;
  clienteNombre: string;
  expectedRevenue: number;
  revenueImpact: number;
  priority: FounderRevenueLeverPriority;
  actionType: FounderRevenueLeverActionType;
  actionLabel: string;
  reasoning: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value: unknown, fallback = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return value;
}

function daysBetween(date?: string | null) {
  if (!date) {
    return 30;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 30;
  }

  const today = new Date();
  const diff =
    today.getTime() - parsedDate.getTime();

  return Math.max(
    0,
    Math.floor(diff / (1000 * 60 * 60 * 24)),
  );
}

function getClientName(client: CommercialMemoryClient) {
  return (
    client.nombre?.trim() ||
    "Cliente sin nombre"
  );
}

function getRelationshipScore(client: CommercialMemoryClient) {
  const estado = client.estado?.toLowerCase() || "";
  const hasNotes = Boolean(client.notas?.trim());
  const hasReminder = Boolean(client.recordatorio?.trim());
  const isPaid = Boolean(client.pagado);

  let score = 45;

  if (estado.includes("activo")) {
    score += 20;
  }

  if (estado.includes("interesado")) {
    score += 15;
  }

  if (estado.includes("pendiente")) {
    score += 10;
  }

  if (hasNotes) {
    score += 10;
  }

  if (hasReminder) {
    score += 10;
  }

  if (isPaid) {
    score += 10;
  }

  return clamp(score);
}

function getMemoryScore(client: CommercialMemoryClient) {
  let score = 35;

  if (client.notas?.trim()) {
    score += 25;
  }

  if (client.recordatorio?.trim()) {
    score += 20;
  }

  if (client.proximo_contacto) {
    score += 20;
  }

  return clamp(score);
}

function getCloseProbability(
  client: CommercialMemoryClient,
  relationshipScore: number,
  memoryScore: number,
) {
  const estado = client.estado?.toLowerCase() || "";
  let probability = 35;

  probability += relationshipScore * 0.25;
  probability += memoryScore * 0.15;

  if (estado.includes("activo")) {
    probability += 20;
  }

  if (estado.includes("interesado")) {
    probability += 15;
  }

  if (estado.includes("pendiente")) {
    probability += 8;
  }

  if (client.pagado) {
    probability += 10;
  }

  return clamp(Math.round(probability));
}

function getResponseProbability(
  relationshipScore: number,
  memoryScore: number,
  daysSinceLastContact: number,
) {
  let probability = 55;

  probability += relationshipScore * 0.2;
  probability += memoryScore * 0.15;
  probability -= daysSinceLastContact * 1.1;

  return clamp(Math.round(probability));
}

function getUrgencyMultiplier(daysSinceLastContact: number) {
  if (daysSinceLastContact >= 21) {
    return 1.4;
  }

  if (daysSinceLastContact >= 14) {
    return 1.3;
  }

  if (daysSinceLastContact >= 7) {
    return 1.15;
  }

  return 1;
}

function getRelationshipMultiplier(score: number) {
  if (score >= 85) {
    return 1.25;
  }

  if (score >= 70) {
    return 1.15;
  }

  if (score >= 55) {
    return 1.05;
  }

  return 1;
}

function getMemoryMultiplier(score: number) {
  if (score >= 80) {
    return 1.15;
  }

  if (score >= 60) {
    return 1.08;
  }

  return 1;
}

function getActionType(
  client: CommercialMemoryClient,
  daysSinceLastContact: number,
  closeProbability: number,
): FounderRevenueLeverActionType {
  const estado = client.estado?.toLowerCase() || "";

  if (closeProbability >= 75) {
    return "close";
  }

  if (daysSinceLastContact >= 21) {
    return "reactivate";
  }

  if (estado.includes("activo") && !client.pagado) {
    return "protect";
  }

  if (daysSinceLastContact >= 7) {
    return "followup";
  }

  return "maintain";
}

function getActionLabel(
  actionType: FounderRevenueLeverActionType,
) {
  switch (actionType) {
    case "close":
      return "Cerrar esta oportunidad hoy";
    case "followup":
      return "Enviar seguimiento comercial";
    case "reactivate":
      return "Reactivar la relación";
    case "protect":
      return "Proteger este ingreso";
    case "maintain":
    default:
      return "Mantener el momentum";
  }
}

function getReasoning(params: {
  monto: number;
  closeProbability: number;
  responseProbability: number;
  relationshipScore: number;
  memoryScore: number;
  daysSinceLastContact: number;
}) {
  const reasons: string[] = [];

  if (params.monto > 0) {
    reasons.push("cliente con valor comercial claro");
  }

  if (params.closeProbability >= 70) {
    reasons.push("alta probabilidad de cierre");
  }

  if (params.responseProbability >= 65) {
    reasons.push("buena probabilidad de respuesta");
  }

  if (params.relationshipScore >= 70) {
    reasons.push("relación comercial fuerte");
  }

  if (params.memoryScore >= 70) {
    reasons.push("contexto suficiente para actuar con precisión");
  }

  if (params.daysSinceLastContact >= 14) {
    reasons.push("requiere seguimiento para no perder momentum");
  }

  if (reasons.length === 0) {
    reasons.push("acción recomendada para mantener control comercial");
  }

  return reasons.join(" + ");
}

function getPriority(
  revenueImpact: number,
  maxImpact: number,
): FounderRevenueLeverPriority {
  if (maxImpact <= 0) {
    return "low";
  }

  const ratio = revenueImpact / maxImpact;

  if (ratio >= 0.85) {
    return "critical";
  }

  if (ratio >= 0.55) {
    return "high";
  }

  if (ratio >= 0.25) {
    return "medium";
  }

  return "low";
}

export function buildFounderRevenueLevers(
  clients: CommercialMemoryClient[],
): FounderRevenueLever[] {
  const baseLevers = clients
    .map((client) => {
      const monto = Math.max(
        0,
        safeNumber(client.monto),
      );

      const daysSinceLastContact = daysBetween(
        client.updated_at || client.created_at,
      );

      const relationshipScore =
        getRelationshipScore(client);

      const memoryScore = getMemoryScore(client);

      const closeProbability =
        getCloseProbability(
          client,
          relationshipScore,
          memoryScore,
        );

      const responseProbability =
        getResponseProbability(
          relationshipScore,
          memoryScore,
          daysSinceLastContact,
        );

      const expectedRevenue = Math.round(
        monto * (closeProbability / 100),
      );

      const revenueImpact = Math.round(
        expectedRevenue *
          getUrgencyMultiplier(daysSinceLastContact) *
          getRelationshipMultiplier(relationshipScore) *
          getMemoryMultiplier(memoryScore),
      );

      const actionType = getActionType(
        client,
        daysSinceLastContact,
        closeProbability,
      );

      return {
        clienteId: client.id,
        clienteNombre: getClientName(client),
        expectedRevenue,
        revenueImpact,
        priority: "low" as FounderRevenueLeverPriority,
        actionType,
        actionLabel: getActionLabel(actionType),
        reasoning: getReasoning({
          monto,
          closeProbability,
          responseProbability,
          relationshipScore,
          memoryScore,
          daysSinceLastContact,
        }),
      };
    })
    .filter((lever) => lever.revenueImpact > 0)
    .sort(
      (a, b) =>
        b.revenueImpact - a.revenueImpact,
    );

  const maxImpact =
    baseLevers[0]?.revenueImpact || 0;

  return baseLevers.map((lever) => ({
    ...lever,
    priority: getPriority(
      lever.revenueImpact,
      maxImpact,
    ),
  }));
}

export function getFounderRevenueLeverPriorityLabel(
  priority: FounderRevenueLeverPriority,
) {
  switch (priority) {
    case "critical":
      return "Impacto crítico";
    case "high":
      return "Alto impacto";
    case "medium":
      return "Impacto medio";
    case "low":
    default:
      return "Impacto bajo";
  }
}

export function getFounderRevenueLeverPriorityClasses(
  priority: FounderRevenueLeverPriority,
) {
  switch (priority) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700";
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "medium":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "low":
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}