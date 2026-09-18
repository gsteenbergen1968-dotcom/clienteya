import Link from "next/link";

import {
  createFounderSupportRepository,
} from "@/app/support/repositories/founder-support-repository";

type FounderInsightCard = {
  title: string;
  description: string;
  value: string;
};

export default async function FounderSupportPage() {
  const repository = createFounderSupportRepository();

  const snapshot = await repository.getSnapshot();

  const insights: FounderInsightCard[] = [
    {
      title: "Product Signals",
      description:
        "Detect support patterns that may require product improvements.",
      value: String(snapshot.learningSignals.length),
    },
    {
      title: "Knowledge Gaps",
      description:
        "Identify missing knowledge inside the organization.",
      value: "0",
    },
    {
      title: "AI Performance",
      description:
        "Measure the effectiveness of applied support intelligence.",
      value: "0%",
    },
  ];

  const actions = [
    "Review product signals",
    "Update priority knowledge",
    "Analyze recurring patterns",
  ];

  return (
    <main className="space-y-6">
      <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          Founder Intelligence
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
          Founder Support Cockpit
        </h1>

        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600">
          Transform support operations into intelligence for strategic decisions.
        </p>

        <Link
          href="/support"
          className="mt-6 inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
        >
          Back to SIP Cockpit
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {insights.map((insight) => (
          <article
            key={insight.title}
            className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.05)]"
          >
            <h2 className="text-xl font-black text-slate-950">
              {insight.title}
            </h2>

            <p className="mt-3 text-4xl font-black text-blue-700">
              {insight.value}
            </p>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              {insight.description}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Recommended Actions
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          Founder Decisions
        </h2>

        <div className="mt-5 grid gap-3">
          {actions.map((action) => (
            <div
              key={action}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-700"
            >
              {action}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}