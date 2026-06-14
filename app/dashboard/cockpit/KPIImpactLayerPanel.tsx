import SectionCard from "../../components/SectionCard";

import {
  buildKPIImpactSignals,
  getKPIImpactPriorityLabel,
  getKPIImpactPriorityClasses,
  type KPIImpactSignal,
} from "../../../lib/kpi-impact-layer";

type KPIImpactLayerPanelProps = {
  responseRate: number;
  conversionRate: number;
  followupRate: number;
  activeClients: number;
  opportunities: number;
};

export default function KPIImpactLayerPanel({
  responseRate,
  conversionRate,
  followupRate,
  activeClients,
  opportunities,
}: KPIImpactLayerPanelProps) {
  const result = buildKPIImpactSignals({
    responseRate,
    conversionRate,
    followupRate,
    activeClients,
    opportunities,
  });

  return (
    <SectionCard
      title="Impacto KPI"
      description="Cómo los indicadores afectan el negocio."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">
              Puntuación de impacto
            </span>

            <span className="text-2xl font-bold text-slate-900">
              {result.score}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-500">
            Interpretación combinada de conversión, respuesta y seguimiento.
          </div>
        </div>

        <div className="space-y-3">
          {result.signals.map((signal: KPIImpactSignal, index: number) => (
            <div
              key={`${signal.title}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="font-semibold text-slate-900">
                  {signal.title}
                </h4>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getKPIImpactPriorityClasses(
                    signal.priority,
                  )}`}
                >
                  {getKPIImpactPriorityLabel(signal.priority)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Impacto
                  </p>

                  <p className="text-sm text-slate-700">
                    {signal.impact}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acción recomendada
                  </p>

                  <p className="text-sm font-medium text-sky-700">
                    {signal.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {result.signals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
            <p className="text-sm text-slate-500">
              No hay señales KPI disponibles.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}