import Link from "next/link";

import {
  type FounderBriefing,
  getAICockpitPriorityLabel,
  getAICockpitTypeLabel,
} from "../../lib/ai-cockpit";

type SafeInsight = FounderBriefing["insights"][number];

function getPriorityClasses(priority: string | null | undefined) {
  if (priority === "urgent") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "high") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (priority === "medium") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getPriorityIcon(priority: string | null | undefined) {
  if (priority === "urgent") return "🚨";
  if (priority === "high") return "🔥";
  if (priority === "medium") return "⚡";

  return "📌";
}

function getTypeIcon(type: string | null | undefined) {
  if (type === "risk") return "⚠️";
  if (type === "opportunity") return "💰";
  if (type === "followup") return "📞";
  if (type === "payment") return "💳";
  if (type === "growth") return "📈";

  return "🧠";
}

function getSafePriority(priority: SafeInsight["priority"] | null | undefined) {
  if (
    priority === "urgent" ||
    priority === "high" ||
    priority === "medium" ||
    priority === "low"
  ) {
    return priority;
  }

  return "low";
}

function getSafeType(type: SafeInsight["type"] | null | undefined) {
  if (
    type === "risk" ||
    type === "opportunity" ||
    type === "followup" ||
    type === "payment" ||
    type === "growth"
  ) {
    return type;
  }

  return "growth";
}

function formatRevenue(value: number | null | undefined) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AICockpitPanel({
  briefing,
}: {
  briefing: FounderBriefing;
}) {
  const title = briefing?.title || "AI Cockpit";
  const summary =
    briefing?.summary ||
    "ClienteYA analiza clientes, riesgos, oportunidades y próximos pasos.";
  const focus =
    briefing?.focus ||
    "Revisar prioridades comerciales y ejecutar los seguimientos más importantes.";

  const riskCount = Number(briefing?.riskCount || 0);
  const followupCount = Number(briefing?.followupCount || 0);
  const opportunityCount = Number(briefing?.opportunityCount || 0);
  const totalRevenue = Number(briefing?.totalRevenue || 0);

  const insights = Array.isArray(briefing?.insights) ? briefing.insights : [];

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-violet-700">
            🧠 AI Cockpit
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            {summary}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Focus del día
          </div>

          <div className="mt-2 max-w-xs text-sm font-semibold leading-relaxed text-slate-900">
            {focus}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
            Riesgos
          </div>

          <div className="mt-2 text-3xl font-black text-red-700">
            {riskCount}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            Follow-ups
          </div>

          <div className="mt-2 text-3xl font-black text-orange-700">
            {followupCount}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
            Oportunidades
          </div>

          <div className="mt-2 text-3xl font-black text-emerald-700">
            {opportunityCount}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Revenue
          </div>

          <div className="mt-2 text-2xl font-black text-blue-700">
            {formatRevenue(totalRevenue)}
          </div>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          ✅ No hay riesgos críticos detectados en este momento.
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const priority = getSafePriority(insight.priority);
            const type = getSafeType(insight.type);

            const id = insight.id || `ai-insight-${index}`;
            const insightTitle = insight.title || "Insight AI";
            const description =
              insight.description ||
              "ClienteYA detectó una señal comercial relevante.";
            const actionHref = insight.actionHref || "/dashboard/clientes";
            const actionLabel = insight.actionLabel || "Abrir";

            return (
              <div
                key={id}
                className={`rounded-2xl border p-4 ${getPriorityClasses(
                  priority
                )}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-lg">
                        {getPriorityIcon(priority)}
                      </span>

                      <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-black uppercase tracking-[0.15em]">
                        {getAICockpitPriorityLabel(priority)}
                      </span>

                      <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-black uppercase tracking-[0.15em]">
                        {getTypeIcon(type)} {getAICockpitTypeLabel(type)}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900">
                      {insightTitle}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {description}
                    </p>
                  </div>

                  <Link
                    href={actionHref}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:scale-[1.02]"
                  >
                    {actionLabel}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}