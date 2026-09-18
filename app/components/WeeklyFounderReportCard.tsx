import {
  buildWeeklyFounderReport,
  type WeeklyFounderReport,
  type WeeklyReportItem,
  type WeeklyReportTone,
} from "../../lib/founder-weekly-report";

import type { FounderBriefingRelationship } from "../../lib/founder-briefing";

function formatGs(value: number) {
  return `Gs. ${value.toLocaleString("es-ES")}`;
}

function toneClasses(tone: WeeklyReportTone) {
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

function ItemList({
  title,
  items,
}: {
  title: string;
  items: WeeklyReportItem[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h3>

      <div className="space-y-3">
        {items.map((item) => {
          const classes = toneClasses(item.tone);

          return (
            <div key={item.id} className="flex gap-2.5">
              <div
                className={`mt-2 h-1.5 w-1.5 flex-none rounded-full ${classes.dot}`}
              />

              <div>
                <p className="text-xs font-black text-slate-950">
                  {item.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

export default function WeeklyFounderReportCard({
  relationships,
}: {
  relationships: FounderBriefingRelationship[];
}) {
  const report: WeeklyFounderReport = buildWeeklyFounderReport(relationships);
  const classes = toneClasses(report.tone);

  return (
    <section
      className={`mb-6 overflow-hidden rounded-3xl border ${classes.shell} shadow-sm`}
    >
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_180px] lg:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${classes.badge}`}
              >
                Reporte semanal founder
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">
                Resumen ejecutivo V1.5
              </span>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Inteligencia ejecutiva semanal
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
              Puntaje semanal
            </p>

            <p className={`mt-1 text-4xl font-black ${classes.text}`}>
              {report.score}
            </p>

            <p className="text-xs font-bold text-slate-500">/100</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-200 bg-slate-50/60 px-5 py-4 sm:px-6 lg:grid-cols-6">
        <Metric label="Momentum" value={report.momentum} />

        <Metric label="Ejecución" value={report.executionDiscipline} />

        <Metric label="Pipeline" value={report.pipelineHealth} />

        <Metric
          label="Ingreso proyectado"
          value={formatGs(report.weeklyRevenue.projectedRevenue)}
        />

        <Metric
          label="Ingreso probable"
          value={formatGs(report.weeklyRevenue.likelyRevenue)}
        />

        <Metric
          label="Ingreso en riesgo"
          value={formatGs(report.weeklyRevenue.revenueAtRisk)}
        />
      </div>

      <div className="grid gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Relaciones activas
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {report.activeRelationships}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {report.totalRelationships} relaciones en total
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Riesgo de pérdida de contacto
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {report.ghostingCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            relaciones perdiendo momentum
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Seguimientos vencidos
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {report.overdueCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            requieren ejecución inmediata
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:px-6 lg:grid-cols-3">
        <ItemList
          title="Principales oportunidades"
          items={report.topOpportunities}
        />

        <ItemList title="Riesgos semanales" items={report.risks} />

        <ItemList
          title="Recomendaciones para founder"
          items={report.recommendations}
        />
      </div>
    </section>
  );
}