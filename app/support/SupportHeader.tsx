import Link from "next/link";
import { redirect } from "next/navigation";

import { createSipAuthServerClient } from "../../lib/supabase/sip-auth-server";

type SupportHeaderProps = {
  title?: string;
  description?: string;
};

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800";

const logoutButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50";

async function signOut() {
  "use server";

  const supabase =
    await createSipAuthServerClient();

  await supabase.auth.signOut();

  redirect("/sip-login");
}

export default function SupportHeader({
  title = "SIP Cockpit",
  description = "Support Intelligence Platform",
}: SupportHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-200 bg-white px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h1>

        <p className="mt-2 text-sm font-semibold text-slate-600">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/support/inbox" className={primaryButtonClass}>
          Inbox
        </Link>

        <Link href="/support/knowledge" className={secondaryButtonClass}>
          Knowledge
        </Link>

        <Link href="/support/escalations" className={secondaryButtonClass}>
          Escalations
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className={logoutButtonClass}
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}