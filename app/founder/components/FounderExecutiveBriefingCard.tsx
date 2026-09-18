import type { FounderExecutiveBriefing } from "../engines/founder-executive-briefing-engine";

type FounderExecutiveBriefingCardProps = {
  briefing: FounderExecutiveBriefing;
};

export function FounderExecutiveBriefingCard({
  briefing,
}: FounderExecutiveBriefingCardProps) {
  const action = briefing.primaryAction;

  return (
    <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Executive Briefing
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          {briefing.title}
        </h2>
      </div>

      <p className="text-sm leading-6 text-slate-600">
        {briefing.summary}
      </p>

      {action && (
        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Primary Action
          </p>

          <h3 className="mt-1 font-semibold text-slate-900">
            {action.title}
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            {action.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              {action.priority}
            </span>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
              Score {action.score}
            </span>

            <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
              {action.status}
            </span>
          </div>
        </div>
      )}

      <div className="mt-5 border-t pt-4">
        <p className="text-xs text-slate-500">
          Supporting insights: {briefing.supportingInsights.length}
        </p>
      </div>
    </section>
  );
}