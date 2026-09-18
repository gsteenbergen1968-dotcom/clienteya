import type { ReactNode } from "react";

export type ExecutiveDecisionTone =
  | "critical"
  | "high"
  | "medium"
  | "stable"
  | "growth";

export type ExecutiveDecisionCardProps = {
  label?: string;
  title: string;
  description: string;
  decision: string;
  tone?: ExecutiveDecisionTone;
  actionLabel?: string;
  actionHref?: string;
  children?: ReactNode;
};

function getToneClasses(tone: ExecutiveDecisionTone) {
  if (tone === "critical") {
    return {
      shell: "border-red-200 bg-red-50",
      badge: "border-red-200 bg-white text-red-700",
      decision: "border-red-200 bg-white text-red-800",
      button: "border-red-700 bg-red-700 text-white hover:bg-red-800",
      dot: "bg-red-500",
    };
  }

  if (tone === "high") {
    return {
      shell: "border-orange-200 bg-orange-50",
      badge: "border-orange-200 bg-white text-orange-700",
      decision: "border-orange-200 bg-white text-orange-800",
      button: "border-orange-700 bg-orange-700 text-white hover:bg-orange-800",
      dot: "bg-orange-500",
    };
  }

  if (tone === "medium") {
    return {
      shell: "border-amber-200 bg-amber-50",
      badge: "border-amber-200 bg-white text-amber-700",
      decision: "border-amber-200 bg-white text-amber-800",
      button: "border-amber-700 bg-amber-700 text-white hover:bg-amber-800",
      dot: "bg-amber-500",
    };
  }

  if (tone === "growth") {
    return {
      shell: "border-blue-200 bg-blue-50",
      badge: "border-blue-200 bg-white text-blue-700",
      decision: "border-blue-200 bg-white text-blue-800",
      button: "border-blue-700 bg-blue-700 text-white hover:bg-blue-800",
      dot: "bg-blue-500",
    };
  }

  return {
    shell: "border-emerald-200 bg-emerald-50",
    badge: "border-emerald-200 bg-white text-emerald-700",
    decision: "border-emerald-200 bg-white text-emerald-800",
    button: "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800",
    dot: "bg-emerald-500",
  };
}

export default function ExecutiveDecisionCard({
  label = "Acción",
  title,
  description,
  decision,
  tone = "stable",
  actionLabel,
  actionHref,
  children,
}: ExecutiveDecisionCardProps) {
  const classes = getToneClasses(tone);

  return (
    <section
      className={`rounded-[30px] border p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${classes.shell}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${classes.badge}`}
            >
              <span className={`h-2 w-2 rounded-full ${classes.dot}`} />
              {label}
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            {title}
          </h3>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            {description}
          </p>
        </div>

        {actionHref && actionLabel ? (
          <a
            href={actionHref}
            className={`inline-flex shrink-0 items-center justify-center rounded-2xl border px-5 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${classes.button}`}
          >
            {actionLabel} →
          </a>
        ) : null}
      </div>

      <div className={`mt-5 rounded-[24px] border px-4 py-4 ${classes.decision}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">
          Acción
        </p>

        <p className="mt-2 text-base font-black leading-6 text-slate-950">
          {decision}
        </p>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}