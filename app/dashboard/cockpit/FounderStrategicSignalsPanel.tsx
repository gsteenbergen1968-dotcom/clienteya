import {
  buildFounderStrategicSignals,
  getFounderStrategicSignalPriorityClasses,
  getFounderStrategicSignalPriorityLabel,
  type FounderStrategicSignal,
} from "../../../lib/founder-strategic-signals";

type FounderStrategicSignalsPanelProps = {
  responseRate: number;
  conversionRate: number;
  followupRate: number;
  activeRelationships: number;
  opportunities: number;
  revenue: number;
};

const fallbackSignal: FounderStrategicSignal = {
  title: "Sin señal estratégica dominante",
  description:
    "ClienteYA todavía no detecta un patrón estratégico fuerte. La actividad comercial actual necesita más datos para generar una lectura más precisa.",
  recommendation:
    "Seguir registrando relaciones, seguimientos, pagos y oportunidades para activar señales estratégicas más claras.",
  priority: "low",
};

export default function FounderStrategicSignalsPanel({
  responseRate,
  conversionRate,
  followupRate,
  activeRelationships,
  opportunities,
  revenue,
}: FounderStrategicSignalsPanelProps) {
  const signals = buildFounderStrategicSignals({
    responseRate,
    conversionRate,
    followupRate,
    activeRelationships,
    opportunities,
    revenue,
  });

  const visibleSignals = signals.length > 0 ? signals : [fallbackSignal];

  const primarySignal: FounderStrategicSignal =
    visibleSignals[0] ?? fallbackSignal;

  const secondarySignals = visibleSignals.slice(1, 4);

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="relative grid gap-0 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-slate-200 bg-gradient-to-br from-white via-blue-50/60 to-slate-50 p-5 sm:p-7 xl:border-b-0 xl:border-r xl:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" />
              V20.9.2 Strategic Signals
            </span>

            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              Negocio → Señal → Decisión
            </span>
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">
            Qué está pasando realmente
          </p>

          <h2 className="mt-3 max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl">
            Señales estratégicas.
          </h2>

          <p className="mt-4 max-w-xl text-base font-bold leading-7 text-slate-700">
            ClienteYA combina respuesta, conversión, seguimiento, oportunidades
            e ingresos para detectar la situación estratégica del negocio.
          </p>

          <div className="mt-6 rounded-[30px] border border-blue-200 bg-white p-5 shadow-[0_16px_46px_rgba(37,99,235,0.08)]">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                  Señal principal
                </p>

                <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950">
                  {primarySignal.title}
                </h3>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getFounderStrategicSignalPriorityClasses(
                  primarySignal.priority
                )}`}
              >
                {getFounderStrategicSignalPriorityLabel(
                  primarySignal.priority
                )}
              </span>
            </div>

            <p className="text-sm font-bold leading-6 text-slate-700">
              {primarySignal.description}
            </p>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Decisión recomendada
              </p>

              <p className="mt-2 text-sm font-black leading-6 text-emerald-900">
                {primarySignal.recommendation}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 p-4 sm:p-6 xl:p-7">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Lectura estratégica
              </p>

              <p className="mt-1 text-sm font-bold text-slate-950">
                No son datos aislados. Son patrones del negocio convertidos en
                dirección founder.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              {visibleSignals.length} señales
            </span>
          </div>

          <div className="grid gap-3">
            {secondarySignals.length === 0 ? (
              <article className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                  Lectura actual
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  La señal principal concentra la lectura estratégica más
                  relevante en este momento.
                </p>
              </article>
            ) : null}

            {secondarySignals.map((signal, index) => (
              <article
                key={`${signal.title}-${index}`}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-700">
                      Señal estratégica 0{index + 2}
                    </p>

                    <h3 className="mt-1 text-sm font-black text-slate-950">
                      {signal.title}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getFounderStrategicSignalPriorityClasses(
                      signal.priority
                    )}`}
                  >
                    {getFounderStrategicSignalPriorityLabel(signal.priority)}
                  </span>
                </div>

                <p className="text-sm font-bold leading-6 text-slate-700">
                  {signal.description}
                </p>

                <p className="mt-3 rounded-2xl border border-white bg-white px-4 py-3 text-xs font-black leading-5 text-blue-800">
                  {signal.recommendation}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}