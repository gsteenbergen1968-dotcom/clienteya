import SectionCard from "../../components/SectionCard";

import {
  getFounderCommercialMemoryActionTypeLabel,
  getFounderCommercialMemoryPriorityLabel,
  getFounderCommercialMemoryToneClasses,
  type FounderCommercialMemoryCenter,
} from "../../../lib/founder-commercial-memory-center";

type FounderCommercialMemoryCenterPanelProps = {
  center: FounderCommercialMemoryCenter;
};

export default function FounderCommercialMemoryCenterPanel({
  center,
}: FounderCommercialMemoryCenterPanelProps) {
  return (
    <SectionCard title="Founder Commercial Memory Center">
      <div className="space-y-6">
        <div
          className={`rounded-2xl border p-5 ${getFounderCommercialMemoryToneClasses(
            center.tone
          )}`}
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Executive Summary
              </div>

              <div className="mt-2 text-lg font-bold">
                {center.executiveSummary}
              </div>

              <div className="mt-3 text-sm opacity-90">
                {center.executiveRecommendation}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/70 px-4 py-3 text-center">
                <div className="text-xs uppercase tracking-wide opacity-70">
                  Riesgo
                </div>

                <div className="mt-1 text-xl font-bold">
                  {center.memoryRiskScore}
                </div>
              </div>

              <div className="rounded-xl bg-white/70 px-4 py-3 text-center">
                <div className="text-xs uppercase tracking-wide opacity-70">
                  Prioridad
                </div>

                <div className="mt-1 text-sm font-bold">
                  {getFounderCommercialMemoryPriorityLabel(center.priority)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Promesas
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-900">
              {center.promisesAtRisk}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Requieren atención
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Dinero
            </div>

            <div className="mt-2 text-xl font-bold text-slate-900">
              Gs. {center.moneyAtRisk.toLocaleString("es-PY")}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              En riesgo
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Oportunidades
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-900">
              {center.activeOpportunities}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Activas
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Relaciones
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-900">
              {center.coolingRelationships}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Enfriándose
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Top Founder Actions
              </h3>

              <p className="text-sm text-slate-500">
                Las acciones con mayor impacto comercial.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              Protege Gs.{" "}
              {center.protectedRevenuePotential.toLocaleString("es-PY")}
            </div>
          </div>

          <div className="space-y-3">
            {center.topActions.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No existen acciones críticas en este momento.
              </div>
            ) : (
              center.topActions.map((action, index) => (
                <div
                  key={action.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                          {index + 1}
                        </div>

                        <div className="font-semibold text-slate-900">
                          {action.relationshipName}
                        </div>

                        <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {getFounderCommercialMemoryActionTypeLabel(
                            action.type
                          )}
                        </div>
                      </div>

                      <div className="mt-3 text-base font-semibold text-slate-900">
                        {action.title}
                      </div>

                      <div className="mt-1 text-sm text-slate-600">
                        {action.description}
                      </div>

                      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                          Acción recomendada
                        </div>

                        <div className="mt-1 text-sm font-medium text-blue-900">
                          {action.action}
                        </div>

                        <div className="mt-2 text-xs text-blue-700">
                          {action.reason}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-[140px] text-right">
                      <div className="text-xs uppercase tracking-wide text-slate-500">
                        Impacto
                      </div>

                      <div className="mt-1 text-2xl font-bold text-slate-900">
                        {action.impactScore}
                      </div>

                      <div className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                        Protege
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        Gs. {action.protectedAmount.toLocaleString("es-PY")}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Founder Recommendation
          </div>

          <div className="mt-2 text-lg font-bold text-blue-900">
            {center.executiveRecommendation}
          </div>

          <div className="mt-3 text-sm text-blue-800">
            ClienteYA prioriza acciones por impacto comercial, relaciones,
            compromisos y dinero potencialmente protegido.
          </div>
        </div>
      </div>
    </SectionCard>
  );
}