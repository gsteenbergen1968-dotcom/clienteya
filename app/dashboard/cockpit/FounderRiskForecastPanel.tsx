import {
  buildFounderRiskForecast,
  getFounderRiskForecastPriorityClasses,
  getFounderRiskForecastPriorityLabel,
} from "../../../lib/founder-risk-forecast";

import type { CommercialMemoryRelationship } from "../../../lib/commercial-memory-signals";

type FounderRiskForecastPanelProps = {
  relationships: CommercialMemoryRelationship[];
};

function formatGs(value: number) {
  return new Intl.NumberFormat("es-PY").format(
    Math.max(0, value)
  );
}

export default function FounderRiskForecastPanel({
  relationships,
}: FounderRiskForecastPanelProps) {
  const forecasts =
    buildFounderRiskForecast(relationships);

  const topForecasts = forecasts.slice(0, 5);

  if (topForecasts.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Founder Risk Forecast
          </p>

          <h2 className="text-lg font-semibold text-slate-950">
            Sin riesgo comercial proyectado
          </h2>

          <p className="text-sm leading-6 text-slate-600">
            Cuando existan relaciones con ingreso en riesgo,
            ClienteYA mostrará dónde puede escaparse valor
            si no se actúa a tiempo.
          </p>
        </div>
      </section>
    );
  }

  const totalRisk = topForecasts.reduce(
    (sum, forecast) => sum + forecast.riskAmount,
    0
  );

  const primaryForecast = topForecasts[0];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Founder Risk Forecast
          </p>

          <h2 className="text-lg font-semibold text-slate-950">
            Qué ingreso puede escaparse si no actúas
          </h2>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            ClienteYA proyecta dónde una relación puede
            enfriarse y cuánto valor comercial podría
            perderse si no se hace seguimiento.
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-right">
          <p className="text-xs font-medium text-red-700">
            Riesgo estimado
          </p>

          <p className="text-xl font-bold text-red-800">
            Gs {formatGs(totalRisk)}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Riesgo principal
            </p>

            <h3 className="text-base font-semibold text-slate-950">
              {primaryForecast.recommendation}
            </h3>

            <p className="text-sm font-medium text-slate-700">
              {primaryForecast.relationshipName}
            </p>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              {primaryForecast.reasoning}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Ingreso en riesgo
            </p>

            <p className="text-lg font-bold text-slate-950">
              Gs {formatGs(primaryForecast.riskAmount)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              riesgo {primaryForecast.riskProbability}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {topForecasts.map((forecast, index) => (
          <article
            key={forecast.relationshipId}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    #{index + 1}
                  </span>

                  <h3 className="text-sm font-semibold text-slate-950">
                    {forecast.relationshipName}
                  </h3>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getFounderRiskForecastPriorityClasses(
                      forecast.priority
                    )}`}
                  >
                    {getFounderRiskForecastPriorityLabel(
                      forecast.priority
                    )}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-800">
                  {forecast.recommendation}
                </p>

                <p className="text-sm leading-6 text-slate-600">
                  {forecast.reasoning}
                </p>

                <p className="text-xs text-slate-500">
                  {forecast.daysWithoutContact} días sin contacto comercial
                  claro.
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-slate-500">
                  En riesgo
                </p>

                <p className="text-base font-bold text-slate-950">
                  Gs {formatGs(forecast.riskAmount)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {forecast.riskProbability}% prob.
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}