import {
  buildFounderRevenueLevers,
  getFounderRevenueLeverPriorityClasses,
  getFounderRevenueLeverPriorityLabel,
} from "../../../lib/founder-revenue-levers";

import type { CommercialMemoryClient } from "../../../lib/commercial-memory-signals";

type FounderRevenueLeversPanelProps = {
  clients: CommercialMemoryClient[];
};

function formatGs(value: number) {
  return new Intl.NumberFormat("es-PY").format(
    Math.max(0, value),
  );
}

export default function FounderRevenueLeversPanel({
  clients,
}: FounderRevenueLeversPanelProps) {
  const levers =
    buildFounderRevenueLevers(clients);

  const topLevers = levers.slice(0, 5);

  if (topLevers.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Founder Revenue Levers
          </p>

          <h2 className="text-lg font-semibold text-slate-950">
            Sin palancas de ingreso detectadas
          </h2>

          <p className="text-sm leading-6 text-slate-600">
            Cuando haya clientes con valor comercial,
            ClienteYA identificará dónde una acción
            concreta puede generar el mayor impacto de
            ingreso.
          </p>
        </div>
      </section>
    );
  }

  const totalImpact = topLevers.reduce(
    (sum, lever) => sum + lever.revenueImpact,
    0,
  );

  const primaryLever = topLevers[0];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Founder Revenue Levers
          </p>

          <h2 className="text-lg font-semibold text-slate-950">
            Dónde está el mayor impacto de ingreso
          </h2>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            ClienteYA prioriza las acciones comerciales
            donde una decisión del fundador puede mover
            más ingreso hoy.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-medium text-emerald-700">
            Impacto estimado
          </p>

          <p className="text-xl font-bold text-emerald-800">
            Gs {formatGs(totalImpact)}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Acción principal
            </p>

            <h3 className="text-base font-semibold text-slate-950">
              {primaryLever.actionLabel}
            </h3>

            <p className="text-sm font-medium text-slate-700">
              {primaryLever.clienteNombre}
            </p>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              {primaryLever.reasoning}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Mayor impacto
            </p>

            <p className="text-lg font-bold text-slate-950">
              Gs {formatGs(primaryLever.revenueImpact)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {topLevers.map((lever, index) => (
          <article
            key={lever.clienteId}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    #{index + 1}
                  </span>

                  <h3 className="text-sm font-semibold text-slate-950">
                    {lever.clienteNombre}
                  </h3>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getFounderRevenueLeverPriorityClasses(
                      lever.priority,
                    )}`}
                  >
                    {getFounderRevenueLeverPriorityLabel(
                      lever.priority,
                    )}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-800">
                  {lever.actionLabel}
                </p>

                <p className="text-sm leading-6 text-slate-600">
                  {lever.reasoning}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-slate-500">
                  Impacto
                </p>

                <p className="text-base font-bold text-slate-950">
                  Gs {formatGs(lever.revenueImpact)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  esperado: Gs{" "}
                  {formatGs(lever.expectedRevenue)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}