import type {
  ExecutiveCockpitReport,
} from "../../../../lib/executive-cockpit-engine";

type ExecutiveCockpitSkeletonPanelProps = {
  report: ExecutiveCockpitReport;
};

type ExecutiveSectionStatus =
  | "critical"
  | "risk"
  | "high"
  | "attention"
  | "medium"
  | "low"
  | "healthy"
  | "excellent"
  | "stable";

type ExecutiveSection = {
  title: string;
  question: string;
  summary: string;
  status: ExecutiveSectionStatus;
  metric: string;
  metricLabel: string;
};

function getStatusLabel(status: ExecutiveSectionStatus) {
  if (status === "critical") return "Crítico";
  if (status === "risk" || status === "high") return "Riesgo";
  if (status === "attention" || status === "medium") return "Atención";
  if (status === "low") return "Bajo";
  if (status === "excellent") return "Excelente";
  if (status === "healthy") return "Saludable";

  return "Estable";
}

function getStatusClasses(status: ExecutiveSectionStatus) {
  if (status === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "risk" || status === "high") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "attention" || status === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "low") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "excellent") {
    return "border-emerald-300 bg-emerald-100 text-emerald-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getEvidenceMetric(
  evidence: {
    value: string | number;
    label: string;
  }[],
  fallbackValue: string,
  fallbackLabel: string,
) {
  const primaryEvidence = evidence[0];

  if (!primaryEvidence) {
    return {
      metric: fallbackValue,
      metricLabel: fallbackLabel,
    };
  }

  return {
    metric: String(primaryEvidence.value),
    metricLabel: primaryEvidence.label,
  };
}

export default function ExecutiveCockpitSkeletonPanel({
  report,
}: ExecutiveCockpitSkeletonPanelProps) {
  const pipelineMetric = getEvidenceMetric(
    report.commercialPipeline.evidence,
    report.commercialPipeline.decision.title,
    "Decisión comercial",
  );

  const relationshipMetric = getEvidenceMetric(
    report.customerIntelligence.evidence,
    report.customerIntelligence.decision.title,
    "Decisión relacional",
  );

  const kpiMetric = getEvidenceMetric(
    report.kpiIntelligence.evidence,
    report.kpiIntelligence.decision.title,
    "KPI prioritario",
  );

  const founderInsight = report.founderInsights.insights[0];
  const executiveAction = report.executiveActions.actions[0];

  const sections: ExecutiveSection[] = [
    {
      title: "Salud del Negocio",
      question: report.executiveHealth.question,
      summary: report.executiveHealth.summary,
      status: report.executiveHealth.status,
      metric: `${report.executiveHealth.score}/100`,
      metricLabel: report.executiveHealth.title,
    },
    {
      title: "Pipeline Comercial",
      question: report.commercialPipeline.question,
      summary: report.commercialPipeline.summary,
      status: report.commercialPipeline.status,
      metric: pipelineMetric.metric,
      metricLabel: pipelineMetric.metricLabel,
    },
    {
      title: "Inteligencia de Relaciones",
      question: report.customerIntelligence.question,
      summary: report.customerIntelligence.summary,
      status: report.customerIntelligence.status,
      metric: relationshipMetric.metric,
      metricLabel: relationshipMetric.metricLabel,
    },
    {
      title: "Inteligencia de KPIs",
      question: report.kpiIntelligence.question,
      summary: report.kpiIntelligence.summary,
      status: report.kpiIntelligence.status,
      metric: kpiMetric.metric,
      metricLabel: kpiMetric.metricLabel,
    },
    {
      title: "Inteligencia del Founder",
      question: report.founderInsights.question,
      summary:
        founderInsight?.description ??
        report.founderInsights.summary,
      status: report.founderInsights.status,
      metric:
        founderInsight?.title ??
        report.founderInsights.decision.title,
      metricLabel:
        founderInsight?.impact ??
        "Patrón ejecutivo dominante",
    },
    {
      title: "Acciones Ejecutivas",
      question: report.executiveActions.question,
      summary:
        executiveAction?.recommendation ??
        report.executiveActions.summary,
      status: report.executiveActions.status,
      metric:
        executiveAction?.title ??
        report.executiveActions.decision.title,
      metricLabel:
        executiveAction?.description ??
        "Siguiente decisión ejecutiva",
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Arquitectura del Cockpit Ejecutivo
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Sistema ejecutivo de decisión
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            El Cockpit traduce la verdad comercial en inteligencia,
            decisiones y prioridades ejecutivas para el founder.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-medium text-emerald-700">
            Estado
          </p>

          <p className="text-sm font-semibold text-emerald-900">
            Inteligencia V23 activa
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">
                  {section.title}
                </h3>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  {section.question}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                  section.status,
                )}`}
              >
                {getStatusLabel(section.status)}
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4">
              <p className="text-lg font-semibold text-slate-950">
                {section.metric}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                {section.metricLabel}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {section.summary}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}