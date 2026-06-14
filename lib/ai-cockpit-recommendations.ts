import type { ClienteForAICockpit } from "./ai-cockpit";

export type AICockpitRecommendationPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export type AICockpitRecommendationCategory =
  | "sales"
  | "retention"
  | "operations"
  | "revenue"
  | "followup";

export type AICockpitRecommendation = {
  id: string;
  title: string;
  description: string;
  priority: AICockpitRecommendationPriority;
  category: AICockpitRecommendationCategory;
};

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function daysUntil(date: string | null | undefined) {
  if (!date) return null;

  const today = new Date();
  const target = new Date(date);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();

  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function buildAICockpitRecommendations(
  clientes: ClienteForAICockpit[]
): AICockpitRecommendation[] {
  const recommendations: AICockpitRecommendation[] = [];

  const overdueClients = clientes.filter((cliente) => {
    const days = daysUntil(cliente.proximo_contacto);

    return days !== null && days < 0;
  });

  const unpaidClients = clientes.filter(
    (cliente) => !cliente.pagado && Number(cliente.monto || 0) > 0
  );

  const interestedClients = clientes.filter((cliente) => {
    const estado = normalize(cliente.estado);

    return (
      estado.includes("interes") ||
      estado.includes("lead") ||
      estado.includes("nuevo")
    );
  });

  const inactiveClients = clientes.filter((cliente) => {
    const estado = normalize(cliente.estado);
    const notas = normalize(cliente.notas);

    return (
      estado.includes("sin respuesta") ||
      estado.includes("inactivo") ||
      notas.includes("no responde")
    );
  });

  if (overdueClients.length > 0) {
    recommendations.push({
      id: "overdue-followups",
      title: "Resolver seguimientos atrasados",
      description: `${overdueClients.length} cliente(s) necesitan seguimiento inmediato. Priorizar contacto hoy.`,
      priority: "urgent",
      category: "followup",
    });
  }

  if (unpaidClients.length >= 3) {
    recommendations.push({
      id: "pending-payments",
      title: "Revisar pagos pendientes",
      description:
        "Existen múltiples pagos pendientes. Conviene ejecutar seguimiento financiero.",
      priority: "high",
      category: "revenue",
    });
  }

  if (interestedClients.length >= 2) {
    recommendations.push({
      id: "accelerate-sales",
      title: "Acelerar oportunidades comerciales",
      description:
        "Existen leads calientes con potencial de conversión inmediata.",
      priority: "high",
      category: "sales",
    });
  }

  if (inactiveClients.length > 0) {
    recommendations.push({
      id: "reactivation",
      title: "Lanzar reactivación comercial",
      description:
        "Hay clientes con baja respuesta o inactivos. Recomendado ejecutar campaña corta.",
      priority: "medium",
      category: "retention",
    });
  }

  if (clientes.length >= 10) {
    recommendations.push({
      id: "operations-scale",
      title: "Fortalecer operación comercial",
      description:
        "La base de clientes está creciendo. Buen momento para optimizar procesos y automatizaciones.",
      priority: "medium",
      category: "operations",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "healthy",
      title: "Operación comercial saludable",
      description:
        "No se detectaron riesgos importantes en este momento.",
      priority: "low",
      category: "operations",
    });
  }

  return recommendations;
}

export function getAICockpitRecommendationPriorityLabel(
  priority: AICockpitRecommendationPriority
) {
  if (priority === "urgent") return "Urgente";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";

  return "Baja";
}

export function getAICockpitRecommendationCategoryLabel(
  category: AICockpitRecommendationCategory
) {
  if (category === "sales") return "Ventas";
  if (category === "retention") return "Retención";
  if (category === "operations") return "Operaciones";
  if (category === "revenue") return "Revenue";

  return "Follow-up";
}