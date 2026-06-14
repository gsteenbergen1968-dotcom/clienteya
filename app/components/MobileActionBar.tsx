"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const items: NavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: "🏠",
  },

  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: "👥",
  },

  {
    href: "/dashboard/automations",
    label: "AI",
    icon: "🤖",
  },

  {
    href: "/dashboard/whatsapp",
    label: "WhatsApp",
    icon: "💬",
  },

  {
    href: "/dashboard/nuevo",
    label: "Nuevo",
    icon: "➕",
  },
];

export default function MobileActionBar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[64px] flex-col items-center justify-center rounded-2xl px-3 py-2 text-center transition ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>

              <span className="mt-1 text-[11px] font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}