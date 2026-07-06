import {
  getCockpitUnifiedSignalCategoryLabel,
  getCockpitUnifiedSignalPriorityLabel,
  getCockpitUnifiedSignalToneClasses,
  type CockpitDeduplicationResult,
} from "../../../lib/cockpit-intelligence-deduplication";

type CockpitUnifiedSignalsPanelProps = {
  result: CockpitDeduplicationResult;
};

export default function CockpitUnifiedSignalsPanel({
  result,
}: CockpitUnifiedSignalsPanelProps) {
  return (
    <section className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-emerald-400 to-slate-950" />

      <div className="relative p-5 sm:p-7 xl:p-8">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                V21.4 Intelligence Deduplication
              </span>

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Una inteligencia · una ubicación
              </span>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Prioridades unificadas.
            </h2>

            <p className="mt-3 max-w-4xl text-sm font-bold leading-6 text-slate-600">
              {result.summary}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 xl:min-w-[520px]">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Señales
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {result.totalSources}
              </p>
            </div>

            <div className="rounded-[22px] border border-blue-200 bg-blue-50 px-4 py-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">
                Visibles
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {result.totalUnifiedSignals}
              </p>
            </div>

            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Duplicadas
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {result.duplicatesRemoved}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-blue-200 bg-blue-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
            Recomendación cockpit
          </p>

          <p className="mt-2 text-base font-black leading-7 text-blue-950">
            {result.recommendation}
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          {result.topSignals.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-600">
              No hay señales suficientes para unificar todavía.
            </div>
          ) : (
            result.topSignals.map((signal, index) => (
              <article
                key={signal.id}
                className={`rounded-[30px] border p-5 shadow-sm ${getCockpitUnifiedSignalToneClasses(
                  signal.tone,
                )}`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm font-black shadow-sm">
                        {index + 1}
                      </span>

                      <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
                        {getCockpitUnifiedSignalPriorityLabel(signal.priority)}
                      </span>

                      {signal.categories.map((category) => (
                        <span
                          key={`${signal.id}-${category}`}
                          className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                        >
                          {getCockpitUnifiedSignalCategoryLabel(category)}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-xl font-black leading-tight text-slate-950">
                      {signal.clientName}
                    </h3>

                    <p className="mt-2 text-base font-black leading-6">
                      {signal.title}
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 opacity-85">
                      {signal.summary}
                    </p>

                    {signal.reasons.length > 0 ? (
                      <div className="mt-4 grid gap-2">
                        {signal.reasons.slice(0, 3).map((reason, reasonIndex) => (
                          <div
                            key={`${signal.id}-reason-${reasonIndex}`}
                            className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-bold leading-6"
                          >
                            {reason}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 xl:w-56">
                    <div className="rounded-[24px] border border-white/70 bg-white/70 p-4 text-center">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] opacity-70">
                        Score
                      </p>

                      <p className="mt-1 text-3xl font-black text-slate-950">
                        {signal.score}
                      </p>
                    </div>

                    <div className="mt-3 rounded-[24px] border border-white/70 bg-white/70 p-4 text-center">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] opacity-70">
                        Protege
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-950">
                        Gs. {signal.protectedAmount.toLocaleString("es-PY")}
                      </p>
                    </div>

                    <a
                      href={signal.actionHref}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-950"
                    >
                      {signal.actionLabel} →
                    </a>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}