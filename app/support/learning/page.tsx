import Link from "next/link";

import { buildSupportMemoryAdapter } from "../adapters";
import { buildSupportRepository } from "../repositories";

type LearningCard = {
  id: string;
  title: string;
  description: string;
  type: "Knowledge" | "Product" | "Process";
  impact: "Low" | "Medium" | "High";
};

function readString(
  record: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = record[key];

  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function getSignalType(value: unknown): LearningCard["type"] {
  if (
    value === "product_friction" ||
    value === "product_improvement" ||
    value === "technical_issue"
  ) {
    return "Product";
  }

  if (
    value === "human_resolution" ||
    value === "automatic_resolution" ||
    value === "repeated_issue"
  ) {
    return "Process";
  }

  return "Knowledge";
}

function getImpact(value: unknown): LearningCard["impact"] {
  if (
    value === "high" ||
    value === "critical" ||
    value === "product_friction" ||
    value === "product_improvement"
  ) {
    return "High";
  }

  if (
    value === "medium" ||
    value === "low_confidence" ||
    value === "negative_feedback" ||
    value === "missing_knowledge"
  ) {
    return "Medium";
  }

  return "Low";
}

function getImpactClasses(impact: LearningCard["impact"]) {
  if (impact === "High") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (impact === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function SupportLearningPage() {
  const adapter = buildSupportMemoryAdapter();
  const repository = buildSupportRepository(adapter);

  const repositorySignals = await repository.getLearningSignals();

  const learningSignals: LearningCard[] = repositorySignals.map(
    (signal, index) => {
      const record = signal as unknown as Record<string, unknown>;
      const signalType = readString(record, "type", "new_question");

      return {
        id: readString(record, "id", `learning-signal-${index}`),
        title: readString(
          record,
          "title",
          readString(record, "label", "Learning signal"),
        ),
        description: readString(
          record,
          "description",
          readString(
            record,
            "message",
            "SIP detected a signal that can be converted into an improvement.",
          ),
        ),
        type: getSignalType(signalType),
        impact: getImpact(record.impact ?? signalType),
      };
    },
  );

  return (
    <main className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          SIP Learning
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
          Learning
        </h1>

        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          Turn conversations, feedback and repeated patterns into permanent
          improvements for the organization.
        </p>

        <Link
          href="/support"
          className="mt-5 inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
        >
          Back to Cockpit
        </Link>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Learning Signals
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Detected Signals
          </h2>
        </div>

        {learningSignals.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-semibold leading-6 text-emerald-800">
            There are no pending learning signals. SIP will continue analyzing
            new conversations.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {learningSignals.map((signal) => (
              <article
                key={signal.id}
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                  {signal.type}
                </span>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  {signal.title}
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {signal.description}
                </p>

                <span
                  className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getImpactClasses(
                    signal.impact,
                  )}`}
                >
                  Impact {signal.impact}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}