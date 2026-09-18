import { buildSectorKpiExplanations } from "./sector-kpi-explanations";

export type FounderKpiInput = {
  sector: string;
  totalRelationships: number;
  activeRelationships: number;
  relationshipsToContactToday: number;
  overdueRelationships: number;
  paidRelationships: number;
  unpaidRelationships: number;
  totalRevenue: number;
};

export type FounderKpiInsight = {
  id: string;
  title: string;
  explanation: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
};

export type FounderKpiIntelligence = {
  headline: string;
  summary: string;
  topInsight: string;
  actionFocus: string;
  insights: FounderKpiInsight[];
};

export function buildFounderKpiIntelligence(
  input: FounderKpiInput
): FounderKpiIntelligence {
  const result = buildSectorKpiExplanations(input);

  const insights: FounderKpiInsight[] = result.explanations.map(
    (item, index) => ({
      id: `${item.title}-${index}`,
      title: item.title,
      explanation: item.explanation,
      recommendation: item.actionHint,
      priority: index === 0 ? "high" : index <= 2 ? "medium" : "low",
    })
  );

  return {
    headline: "Inteligencia KPI",
    summary: result.summary,
    topInsight:
      insights[0]?.explanation ??
      "ClienteYA continúa aprendiendo tu negocio.",
    actionFocus:
      insights[0]?.recommendation ??
      "Continúa registrando actividad comercial.",
    insights,
  };
}