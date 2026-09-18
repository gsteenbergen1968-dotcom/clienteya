import Link from "next/link";

import {
  buildSectorKpiExplanations,
  getSectorKpiExplanationBadgeClasses,
  getSectorKpiExplanationToneClasses,
  getSectorKpiExplanationUrgencyLabel,
  type SectorKpiExplanationInput,
} from "../../../lib/sector-kpi-explanations";

import {
  buildCommercialMemorySignals,
  getCommercialMemorySignalBadgeClasses,
  getCommercialMemorySignalPriorityLabel,
  getCommercialMemorySignalTypeLabel,
  type CommercialMemoryRelationship,
} from "../../../lib/commercial-memory-signals";

import {
  buildMemoryPatternClusters,
  getMemoryPatternClusterBadgeClasses,
  getMemoryPatternClusterIcon,
  getMemoryPatternClusterPriorityLabel,
} from "../../../lib/memory-pattern-clusters";

type DashboardMemoryIntegrationProps = {
  sector?: string | null;
  relationships: CommercialMemoryRelationship[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-PY").format(Math.max(0, value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}

function isToday(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isOverdue(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return date.getTime() < now.getTime();
}

function buildKpiInput(
  sector: string | null | undefined,
  relationships: CommercialMemoryRelationship[]
): SectorKpiExplanationInput {
  const totalRelationships = relationships.length;

  const activeRelationships = relationships.filter((relationship) => {
    if (!relationship.updated_at) return false;

    const updatedAt = new Date(relationship.updated_at);

    if (Number.isNaN(updatedAt.getTime())) return false;

    const diffDays = Math.floor(
      (Date.now() - updatedAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    return diffDays <= 30;
  }).length;

  const relationshipsToContactToday = relationships.filter((relationship) =>
    isToday(relationship.proximo_contacto)
  ).length;

  const overdueRelationships = relationships.filter((relationship) =>
    isOverdue(relationship.proximo_contacto)
  ).length;

  const paidRelationships = relationships.filter((relationship) =>
    Boolean(relationship.pagado)
  ).length;

  const unpaidRelationships = relationships.filter(
    (relationship) =>
      Number(relationship.monto ?? 0) > 0 && !relationship.pagado
  ).length;

  const totalRevenue = relationships.reduce((total, relationship) => {
    if (!relationship.pagado) return total;

    return total + Number(relationship.monto ?? 0);
  }, 0);

  return {
    sector,
    totalRelationships,
    activeRelationships,
    relationshipsToContactToday,
    overdueRelationships,
    paidRelationships,
    unpaidRelationships,
    totalRevenue,
  };
}

export default function DashboardMemoryIntegration({
  sector,
  relationships,
}: DashboardMemoryIntegrationProps) {
  const kpiInput = buildKpiInput(sector, relationships);
  const kpiExplanations = buildSectorKpiExplanations(kpiInput);
  const memorySignals = buildCommercialMemorySignals(relationships);
  const memoryClusters = buildMemoryPatternClusters(relationships);

  const topExplanations = kpiExplanations.explanations.slice(0, 4);
  const topClusters = memoryClusters.clusters.slice(0, 4);
  const topSignals = memorySignals.signals.slice(0, 5);

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Inteligencia de KPI
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            {kpiExplanations.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {kpiExplanations.summary}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {topExplanations.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 ${getSectorKpiExplanationToneClasses(
                item.tone
              )}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold">{item.title}</h3>

                <span
                  className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getSectorKpiExplanationBadgeClasses(
                    item.tone
                  )}`}
                >
                  {getSectorKpiExplanationUrgencyLabel(item.urgency)}
                </span>
              </div>

              <p className="text-sm font-semibold">{item.valueLabel}</p>

              <p className="mt-2 text-sm leading-6 opacity-85">
                {item.explanation}
              </p>

              <p className="mt-3 text-sm font-semibold">
                {item.actionHint}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Patrones de memoria
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            {memoryClusters.summary.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {memoryClusters.summary.summary}
          </p>
        </div>

        {topClusters.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {topClusters.map((cluster) => (
              <article
                key={cluster.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">
                      {getMemoryPatternClusterIcon(cluster.type)}{" "}
                      {cluster.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {cluster.subtitle}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getMemoryPatternClusterBadgeClasses(
                      cluster.tone
                    )}`}
                  >
                    {getMemoryPatternClusterPriorityLabel(cluster.priority)}
                  </span>
                </div>

                <p className="text-sm leading-6 text-slate-700">
                  {cluster.founderMeaning}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">
                    {formatNumber(cluster.count)} relaciones
                  </span>

                  <span className="text-xs font-bold text-slate-900">
                    {cluster.actionLabel}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            ClienteYA todavía necesita más relaciones o actividad para detectar
            patrones comerciales.
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Señales comerciales
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            {memorySignals.summary.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {memorySignals.summary.bestAction}
          </p>
        </div>

        {topSignals.length > 0 ? (
          <div className="space-y-3">
            {topSignals.map((signal) => (
              <article
                key={signal.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">
                      {signal.relationshipName}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {getCommercialMemorySignalTypeLabel(signal.type)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getCommercialMemorySignalBadgeClasses(
                      signal.tone
                    )}`}
                  >
                    {getCommercialMemorySignalPriorityLabel(signal.priority)}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900">
                  {signal.title}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {signal.insight}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Score {signal.score}/100
                  </span>

                  <Link
                    href={`/dashboard/relationships/${signal.relationshipId}`}
                    className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    {signal.actionLabel}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            ClienteYA todavía no detecta señales comerciales suficientes.
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
            Acción recomendada
          </p>

          <p className="mt-2 text-sm font-bold text-blue-950">
            {memoryClusters.summary.bestAction}
          </p>

          <p className="mt-1 text-sm text-blue-800">
            {memoryClusters.summary.mainRisk}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">
            Relaciones
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {formatNumber(kpiInput.totalRelationships)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">
            Patrones
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {formatNumber(memoryClusters.summary.totalClusters)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">
            Señales altas
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {formatNumber(memorySignals.summary.highSignals)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">
            Ingresos
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {formatCurrency(kpiInput.totalRevenue)}
          </p>
        </div>
      </div>
    </section>
  );
}