import {
  buildFounderAIExecutiveAdvisor,
  getFounderExecutiveCategoryLabel,
  getFounderExecutiveUrgencyClasses,
  getFounderExecutiveUrgencyLabel,
} from "../../../lib/founder-ai-executive-advisor";

import type { CommercialMemoryRelationship } from "../../../lib/commercial-memory-signals";

type FounderAIExecutiveAdvisorPanelProps = {
  relationships: CommercialMemoryRelationship[];
};

function formatGs(value: number) {
  return new Intl.NumberFormat("es-PY").format(
    Math.max(0, value)
  );
}

export default function FounderAIExecutiveAdvisorPanel({
  relationships,
}: FounderAIExecutiveAdvisorPanelProps) {
  const priorities =
    buildFounderAIExecutiveAdvisor(relationships);

  if (priorities.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Founder AI Executive Advisor
          </p>

          <h2 className="text-lg font-semibold text-slate-950">
            Sin decisiones estratégicas todavía
          </h2>

          <p className="text-sm leading-6 text-slate-600">
            Cuando existan suficientes señales comerciales,
            ClienteYA resumirá automáticamente las decisiones
            más importantes para el fundador.
          </p>
        </div>
      </section>
    );
  }

  const primaryDecision = priorities[0];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Founder AI Executive Advisor
        </p>

        <h2 className="text-lg font-semibold text-slate-950">
          Las 3 decisiones más importantes hoy
        </h2>

        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          ClienteYA sintetiza señales de ingreso,
          riesgo y crecimiento para ayudarte a decidir
          dónde concentrar tu tiempo hoy.
        </p>
      </div>

      <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Recomendación principal
            </p>

            <h3 className="text-base font-semibold text-slate-950">
              {primaryDecision.recommendation}
            </h3>

            <p className="text-sm font-medium text-slate-700">
              {primaryDecision.relationshipName}
            </p>

            <p className="text-sm leading-6 text-slate-600">
              {primaryDecision.reasoning}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Impacto estimado
            </p>

            <p className="text-lg font-bold text-slate-950">
              Gs {formatGs(primaryDecision.impact)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {priorities.map((priority, index) => (
          <article
            key={priority.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    #{index + 1}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getFounderExecutiveUrgencyClasses(
                      priority.urgency
                    )}`}
                  >
                    {getFounderExecutiveUrgencyLabel(
                      priority.urgency
                    )}
                  </span>

                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {getFounderExecutiveCategoryLabel(
                      priority.category
                    )}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-950">
                  {priority.title}
                </h3>

                <p className="text-sm font-medium text-slate-800">
                  {priority.recommendation}
                </p>

                <p className="text-sm text-slate-700">
                  {priority.relationshipName}
                </p>

                <p className="text-sm leading-6 text-slate-600">
                  {priority.reasoning}
                </p>

                <p className="text-xs text-slate-500">
                  Fuente: {priority.sourceLabel}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-slate-500">
                  Impacto
                </p>

                <p className="text-base font-bold text-slate-950">
                  Gs {formatGs(priority.impact)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}