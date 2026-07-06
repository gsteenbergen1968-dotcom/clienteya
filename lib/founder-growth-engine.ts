import type { CommercialMemoryClient } from "./commercial-memory-signals";

export type FounderGrowthPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type FounderGrowthOpportunity = {
  clienteId: string;
  clienteNombre: string;
  growthPotential: number;
  growthScore: number;
  recommendation: string;
  reasoning: string;
  priority: FounderGrowthPriority;
};

function clamp(
  value: number,
  min = 0,
  max = 100,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function safeNumber(
  value: unknown,
  fallback = 0,
) {
  if (
    typeof value !== "number" ||
    Number.isNaN(value)
  ) {
    return fallback;
  }

  return value;
}

function getClientName(
  client: CommercialMemoryClient,
) {
  return (
    client.nombre?.trim() ||
    "Cliente sin nombre"
  );
}

function getRelationshipScore(
  client: CommercialMemoryClient,
) {
  let score = 40;

  if (client.notas?.trim()) {
    score += 20;
  }

  if (client.recordatorio?.trim()) {
    score += 15;
  }

  if (client.pagado) {
    score += 15;
  }

  if (
    client.estado
      ?.toLowerCase()
      .includes("activo")
  ) {
    score += 20;
  }

  return clamp(score);
}

function getGrowthScore(
  client: CommercialMemoryClient,
) {
  const monto = safeNumber(
    client.monto,
  );

  const relationshipScore =
    getRelationshipScore(client);

  let score =
    relationshipScore * 0.6;

  if (monto > 0) {
    score += 20;
  }

  if (client.pagado) {
    score += 10;
  }

  if (
    client.estado
      ?.toLowerCase()
      .includes("activo")
  ) {
    score += 10;
  }

  return clamp(
    Math.round(score),
  );
}

function getPriority(
  score: number,
): FounderGrowthPriority {
  if (score >= 85) {
    return "critical";
  }

  if (score >= 70) {
    return "high";
  }

  if (score >= 50) {
    return "medium";
  }

  return "low";
}

function getRecommendation(
  score: number,
) {
  if (score >= 85) {
    return "Proponer expansión inmediata";
  }

  if (score >= 70) {
    return "Presentar nueva oferta";
  }

  if (score >= 50) {
    return "Fortalecer relación comercial";
  }

  return "Mantener seguimiento";
}

function getReasoning(params: {
  growthScore: number;
  relationshipScore: number;
  amount: number;
}) {
  const reasons: string[] = [];

  if (
    params.relationshipScore >=
    70
  ) {
    reasons.push(
      "relación sólida",
    );
  }

  if (
    params.amount > 0
  ) {
    reasons.push(
      "historial comercial existente",
    );
  }

  if (
    params.growthScore >=
    80
  ) {
    reasons.push(
      "alto potencial de expansión",
    );
  }

  if (
    reasons.length === 0
  ) {
    reasons.push(
      "potencial de crecimiento moderado",
    );
  }

  return reasons.join(
    " + ",
  );
}

export function buildFounderGrowthEngine(
  clients: CommercialMemoryClient[],
): FounderGrowthOpportunity[] {
  return clients
    .map((client) => {
      const amount =
        Math.max(
          0,
          safeNumber(
            client.monto,
          ),
        );

      const relationshipScore =
        getRelationshipScore(
          client,
        );

      const growthScore =
        getGrowthScore(
          client,
        );

      const growthPotential =
        Math.round(
          amount *
            (growthScore /
              100),
        );

      return {
        clienteId: client.id,
        clienteNombre:
          getClientName(client),
        growthPotential,
        growthScore,
        recommendation:
          getRecommendation(
            growthScore,
          ),
        reasoning:
          getReasoning({
            growthScore,
            relationshipScore,
            amount,
          }),
        priority:
          getPriority(
            growthScore,
          ),
      };
    })
    .filter(
      (item) =>
        item.growthPotential > 0,
    )
    .sort(
      (a, b) =>
        b.growthPotential -
        a.growthPotential,
    );
}

export function getFounderGrowthPriorityLabel(
  priority: FounderGrowthPriority,
) {
  switch (priority) {
    case "critical":
      return "Crecimiento crítico";

    case "high":
      return "Alto potencial";

    case "medium":
      return "Potencial medio";

    case "low":
    default:
      return "Potencial bajo";
  }
}

export function getFounderGrowthPriorityClasses(
  priority: FounderGrowthPriority,
) {
  switch (priority) {
    case "critical":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "high":
      return "border-sky-200 bg-sky-50 text-sky-700";

    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "low":
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}