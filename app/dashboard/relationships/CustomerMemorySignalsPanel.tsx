import {
  buildCommercialMemorySignals,
  getCommercialMemorySignalBadgeClasses,
  getCommercialMemorySignalPriorityLabel,
  getCommercialMemorySignalTypeLabel,
  type CommercialMemoryRelationship,
} from "../../../lib/commercial-memory-signals";

type CustomerMemorySignalsPanelProps = {
  relationship: CommercialMemoryRelationship;
};

export default function CustomerMemorySignalsPanel({
  relationship,
}: CustomerMemorySignalsPanelProps) {
  const memory = buildCommercialMemorySignals([relationship]);
  const signal = memory.signals[0];

  if (!signal) return null;

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
            V20.8.3 Memoria comercial
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Señal principal de esta relación
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            ClienteYA resume el patrón comercial más importante de esta relación.
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getCommercialMemorySignalBadgeClasses(
            signal.tone
          )}`}
        >
          {getCommercialMemorySignalPriorityLabel(signal.priority)}
        </span>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
            {getCommercialMemorySignalTypeLabel(signal.type)}
          </span>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
            Score {signal.score}/100
          </span>
        </div>

        <h3 className="text-xl font-black leading-tight text-slate-950">
          {signal.title}
        </h3>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
          {signal.insight}
        </p>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="rounded-[22px] border border-white bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Evidencia
            </p>

            <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
              {signal.evidence}
            </p>
          </div>

          <div className="rounded-[22px] border border-white bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Recomendación
            </p>

            <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
              {signal.recommendation}
            </p>
          </div>

          <div className="rounded-[22px] border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              Acción
            </p>

            <p className="mt-2 text-sm font-black leading-6 text-blue-950">
              {signal.actionLabel}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}