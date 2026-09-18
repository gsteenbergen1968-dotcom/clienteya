"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type MobileActionBarProps = {
  limitedAccess?: boolean;
};

const items: NavItem[] = [
  {
    href: "/dashboard",
    label: "Resumen",
    icon: "🏠",
  },
  {
    href: "/dashboard/planning",
    label: "Plan",
    icon: "📅",
  },
  {
    href: "/dashboard/relationships",
    label: "Relaciones",
    icon: "👥",
  },
  {
    href: "/dashboard/cockpit",
    label: "Cockpit",
    icon: "✨",
  },
  {
    href: "/dashboard/settings",
    label: "Config.",
    icon: "⚙️",
  },
];

const limitedAccessItems: NavItem[] = [
  {
    href: "/dashboard/billing",
    label: "Suscripción",
    icon: "💳",
  },
];

export default function MobileActionBar({
  limitedAccess = false,
}: MobileActionBarProps) {
  const pathname = usePathname();

  const visibleItems =
    limitedAccess
      ? limitedAccessItems
      : items;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div
        className={`mx-auto flex max-w-xl items-center gap-1 ${
          limitedAccess
            ? "justify-center"
            : "justify-between"
        }`}
      >
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (
              item.href !== "/dashboard" &&
              pathname.startsWith(item.href)
            );

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={`flex min-w-[64px] flex-col items-center justify-center rounded-2xl px-3 py-2 text-center transition ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-lg">
                {item.icon}
              </span>

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