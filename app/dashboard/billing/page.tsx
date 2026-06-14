import Link from "next/link";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { AppHeader } from "../../components/AppHeader";
import BancardCheckoutButton from "../../components/BancardCheckoutButton";

import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";
import SectionCard from "../../components/SectionCard";

import {
  getAccessBadge,
  isTrialExpired,
  type ProfileAccess,
} from "../../../lib/access-control";

export const dynamic = "force-dynamic";

type ProfileRow = ProfileAccess & {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

type PaymentPlan = "starter" | "pro";

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
    Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function getSpanishPlanLabel(plan?: string | null) {
  if (plan === "starter") return "Básico";
  if (plan === "pro") return "Profesional";
  if (plan === "enterprise") return "Corporativo";

  return "Sin plan";
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

      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  subtitle,
  features,
  highlight,
  current,
  paymentPlan,
}: {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  highlight?: boolean;
  current?: boolean;
  paymentPlan?: PaymentPlan;
}) {
  return (
    <div
      className={`flex h-full min-w-0 flex-col rounded-[30px] border p-6 shadow-sm transition ${
        highlight
          ? "border-blue-300 bg-gradient-to-br from-blue-50 to-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>

          <p className="mt-4 whitespace-nowrap text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
            {price}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {subtitle}
          </p>
        </div>

        {current && (
          <div className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Actual
          </div>
        )}
      </div>

      <div className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <div
            key={feature}
            className="flex items-start gap-3 text-sm leading-5 text-slate-700"
          >
            <span className="mt-0.5 text-emerald-600">✓</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-7">
        {paymentPlan ? (
          <BancardCheckoutButton
            plan={paymentPlan}
            label={current ? "Renovar con Bancard" : "Pagar con Bancard"}
          />
        ) : (
          <button className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50">
            Contactar
          </button>
        )}
      </div>
    </div>
  );
}

export default async function BillingPage() {
  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const currentProfile = profile as ProfileRow | null;

  const planLabel = getSpanishPlanLabel(currentProfile?.plan_type);
  const accessBadge = getAccessBadge(currentProfile || {});
  const trialExpired = isTrialExpired(currentProfile || {});
  const trialDaysRemaining = getDaysRemaining(currentProfile?.trial_ends_at);

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl space-y-6">
              <PageHeader
                title="Suscripción y pagos"
                description="Gestiona tu plan, estado de acceso y opciones de pago automático."
                badge="ClienteYA SaaS"
              />

              <SectionCard
                badge="Estado actual"
                title="Suscripción actual"
                description="Control central de acceso, plan y activación de tu cuenta ClienteYA."
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatusCard
                    label="Plan"
                    value={planLabel}
                    description="Plan comercial asignado a tu cuenta."
                  />

                  <StatusCard
                    label="Estado"
                    value={accessBadge}
                    description="Estado actual de acceso a la plataforma."
                  />

                  <StatusCard
                    label="Prueba"
                    value={
                      trialExpired ? "Finalizada" : `${trialDaysRemaining} días`
                    }
                    description="Días restantes del período de prueba."
                  />

                  <StatusCard
                    label="Vencimiento"
                    value={formatDate(currentProfile?.subscription_ends_at)}
                    description="Fecha de vencimiento de la suscripción."
                  />
                </div>

                <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold leading-relaxed text-blue-900">
                  ClienteYA usará Bancard para pagos online, activación
                  automática, control de planes y gestión SaaS empresarial.
                </div>
              </SectionCard>

              <div className="grid gap-5 xl:grid-cols-3">
                <PlanCard
                  title="Básico"
                  price="Gs. 75.000"
                  subtitle="mensual"
                  paymentPlan="starter"
                  current={currentProfile?.plan_type === "starter"}
                  features={[
                    "CRM comercial",
                    "Clientes y calendario",
                    "Acciones rápidas por WhatsApp",
                    "Seguimientos básicos",
                    "Automatizaciones iniciales",
                  ]}
                />

                <PlanCard
                  title="Profesional"
                  price="Gs. 125.000"
                  subtitle="mensual"
                  highlight
                  paymentPlan="pro"
                  current={currentProfile?.plan_type === "pro"}
                  features={[
                    "Centro estratégico AI",
                    "Resumen ejecutivo inteligente",
                    "Inteligencia de timeline",
                    "Proyección de ingresos",
                    "Temperatura comercial de clientes",
                    "Cola inteligente de trabajo",
                    "Automatizaciones avanzadas",
                  ]}
                />

                <PlanCard
                  title="Corporativo"
                  price="A medida"
                  subtitle="para equipos y multi-sucursal"
                  current={currentProfile?.plan_type === "enterprise"}
                  features={[
                    "Multi sucursal",
                    "Cuentas de equipo",
                    "Inteligencia operativa",
                    "Dashboards de expansión",
                    "Sistema ejecutivo fundador",
                    "Analítica corporativa",
                    "Infraestructura avanzada",
                  ]}
                />
              </div>

              <SectionCard
                badge="Pago automático"
                title="Bancard Paraguay"
                description="Los pagos con tarjeta activarán la cuenta automáticamente después de la confirmación."
              >
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="min-w-0 rounded-[28px] border border-blue-200 bg-blue-50 p-6 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                      Pago con Bancard
                    </p>

                    <p className="mt-4 text-sm leading-relaxed text-blue-900">
                      ClienteYA conectará con Bancard para aceptar Visa,
                      Mastercard, débito, crédito y QR. Al aprobarse el pago,
                      la cuenta se activará automáticamente.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {["Visa", "Mastercard", "Débito", "Crédito", "QR"].map(
                        (item) => (
                          <div
                            key={item}
                            className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-black text-blue-700 shadow-sm"
                          >
                            {item}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                      Activación automática
                    </p>

                    <p className="mt-4 text-sm leading-relaxed text-emerald-900">
                      Cuando Bancard confirme el pago, ClienteYA actualizará el
                      perfil del usuario a activo y desbloqueará el acceso según
                      el plan seleccionado.
                    </p>

                    <div className="mt-6 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-xs font-black text-emerald-700 shadow-sm">
                      Pago aprobado → cuenta activa → acceso desbloqueado
                    </div>
                  </div>
                </div>
              </SectionCard>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
                La transferencia bancaria queda fuera del flujo principal para
                evitar activaciones manuales. Bancard será el método principal
                de activación automática.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}