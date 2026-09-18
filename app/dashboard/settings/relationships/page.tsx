import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "../../../components/AppHeader";
import { RelationshipSourcesCard } from "../../../components/settings/RelationshipSourcesCard";
import MobileDashboardNav from "../../MobileDashboardNav";
import SidebarNav from "../../SidebarNav";

import { createAuthServerClient } from "../../../../lib/supabase/auth-server";

export const dynamic = "force-dynamic";

export default async function RelationshipSettingsPage() {
  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="min-w-0 flex-1 px-4 pb-40 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
            <div className="mx-auto w-full max-w-[1180px]">
              <div className="mb-6 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                <div className="bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 sm:p-8">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                          Configuración
                        </span>

                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                          Relaciones
                        </span>
                      </div>

                      <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                        Importar relaciones
                      </h1>

                      <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                        Añade relaciones desde tus herramientas y archivos sin salir de ClienteYA.
                      </p>
                    </div>

                    <Link
                      href="/dashboard/settings"
                      className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                    >
                      Volver a configuración
                    </Link>
                  </div>
                </div>
              </div>

              <RelationshipSourcesCard />
            </div>
          </div>
        </div>
      </main>

      <div className="lg:hidden">
        <MobileDashboardNav />
      </div>
    </div>
  );
}