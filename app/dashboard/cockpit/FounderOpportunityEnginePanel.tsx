import {
  buildFounderOpportunities,
  getFounderOpportunityMomentumClasses,
  getFounderOpportunityMomentumLabel,
  getFounderOpportunityPriorityClasses,
  getFounderOpportunityPriorityLabel,
} from "../../../lib/founder-opportunity-engine";

import type { CommercialMemoryRelationship } from "../../../lib/commercial-memory-signals";

type FounderOpportunityEnginePanelProps = {
  relationships: CommercialMemoryRelationship[];
};

function formatGs(value: number) {
  return new Intl.NumberFormat("es-PY").format(
    Math.max(0, value)
  );
}

export default function FounderOpportunityEnginePanel({
  relationships,
}: FounderOpportunityEnginePanelProps) {
  const opportunities =
    buildFounderOpportunities(relationships);

  const topOpportunities =
    opportunities.slice(0, 3);

  const accelerating =
    opportunities.filter(
      (opportunity) =>
        opportunity.momentum === "accelerating"
    ).length;

  const stable =
    opportunities.filter(
      (opportunity) =>
        opportunity.momentum === "stable"
    ).length;

  const cooling =
    opportunities.filter(
      (opportunity) =>
        opportunity.momentum === "cooling"
    ).length;

  const topOpportunity =
    topOpportunities[0];

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-blue-600 to-slate-950" />

      <div className="relative grid gap-0 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="border-b border-slate-200 bg-gradient-to-br from-white via-emerald-50/60 to-slate-50 p-5 sm:p-7 xl:border-b-0 xl:border-r xl:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              🚀 V21.5
            </span>

            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
              Opportunity Engine
            </span>
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
            Dónde está el dinero
          </p>

          <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl">
            Oportunidades.
          </h2>

          <p className="mt-4 text-base font-bold leading-7 text-slate-700">
            ClienteYA detecta qué relaciones tienen
            mayor probabilidad de convertirse en
            ingresos y cuáles están perdiendo
            momentum.
          </p>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Acelerando
              </p>

              <p className="mt-2 text-3xl font-black text-slate-950">
                {accelerating}
              </p>
            </div>

            <div className="rounded-[28px] border border-sky-200 bg-sky-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
                Estables
              </p>

              <p className="mt-2 text-3xl font-black text-slate-950">
                {stable}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
                Enfriándose
              </p>

              <p className="mt-2 text-3xl font-black text-slate-950">
                {cooling}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 xl:p-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Founder Focus
              </p>

              <p className="mt-1 text-sm font-bold text-slate-950">
                Prioridades comerciales reales.
              </p>
            </div>

            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              {opportunities.length} oportunidades
            </span>
          </div>

          {topOpportunity ? (
            <div className="mb-4 rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Si solo haces una cosa hoy
              </p>

              <h3 className="mt-3 text-xl font-black text-slate-950">
                {topOpportunity.relationshipName}
              </h3>

              <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                {topOpportunity.recommendation}
              </p>
            </div>
          ) : null}

          <div className="grid gap-3">
            {topOpportunities.map((opportunity) => (
              <article
                key={opportunity.id}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getFounderOpportunityPriorityClasses(
                      opportunity.priority
                    )}`}
                  >
                    {getFounderOpportunityPriorityLabel(
                      opportunity.priority
                    )}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getFounderOpportunityMomentumClasses(
                      opportunity.momentum
                    )}`}
                  >
                    {getFounderOpportunityMomentumLabel(
                      opportunity.momentum
                    )}
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-950">
                  {opportunity.relationshipName}
                </h3>

                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  {opportunity.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white bg-white px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Probabilidad
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-950">
                      {opportunity.probability}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white bg-white px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Potencial
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-950">
                      Gs.{" "}
                      {formatGs(
                        opportunity.potentialRevenue
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-xs font-black leading-5 text-blue-800">
                    {opportunity.momentumReason}
                  </p>
                </div>
              </article>
            ))}

            {topOpportunities.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-600">
                ClienteYA todavía no detecta
                oportunidades suficientes para
                construir una lectura comercial.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}