"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ui } from "../../lib/ui";

const items = [
  { href: "/dashboard", label: "Resumen", badge: null },
  { href: "/dashboard/nuevo", label: ui.nav.nuevoCliente, badge: null },
  { href: "/dashboard/calendario", label: ui.nav.calendario, badge: null },
  { href: "/dashboard/clientes", label: ui.nav.clientes, badge: null },

  {
    href: "/dashboard/automations",
    label: ui.nav.automations,
    badge: "IA",
    premium: true,
  },

  {
    href: "/dashboard/ai-cockpit",
    label: "Centro estratégico",
    badge: "PRO",
    premium: true,
  },

  { href: "/dashboard/billing", label: "Suscripción", badge: null },


  { href: "/dashboard/admin", label: "Admin", badge: null },

  {
    href: "/dashboard/settings",
    label: ui.nav.configuracion,
    badge: null,
  },
];

function badgeClasses(badge?: string | null) {
  if (badge === "PRO") {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (badge === "IA") {
    return "border-violet-200 bg-violet-100 text-violet-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

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

export default function SidebarNav() {
  const pathname = usePathname();

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
          {items.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex min-w-0 items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 transition-all ${
                  active
                    ? "border-blue-100 bg-gradient-to-r from-blue-50 to-white shadow-sm"
                    : "border-transparent hover:border-slate-200 hover:bg-white"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
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
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {item.premium && (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Premium
                    </span>
                  )}

                  {item.badge && (
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${badgeClasses(
                        item.badge
                      )}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-100 px-4 py-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Sistema operativo
          </p>

          <p className="mt-2 text-sm font-black text-slate-950">
            ClienteYA Executive
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            CRM + automatización + inteligencia ejecutiva.
          </p>
        </div>
      </div>
    </div>
  );
}