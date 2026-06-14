type MetricTone = "default" | "success" | "warning" | "danger" | "info";

type MetricCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: string;
  tone?: MetricTone;
};

function getToneClasses(tone: MetricTone) {
  const tones: Record<MetricTone, string> = {
    default: "border-slate-200 bg-white text-slate-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-rose-200 bg-rose-50 text-rose-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return tones[tone];
}

export default function MetricCard({
  title,
  value,
  description,
  icon = "📊",
  tone = "default",
}: MetricCardProps) {
  return (
    <article
      className={`rounded-3xl border p-4 shadow-sm ${getToneClasses(tone)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
            {title}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight">
            {value}
          </p>

          {description ? (
            <p className="mt-2 text-sm leading-5 opacity-75">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-lg shadow-sm">
          {icon}
        </div>
      </div>
    </article>
  );
}