import { redirect } from "next/navigation";
import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";
import { buildWhatsAppLink } from "../../../lib/whatsapp-link";
import PageHeader from "../components/PageHeader";
import { applyAutomationRules } from "../../../lib/automation-engine";

export const dynamic = "force-dynamic";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  estado?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
};

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  const parts = date.split("-");
  if (parts.length !== 3) return date;

  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

export default async function AutomationsPage() {
  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("clientes")
    .select("id,nombre,telefono,estado,recordatorio,proximo_contacto")
    .eq("user_id", user.id)
    .order("proximo_contacto", { ascending: true });

  if (error) {
    console.error("Error loading automations:", error.message);
  }

  // 🔥 Automation rules toegepast
  const clientes = applyAutomationRules((data ?? []) as Cliente[]);

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-6 py-10">
            <div className="mx-auto max-w-5xl">
              <PageHeader
                title="Automations"
                description="Follow-ups programados para clientes con próximo contacto."
              />

              {clientes.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                  No hay automatizaciones todavía.
                </div>
              ) : (
                <div className="space-y-4">
                  {clientes.map((cliente) => {
                    const message =
                      cliente.recordatorio ||
                      `Hola ${cliente.nombre}, te escribo para hacer seguimiento 👋`;

                    const link = buildWhatsAppLink(
                      cliente.telefono,
                      message
                    );

                    return (
                      <div
                        key={cliente.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-slate-900">
                              {cliente.nombre}
                            </p>

                            <p className="text-sm text-slate-500">
                              {cliente.telefono}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Próximo contacto:{" "}
                              {formatDate(cliente.proximo_contacto)}
                            </p>

                            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                              {message}
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                            >
                              Quick send
                            </a>

                            <a
                              href={`/dashboard/whatsapp?id=${cliente.id}`}
                              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Editor
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}