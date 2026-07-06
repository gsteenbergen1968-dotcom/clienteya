import {
  buildFounderGrowthEngine,
  getFounderGrowthPriorityClasses,
  getFounderGrowthPriorityLabel,
} from "../../../lib/founder-growth-engine";

import type { CommercialMemoryClient } from "../../../lib/commercial-memory-signals";

type FounderGrowthEnginePanelProps = {
  clients: CommercialMemoryClient[];
};

function formatGs(value: number) {
  return new Intl.NumberFormat("es-PY").format(
    Math.max(0, value),
  );
}

export default function FounderGrowthEnginePanel({
  clients,
}: FounderGrowthEnginePanelProps) {
  const opportunities =
    buildFounderGrowthEngine(clients);

  const topOpportunities =
    opportunities.slice(0, 5);

  if (topOpportunities.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Founder Growth Engine
          </p>

          <h2 className="text-lg font-semibold text-slate-950">
            Sin crecimiento proyectado todavía
          </h2>

          <p className="text-sm leading-6 text-slate-600">
            Cuando existan clientes con señales claras de
            expansión, ClienteYA mostrará dónde puede crecer
            el ingreso de forma más inteligente.
          </p>
        </div>
      </section>
    );
  }

  const totalGrowth = topOpportunities.reduce(
    (sum, opportunity) =>
      sum + opportunity.growthPotential,
    0,
  );

  const primaryOpportunity =
    topOpportunities[0];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Founder Growth Engine
          </p>

          <h2 className="text-lg font-semibold text-slate-950">
            Dónde puede crecer este negocio
          </h2>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            ClienteYA detecta clientes donde la relación,
            el historial y el valor comercial abren una
            oportunidad real de expansión.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-medium text-emerald-700">
            Crecimiento estimado
          </p>

          <p className="text-xl font-bold text-emerald-800">
            Gs {formatGs(totalGrowth)}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Crecimiento principal
            </p>

            <h3 className="text-base font-semibold text-slate-950">
              {primaryOpportunity.recommendation}
            </h3>

            <p className="text-sm font-medium text-slate-700">
              {primaryOpportunity.clienteNombre}
            </p>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              {primaryOpportunity.reasoning}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Potencial
            </p>

            <p className="text-lg font-bold text-slate-950">
              Gs {formatGs(primaryOpportunity.growthPotential)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              score {primaryOpportunity.growthScore}/100
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {topOpportunities.map((opportunity, index) => (
          <article
            key={opportunity.clienteId}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    #{index + 1}
                  </span>

                  <h3 className="text-sm font-semibold text-slate-950">
                    {opportunity.clienteNombre}
                  </h3>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getFounderGrowthPriorityClasses(
                      opportunity.priority,
                    )}`}
                  >
                    {getFounderGrowthPriorityLabel(
                      opportunity.priority,
                    )}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-800">
                  {opportunity.recommendation}
                </p>

                <p className="text-sm leading-6 text-slate-600">
                  {opportunity.reasoning}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-slate-500">
                  Potencial
                </p>

                <p className="text-base font-bold text-slate-950">
                  Gs {formatGs(opportunity.growthPotential)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {opportunity.growthScore}/100
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}