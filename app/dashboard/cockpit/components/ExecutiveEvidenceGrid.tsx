import type { ReactNode } from "react";

export type ExecutiveEvidenceTone =
  | "critical"
  | "high"
  | "medium"
  | "stable"
  | "growth";

export type ExecutiveEvidenceItem = {
  label: string;
  value: string;
  description?: string;
  tone?: ExecutiveEvidenceTone;
  icon?: ReactNode;
};

export type ExecutiveEvidenceGridProps = {
  label?: string;
  title?: string;
  description?: string;
  evidence?: ExecutiveEvidenceItem[];
  columns?: "two" | "three";
  emptyTitle?: string;
  emptyDescription?: string;
  children?: ReactNode;
};

function getToneClasses(tone: ExecutiveEvidenceTone) {
  if (tone === "critical") {
    return {
      card: "border-red-200 bg-red-50",
      badge: "border-red-200 bg-white text-red-700",
      value: "text-red-800",
      icon: "border-red-200 bg-white text-red-700",
      dot: "bg-red-500",
    };
  }

  if (tone === "high") {
    return {
      card: "border-orange-200 bg-orange-50",
      badge: "border-orange-200 bg-white text-orange-700",
      value: "text-orange-800",
      icon: "border-orange-200 bg-white text-orange-700",
      dot: "bg-orange-500",
    };
  }

  if (tone === "medium") {
    return {
      card: "border-amber-200 bg-amber-50",
      badge: "border-amber-200 bg-white text-amber-700",
      value: "text-amber-800",
      icon: "border-amber-200 bg-white text-amber-700",
      dot: "bg-amber-500",
    };
  }

  if (tone === "growth") {
    return {
      card: "border-emerald-200 bg-emerald-50",
      badge: "border-emerald-200 bg-white text-emerald-700",
      value: "text-emerald-800",
      icon: "border-emerald-200 bg-white text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  return {
    card: "border-slate-200 bg-white",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    value: "text-slate-950",
    icon: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  };
}

export default function ExecutiveEvidenceGrid({
  title = "Evidencia",
  description =
    "Esta evidencia explica por qué ClienteYA llega a esta conclusión.",
  evidence = [],
  columns = "three",
  emptyTitle = "Aún no hay evidencia suficiente",
  emptyDescription =
    "ClienteYA todavía no dispone de suficiente evidencia para sostener una conclusión confiable.",
  children,
}: ExecutiveEvidenceGridProps) {
  const hasChildren = Boolean(children);
  const hasEvidence = evidence.length > 0;
  const gridColumns =
    columns === "two"
      ? "grid gap-3 sm:grid-cols-2"
      : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 space-y-1">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      {hasChildren ? (
        <div className={gridColumns}>{children}</div>
      ) : hasEvidence ? (
        <div className={gridColumns}>
          {evidence.map((item) => {
            const tone = item.tone ?? "stable";
            const classes = getToneClasses(tone);

            return (
              <article
                key={`${item.label}-${item.value}`}
                className={`rounded-2xl border p-4 ${classes.card}`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${classes.dot}`}
                    />
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes.badge}`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.icon ? (
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${classes.icon}`}
                    >
                      {item.icon}
                    </div>
                  ) : null}
                </div>

                <p
                  className={`text-2xl font-bold tracking-tight ${classes.value}`}
                >
                  {item.value}
                </p>

                {item.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-800">
            {emptyTitle}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {emptyDescription}
          </p>
        </div>
      )}
    </section>
  );
}