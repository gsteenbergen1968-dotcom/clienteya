import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { buildFounderBriefing } from "../../../lib/founder-briefing";
import { buildWeeklyFounderReport } from "../../../lib/founder-weekly-report";

import type {
  RelationshipRecord,
} from "../../../lib/relationship-repository";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import PrintReportButton from "../../components/PrintReportButton";

export const dynamic = "force-dynamic";

function formatGs(value: number) {
  return `Gs. ${value.toLocaleString("es-ES")}`;
}

function todayLabel() {
  return new Intl.DateTimeFormat("es-PY", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

export default async function FounderReportPage() {
  const authSupabase =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data,
    error,
  } =
    await authSupabase
      .from("relationships")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const relationships =
    (
      data || []
    ) as RelationshipRecord[];

  const briefing =
    buildFounderBriefing(
      relationships,
    );

  const weekly =
    buildWeeklyFounderReport(
      relationships,
    );

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-slate-200 bg-white print:hidden lg:block">
          <SidebarNav />
        </aside>

        <div className="flex-1 px-5 py-6 sm:px-8 print:p-0">
          <div className="mx-auto max-w-5xl print:max-w-none">
            <div className="mb-6 flex items-start justify-between gap-4 print:hidden">
              <div>
                <a
                  href="/dashboard"
                  className="text-sm font-bold text-blue-700"
                >
                  ← Volver al dashboard
                </a>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  Founder Report
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                  Reporte ejecutivo generado por ClienteYA AI.
                </p>
              </div>

              <PrintReportButton />
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
              <header className="border-b border-slate-200 pb-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                  ClienteYA Founder Report
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                  Weekly Executive Briefing
                </h2>

                <p className="mt-3 text-sm text-slate-600">
                  {todayLabel()}
                </p>

                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700">
                  {weekly.summary}
                </p>
              </header>

              <section className="mt-8">
                <h3 className="text-lg font-black text-slate-950">
                  Executive Summary
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Metric
                    label="Founder Score"
                    value={`${briefing.score}/100`}
                  />
                  <Metric
                    label="Weekly Score"
                    value={`${weekly.score}/100`}
                  />
                  <Metric
                    label="Pipeline Health"
                    value={weekly.pipelineHealth}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Founder Insight
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {briefing.insight}
                  </p>
                </div>
              </section>

              <section className="mt-8">
                <h3 className="text-lg font-black text-slate-950">
                  Revenue Forecast
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <Metric
                    label="Projected"
                    value={formatGs(briefing.projectedRevenue)}
                  />
                  <Metric
                    label="Likely"
                    value={formatGs(briefing.likelyRevenue)}
                  />
                  <Metric
                    label="At Risk"
                    value={formatGs(briefing.revenueAtRisk)}
                  />
                  <Metric
                    label="Avg. Conversion"
                    value={`${briefing.averageConversionProbability}%`}
                  />
                </div>
              </section>

              <section className="mt-8">
                <h3 className="text-lg font-black text-slate-950">
                  Weekly Operating Signals
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Metric
                    label="Momentum"
                    value={weekly.momentum}
                  />
                  <Metric
                    label="Execution"
                    value={weekly.executionDiscipline}
                  />
                  <Metric
                    label="Overdue Follow-ups"
                    value={weekly.overdueCount}
                  />
                </div>
              </section>

              <section className="mt-8 grid gap-6 md:grid-cols-3">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                    Top Opportunities
                  </h4>

                  <div className="mt-3 space-y-3">
                    {weekly.topOpportunities.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-sm font-black text-slate-950">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                    Key Risks
                  </h4>

                  <div className="mt-3 space-y-3">
                    {weekly.risks.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-red-200 bg-red-50/30 p-4"
                      >
                        <p className="text-sm font-black text-slate-950">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                    Founder Recommendations
                  </h4>

                  <div className="mt-3 space-y-3">
                    {weekly.recommendations.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4"
                      >
                        <p className="text-sm font-black text-slate-950">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <footer className="mt-10 border-t border-slate-200 pt-5">
                <p className="text-xs text-slate-500">
                  Generated by ClienteYA AI Founder Operating System.
                </p>
              </footer>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}