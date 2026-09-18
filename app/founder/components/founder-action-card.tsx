import type { FounderAction } from "../models";

type FounderActionCardProps = {
  action: FounderAction | null;
};

export function FounderActionCard({
  action,
}: FounderActionCardProps) {
  if (!action) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Next Action</h2>
        <p className="mt-2 text-sm text-slate-500">
          No actions available.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{action.title}</h2>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          {action.priority}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {action.description}
      </p>

      <div className="mt-6 grid gap-3 text-sm">
        <div><strong>Owner:</strong> {action.owner}</div>
        <div><strong>Status:</strong> {action.status}</div>
        <div><strong>Effort:</strong> {action.effort}</div>
        <div><strong>Expected:</strong> {action.outcome.expectedResult}</div>
      </div>
    </section>
  );
}