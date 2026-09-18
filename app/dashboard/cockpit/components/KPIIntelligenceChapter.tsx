import ExecutiveChapter from "./ExecutiveChapter";
import ExecutiveDecisionCard from "./ExecutiveDecisionCard";
import ExecutiveEvidenceGrid from "./ExecutiveEvidenceGrid";
import ExecutiveSummaryCard from "./ExecutiveSummaryCard";

import type {
  ExecutiveKpiChapter,
  ExecutiveKpiStatus,
} from "../../../../lib/executive-kpi-intelligence-engine";

type KPIIntelligenceChapterProps = {
  chapter: ExecutiveKpiChapter;
};

function getTone(status: ExecutiveKpiChapter["status"]) {
  if (status === "critical") return "red" as const;
  if (status === "risk") return "amber" as const;
  return "emerald" as const;
}

function getStatus(status: ExecutiveKpiChapter["status"]) {
  if (status === "critical") return "critical" as const;
  if (status === "risk") return "warning" as const;
  return "stable" as const;
}

function getSummaryTone(status: ExecutiveKpiChapter["status"]) {
  if (status === "critical") return "critical" as const;
  if (status === "risk") return "warning" as const;
  return "stable" as const;
}

function getStatusLabel(status: ExecutiveKpiChapter["status"]) {
  if (status === "critical") return "Crítico";
  if (status === "risk") return "Atención";
  return "Estable";
}

function getEvidenceClasses(
  status: ExecutiveKpiStatus,
) {
  if (status === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "risk") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "attention") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getEvidenceStatus(
  item: ExecutiveKpiChapter["evidence"][number],
): ExecutiveKpiStatus {
  const label = item.label.toLowerCase();
  const value = String(item.value).toLowerCase();

  if (
    label.includes("deuda") ||
    label.includes("presión")
  ) {
    const numeric =
      Number.parseInt(
        value.replace(/[^\d]/g, ""),
        10,
      );

    if (Number.isFinite(numeric)) {
      if (numeric >= 65) return "critical";
      if (numeric >= 45) return "risk";
      if (numeric > 0) return "attention";
      return "healthy";
    }
  }

  if (
    label.includes("ingresos confirmados")
  ) {
    return value.includes("sin ingresos")
      ? "attention"
      : "healthy";
  }

  if (
    label.includes("conversión")
  ) {
    return value.startsWith("0 ")
      ? "attention"
      : "healthy";
  }

  if (
    label.includes("actividad")
  ) {
    const numeric =
      Number.parseInt(
        value.replace(/[^\d]/g, ""),
        10,
      );

    if (Number.isFinite(numeric)) {
      if (numeric < 30) return "critical";
      if (numeric < 45) return "risk";
      if (numeric < 60) return "attention";
      return "healthy";
    }
  }

  return "attention";
}

export default function KPIIntelligenceChapter({
  chapter,
}: KPIIntelligenceChapterProps) {
  return (
    <ExecutiveChapter
      index={4}
      title="Inteligencia de KPIs"
      question="¿Qué KPIs requieren mi atención?"
      status={getStatus(chapter.status)}
      tone={getTone(chapter.status)}
    >
      <ExecutiveSummaryCard
        eyebrow="Conclusión"
        title={chapter.title}
        question="¿Qué muestran los KPIs sobre la situación actual?"
        summary={chapter.summary}
        statusLabel={getStatusLabel(chapter.status)}
        tone={getSummaryTone(chapter.status)}
        trend="stable"
        trendLabel="Presión operativa"
        primaryMetric={String(chapter.evidence.length)}
        primaryMetricLabel="Señales medidas"
        secondaryMetric={chapter.decision.actionLabel}
        secondaryMetricLabel="Acción"
        decision={chapter.decision.description}
      />

      <ExecutiveEvidenceGrid
        title="Evidencia"
        description="Esta evidencia explica por qué ClienteYA llega a esta conclusión."
        columns="two"
      >
        {chapter.evidence.map((item) => {
          const evidenceStatus =
            getEvidenceStatus(item);

          return (
            <div
              key={item.label}
              className={`rounded-[26px] border p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${getEvidenceClasses(
                evidenceStatus,
              )}`}
            >
              <p className="text-xs font-black uppercase opacity-80">
                {item.label}
              </p>

              <p className="mt-2 text-2xl font-black text-slate-950">
                {item.value}
              </p>

              <p className="mt-3 text-sm font-semibold leading-6 opacity-90">
                {item.meaning}
              </p>
            </div>
          );
        })}
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