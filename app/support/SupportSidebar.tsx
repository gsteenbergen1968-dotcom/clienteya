import Link from "next/link";

import { BrandMark } from "../components/BrandMark";

import { requireSipAccess } from "../../lib/sip-auth";

import type {
  SupportPermission,
} from "./models";

type NavigationItem = {
  href: string;
  label: string;
  permission: SupportPermission;
};

const navigation: NavigationItem[] = [
  {
    href: "/support",
    label: "SIP Cockpit",
    permission: "view_dashboard",
  },
  {
    href: "/support/inbox",
    label: "Inbox",
    permission: "view_conversations",
  },
  {
    href: "/support/conversations",
    label: "Conversations",
    permission: "view_conversations",
  },
  {
    href: "/support/knowledge",
    label: "Knowledge",
    permission: "manage_knowledge",
  },
  {
    href: "/support/escalations",
    label: "Escalations",
    permission: "assign_conversations",
  },
  {
    href: "/support/learning",
    label: "Learning",
    permission: "manage_knowledge",
  },
  {
    href: "/support/analytics",
    label: "Analytics",
    permission: "view_analytics",
  },
  {
    href: "/support/settings",
    label: "Settings",
    permission: "manage_settings",
  },
];

export default async function SupportSidebar() {
  const context =
    await requireSipAccess();

  const visibleNavigation =
    navigation.filter(
      (item) =>
        context.permissions.includes(
          item.permission,
        ),
    );

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-6">
        <BrandMark showTagline={false} />

        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
          SIP
        </h1>

        <p className="mt-2 text-sm font-semibold text-slate-600">
          Support Intelligence Platform
        </p>

        <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
          {context.role.replaceAll("_", " ")}
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-2xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}