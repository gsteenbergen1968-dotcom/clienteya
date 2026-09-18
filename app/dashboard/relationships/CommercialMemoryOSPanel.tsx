import SectionCard from "../../components/SectionCard";

import {
  getCommercialMemoryPriorityLabel,
  getCommercialMemoryToneClasses,
  type CommercialMemoryOSResult,
} from "../../../lib/commercial-memory-os";

type CommercialMemoryOSPanelProps = {
  result: CommercialMemoryOSResult;
};

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
      {message}
    </div>
  );
}

function SignalList({
  items,
}: {
  items: {
    id: string;
    title: string;
    description: string;
  }[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-slate-200 bg-white p-3"
        >
          <div className="font-medium text-slate-900">{item.title}</div>

          <div className="mt-1 text-sm text-slate-600">
            {item.description}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommercialMemoryOSPanel({
  result,
}: CommercialMemoryOSPanelProps) {
  return (
    <SectionCard
      title="Commercial Memory OS"
      description="Memoria comercial activa del cliente."
    >
      <div className="space-y-6">
        <div
          className={`rounded-2xl border p-4 ${getCommercialMemoryToneClasses(
            result.tone,
          )}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                Estado comercial
              </div>

              <div className="mt-1 text-lg font-bold">
                {result.headline}
              </div>

              <div className="mt-2 text-sm opacity-90">
                {result.summary}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="rounded-xl bg-white/70 px-4 py-3 text-center">
                <div className="text-xs uppercase tracking-wide opacity-70">
                  Prioridad
                </div>

                <div className="mt-1 text-lg font-bold">
                  {getCommercialMemoryPriorityLabel(result.priority)}
                </div>
              </div>

              <div className="rounded-xl bg-white/70 px-4 py-3 text-center">
                <div className="text-xs uppercase tracking-wide opacity-70">
                  Score
                </div>

                <div className="mt-1 text-lg font-bold">
                  {result.priorityScore}
                </div>
              </div>

              <div className="rounded-xl bg-white/70 px-4 py-3 text-center">
                <div className="text-xs uppercase tracking-wide opacity-70">
                  Memory
                </div>

                <div className="mt-1 text-lg font-bold">
                  {result.memoryHealth}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Promesas
          </h3>

          {result.promises.length > 0 ? (
            <SignalList items={result.promises} />
          ) : (
            <EmptyMessage message="No se detectaron promesas o seguimientos pendientes." />
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Oportunidades
          </h3>

          {result.opportunities.length > 0 ? (
            <SignalList items={result.opportunities} />
          ) : (
            <EmptyMessage message="No se detectaron oportunidades comerciales activas." />
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Dinero
          </h3>

          {result.moneySignals.length > 0 ? (
            <SignalList
              items={result.moneySignals.map((signal) => ({
                ...signal,
                description: `${signal.description} · Gs. ${signal.amount.toLocaleString(
                  "es-PY",
                )}`,
              }))}
            />
          ) : (
            <EmptyMessage message="No hay movimientos financieros relevantes registrados." />
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Relación
          </h3>

          {result.relationshipSignals.length > 0 ? (
            <SignalList items={result.relationshipSignals} />
          ) : (
            <EmptyMessage message="La relación no presenta señales de riesgo actualmente." />
          )}
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Acción AI recomendada
          </div>

          <div className="mt-2 text-lg font-bold text-blue-900">
            {result.nextBestAction}
          </div>

          <div className="mt-3 text-sm text-blue-800">
            {result.actionReason}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}