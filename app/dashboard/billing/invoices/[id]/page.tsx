import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../../../lib/supabase/auth-server";
import { AppHeader } from "../../../../components/AppHeader";
import SidebarNav from "../../../SidebarNav";
import PrintReportButton from "../../../../components/PrintReportButton";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-PY").format(new Date(value));
}

function getPlanLabel(value?: string | null) {
  if (value === "pro") return "Profesional";
  if (value === "enterprise") return "Corporativo";

  return "—";
}

function getBillingCycleLabel(value?: string | null) {
  if (value === "monthly") return "Mensual";
  if (value === "yearly") return "Anual";

  return "—";
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) redirect("/dashboard/billing");

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-black text-slate-950">
                    Factura
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Documento de pago ClienteYA
                  </p>
                </div>

                <PrintReportButton />
              </div>

              <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">
                  {invoice.invoice_number}
                </h2>

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Fecha: {formatDate(invoice.invoice_date)}
                </p>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Empresa
                    </p>

                    <p className="mt-2 font-black text-slate-950">
                      {invoice.business_name || "—"}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      RUC: {invoice.ruc || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Dirección
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {invoice.address || "—"}
                    </p>

                    <p className="text-sm font-semibold text-slate-700">
                      {invoice.city || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Plan
                    </p>

                    <p className="mt-2 font-black text-slate-950">
                      {getPlanLabel(invoice.plan_type)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Período
                    </p>

                    <p className="mt-2 font-black text-slate-950">
                      {getBillingCycleLabel(invoice.billing_cycle)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-3xl bg-slate-50 p-6">
                  <p className="text-xs font-black uppercase text-slate-400">
                    Total
                  </p>

                  <p className="mt-2 text-3xl font-black text-blue-700">
                    {invoice.currency} {invoice.amount}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}