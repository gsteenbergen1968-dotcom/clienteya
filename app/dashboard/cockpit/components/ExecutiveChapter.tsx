import type { ReactNode } from "react";

export type ExecutiveChapterTone =
  | "blue"
  | "emerald"
  | "amber"
  | "red"
  | "purple"
  | "slate";

export type ExecutiveChapterStatus =
  | "stable"
  | "attention"
  | "warning"
  | "critical"
  | "neutral";

type ExecutiveChapterMetric = {
  label: string;
  value: string | number;
  description?: string;
};

type ExecutiveChapterProps = {
  index: number;
  title: string;
  question: string;
  status?: ExecutiveChapterStatus;
  statusLabel?: string;
  tone?: ExecutiveChapterTone;
  metrics?: ExecutiveChapterMetric[];
  children?: ReactNode;
};

function getToneClasses(tone: ExecutiveChapterTone) {
  if (tone === "emerald") {
    return {
      shell: "border-emerald-200 bg-emerald-50/40",
      accent: "text-emerald-700",
      bar: "from-emerald-500 via-blue-500 to-slate-900",
    };
  }

  if (tone === "amber") {
    return {
      shell: "border-amber-200 bg-amber-50/40",
      accent: "text-amber-700",
      bar: "from-amber-500 via-orange-400 to-blue-600",
    };
  }

  if (tone === "red") {
    return {
      shell: "border-red-200 bg-red-50/40",
      accent: "text-red-700",
      bar: "from-red-500 via-orange-500 to-blue-600",
    };
  }

  if (tone === "purple") {
    return {
      shell: "border-purple-200 bg-purple-50/40",
      accent: "text-purple-700",
      bar: "from-purple-500 via-blue-500 to-emerald-500",
    };
  }

  if (tone === "slate") {
    return {
      shell: "border-slate-200 bg-slate-50/70",
      accent: "text-slate-700",
      bar: "from-slate-500 via-blue-500 to-slate-900",
    };
  }

  return {
    shell: "border-blue-200 bg-blue-50/40",
    accent: "text-blue-700",
    bar: "from-blue-600 via-cyan-500 to-emerald-400",
  };
}

function getStatusLabel(status: ExecutiveChapterStatus) {
  if (status === "stable") return "Estable";
  if (status === "attention") return "Atención";
  if (status === "warning") return "Vigilancia";
  if (status === "critical") return "Crítico";
  return "Neutral";
}

function getStatusClasses(status: ExecutiveChapterStatus) {
  if (status === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "attention") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "stable") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function ExecutiveChapter({
  title,
  question,
  status = "neutral",
  statusLabel,
  tone = "blue",
  metrics = [],
  children,
}: ExecutiveChapterProps) {
  const toneClasses = getToneClasses(tone);
  const visibleMetrics = metrics.slice(0, 4);

  return (
    <section
      className={`relative overflow-hidden rounded-[38px] border bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] ${toneClasses.shell}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${toneClasses.bar}`}
      />

      <div className="relative border-b border-slate-200/80 bg-white/90 p-5 sm:p-7 xl:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p
              className={`text-[11px] font-black uppercase tracking-[0.24em] ${toneClasses.accent}`}
            >
              {title}
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl xl:text-4xl">
              {question}
            </h2>
          </div>

          <div className="flex flex-col items-end gap-4">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusClasses(
                status,
              )}`}
            >
              {statusLabel || getStatusLabel(status)}
            </span>

            {visibleMetrics.length > 0 ? (
              <div className="grid w-full gap-3 sm:grid-cols-2 xl:min-w-[520px]">
                {visibleMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                      {metric.label}
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-950">
                      {metric.value}
                    </p>

                    {metric.description ? (
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        {metric.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {children ? (
        <div className="relative bg-gradient-to-br from-white via-slate-50/60 to-white p-5 sm:p-7 xl:p-8">
          <div className="space-y-6">{children}</div>
        </div>
      ) : null}
    </section>
  );
}