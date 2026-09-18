import type { ReactNode } from "react";

export type ExecutiveSummaryTone =
  | "critical"
  | "warning"
  | "stable"
  | "positive"
  | "neutral";

export type ExecutiveSummaryTrend =
  | "up"
  | "stable"
  | "down"
  | "unknown";

type ExecutiveSummaryCardProps = {
  eyebrow?: string;
  title: string;
  question: string;
  summary: string;
  statusLabel: string;
  tone?: ExecutiveSummaryTone;
  trend?: ExecutiveSummaryTrend;
  trendLabel?: string;
  primaryMetric?: string | number;
  primaryMetricLabel?: string;
  secondaryMetric?: string | number;
  secondaryMetricLabel?: string;
  decisionLabel?: string;
  decision?: string;
  actionLabel?: string;
  actionHref?: string;
  children?: ReactNode;
};

function getToneClasses(tone: ExecutiveSummaryTone) {
  if (tone === "critical") {
    return {
      shell: "border-red-200 bg-red-50/80",
      badge: "border-red-200 bg-white text-red-700",
      accent: "text-red-700",
      dot: "bg-red-500",
      soft: "border-red-100 bg-white/80",
    };
  }

  if (tone === "warning") {
    return {
      shell: "border-amber-200 bg-amber-50/80",
      badge: "border-amber-200 bg-white text-amber-700",
      accent: "text-amber-700",
      dot: "bg-amber-500",
      soft: "border-amber-100 bg-white/80",
    };
  }

  if (tone === "positive") {
    return {
      shell: "border-emerald-200 bg-emerald-50/80",
      badge: "border-emerald-200 bg-white text-emerald-700",
      accent: "text-emerald-700",
      dot: "bg-emerald-500",
      soft: "border-emerald-100 bg-white/80",
    };
  }

  if (tone === "stable") {
    return {
      shell: "border-blue-200 bg-blue-50/80",
      badge: "border-blue-200 bg-white text-blue-700",
      accent: "text-blue-700",
      dot: "bg-blue-500",
      soft: "border-blue-100 bg-white/80",
    };
  }

  return {
    shell: "border-slate-200 bg-slate-50",
    badge: "border-slate-200 bg-white text-slate-700",
    accent: "text-slate-700",
    dot: "bg-slate-500",
    soft: "border-slate-200 bg-white/80",
  };
}

function getTrendIcon(trend: ExecutiveSummaryTrend) {
  if (trend === "up") return "↗";
  if (trend === "down") return "↘";
  if (trend === "stable") return "→";
  return "•";
}

export default function ExecutiveSummaryCard({
  eyebrow = "Conclusión",
  title,
  question,
  summary,
  statusLabel,
  tone = "neutral",
  trend = "unknown",
  trendLabel = "Sin patrón dominante",
  primaryMetric,
  primaryMetricLabel,
  secondaryMetric,
  secondaryMetricLabel,
  decisionLabel = "Acción",
  decision,
  actionLabel,
  actionHref,
  children,
}: ExecutiveSummaryCardProps) {
  const classes = getToneClasses(tone);

  return (
    <section
      className={`relative overflow-hidden rounded-[32px] border p-5 shadow-[0_14px_44px_rgba(15,23,42,0.06)] sm:p-6 ${classes.shell}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.58),transparent_30%)]" />

      <div className="relative">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${classes.accent}`}>
              {eyebrow}
            </p>

            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {title}
            </h3>

            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600">
              {question}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${classes.badge}`}
            >
              <span className={`h-2 w-2 rounded-full ${classes.dot}`} />
              {statusLabel}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
              {getTrendIcon(trend)} {trendLabel}
            </span>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={`rounded-[26px] border px-5 py-4 ${classes.soft}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Conclusión
            </p>

            <p className="mt-3 text-base font-black leading-7 text-slate-950">
              {summary}
            </p>

            {decision ? (
              <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${classes.accent}`}>
                  {decisionLabel}
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  {decision}
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {primaryMetric !== undefined && primaryMetricLabel ? (
              <div className="rounded-[24px] border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {primaryMetricLabel}
                </p>

                <p className="mt-2 text-2xl font-black text-slate-950">
                  {primaryMetric}
                </p>
              </div>
            ) : null}

            {secondaryMetric !== undefined && secondaryMetricLabel ? (
              <div className="rounded-[24px] border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {secondaryMetricLabel}
                </p>

                <p className="mt-2 text-2xl font-black text-slate-950">
                  {secondaryMetric}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        {actionHref && actionLabel ? (
          <a
            href={actionHref}
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-blue-700 bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-[0_16px_38px_rgba(37,99,235,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-800 sm:w-auto"
          >
            {actionLabel} →
          </a>
        ) : null}
      </div>
    </section>
  );
}