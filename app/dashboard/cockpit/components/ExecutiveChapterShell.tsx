import type { ReactNode } from "react";

export type ExecutiveChapterTone =
  | "health"
  | "pipeline"
  | "customers"
  | "kpi"
  | "founder"
  | "actions";

export type ExecutiveChapterShellProps = {
  eyebrow?: string;
  title: string;
  question: string;
  answer?: string;
  tone?: ExecutiveChapterTone;
  children: ReactNode;
  footer?: ReactNode;
};

function getToneClasses(tone: ExecutiveChapterTone) {
  if (tone === "health") {
    return {
      shell: "border-emerald-200 bg-emerald-50/70",
      badge: "border-emerald-200 bg-white text-emerald-700",
      question: "text-emerald-950",
      answer: "border-emerald-200 bg-white text-emerald-900",
      dot: "bg-emerald-500",
    };
  }

  if (tone === "pipeline") {
    return {
      shell: "border-blue-200 bg-blue-50/70",
      badge: "border-blue-200 bg-white text-blue-700",
      question: "text-blue-950",
      answer: "border-blue-200 bg-white text-blue-900",
      dot: "bg-blue-500",
    };
  }

  if (tone === "customers") {
    return {
      shell: "border-violet-200 bg-violet-50/70",
      badge: "border-violet-200 bg-white text-violet-700",
      question: "text-violet-950",
      answer: "border-violet-200 bg-white text-violet-900",
      dot: "bg-violet-500",
    };
  }

  if (tone === "kpi") {
    return {
      shell: "border-sky-200 bg-sky-50/70",
      badge: "border-sky-200 bg-white text-sky-700",
      question: "text-sky-950",
      answer: "border-sky-200 bg-white text-sky-900",
      dot: "bg-sky-500",
    };
  }

  if (tone === "founder") {
    return {
      shell: "border-amber-200 bg-amber-50/70",
      badge: "border-amber-200 bg-white text-amber-700",
      question: "text-amber-950",
      answer: "border-amber-200 bg-white text-amber-900",
      dot: "bg-amber-500",
    };
  }

  return {
    shell: "border-slate-200 bg-slate-50/80",
    badge: "border-slate-200 bg-white text-slate-700",
    question: "text-slate-950",
    answer: "border-slate-200 bg-white text-slate-900",
    dot: "bg-slate-500",
  };
}

export default function ExecutiveChapterShell({
  eyebrow,
  title,
  question,
  answer,
  tone = "health",
  children,
  footer,
}: ExecutiveChapterShellProps) {
  const classes = getToneClasses(tone);

  return (
    <section
      className={`rounded-[2rem] border p-4 shadow-sm sm:p-6 ${classes.shell}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            {eyebrow ? (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${classes.badge}`}
                >
                  <span className={`h-2 w-2 rounded-full ${classes.dot}`} />
                  {eyebrow}
                </span>
              </div>
            ) : null}

            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                {title}
              </h2>

              <p className={`text-sm font-semibold ${classes.question}`}>
                {question}
              </p>
            </div>
          </div>
        </div>

        {answer ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-6 ${classes.answer}`}
          >
            {answer}
          </div>
        ) : null}

        <div className="space-y-4">{children}</div>

        {footer ? (
          <div className="border-t border-white/70 pt-4">{footer}</div>
        ) : null}
      </div>
    </section>
  );
}