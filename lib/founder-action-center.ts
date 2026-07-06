import type { ClienteForRevenueForecast } from "./revenue-forecast";
import type { RevenueForecast } from "./revenue-forecast";

export type FounderActionPriority =
  | "critical"
  | "high"
  | "medium";

export type FounderAction = {
  id: string;
  title: string;
  description: string;
  impact: number;
  actionLabel: string;
  actionHref: string;
  priority: FounderActionPriority;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function formatImpact(value: number) {
  return Math.max(0, Number(value || 0));
}

export function buildFounderActions(
  clientes: ClienteForRevenueForecast[],
  forecast: RevenueForecast
): FounderAction[] {
  const actions: FounderAction[] = [];

  forecast.topOpportunities.slice(0, 3).forEach((opportunity) => {
    actions.push({
      id: `forecast-${opportunity.id}`,
      title: `Contactar ${opportunity.nombre}`,
      description: opportunity.reason,
      impact: formatImpact(opportunity.expectedRevenue),
      actionLabel: "Abrir cliente",
      actionHref: `/dashboard/clientes/${opportunity.id}`,
      priority:
        opportunity.probability >= 70
          ? "critical"
          : opportunity.probability >= 50
            ? "high"
            : "medium",
    });
  });

  if (
    forecast.revenueAtRisk > 0 &&
    forecast.atRiskOpportunities.length > 0
  ) {
    actions.push({
      id: "pipeline-risk",
      title: "Revisar oportunidades en riesgo",
      description:
        "Hay ingresos potenciales que pueden perderse sin seguimiento.",
      impact: formatImpact(forecast.revenueAtRisk),
      actionLabel: "Ver clientes",
      actionHref: "/dashboard/clientes",
      priority: "critical",
    });
  }

  clientes.forEach((cliente) => {
    const estado = normalizeText(cliente.estado);

    if (
      estado.includes("interes") &&
      !forecast.topOpportunities.some(
        (item) => item.id === cliente.id
      )
    ) {
      actions.push({
        id: `interest-${cliente.id}`,
        title: `Avanzar negociación con ${cliente.nombre}`,
        description:
          "Cliente con señales de interés que necesita seguimiento.",
        impact: formatImpact(Number(cliente.monto || 0)),
        actionLabel: "Abrir cliente",
        actionHref: `/dashboard/clientes/${cliente.id}`,
        priority: "high",
      });
    }
  });

  return actions
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);
}

export function getFounderActionPriorityLabel(
  priority: FounderActionPriority
) {
  if (priority === "critical") return "Crítica";
  if (priority === "high") return "Alta";

  return "Media";
}

export function getFounderActionPriorityClasses(
  priority: FounderActionPriority
) {
  if (priority === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "high") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}