import ExecutiveChapter from "./ExecutiveChapter";
import ExecutiveDecisionCard from "./ExecutiveDecisionCard";
import ExecutiveEvidenceGrid from "./ExecutiveEvidenceGrid";
import ExecutiveSummaryCard from "./ExecutiveSummaryCard";

import type { ExecutiveActionsChapter as ExecutiveActionsModel } from "../../../../lib/executive-actions-engine";

type ExecutiveActionsChapterProps = {
  chapter: ExecutiveActionsModel;
};

function mapStatus(status: ExecutiveActionsModel["status"]) {
  if (status === "critical") {
    return {
      state: "critical" as const,
      tone: "critical" as const,
      color: "red" as const,
    };
  }

  if (status === "risk") {
    return {
      state: "warning" as const,
      tone: "warning" as const,
      color: "amber" as const,
    };
  }

  return {
    state: "stable" as const,
    tone: "stable" as const,
    color: "emerald" as const,
  };
}

function getStatusLabel(status: ExecutiveActionsModel["status"]) {
  if (status === "critical") return "Crítico";
  if (status === "risk") return "Atención";
  return "Estable";
}

function getActionTypeLabel(
  type: ExecutiveActionsModel["actions"][number]["type"],
) {
  if (type === "followup") return "Seguimiento";
  if (type === "revenue") return "Ingresos";
  if (type === "relationship") return "Relación";
  if (type === "execution") return "Ejecución";
  if (type === "growth") return "Crecimiento";

  return "Acción";
}

export default function ExecutiveActionsChapter({
  chapter,
}: ExecutiveActionsChapterProps) {
  const ui = mapStatus(chapter.status);

  return (
    <ExecutiveChapter
      index={6}
      title="Acciones Ejecutivas"
      question="¿Qué debo hacer ahora?"
      status={ui.state}
      tone={ui.color}
    >
      <ExecutiveSummaryCard
        eyebrow="Conclusión"
        title={chapter.title}
        question="¿Cuál es la acción más importante de hoy?"
        summary={chapter.summary}
        statusLabel={getStatusLabel(chapter.status)}
        tone={ui.tone}
        trend="stable"
        trendLabel="Prioridad ejecutiva"
        primaryMetric={String(chapter.actions.length)}
        primaryMetricLabel="Acciones prioritarias"
        secondaryMetric={chapter.decision.actionLabel}
        secondaryMetricLabel="Acción"
        decision={chapter.decision.description}
      />

      <ExecutiveEvidenceGrid
        title="Evidencia"
        description="Esta evidencia explica por qué ClienteYA llega a esta conclusión."
        columns="two"
      >
        {chapter.actions.map((action) => (
          <div key={action.id} className="rounded-[26px] border p-5">
            <p className="text-xs font-black uppercase">
              {getActionTypeLabel(action.type)}
            </p>

            <h3 className="mt-2 text-base font-black">{action.title}</h3>

            <p className="mt-3 text-sm">{action.description}</p>

            <p className="mt-3 text-sm text-slate-600">
              {action.recommendation}
            </p>
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