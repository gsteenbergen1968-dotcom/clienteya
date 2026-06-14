import StatusBadge from "./StatusBadge";

type AIInsightTone = "default" | "success" | "warning" | "danger" | "info";

type AIInsightCardProps = {
  title: string;
  description: string;
  label?: string;
  tone?: AIInsightTone;
  icon?: string;
  action?: React.ReactNode;
};

function getToneClasses(tone: AIInsightTone) {
  const tones: Record<AIInsightTone, string> = {
    default: "border-slate-200 bg-slate-50",
    success: "border-emerald-200 bg-emerald-50",
    warning: "border-amber-200 bg-amber-50",
    danger: "border-rose-200 bg-rose-50",
    info: "border-sky-200 bg-sky-50",
  };

  return tones[tone];
}

function getBadgeTone(tone: AIInsightTone) {
  if (tone === "success") return "success";
  if (tone === "warning") return "warning";
  if (tone === "danger") return "danger";
  if (tone === "info") return "info";

  return "default";
}

export default function AIInsightCard({
  title,
  description,
  label = "Insight AI",
  tone = "default",
  icon = "✨",
  action,
}: AIInsightCardProps) {
  return (
    <article
      className={`rounded-3xl border p-4 ${getToneClasses(tone)}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge label={label} type="custom" tone={getBadgeTone(tone)} />
          </div>

          <h3 className="text-sm font-bold text-slate-950">{title}</h3>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {description}
          </p>

          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </article>
  );
}