import {
  buildStrategicAdvisorReport,
  type StrategicAdvisorReport,
  type StrategicAdvisorTone,
  type StrategicInsight,
} from "../../lib/strategic-advisor";

import type { FounderBriefingClient } from "../../lib/founder-briefing";

function toneClasses(tone: StrategicAdvisorTone) {
  if (tone === "critical") {
    return {
      shell:
        "border-red-200 bg-gradient-to-br from-white via-red-50/30 to-white",
      text: "text-red-700",
      badge: "border-red-200 bg-red-100 text-red-700",
      dot: "bg-red-500",
    };
  }

  if (tone === "warning") {
    return {
      shell:
        "border-amber-200 bg-gradient-to-br from-white via-amber-50/30 to-white",
      text: "text-amber-700",
      badge: "border-amber-200 bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    shell:
      "border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-white",
    text: "text-emerald-700",
    badge: "border-emerald-200 bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  };
}

function ProgressBar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full ${color}`}
        style={{
          width: `${Math.max(5, Math.min(100, value))}%`,
        }}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>

        <p className="text-sm font-black text-slate-950">{value}%</p>
      </div>

      <div className="mt-3">
        <ProgressBar value={value} color={color} />
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: StrategicInsight }) {
  const classes = toneClasses(insight.tone);

  return (
    <div className={`rounded-2xl border ${classes.shell} p-5 shadow-sm`}>
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${classes.dot}`}
        />

        <div>
          <h3 className="text-sm font-black text-slate-950">
            {insight.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            {insight.message}
          </p>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Recomendación
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-700">
              {insight.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StrategicAdvisorCard({
  clients,
}: {
  clients: FounderBriefingClient[];
}) {
  const report: StrategicAdvisorReport = buildStrategicAdvisorReport(clients);
  const classes = toneClasses(report.tone);

  return (
    <section
      className={`mb-6 overflow-hidden rounded-3xl border ${classes.shell} shadow-sm`}
    >
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${classes.badge}`}
              >
                Asesor estratégico IA
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">
                Capa estratégica V1.7
              </span>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Inteligencia estratégica para founder
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              {report.headline}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              {report.summary}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Puntaje estratégico
            </p>

            <p className={`mt-1 text-4xl font-black ${classes.text}`}>
              {report.score}
            </p>

            <p className="text-xs font-bold text-slate-500">/100</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-b border-slate-200 bg-slate-50/50 px-5 py-5 sm:px-6 lg:grid-cols-4">
        <Metric
          label="Presión de ejecución"
          value={report.executionPressure}
          color="bg-red-500"
        />

        <Metric
          label="Concentración de ingresos"
          value={report.concentrationRisk}
          color="bg-amber-500"
        />

        <Metric
          label="Salud del pipeline"
          value={report.pipelineHealth}
          color="bg-emerald-500"
        />

        <Metric
          label="Momentum comercial"
          value={report.commercialMomentum}
          color="bg-blue-500"
        />
      </div>

      <div className="grid gap-4 p-5 sm:px-6 lg:grid-cols-2">
        {report.insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  );
}