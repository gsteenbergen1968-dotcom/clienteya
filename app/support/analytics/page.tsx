import Link from "next/link";

import { buildSupportMemoryAdapter } from "../adapters";
import { buildSupportRepository } from "../repositories";

type AnalyticsMetric = {
  label: string;
  value: string;
  description: string;
};

type AnalyticsSignal = {
  title: string;
  value: string;
  trend: string;
};

function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];

  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function readDate(
  record: Record<string, unknown>,
  keys: string[],
): Date | null {
  for (const key of keys) {
    const value = readString(record, key);

    if (!value) {
      continue;
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function formatDuration(milliseconds: number | null): string {
  if (milliseconds === null) {
    return "—";
  }

  const minutes = Math.max(0, Math.round(milliseconds / 60_000));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

export default async function SupportAnalyticsPage() {
  const adapter = buildSupportMemoryAdapter();
  const repository = buildSupportRepository(adapter);

  const [
    conversations,
    requests,
    knowledgeItems,
    escalations,
  ] = await Promise.all([
    repository.getConversations(),
    repository.getRequests(),
    repository.getKnowledgeItems(),
    repository.getEscalations(),
  ]);

  const automaticallyResolved = requests.filter((request) => {
    const record = request as unknown as Record<string, unknown>;
    const status = readString(record, "status");

    return (
      record.requiresHumanResponse === false &&
      (status === "resolved" || status === "closed")
    );
  }).length;

  const automaticResolutionRate =
    requests.length === 0
      ? 0
      : Math.round((automaticallyResolved / requests.length) * 100);

  const responseDurations = requests
    .map((request) => {
      const record = request as unknown as Record<string, unknown>;
      const createdAt = readDate(record, [
        "createdAt",
        "receivedAt",
        "openedAt",
      ]);
      const firstResponseAt = readDate(record, [
        "firstResponseAt",
        "respondedAt",
        "resolvedAt",
      ]);

      if (!createdAt || !firstResponseAt) {
        return null;
      }

      return firstResponseAt.getTime() - createdAt.getTime();
    })
    .filter((value): value is number => value !== null && value >= 0);

  const averageResponseTime =
    responseDurations.length === 0
      ? null
      : responseDurations.reduce((total, value) => total + value, 0) /
        responseDurations.length;

  const knowledgeUsage = knowledgeItems.reduce((total, item) => {
    const record = item as unknown as Record<string, unknown>;
    const value = record.usageCount;

    return total + (typeof value === "number" ? value : 0);
  }, 0);

  const activeEscalations = escalations.filter((escalation) => {
    const record = escalation as unknown as Record<string, unknown>;
    const status = readString(record, "status");

    return status !== "resolved" && status !== "closed";
  }).length;

  const metrics: AnalyticsMetric[] = [
    {
      label: "Conversations",
      value: String(conversations.length),
      description: "Total conversations processed by SIP.",
    },
    {
      label: "Automatic Resolution",
      value: `${automaticResolutionRate}%`,
      description: "Cases resolved through support intelligence.",
    },
    {
      label: "Response Time",
      value: formatDuration(averageResponseTime),
      description: "Average time until the first response.",
    },
    {
      label: "Satisfaction",
      value: "—",
      description: "Feedback received from users.",
    },
  ];

  const signals: AnalyticsSignal[] = [
    {
      title: "Support Volume",
      value: String(requests.length),
      trend:
        requests.length === 0
          ? "No data yet"
          : "Registered requests",
    },
    {
      title: "Knowledge Used",
      value: String(knowledgeUsage),
      trend:
        knowledgeUsage === 0
          ? "No data yet"
          : "Accumulated uses",
    },
    {
      title: "Escalations",
      value: String(activeEscalations),
      trend:
        activeEscalations === 0
          ? "No active escalations"
          : "Require attention",
    },
  ];

  return (
    <main className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          SIP Analytics
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
          Analytics
        </h1>

        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          Measure support behaviour, intelligence efficiency and improvement
          opportunities.
        </p>

        <Link
          href="/support"
          className="mt-5 inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
        >
          Back to Cockpit
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)]"
          >
            <p className="text-sm font-black text-slate-700">
              {metric.label}
            </p>

            <p className="mt-3 text-4xl font-black text-slate-950">
              {metric.value}
            </p>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              {metric.description}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Intelligence Signals
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {signals.map((signal) => (
            <article
              key={signal.title}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <h3 className="text-lg font-black text-slate-950">
                {signal.title}
              </h3>

              <p className="mt-3 text-3xl font-black text-blue-700">
                {signal.value}
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-600">
                {signal.trend}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}