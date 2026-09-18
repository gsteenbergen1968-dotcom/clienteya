export type ExecutiveMetricTone =
  | "critical"
  | "high"
  | "medium"
  | "stable"
  | "growth";

export type ExecutiveMetricItem = {
  label: string;
  value: string;
  description?: string;
  tone?: ExecutiveMetricTone;
};

export type ExecutiveMetricStripProps = {
  title?: string;
  description?: string;
  metrics: ExecutiveMetricItem[];
};

function getToneClasses(tone: ExecutiveMetricTone) {
  if (tone === "critical") {
    return {
      card: "border-red-200 bg-red-50",
      label: "text-red-700",
      value: "text-red-900",
      description: "text-red-700",
    };
  }

  if (tone === "high") {
    return {
      card: "border-orange-200 bg-orange-50",
      label: "text-orange-700",
      value: "text-orange-900",
      description: "text-orange-700",
    };
  }

  if (tone === "medium") {
    return {
      card: "border-amber-200 bg-amber-50",
      label: "text-amber-700",
      value: "text-amber-900",
      description: "text-amber-700",
    };
  }

  if (tone === "growth") {
    return {
      card: "border-emerald-200 bg-emerald-50",
      label: "text-emerald-700",
      value: "text-emerald-900",
      description: "text-emerald-700",
    };
  }

  return {
    card: "border-slate-200 bg-white",
    label: "text-slate-500",
    value: "text-slate-950",
    description: "text-slate-500",
  };
}

export default function ExecutiveMetricStrip({
  title,
  description,
  metrics,
}: ExecutiveMetricStripProps) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5">
      {(title || description) && (
        <div className="mb-4 space-y-1">
          {title && (
            <h3 className="text-sm font-semibold text-slate-950">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs leading-relaxed text-slate-500">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const toneClasses = getToneClasses(
            metric.tone ?? "stable",
          );

          return (
            <article
              key={`${metric.label}-${metric.value}`}
              className={`rounded-2xl border p-4 ${toneClasses.card}`}
            >
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClasses.label}`}
              >
                {metric.label}
              </p>
              <p
                className={`mt-2 text-2xl font-bold tracking-tight ${toneClasses.value}`}
              >
                {metric.value}
              </p>
              {metric.description && (
                <p
                  className={`mt-1 text-xs leading-relaxed ${toneClasses.description}`}
                >
                  {metric.description}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
