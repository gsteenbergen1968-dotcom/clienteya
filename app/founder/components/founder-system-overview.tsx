import type { FounderSystemOverview } from "../models/founder-system-model";

type FounderSystemOverviewProps = {
  overview: FounderSystemOverview;
};

function formatLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function FounderSystemOverview({
  overview,
}: FounderSystemOverviewProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">System status</p>
        <p className="mt-2 text-xl font-semibold">
          {formatLabel(overview.summary.status)}
        </p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Confidence</p>
        <p className="mt-2 text-xl font-semibold">
          {overview.confidence.score}%
        </p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Active evidence</p>
        <p className="mt-2 text-xl font-semibold">
          {overview.metrics.active} / {overview.metrics.total}
        </p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Readiness</p>
        <p className="mt-2 text-xl font-semibold">
          {overview.readiness.ready ? "Ready" : "Attention required"}
        </p>
      </article>
    </section>
  );
}