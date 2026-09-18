import {
  FounderActionCard,
  FounderDecisionCard,
  FounderExecutiveBriefingCard,
  FounderPrimaryInsight,
  FounderSystemOverview,
} from "./components";
import { getFounderGreeting } from "./engines/founder-greeting-engine";
import { getPrimaryFounderAction } from "./models";
import { getFounderDashboardData } from "./services/founder-dashboard-service";

export const dynamic = "force-dynamic";

type MetricValue = string | number | boolean | null | undefined;

type BusinessMetricSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  totals: Record<string, MetricValue>;
};

function formatMetricLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatMetricValue(
  key: string,
  value: MetricValue,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey.includes("rate") ||
      normalizedKey.includes("growth") ||
      normalizedKey.includes("percentage")
    ) {
      return `${value}%`;
    }

    if (
      normalizedKey.includes("revenue") ||
      normalizedKey.includes("value") ||
      normalizedKey.includes("amount")
    ) {
      return `Gs. ${value.toLocaleString("es-PY")}`;
    }

    return value.toLocaleString("en-US");
  }

  return value;
}

function BusinessMetricSection({
  eyebrow,
  title,
  description,
  totals,
}: BusinessMetricSectionProps) {
  const metrics = Object.entries(totals);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>

      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
        {description}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(([key, value]) => (
          <article
            key={key}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <p className="text-sm font-medium text-slate-600">
              {formatMetricLabel(key)}
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {formatMetricValue(key, value)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function FounderPage() {
  const greeting = getFounderGreeting({ founderName: "Gerard" });

  const {
    business,
    snapshot,
    overview,
    actions,
    briefing,
  } = await getFounderDashboardData();

  const primaryInsight =
    snapshot.insights.find(
      (insight) => insight.id === snapshot.primaryInsightId,
    ) ?? snapshot.insights[0];

  if (!primaryInsight) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
        <div className="mx-auto max-w-5xl">
          <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Founder Center
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {greeting.greeting}
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {greeting.question}
            </p>
          </header>

          <p className="mt-6 text-sm text-slate-600">
            No sufficient evidence is currently available.
          </p>
        </div>
      </main>
    );
  }

  const primaryAction = getPrimaryFounderAction(actions);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            Founder Center
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting.greeting}
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {greeting.question}
          </p>
        </header>

        <FounderExecutiveBriefingCard briefing={briefing} />
        <FounderSystemOverview overview={overview} />

        <BusinessMetricSection
          eyebrow="Growth Intelligence"
          title="Growth performance"
          description="A founder-level view of user growth, activation and plan conversion."
          totals={business.growth.totals}
        />

        <BusinessMetricSection
          eyebrow="Revenue Intelligence"
          title="Revenue performance"
          description="A founder-level view of recurring revenue, growth and customer value."
          totals={business.revenue.totals}
        />

        <BusinessMetricSection
          eyebrow="Payments Intelligence"
          title="Payment performance"
          description="A founder-level view of subscriptions, collections and payment outcomes."
          totals={business.payments.totals}
        />

        <BusinessMetricSection
          eyebrow="Product Intelligence"
          title="Product performance"
          description="A founder-level view of product activity, adoption and usage signals."
          totals={business.product.totals}
        />

        <BusinessMetricSection
          eyebrow="Support Intelligence"
          title="Support performance"
          description="A founder-level view of support activity, response performance and customer experience."
          totals={business.support.totals}
        />

        <BusinessMetricSection
          eyebrow="Geography Intelligence"
          title="Geographic performance"
          description="A founder-level view of regional activity, distribution and market signals."
          totals={business.geography.totals}
        />

        <BusinessMetricSection
          eyebrow="Infrastructure Intelligence"
          title="Infrastructure performance"
          description="A founder-level view of platform availability, reliability and technical capacity."
          totals={business.infrastructure.totals}
        />

        <FounderPrimaryInsight insight={primaryInsight} />
        <FounderDecisionCard decision={primaryInsight.decision} />
        <FounderActionCard action={primaryAction} />
      </div>
    </main>
  );
}