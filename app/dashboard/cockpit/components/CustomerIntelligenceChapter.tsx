import {
  buildExecutiveCustomerIntelligenceChapter,
  type ExecutiveCustomerStatus,
} from "../../../../lib/executive-customer-intelligence-engine";

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

type CustomerIntelligenceChapterProps = {
  relationships: CommercialRelationship[];
};

function getSummaryTone(
  status: ExecutiveCustomerStatus,
): ExecutiveSummaryTone {
  if (status === "critical") return "critical";
  if (status === "risk") return "warning";
  if (status === "attention") return "stable";

  return "positive";
}

function getTrend(
  status: ExecutiveCustomerStatus,
): ExecutiveSummaryTrend {
  if (status === "healthy") return "up";
  if (status === "attention") return "stable";

  return "down";
}

function getStatusLabel(
  status: ExecutiveCustomerStatus,
): string {
  if (status === "healthy") return "Relaciones fuertes";
  if (status === "attention") return "Atención selectiva";
  if (status === "risk") return "Riesgo relacional";

  return "Intervención urgente";
}

function getTrendLabel(
  status: ExecutiveCustomerStatus,
): string {
  if (status === "healthy") {
    return "Relaciones con buena continuidad";
  }

  if (status === "attention") {
    return "Relaciones bajo observación";
  }

  if (status === "risk") {
    return "Relaciones perdiendo fuerza";
  }

  return "Relaciones críticas";
}

function getDecisionTone(
  status: ExecutiveCustomerStatus,
) {
  if (status === "critical") return "critical" as const;
  if (status === "risk") return "medium" as const;
  if (status === "attention") return "stable" as const;

  return "growth" as const;
}

function getMetricTone(
  status: ExecutiveCustomerStatus,
): ExecutiveMetricItem["tone"] {
  if (status === "critical") return "critical";
  if (status === "risk") return "medium";
  if (status === "attention") return "stable";

  return "growth";
}

function getEvidenceTone(
  status: ExecutiveCustomerStatus,
) {
  if (status === "critical") return "critical" as const;
  if (status === "risk") return "medium" as const;
  if (status === "attention") return "stable" as const;

  return "growth" as const;
}

export default function CustomerIntelligenceChapter({
  relationships,
}: CustomerIntelligenceChapterProps) {
  const chapter =
    buildExecutiveCustomerIntelligenceChapter(relationships);

  const primaryMetric =
    chapter.evidence[0]?.value ?? "0";

  const secondaryMetric =
    chapter.evidence[4]?.value ?? "0";

  const metrics: ExecutiveMetricItem[] =
    chapter.evidence
      .slice(0, 4)
      .map((item) => ({
        label: item.label,
        value: item.value,
        description: item.meaning,
        tone: getMetricTone(chapter.status),
      }));

  const evidence =
    chapter.evidence.map((item) => ({
      label: item.label,
      value: item.value,
      description: item.meaning,
      tone: getEvidenceTone(chapter.status),
    }));

  return (
    <ExecutiveChapterShell
      title="Inteligencia de Relaciones"
      question="¿Qué relaciones explican esta situación?"
      answer={chapter.decision.description}
      tone="customers"
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
        title="Indicadores clave"
        description="Los indicadores esenciales para comprender qué relaciones explican la situación comercial actual."
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