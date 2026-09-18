import Link from "next/link";

import { buildSupportMemoryAdapter } from "../adapters";
import { buildSupportRepository } from "../repositories";

type EscalationItem = {
  id: string;
  title: string;
  reason: string;
  priority: "Urgent" | "High" | "Normal";
  status: "Open" | "In progress" | "Resolved";
  founderReview: boolean;
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

function getPriority(value: unknown): EscalationItem["priority"] {
  if (value === "urgent" || value === "critical") {
    return "Urgent";
  }

  if (value === "high") {
    return "High";
  }

  return "Normal";
}

function getStatus(value: unknown): EscalationItem["status"] {
  if (value === "resolved" || value === "closed") {
    return "Resolved";
  }

  if (value === "in_progress" || value === "processing") {
    return "In progress";
  }

  return "Open";
}

function getPriorityClasses(priority: EscalationItem["priority"]) {
  if (priority === "Urgent") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (priority === "High") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function SupportEscalationsPage() {
  const adapter = buildSupportMemoryAdapter();
  const repository = buildSupportRepository(adapter);

  const repositoryEscalations = await repository.getEscalations();

  const escalations: EscalationItem[] = repositoryEscalations.map(
    (escalation) => {
      const record = escalation as unknown as Record<string, unknown>;
      const reason = readString(record, "reason", "Review required");

      return {
        id: readString(record, "id", crypto.randomUUID()),
        title: readString(
          record,
          "title",
          readString(record, "subject", "Escalated case"),
        ),
        reason,
        priority: getPriority(record.priority),
        status: getStatus(record.status),
        founderReview:
          record.founderReview === true ||
          record.requiresFounderReview === true ||
          reason === "founder_review",
      };
    },
  );

  return (
    <main className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          SIP Escalations
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
          Escalations
        </h1>

        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          Manage cases that require human review, special attention or a team
          decision.
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
            Control
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Escalated Cases
          </h2>
        </div>

        {escalations.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-semibold leading-6 text-emerald-800">
            There are no active escalations. SIP does not require additional
            intervention at this time.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {escalations.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getPriorityClasses(
                        item.priority,
                      )}`}
                    >
                      {item.priority}
                    </span>

                    <h3 className="mt-3 text-xl font-black text-slate-950">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Reason: {item.reason}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Status: {item.status}
                    </p>
                  </div>

                  {item.founderReview ? (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">
                      Founder Review
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}