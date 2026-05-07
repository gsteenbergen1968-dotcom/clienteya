import Link from "next/link";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { createAdminClient } from "../../lib/supabase/server";

function ParaguayBadge() {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1/3 bg-red-500" />
      <div className="absolute inset-x-0 top-1/3 h-1/3 bg-white" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-blue-600" />
      <span className="relative z-10 text-[11px] font-bold text-slate-900">
        PY
      </span>
    </div>
  );
}

const navItems = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/nuevo", label: "+ Nuevo cliente" },
  { href: "/dashboard/calendario", label: "Calendario" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/automations", label: "Automations" },
  { href: "/billing", label: "Activar plan" },
  { href: "/dashboard/admin", label: "Admin" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function SidebarNav() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const { data: settings } = await admin
    .from("user_settings")
    .select("brand_name")
    .eq("user_id", user?.id || "")
    .maybeSingle();

  const displayName =
    settings?.brand_name?.trim() || "ClienteYA";

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <ParaguayBadge />

          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold tracking-tight text-slate-950">
              {displayName}
            </p>
            <p className="mt-1 text-sm text-slate-500">Hecho para Paraguay</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}