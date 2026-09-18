import Link from "next/link";

import { requireSipPermission } from "../../../lib/sip-auth";

const settings = [
  {
    title: "Users and Teams",
    description:
      "Manage users, roles and teams within the support operation.",
    href: "/support/settings/users",
    available: true,
  },
  {
    title: "Support Channels",
    description:
      "Configure the channels that receive conversations and support requests.",
    href: null,
    available: false,
  },
  {
    title: "Automation",
    description:
      "Define rules for responses, priorities and escalations.",
    href: null,
    available: false,
  },
  {
    title: "Integrations",
    description:
      "Manage external connections used by SIP.",
    href: null,
    available: false,
  },
];

export default async function SupportSettingsPage() {
  await requireSipPermission("settings.read");

  return (
    <main className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          SIP Settings
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
          Settings
        </h1>

        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          Configure support operations, teams, channels and intelligence.
        </p>

        <Link
          href="/support"
          className="mt-5 inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
        >
          Back to Cockpit
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {settings.map((item) => (
          <article
            key={item.title}
            className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.05)]"
          >
            <h2 className="text-xl font-black text-slate-950">
              {item.title}
            </h2>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              {item.description}
            </p>

            {item.available && item.href ? (
              <Link
                href={item.href}
                className="mt-5 inline-flex items-center justify-center rounded-2xl bg-blue-700 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-800"
              >
                Open
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-5 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-500"
              >
                Coming Soon
              </button>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}