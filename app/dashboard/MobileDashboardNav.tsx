import Link from "next/link";

import { ui } from "../../lib/ui";

const mobileItems = [
  {
    href: "/dashboard",
    label: ui.nav.dashboard,
    shortLabel: "Resumen",
    icon: "🏠",
  },
  {
    href: "/dashboard/clientes",
    label: ui.nav.clientes,
    shortLabel: "Clientes",
    icon: "👥",
  },
  {
    href: "/dashboard/nuevo",
    label: ui.nav.nuevoCliente,
    shortLabel: "Nuevo",
    icon: "➕",
  },
  {
    href: "/dashboard/calendario",
    label: ui.nav.calendario,
    shortLabel: "Agenda",
    icon: "📅",
  },
  {
    href: "/dashboard/cockpit",
    label: ui.nav.cockpit,
    shortLabel: "Cockpit",
    icon: "✨",
  },
];

export default function MobileDashboardNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto grid w-full max-w-md grid-cols-5 gap-1 overflow-hidden">
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            className={`${ui.mobile.touch} flex min-w-0 flex-col items-center justify-center rounded-2xl px-1.5 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 active:scale-[0.98]`}
          >
            <span className="text-base leading-none">{item.icon}</span>

            <span className="mt-1 w-full truncate text-center leading-none">
              {item.shortLabel}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}