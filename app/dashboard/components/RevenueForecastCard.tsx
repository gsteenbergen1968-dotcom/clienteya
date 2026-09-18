import { ui } from "../../../lib/ui";

import {
  buildRevenueAnalyticsV2,
  formatGuaraniV2,
} from "../../../lib/revenue-analytics-v2";
import type { RelationshipRecord } from "../../../lib/relationship-repository";

import KpiCard from "../../components/KpiCard";
import SectionCard from "../../components/SectionCard";

type RevenueForecastCardProps = {
  relationships: RelationshipRecord[];
};

function getConfidenceTone(confidence: string) {
  if (confidence === "Alta") return ui.badges.success;
  if (confidence === "Media") return ui.badges.warning;

  return ui.badges.danger;
}

function getPressureTone(pressure: string) {
  if (pressure === "Alta") return ui.badges.danger;
  if (pressure === "Media") return ui.badges.warning;

  return ui.badges.success;
}

export default function RevenueForecastCard({
  relationships,
}: RevenueForecastCardProps) {
  const revenue = buildRevenueAnalyticsV2(relationships);

  return (
    <SectionCard
      badge="Revenue Forecast"
      title="Proyección comercial inteligente"
      description="Forecast ejecutivo basado en pipeline, conversión, presión comercial y momentum."
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Forecast ponderado"
            value={formatGuaraniV2(revenue.weightedForecast)}
            tone="emerald"
          />

          <KpiCard
            label="Pipeline abierto"
            value={formatGuaraniV2(revenue.expectedRevenue)}
            tone="sky"
          />

          <KpiCard
            label="Conversión"
            value={`${revenue.conversionRate}%`}
            tone="emerald"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className={`${ui.surfaces.muted} rounded-2xl px-4 py-3`}>
            <p className={ui.typography.label}>Confianza forecast</p>

            <div className="mt-3">
              <span className={getConfidenceTone(revenue.forecastConfidence)}>
                {revenue.forecastConfidence}
              </span>
            </div>
          </div>

          <div className={`${ui.surfaces.muted} rounded-2xl px-4 py-3`}>
            <p className={ui.typography.label}>Presión pipeline</p>

            <div className="mt-3">
              <span className={getPressureTone(revenue.pipelinePressure)}>
                {revenue.pipelinePressure}
              </span>
            </div>
          </div>

          <div className={`${ui.surfaces.muted} rounded-2xl px-4 py-3`}>
            <p className={ui.typography.label}>Momentum</p>

            <p className="mt-3 text-sm font-black text-slate-900">
              {revenue.momentumLabel}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
            Interpretación ejecutiva
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            {revenue.executiveSummary}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}