import type { FounderInsight } from "../models/founder-model";

type FounderPrimaryInsightProps = {
  insight: FounderInsight;
};

function formatLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function FounderPrimaryInsight({
  insight,
}: FounderPrimaryInsightProps) {
  const { conclusion, evidence } = insight;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-6">
        <p className="text-sm font-medium text-slate-500">
          Primary insight
        </p>

        <h2 className="text-2xl font-semibold tracking-tight">
          {conclusion.title}
        </h2>

        <p className="max-w-3xl leading-7 text-slate-700">
          {conclusion.summary}
        </p>

        <div className="flex flex-wrap gap-2 pt-1 text-sm">
          <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
            Status: {formatLabel(conclusion.status)}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            Evidence: {formatLabel(conclusion.evidenceAssessment.strength)}
          </span>
        </div>
      </div>

      <div className="pt-6">
        <p className="text-sm font-medium text-slate-500">
          Verified evidence
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {evidence.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold">
                  {item.title}
                </h3>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {formatLabel(item.strength)}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>

              {item.sourceReference ? (
                <p className="mt-3 break-all text-xs text-slate-400">
                  Source: {item.sourceReference}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}