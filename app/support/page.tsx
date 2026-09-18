import Link from "next/link";
import { redirect } from "next/navigation";

import { createSipAuthServerClient } from "../../lib/supabase/sip-auth-server";

import { buildSupportMemoryAdapter } from "./adapters";
import { buildSupportRepository } from "./repositories";

export const dynamic = "force-dynamic";

type CockpitMetric = {
  label: string;
  value: string;
  description: string;
};

type PriorityItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  priority: "Critical" | "High" | "Normal";
};

type CockpitModule = {
  title: string;
  description: string;
  href: string;
  status: string;
};

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800";

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50";

const modules: CockpitModule[] = [
  {
    title: "Inbox",
    description:
      "Review new, open and pending support requests.",
    href: "/support/inbox",
    status: "Operations",
  },
  {
    title: "Conversations",
    description:
      "Review the complete history of every support interaction.",
    href: "/support/conversations",
    status: "Context",
  },
  {
    title: "Knowledge",
    description:
      "Manage the knowledge that powers support intelligence.",
    href: "/support/knowledge",
    status: "Knowledge",
  },
  {
    title: "Escalations",
    description:
      "Manage cases that require intervention or specialist review.",
    href: "/support/escalations",
    status: "Control",
  },
  {
    title: "Learning",
    description:
      "Turn repeated questions and feedback into structural improvements.",
    href: "/support/learning",
    status: "Learning",
  },
  {
    title: "Analytics",
    description:
      "Measure volume, resolution, timing and system behaviour.",
    href: "/support/analytics",
    status: "Intelligence",
  },
];

function getPriorityClasses(priority: PriorityItem["priority"]) {
  if (priority === "Critical") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (priority === "High") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function SipHero() {
  return (
    <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Support Intelligence
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Support Center
            </h1>

            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600 sm:text-lg">
              Manage requests, resolve priorities and turn every conversation
              into useful knowledge for ClienteYA.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[390px]">
            <Link href="/support/inbox" className={primaryButtonClass}>
              Open Inbox
            </Link>

            <Link href="/support/escalations" className={secondaryButtonClass}>
              View Escalations
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricsSection({ metrics }: { metrics: CockpitMetric[] }) {
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Operational Status
        </p>

        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          What requires attention now
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)]"
          >
            <p className="text-sm font-black text-slate-700">
              {metric.label}
            </p>

            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              {metric.value}
            </p>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              {metric.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PrioritiesSection({ priorities }: { priorities: PriorityItem[] }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_44px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Today
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Support Priorities
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            ClienteYA shows only the cases that require a decision.
          </p>
        </div>

        <Link href="/support/inbox" className={secondaryButtonClass}>
          View All
        </Link>
      </div>

      {priorities.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold leading-6 text-emerald-800">
          There are no active priorities. Operations are under control.
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {priorities.map((priority) => (
            <article
              key={priority.id}
              className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getPriorityClasses(
                      priority.priority,
                    )}`}
                  >
                    {priority.priority}
                  </span>

                  <h3 className="mt-3 text-xl font-black text-slate-950">
                    {priority.title}
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {priority.description}
                  </p>
                </div>

                <Link href={priority.href} className={primaryButtonClass}>
                  {priority.actionLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ModulesSection() {
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Operations
        </p>

        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          Support Modules
        </h2>

        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          Each module has a clear responsibility within the support flow.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_44px_rgba(15,23,42,0.08)]"
          >
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
              {module.status}
            </span>

            <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
              {module.title}
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {module.description}
            </p>

            <p className="mt-5 text-sm font-black text-blue-700">
              Open Module <span aria-hidden="true">→</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function IntelligenceSection() {
  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Intelligence Layer
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Operations feed continuous improvement
          </h2>

          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
            Conversations, escalations and learning signals are transformed
            into knowledge and then into useful intelligence for ClienteYA.
          </p>
        </div>

        <Link
          href="/support/learning"
          className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
        >
          Open Learning
        </Link>
      </div>
    </section>
  );
}

export default async function SupportPage() {
  const authSupabase =
    await createSipAuthServerClient();

  const {
    data: { user },
  } =
    await authSupabase.auth.getUser();

  if (!user) {
    redirect("/sip-login");
  }

  const adapter =
    buildSupportMemoryAdapter();

  const repository =
    buildSupportRepository(
      adapter,
    );

  const [
    requests,
    escalations,
    learningSignals,
  ] =
    await Promise.all([
      repository.getRequests(),
      repository.getEscalations(),
      repository.getLearningSignals(),
    ]);

  const openRequests =
    requests.filter(
      (request) =>
        ![
          "resolved",
          "closed",
        ].includes(
          String(
            request.status,
          ),
        ),
    );

  const resolvedByIntelligence =
    requests.filter(
      (request) =>
        String(
          request.status,
        ) === "resolved" &&
        Boolean(
          request.matchedKnowledgeItemId,
        ) &&
        !request.requiresFounderReview,
    );

  const activeEscalations =
    escalations.filter(
      (escalation) =>
        ![
          "resolved",
          "closed",
        ].includes(
          String(
            escalation.status,
          ),
        ),
    );

  const activeLearningSignals =
    learningSignals.filter(
      (signal) =>
        ![
          "implemented",
          "dismissed",
          "closed",
        ].includes(
          String(
            signal.status,
          ),
        ),
    );

  const metrics: CockpitMetric[] = [
    {
      label:
        "Open Requests",
      value:
        String(
          openRequests.length,
        ),
      description:
        "Conversations that require attention.",
    },
    {
      label:
        "Resolved by Intelligence",
      value:
        String(
          resolvedByIntelligence.length,
        ),
      description:
        "Responses completed without manual intervention.",
    },
    {
      label:
        "Active Escalations",
      value:
        String(
          activeEscalations.length,
        ),
      description:
        "Cases that require human review.",
    },
    {
      label:
        "Learning Signals",
      value:
        String(
          activeLearningSignals.length,
        ),
      description:
        "New patterns detected by ClienteYA.",
    },
  ];

  const priorities: PriorityItem[] =
    activeEscalations
      .sort(
        (
          left,
          right,
        ) => {
          const priorityOrder: Record<string, number> = {
            urgent:
              3,
            high:
              2,
            normal:
              1,
            low:
              0,
          };

          return (
            (
              priorityOrder[
                String(
                  right.priority,
                )
              ] ?? 0
            ) -
            (
              priorityOrder[
                String(
                  left.priority,
                )
              ] ?? 0
            )
          );
        },
      )
      .slice(
        0,
        5,
      )
      .map(
        (
          escalation,
        ) => ({
          id:
            escalation.id,
          title:
            escalation.title,
          description:
            escalation.description,
          href:
            "/support/escalations",
          actionLabel:
            "Review Escalation",
          priority:
            String(
              escalation.priority,
            ) === "urgent"
              ? "Critical"
              : String(
                    escalation.priority,
                  ) === "high"
                ? "High"
                : "Normal",
        }),
      );

  return (
    <div className="space-y-7">
      <SipHero />

      <MetricsSection
        metrics={
          metrics
        }
      />

      <PrioritiesSection
        priorities={
          priorities
        }
      />

      <ModulesSection />

      <IntelligenceSection />
    </div>
  );
}