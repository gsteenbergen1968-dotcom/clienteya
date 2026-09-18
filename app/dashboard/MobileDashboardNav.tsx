"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ui } from "../../lib/ui";

type NavigationItem = {
  href: string;
  label: string;
};

type SidebarNavProps = {
  limitedAccess?: boolean;
};

const primaryItems: NavigationItem[] = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/planning", label: ui.nav.calendario },
  { href: "/dashboard/new", label: "Nueva relación" },
  { href: "/dashboard/relationships", label: "Relaciones" },
  { href: "/dashboard/cockpit", label: "Cockpit" },
  { href: "/dashboard/automations", label: ui.nav.automations },
];

const accountItems: NavigationItem[] = [
  { href: "/dashboard/billing", label: "Suscripción" },
  { href: "/dashboard/settings", label: ui.nav.configuracion },
  { href: "/dashboard/support", label: "Soporte" },
];

const limitedAccessItems: NavigationItem[] = [
  { href: "/dashboard/billing", label: "Suscripción" },
];

function ParaguayBadge() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="h-2 w-6 bg-red-500" />

        <div className="flex h-2 w-6 items-center justify-center bg-white text-[7px] font-black text-slate-900">
          PY
        </div>

        <div className="h-2 w-6 bg-blue-600" />
      </div>
    </div>
  );
}

type SidebarLinkProps = {
  item: NavigationItem;
  pathname: string;
};

function SidebarLink({
  item,
  pathname,
}: SidebarLinkProps) {
  const active =
    pathname === item.href ||
    (
      item.href !== "/dashboard" &&
      pathname.startsWith(`${item.href}/`)
    );

  return (
    <Link
      href={item.href}
      className={`group flex min-w-0 items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-all ${
        active
          ? "border-blue-100 bg-gradient-to-r from-blue-50 to-white shadow-sm"
          : "border-transparent hover:border-slate-200 hover:bg-white"
      }`}
    >
      <div
        className={`h-2 w-2 shrink-0 rounded-full transition-all ${
          active
            ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.45)]"
            : "bg-slate-300 group-hover:bg-slate-500"
        }`}
      />

      <span
        className={`truncate text-sm font-semibold transition-colors ${
          active
            ? "text-slate-950"
            : "text-slate-600 group-hover:text-slate-950"
        }`}
      >
        {item.label}
      </span>
    </Link>
  );
}

export default function SidebarNav({
  limitedAccess = false,
}: SidebarNavProps) {
  const pathname = usePathname();

  if (limitedAccess) {
    return (
      <div className="flex h-full min-w-0 flex-col">
        <div className="border-b border-slate-100 px-4 py-4">
          <div className={`${ui.cards.base} ${ui.cards.padding.sm}`}>
            <div className="flex min-w-0 items-center gap-3">
              <ParaguayBadge />

              <div className="min-w-0">
                <h2 className="truncate text-sm font-black tracking-tight text-slate-950">
                  Cliente<span className="text-red-600">YA</span>
                </h2>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Hecho para Paraguay
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-1">
            {limitedAccessItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
              />
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="border-b border-slate-100 px-4 py-4">
        <div className={`${ui.cards.base} ${ui.cards.padding.sm}`}>
          <div className="flex min-w-0 items-center gap-3">
            <ParaguayBadge />

            <div className="min-w-0">
              <h2 className="truncate text-sm font-black tracking-tight text-slate-950">
                Cliente<span className="text-red-600">YA</span>
              </h2>

              <p className="mt-0.5 truncate text-xs text-slate-500">
                Hecho para Paraguay
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          {primaryItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              pathname={pathname}
            />
          ))}
        </div>

        <div className="my-3 border-t border-slate-100" />

        <div className="space-y-1">
          {accountItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              pathname={pathname}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}