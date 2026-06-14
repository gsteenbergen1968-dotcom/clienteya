import {
  buildFounderMemoryBriefing,
} from "../../../lib/founder-memory-briefing";

import {
  buildMemoryPatternClusters,
} from "../../../lib/memory-pattern-clusters";

import type {
  CommercialMemoryClient,
} from "../../../lib/commercial-memory-signals";

type FounderMemoryBriefingPanelProps = {
  clients: CommercialMemoryClient[];
};

export default function FounderMemoryBriefingPanel({
  clients,
}: FounderMemoryBriefingPanelProps) {
  const briefing = buildFounderMemoryBriefing(clients);
  const patterns = buildMemoryPatternClusters(clients);
  const topClusters = patterns.clusters.slice(0, 4);

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-blue-200 bg-white shadow-[0_24px_80px_rgba(37,99,235,0.10)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400" />

      <div className="relative grid gap-0 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-blue-100 bg-gradient-to-br from-white via-blue-50/75 to-slate-50 p-5 sm:p-7 xl:border-b-0 xl:border-r xl:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" />
              V20.8.6 Founder Memory
            </span>

            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              Memoria comercial
            </span>
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">
            Qué está aprendiendo ClienteYA
          </p>

          <h2 className="mt-3 max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl">
            Memoria comercial activa.
          </h2>

          <p className="mt-4 max-w-xl text-base font-bold leading-7 text-slate-700">
            {briefing.summary}
          </p>

          <div className="mt-6 rounded-[30px] border border-blue-200 bg-white p-5 shadow-[0_16px_46px_rgba(37,99,235,0.09)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                  Memoria AI
                </p>

                <p className="mt-3 text-5xl font-black leading-none text-slate-950">
                  {briefing.memoryScore}
                  <span className="text-2xl text-blue-700">/100</span>
                </p>
              </div>

              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                {briefing.memoryLabel}
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${briefing.memoryScore}%` }}
              />
            </div>

            <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black leading-6 text-emerald-800">
              {briefing.founderReminder}
            </p>
          </div>
        </div>

        <div className="bg-white/95 p-4 sm:p-6 xl:p-7">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Patrones detectados
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                ClienteYA convierte actividad comercial en memoria útil para decidir mejor.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              {briefing.totalPatterns} patrones
            </span>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                Patrón más fuerte
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-slate-950">
                {briefing.strongestPattern}
              </p>
            </div>

            <div className="rounded-[28px] border border-red-200 bg-red-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-700">
                Riesgo principal
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-slate-950">
                {briefing.mainRisk}
              </p>
            </div>

            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Mejor acción
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-slate-950">
                {briefing.bestAction}
              </p>
            </div>
          </div>

          {topClusters.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {topClusters.map((cluster) => (
                <div
                  key={cluster.id}
                  className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {cluster.title}
                      </p>
                      <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                        {cluster.subtitle}
                      </p>
                    </div>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-700">
                      {cluster.count}
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-bold leading-5 text-slate-600">
                    {cluster.recommendation}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}