import {
  buildFounderKpiIntelligence,
  type FounderKpiInsight,
} from "../../../lib/founder-kpi-intelligence";

import {
  buildKPIImpactSignals,
  getKPIImpactPriorityClasses,
  getKPIImpactPriorityLabel,
  type KPIImpactSignal,
} from "../../../lib/kpi-impact-layer";

import type { SectorKpiInput } from "../../../lib/sector-kpi-explanations";

type FounderKpiIntelligencePanelProps = {
  input: SectorKpiInput;
};

function getPriorityClasses(priority: FounderKpiInsight["priority"]) {
  if (priority === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getPriorityLabel(priority: FounderKpiInsight["priority"]) {
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";
  return "Baja";
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export default function FounderKpiIntelligencePanel({
  input,
}: FounderKpiIntelligencePanelProps) {
  const intelligence = buildFounderKpiIntelligence(input);
  const topInsights = intelligence.insights.slice(0, 3);

  const responseRate = clamp(
    Math.round((input.activeClients / Math.max(input.totalClients, 1)) * 100),
  );

  const conversionRate = clamp(
    Math.round((input.paidClients / Math.max(input.totalClients, 1)) * 100),
  );

  const followupRate = clamp(
    Math.round(
      ((input.totalClients - input.overdueClients) /
        Math.max(input.totalClients, 1)) *
        100,
    ),
  );

  const impactLayer = buildKPIImpactSignals({
    responseRate,
    conversionRate,
    followupRate,
    activeClients: input.activeClients,
    opportunities: input.clientsToContactToday + input.overdueClients,
  });

  const topImpactSignals = impactLayer.signals.slice(0, 3);

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-950 via-blue-600 to-amber-400" />

      <div className="relative grid gap-0 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/50 p-5 sm:p-7 xl:border-b-0 xl:border-r xl:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" />
              V20.9.1 KPI Impact Layer
            </span>

            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
              KPI → Impacto → Acción
            </span>
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">
            Qué significan tus números
          </p>

          <h2 className="mt-3 max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl">
            Inteligencia KPI.
          </h2>

          <p className="mt-4 max-w-xl text-base font-bold leading-7 text-slate-700">
            {intelligence.summary}
          </p>

          <div className="mt-6 rounded-[30px] border border-blue-200 bg-white p-5 shadow-[0_16px_46px_rgba(37,99,235,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                  Insight principal
                </p>

                <p className="mt-3 text-lg font-black leading-7 text-slate-950">
                  {intelligence.topInsight}
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-950">
                {impactLayer.score}/100
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Acción recomendada
              </p>

              <p className="mt-2 text-sm font-black leading-6 text-emerald-900">
                {intelligence.actionFocus}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-[22px] border border-blue-200 bg-blue-50 px-3 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-700">
                Respuesta
              </p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {responseRate}%
              </p>
            </div>

            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-3 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                Conversión
              </p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {conversionRate}%
              </p>
            </div>

            <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-3 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-700">
                Seguimiento
              </p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {followupRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 p-4 sm:p-6 xl:p-7">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                KPI, impacto y acción
              </p>

              <p className="mt-1 text-sm font-bold text-slate-950">
                ClienteYA convierte métricas en contexto, riesgo comercial y
                próximos pasos.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              {intelligence.insights.length + impactLayer.signals.length} señales
            </span>
          </div>

          <div className="grid gap-3">
            {topInsights.map((insight) => (
              <article
                key={insight.id}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-sm font-black text-slate-950">
                    {insight.title}
                  </h3>

                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getPriorityClasses(
                      insight.priority,
                    )}`}
                  >
                    {getPriorityLabel(insight.priority)}
                  </span>
                </div>

                <p className="text-sm font-bold leading-6 text-slate-700">
                  {insight.explanation}
                </p>

                <p className="mt-3 rounded-2xl border border-white bg-white px-4 py-3 text-xs font-black leading-5 text-blue-800">
                  {insight.recommendation}
                </p>
              </article>
            ))}

            {topImpactSignals.map((signal: KPIImpactSignal, index: number) => (
              <article
                key={`${signal.title}-${index}`}
                className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-700">
                      Impacto comercial
                    </p>

                    <h3 className="mt-1 text-sm font-black text-slate-950">
                      {signal.title}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getKPIImpactPriorityClasses(
                      signal.priority,
                    )}`}
                  >
                    {getKPIImpactPriorityLabel(signal.priority)}
                  </span>
                </div>

                <p className="text-sm font-bold leading-6 text-slate-700">
                  {signal.impact}
                </p>

                <p className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-black leading-5 text-blue-800">
                  {signal.recommendation}
                </p>
              </article>
            ))}

            {topInsights.length === 0 && topImpactSignals.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-600">
                ClienteYA necesita más actividad comercial para interpretar KPI.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}