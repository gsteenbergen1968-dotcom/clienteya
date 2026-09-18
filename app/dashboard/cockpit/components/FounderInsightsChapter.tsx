import ExecutiveChapter from "./ExecutiveChapter";
import ExecutiveDecisionCard from "./ExecutiveDecisionCard";
import ExecutiveEvidenceGrid from "./ExecutiveEvidenceGrid";
import ExecutiveSummaryCard from "./ExecutiveSummaryCard";

import type { ExecutiveFounderInsightsChapter } from "../../../../lib/executive-founder-insights-engine";

type FounderInsightsChapterProps = {
  chapter: ExecutiveFounderInsightsChapter;
};

function getStatus(status: ExecutiveFounderInsightsChapter["status"]) {
  if (status === "critical") return "critical" as const;
  if (status === "risk") return "warning" as const;
  return "stable" as const;
}

function getTone(status: ExecutiveFounderInsightsChapter["status"]) {
  if (status === "critical") return "red" as const;
  if (status === "risk") return "amber" as const;
  return "emerald" as const;
}

function getStatusLabel(status: ExecutiveFounderInsightsChapter["status"]) {
  if (status === "critical") return "Crítico";
  if (status === "risk") return "Atención";
  return "Estable";
}

export default function FounderInsightsChapter({
  chapter,
}: FounderInsightsChapterProps) {
  return (
    <ExecutiveChapter
      index={5}
      title="Inteligencia del Founder"
      question="¿Qué patrón no debo ignorar?"
      status={getStatus(chapter.status)}
      tone={getTone(chapter.status)}
    >
      <ExecutiveSummaryCard
        eyebrow="Conclusión"
        title={chapter.title}
        question="¿Qué patrón explica lo que está pasando?"
        summary={chapter.summary}
        statusLabel={getStatusLabel(chapter.status)}
        tone={getStatus(chapter.status)}
        trend="stable"
        trendLabel="Patrón detectado"
        primaryMetric={String(chapter.insights.length)}
        primaryMetricLabel="Patrones detectados"
        secondaryMetric={chapter.decision.actionLabel}
        secondaryMetricLabel="Acción"
        decision={chapter.decision.description}
      />

      <ExecutiveEvidenceGrid
        title="Evidencia"
        description="Esta evidencia explica por qué ClienteYA llega a esta conclusión."
        columns="two"
      >
        {chapter.insights.map((item) => (
          <div key={item.title} className="rounded-[26px] border p-5">
            <p className="text-xs font-black uppercase">{item.title}</p>
            <p className="mt-3 text-sm font-semibold">{item.description}</p>
            <p className="mt-3 text-sm text-slate-600">{item.impact}</p>
          </div>
        ))}
      </ExecutiveEvidenceGrid>

      <ExecutiveDecisionCard
        title={chapter.decision.title}
        description={chapter.decision.description}
        decision={chapter.decision.actionLabel}
        tone="stable"
      />
    </ExecutiveChapter>
  );
}