import type { FounderDecision } from "../models/founder-model";

type FounderDecisionCardProps = {
  decision: FounderDecision | null | undefined;
};

export function FounderDecisionCard({
  decision,
}: FounderDecisionCardProps) {
  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
      <p className="text-sm font-semibold text-blue-700">
        Next logical decision
      </p>

      {decision ? (
        <>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {decision.title}
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            {decision.reason}
          </p>

          <div className="mt-5 rounded-2xl border border-blue-200 bg-white/70 p-4">
            <p className="text-sm font-medium text-slate-950">
              Expected impact
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {decision.impact.description}
            </p>

            {decision.impact.expectedOutcome ? (
              <p className="mt-2 text-sm text-slate-600">
                Expected outcome: {decision.impact.expectedOutcome}
              </p>
            ) : null}

            {decision.impact.measurableBy ? (
              <p className="mt-2 text-sm text-slate-600">
                Measured by: {decision.impact.measurableBy}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <p className="mt-2 text-slate-700">
          There is not enough evidence to propose a decision.
        </p>
      )}
    </section>
  );
}