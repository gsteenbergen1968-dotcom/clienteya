import {
  buildFounderRevenueLevers,
  type FounderRevenueLever,
} from "./founder-revenue-levers";

import {
  buildFounderRiskForecast,
  type FounderRiskForecast,
} from "./founder-risk-forecast";

import {
  buildFounderGrowthEngine,
  type FounderGrowthOpportunity,
} from "./founder-growth-engine";

import type { CommercialMemoryClient } from "./commercial-memory-signals";

export type FounderExecutivePriorityCategory =
  | "revenue"
  | "risk"
  | "growth";

export type FounderExecutivePriorityUrgency =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type FounderExecutivePriority = {
  id: string;
  clienteId: string;
  clienteNombre: string;
  category: FounderExecutivePriorityCategory;
  urgency: FounderExecutivePriorityUrgency;
  title: string;
  recommendation: string;
  impact: number;
  reasoning: string;
  sourceLabel: string;
};

function getUrgencyScore(
  urgency: FounderExecutivePriorityUrgency,
) {
  switch (urgency) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
    default:
      return 1;
  }
}

function normalizeUrgency(
  priority: string,
): FounderExecutivePriorityUrgency {
  if (priority === "critical") {
    return "critical";
  }

  if (priority === "high") {
    return "high";
  }

  if (priority === "medium") {
    return "medium";
  }

  return "low";
}

function fromRevenueLever(
  lever: FounderRevenueLever,
): FounderExecutivePriority {
  return {
    id: `revenue-${lever.clienteId}`,
    clienteId: lever.clienteId,
    clienteNombre: lever.clienteNombre,
    category: "revenue",
    urgency: normalizeUrgency(lever.priority),
    title: "Mayor impacto de ingreso hoy",
    recommendation: lever.actionLabel,
    impact: lever.revenueImpact,
    reasoning: lever.reasoning,
    sourceLabel: "Revenue Levers",
  };
}

function fromRiskForecast(
  forecast: FounderRiskForecast,
): FounderExecutivePriority {
  return {
    id: `risk-${forecast.clienteId}`,
    clienteId: forecast.clienteId,
    clienteNombre: forecast.clienteNombre,
    category: "risk",
    urgency: normalizeUrgency(forecast.priority),
    title: "Ingreso en riesgo si no actúas",
    recommendation: forecast.recommendation,
    impact: forecast.riskAmount,
    reasoning: forecast.reasoning,
    sourceLabel: "Risk Forecast",
  };
}

function fromGrowthOpportunity(
  opportunity: FounderGrowthOpportunity,
): FounderExecutivePriority {
  return {
    id: `growth-${opportunity.clienteId}`,
    clienteId: opportunity.clienteId,
    clienteNombre: opportunity.clienteNombre,
    category: "growth",
    urgency: normalizeUrgency(opportunity.priority),
    title: "Mayor potencial de crecimiento",
    recommendation: opportunity.recommendation,
    impact: opportunity.growthPotential,
    reasoning: opportunity.reasoning,
    sourceLabel: "Growth Engine",
  };
}

function deduplicateByClient(
  priorities: FounderExecutivePriority[],
) {
  const bestByClient = new Map<
    string,
    FounderExecutivePriority
  >();

  for (const priority of priorities) {
    const existing =
      bestByClient.get(priority.clienteId);

    if (!existing) {
      bestByClient.set(
        priority.clienteId,
        priority,
      );
      continue;
    }

    const currentScore =
      priority.impact *
      getUrgencyScore(priority.urgency);

    const existingScore =
      existing.impact *
      getUrgencyScore(existing.urgency);

    if (currentScore > existingScore) {
      bestByClient.set(
        priority.clienteId,
        priority,
      );
    }
  }

  return Array.from(bestByClient.values());
}

export function buildFounderAIExecutiveAdvisor(
  clients: CommercialMemoryClient[],
): FounderExecutivePriority[] {
  const revenuePriorities =
    buildFounderRevenueLevers(clients)
      .slice(0, 5)
      .map(fromRevenueLever);

  const riskPriorities =
    buildFounderRiskForecast(clients)
      .slice(0, 5)
      .map(fromRiskForecast);

  const growthPriorities =
    buildFounderGrowthEngine(clients)
      .slice(0, 5)
      .map(fromGrowthOpportunity);

  return deduplicateByClient([
    ...revenuePriorities,
    ...riskPriorities,
    ...growthPriorities,
  ])
    .filter((priority) => priority.impact > 0)
    .sort((a, b) => {
      const urgencyDifference =
        getUrgencyScore(b.urgency) -
        getUrgencyScore(a.urgency);

      if (urgencyDifference !== 0) {
        return urgencyDifference;
      }

      return b.impact - a.impact;
    })
    .slice(0, 3);
}

export function getFounderExecutiveCategoryLabel(
  category: FounderExecutivePriorityCategory,
) {
  switch (category) {
    case "revenue":
      return "Ingreso";
    case "risk":
      return "Riesgo";
    case "growth":
      return "Crecimiento";
    default:
      return "Prioridad";
  }
}

export function getFounderExecutiveUrgencyLabel(
  urgency: FounderExecutivePriorityUrgency,
) {
  switch (urgency) {
    case "critical":
      return "Decisión crítica";
    case "high":
      return "Alta prioridad";
    case "medium":
      return "Prioridad media";
    case "low":
    default:
      return "Monitorear";
  }
}

export function getFounderExecutiveUrgencyClasses(
  urgency: FounderExecutivePriorityUrgency,
) {
  switch (urgency) {
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