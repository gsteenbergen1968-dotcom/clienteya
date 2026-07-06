import type { CommercialMemoryClient } from "./commercial-memory-signals";

export type FounderRiskForecastPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type FounderRiskForecast = {
  clienteId: string;
  clienteNombre: string;
  riskAmount: number;
  riskProbability: number;
  daysWithoutContact: number;
  priority: FounderRiskForecastPriority;
  recommendation: string;
  reasoning: string;
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

function daysBetween(
  date?: string | null,
) {
  if (!date) {
    return 30;
  }

  const parsedDate = new Date(date);

  if (
    Number.isNaN(parsedDate.getTime())
  ) {
    return 30;
  }

  const today = new Date();

  const diff =
    today.getTime() -
    parsedDate.getTime();

  return Math.max(
    0,
    Math.floor(
      diff /
        (1000 * 60 * 60 * 24),
    ),
  );
}

function getClientName(
  client: CommercialMemoryClient,
) {
  return (
    client.nombre?.trim() ||
    "Cliente sin nombre"
  );
}

function getRiskProbability(
  client: CommercialMemoryClient,
  daysWithoutContact: number,
) {
  let probability = 20;

  probability +=
    daysWithoutContact * 2.2;

  if (!client.notas?.trim()) {
    probability += 10;
  }

  if (!client.recordatorio?.trim()) {
    probability += 10;
  }

  if (
    !client.proximo_contacto
  ) {
    probability += 10;
  }

  if (
    client.estado
      ?.toLowerCase()
      .includes("pendiente")
  ) {
    probability += 10;
  }

  return clamp(
    Math.round(probability),
  );
}

function getPriority(
  probability: number,
): FounderRiskForecastPriority {
  if (probability >= 80) {
    return "critical";
  }

  if (probability >= 65) {
    return "high";
  }

  if (probability >= 45) {
    return "medium";
  }

  return "low";
}

function getRecommendation(
  probability: number,
  daysWithoutContact: number,
) {
  if (
    probability >= 80
  ) {
    return "Contactar hoy";
  }

  if (
    daysWithoutContact >= 14
  ) {
    return "Seguimiento urgente";
  }

  if (
    daysWithoutContact >= 7
  ) {
    return "Programar contacto";
  }

  return "Monitorear";
}

function getReasoning(params: {
  probability: number;
  daysWithoutContact: number;
}) {
  const reasons: string[] = [];

  if (
    params.daysWithoutContact >=
    21
  ) {
    reasons.push(
      "sin contacto reciente",
    );
  }

  if (
    params.probability >= 70
  ) {
    reasons.push(
      "alto riesgo de pérdida",
    );
  }

  if (
    params.daysWithoutContact >=
    14
  ) {
    reasons.push(
      "relación enfriándose",
    );
  }

  if (
    reasons.length === 0
  ) {
    reasons.push(
      "mantener seguimiento",
    );
  }

  return reasons.join(
    " + ",
  );
}

export function buildFounderRiskForecast(
  clients: CommercialMemoryClient[],
): FounderRiskForecast[] {
  return clients
    .map((client) => {
      const amount =
        Math.max(
          0,
          safeNumber(
            client.monto,
          ),
        );

      const daysWithoutContact =
        daysBetween(
          client.updated_at ||
            client.created_at,
        );

      const riskProbability =
        getRiskProbability(
          client,
          daysWithoutContact,
        );

      const riskAmount =
        Math.round(
          amount *
            (riskProbability /
              100),
        );

      return {
        clienteId: client.id,
        clienteNombre:
          getClientName(client),
        riskAmount,
        riskProbability,
        daysWithoutContact,
        priority:
          getPriority(
            riskProbability,
          ),
        recommendation:
          getRecommendation(
            riskProbability,
            daysWithoutContact,
          ),
        reasoning:
          getReasoning({
            probability:
              riskProbability,
            daysWithoutContact,
          }),
      };
    })
    .filter(
      (item) =>
        item.riskAmount > 0,
    )
    .sort(
      (a, b) =>
        b.riskAmount -
        a.riskAmount,
    );
}

export function getFounderRiskForecastPriorityLabel(
  priority: FounderRiskForecastPriority,
) {
  switch (priority) {
    case "critical":
      return "Riesgo crítico";

    case "high":
      return "Riesgo alto";

    case "medium":
      return "Riesgo medio";

    case "low":
    default:
      return "Riesgo bajo";
  }
}

export function getFounderRiskForecastPriorityClasses(
  priority: FounderRiskForecastPriority,
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