import {
  buildExecutiveCommercialPipelineChapter,
  type ExecutivePipelineStatus,
} from "../../../../lib/executive-commercial-pipeline-engine";

import type {
  CommercialRelationship,
} from "../../../../lib/commercial-action-engine";

import ExecutiveChapterShell from "./ExecutiveChapterShell";
import ExecutiveDecisionCard from "./ExecutiveDecisionCard";
import ExecutiveEvidenceGrid from "./ExecutiveEvidenceGrid";
import ExecutiveMetricStrip, {
  type ExecutiveMetricItem,
} from "./ExecutiveMetricStrip";
import ExecutiveSummaryCard, {
  type ExecutiveSummaryTone,
  type ExecutiveSummaryTrend,
} from "./ExecutiveSummaryCard";

type CommercialPipelineChapterProps = {
  relationships: CommercialRelationship[];
};

function getSummaryTone(
  status: ExecutivePipelineStatus,
): ExecutiveSummaryTone {
  if (status === "critical") return "critical";
  if (status === "risk") return "warning";
  if (status === "attention") return "stable";

  return "positive";
}

function getTrend(
  status: ExecutivePipelineStatus,
): ExecutiveSummaryTrend {
  if (status === "healthy") return "up";
  if (status === "attention") return "stable";

  return "down";
}

function getStatusLabel(
  status: ExecutivePipelineStatus,
): string {
  if (status === "healthy") return "Fuerte";
  if (status === "attention") return "Seguimiento";
  if (status === "risk") return "Presión";

  return "Crítico";
}

function getTrendLabel(
  status: ExecutivePipelineStatus,
): string {
  if (status === "healthy") return "Momentum comercial positivo";
  if (status === "attention") return "Pipeline bajo vigilancia";
  if (status === "risk") return "Riesgo creciente";
  return "Intervención necesaria";
}

function getDecisionTone(
  status: ExecutivePipelineStatus,
) {
  if (status === "critical") return "critical" as const;
  if (status === "risk") return "medium" as const;
  if (status === "attention") return "stable" as const;

  return "growth" as const;
}

function getMetricTone(
  status: ExecutivePipelineStatus,
): ExecutiveMetricItem["tone"] {
  if (status === "critical") return "critical";
  if (status === "risk") return "medium";
  if (status === "attention") return "stable";

  return "growth";
}

function getEvidenceTone(
  status: ExecutivePipelineStatus,
) {
  if (status === "critical") return "critical" as const;
  if (status === "risk") return "medium" as const;
  if (status === "attention") return "stable" as const;

  return "growth" as const;
}

export default function CommercialPipelineChapter({
  relationships,
}: CommercialPipelineChapterProps) {
  const chapter =
    buildExecutiveCommercialPipelineChapter(
      relationships,
    );

  const primaryMetric =
    chapter.evidence[0]?.value ?? "Gs. 0";

  const secondaryMetric =
    chapter.evidence[4]?.value ?? "0";

  const metrics: ExecutiveMetricItem[] =
    chapter.evidence
      .slice(0, 4)
      .map((item) => ({
        label: item.label,
        value: item.value,
        description: item.meaning,
        tone: getMetricTone(item.status),
      }));

  const evidence = chapter.evidence.map(
    (item) => ({
      label: item.label,
      value: item.value,
      description: item.meaning,
      tone: getEvidenceTone(item.status),
    }),
  );

  return (
    <ExecutiveChapterShell
      title="Pipeline Comercial"
      question={chapter.question}
      answer={chapter.summary}
      tone="pipeline"
    >
      <ExecutiveSummaryCard
        eyebrow="Conclusión"
        title={chapter.title}
        question={chapter.question}
        summary={chapter.summary}
        statusLabel={getStatusLabel(chapter.status)}
        tone={getSummaryTone(chapter.status)}
        trend={getTrend(chapter.status)}
        trendLabel={getTrendLabel(chapter.status)}
        primaryMetric={primaryMetric}
        primaryMetricLabel="Valor principal"
        secondaryMetric={secondaryMetric}
        secondaryMetricLabel="Señal secundaria"
        decision={chapter.decision.description}
      />

      <ExecutiveMetricStrip
        title="Evidencia"
        description="Esta evidencia explica por qué ClienteYA llega a esta conclusión."
        metrics={metrics}
      />

      <ExecutiveEvidenceGrid
        title="Evidencia"
        description="Esta evidencia explica por qué ClienteYA llega a esta conclusión."
        evidence={evidence}
        columns="two"
      />

      <ExecutiveDecisionCard
        title={chapter.decision.title}
        description={chapter.decision.description}
        decision={chapter.decision.actionLabel}
        tone={getDecisionTone(chapter.status)}
      />
    </ExecutiveChapterShell>
  );
}