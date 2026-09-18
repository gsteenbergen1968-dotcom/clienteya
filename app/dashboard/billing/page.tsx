import Link from "next/link";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import {
  getAccessBadge,
  hasPlatformAccess,
  isTrialExpired,
  type ProfileAccess,
} from "../../../lib/access-control";

import { AppHeader } from "../../components/AppHeader";
import BancardCheckoutButton from "../../components/BancardCheckoutButton";
import SectionCard from "../../components/SectionCard";

import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";

export const dynamic = "force-dynamic";

type ProfileRow = ProfileAccess & {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

type BillingCycle = "monthly" | "yearly";

function formatDate(value?: string | null) {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function getDaysRemaining(date?: string | null) {
  if (!date) return 0;

  const today = new Date();
  const target = new Date(date);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.ceil(
      (target.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
}

function getSpanishPlanLabel(plan?: string | null) {
  if (plan === "enterprise") return "Corporativo";
  if (plan === "pro") return "Profesional";

  return "Sin plan";
}

function getSpanishAccessLabel(accessBadge: string) {
  const normalized = accessBadge.trim().toLowerCase();

  if (normalized === "founder mode") return "Modo Founder";
  if (normalized === "active") return "Activo";
  if (normalized === "inactive") return "Inactivo";
  if (normalized === "trial") return "Prueba";
  if (normalized === "expired") return "Vencido";
  if (normalized === "blocked") return "Bloqueado";

  return accessBadge;
}

function StatusCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-xl font-black leading-tight text-slate-950 sm:text-2xl">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function BillingOptionCard({
  title,
  price,
  period,
  saving,
  label,
  billingCycle,
}: {
  title: string;
  price: string;
  period: string;
  saving?: string;
  label: string;
  billingCycle: BillingCycle;
}) {
  return (
    <div className="flex h-full flex-col rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
          {title}
        </p>

        <p className="mt-3 text-2xl font-black leading-tight text-slate-950">
          {price}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          {period}
        </p>

        {saving ? (
          <div className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            {saving}
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <BancardCheckoutButton
          plan="pro"
          billingCycle={billingCycle}
          label={label}
        />
      </div>
    </div>
  );
}

function ProfessionalPlanCard({
  current,
}: {
  current: boolean;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-[30px] border border-blue-300 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
            Profesional
          </p>

          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Elige el período que mejor encaja con tu negocio.
          </p>
        </div>

        {current && (
          <div className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Actual
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <BillingOptionCard
          title="Mensual"
          price="Gs. 200.000"
          period="por mes"
          billingCycle="monthly"
          label={
            current
              ? "Renovar mensual"
              : "Activar mensual"
          }
        />

        <BillingOptionCard
          title="Anual"
          price="Gs. 2.000.000"
          period="por año"
          saving="Ahorra Gs. 400.000"
          billingCycle="yearly"
          label={
            current
              ? "Renovar anual"
              : "Activar anual"
          }
        />
      </div>

      <div className="mt-6 flex-1 space-y-3">
        {[
          "Centro estratégico con inteligencia ejecutiva",
          "Resumen ejecutivo del negocio",
          "Inteligencia de relaciones",
          "Proyección de ingresos",
          "Temperatura comercial",
          "Cola inteligente de trabajo",
          "Automatizaciones avanzadas",
        ].map((feature) => (
          <div
            key={feature}
            className="flex items-start gap-3 text-sm leading-5 text-slate-700"
          >
            <span className="mt-0.5 text-emerald-600">✓</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-white/80 px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
          Renovación automática
        </p>

        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          La suscripción se renueva automáticamente según el período elegido
          hasta su cancelación. El plan mensual se renueva cada mes y el plan
          anual cada 12 meses.
        </p>

        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          La cancelación detiene futuras renovaciones y no afecta el período ya
          pagado.
        </p>
      </div>
    </div>
  );
}

function CorporatePlanCard({
  current,
}: {
  current: boolean;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Corporativo
          </p>

          <p className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
            A medida
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            contratación anual
          </p>
        </div>

        {current && (
          <div className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Actual
          </div>
        )}
      </div>

      <div className="mt-6 flex-1 space-y-3">
        {[
          "Gestión de múltiples sucursales",
          "Cuentas de equipo",
          "Inteligencia operativa",
          "Visión ejecutiva de expansión",
          "Analítica corporativa",
          "Infraestructura avanzada",
        ].map((feature) => (
          <div
            key={feature}
            className="flex items-start gap-3 text-sm leading-5 text-slate-700"
          >
            <span className="mt-0.5 text-slate-400">✓</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
        <p className="text-sm font-black text-slate-700">
          Contratación personalizada
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          El plan Corporativo se configura según el equipo, la cantidad de
          sucursales y las necesidades de la organización.
        </p>
      </div>
    </div>
  );
}

export default async function BillingPage() {
  const supabase =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

  const currentProfile =
    profile as ProfileRow | null;

  const { data: invoices } =
    await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  const userInvoices =
    invoices ?? [];

  const planLabel =
    getSpanishPlanLabel(
      currentProfile?.plan_type,
    );

  const accessBadge =
    getSpanishAccessLabel(
      getAccessBadge(
        currentProfile || {},
      ),
    );

  const access =
    hasPlatformAccess(
      currentProfile || {},
    );

  const limitedAccess =
    !access.allowed;

  const trialExpired =
    isTrialExpired(
      currentProfile || {},
    );

  const trialDaysRemaining =
    getDaysRemaining(
      currentProfile?.trial_ends_at,
    );

  const hasProfessionalPlan =
    access.allowed &&
    currentProfile?.plan_type === "pro";

  const hasCorporatePlan =
    access.allowed &&
    currentProfile?.plan_type ===
      "enterprise";

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav
              limitedAccess={limitedAccess}
            />
          </aside>

          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl space-y-6">
              <PageHeader
                title="Suscripción"
                description="Gestiona tu acceso a ClienteYA y el estado de tu plan."
              />

              <SectionCard
                title="Estado de la suscripción"
                description="Información actual de tu acceso y activación."
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatusCard
                    label="Plan"
                    value={planLabel}
                    description="Plan asignado a tu cuenta."
                  />

                  <StatusCard
                    label="Acceso"
                    value={accessBadge}
                    description="Estado actual de acceso a ClienteYA."
                  />

                  <StatusCard
                    label="Prueba"
                    value={
                      trialExpired
                        ? "Finalizada"
                        : `${trialDaysRemaining} días`
                    }
                    description="Estado del período de prueba."
                  />

                  <StatusCard
                    label="Vencimiento"
                    value={formatDate(
                      currentProfile?.subscription_ends_at,
                    )}
                    description="Próxima fecha de vencimiento."
                  />
                </div>

                <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold leading-relaxed text-blue-900">
                  Los pagos confirmados por Bancard activarán o renovarán el
                  acceso automáticamente cuando la integración de pagos esté
                  habilitada.
                </div>
              </SectionCard>

              <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                <ProfessionalPlanCard
                  current={hasProfessionalPlan}
                />

                <CorporatePlanCard
                  current={hasCorporatePlan}
                />
              </div>

              <SectionCard
                title="Pago con Bancard"
                description="La activación automática quedará disponible cuando Bancard esté habilitado para ClienteYA."
              >
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="min-w-0 rounded-[28px] border border-blue-200 bg-blue-50 p-6 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                      Pago seguro
                    </p>

                    <p className="mt-4 text-sm leading-relaxed text-blue-900">
                      Bancard permitirá pagar con tarjeta de crédito, tarjeta de
                      débito y los medios habilitados en Paraguay.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {[
                        "Crédito",
                        "Débito",
                        "Bancard",
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-black text-blue-700 shadow-sm"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                      Activación automática
                    </p>

                    <p className="mt-4 text-sm leading-relaxed text-emerald-900">
                      Cuando Bancard confirme el pago, ClienteYA actualizará el
                      estado de la cuenta y habilitará el acceso correspondiente.
                    </p>

                    <div className="mt-6 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-xs font-black text-emerald-700 shadow-sm">
                      Pago confirmado → cuenta activa → acceso habilitado
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Facturas"
                description="Historial de pagos y documentos disponibles."
              >
                {userInvoices.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-600">
                    No hay facturas disponibles.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {userInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-black text-slate-950">
                            {invoice.invoice_number}
                          </p>

                          <p className="text-sm font-semibold text-slate-600">
                            {invoice.currency}{" "}
                            {invoice.amount}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-slate-500">
                            {invoice.status}
                          </p>

                          <Link
                            href={`/dashboard/billing/invoices/${invoice.id}`}
                            className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                          >
                            Ver factura
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}