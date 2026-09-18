import type { FounderRelationshipsSnapshot } from "../models";

export type FounderRelationshipsInsightPriority =
  | "critical"
  | "high"
  | "medium"
  | "stable";

export type FounderRelationshipsInsight = {
  id: string;
  title: string;
  description: string;
  priority: FounderRelationshipsInsightPriority;
};

export type FounderRelationshipsEngineResult = {
  generatedAt: string;
  healthScore: number;
  insights: FounderRelationshipsInsight[];
};

export function buildFounderRelationshipsEngine(
  snapshot: FounderRelationshipsSnapshot
): FounderRelationshipsEngineResult {
  const insights: FounderRelationshipsInsight[] = [];

  const {
    totalRelationships,
    activeRelationships,
    inactiveRelationships,
    newRelationshipsThisMonth,
    relationshipsWithNextAction,
    payingRelationships,
  } = snapshot.totals;

  if (inactiveRelationships > activeRelationships) {
    insights.push({
      id: "inactive-majority",
      title: "Mayoría de relaciones inactivas",
      description:
        "Hay más relaciones inactivas que activas. Revisa la estrategia de seguimiento.",
      priority: "critical",
    });
  }

  if (
    totalRelationships > 0 &&
    relationshipsWithNextAction / totalRelationships < 0.5
  ) {
    insights.push({
      id: "missing-next-actions",
      title: "Faltan próximas acciones",
      description:
        "Menos del 50% de las relaciones tienen una próxima acción planificada.",
      priority: "high",
    });
  }

  if (newRelationshipsThisMonth === 0) {
    insights.push({
      id: "no-new-relationships",
      title: "Sin nuevas relaciones",
      description:
        "Este mes no se registraron nuevas relaciones.",
      priority: "medium",
    });
  }

  if (
    totalRelationships > 0 &&
    payingRelationships / totalRelationships >= 0.6
  ) {
    insights.push({
      id: "healthy-paying-base",
      title: "Base comercial sólida",
      description:
        "Una parte importante de las relaciones genera ingresos.",
      priority: "stable",
    });
  }

  const healthScore =
    totalRelationships === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (activeRelationships / totalRelationships) * 100
            )
          )
        );

  return {
    generatedAt: snapshot.generatedAt,
    healthScore,
    insights,
  };
}