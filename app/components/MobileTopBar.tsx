"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MobileTopBarProps = {
  title?: string;
  notificationCount?: number;
};

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/dashboard/relationships")) {
    return "Relaciones";
  }

  if (pathname.startsWith("/dashboard/automations")) {
    return "Automations";
  }

  if (pathname.startsWith("/dashboard/whatsapp")) {
    return "WhatsApp AI";
  }

  if (pathname.startsWith("/dashboard/planning")) {
    return "Calendario";
  }

  if (pathname.startsWith("/dashboard/settings")) {
    return "Settings";
  }

  if (pathname.startsWith("/dashboard/new")) {
    return "Nueva relación";
  }

  return "Dashboard";
}

export default function MobileTopBar({
  title,
  notificationCount = 0,
}: MobileTopBarProps) {
  const pathname = usePathname();

  const resolvedTitle = title || getPageTitle(pathname);

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
            ClienteYA
          </p>

          <h1 className="text-lg font-bold tracking-tight text-slate-950">
            {resolvedTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg shadow-sm transition hover:bg-slate-100"
          >
            ⚡
          </Link>

          <Link
            href="/dashboard/new"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-lg text-white shadow-sm transition hover:bg-blue-700"
          >
            ➕
          </Link>

          <Link
            href="/dashboard/automations"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg shadow-sm transition hover:bg-slate-100"
          >
            🔔

            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}