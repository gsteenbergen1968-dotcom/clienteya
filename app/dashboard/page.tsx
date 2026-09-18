import Link from "next/link";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../lib/supabase/auth-server";

import { AppHeader } from "../components/AppHeader";
import EmptyState from "../components/EmptyState";
import KpiCard from "../components/KpiCard";
import SectionCard from "../components/SectionCard";
import UpgradeTriggerCard from "../components/UpgradeTriggerCard";
import SidebarNav from "./SidebarNav";

import {
  canAccessAICockpit,
  hasPlatformAccess,
  type ProfileAccess,
} from "../../lib/access-control";

import {
  getBusinessTypeLabel,
  normalizeBusinessType,
} from "../../lib/sector-intelligence";

import {
  buildSectorKpiIntelligence,
  type SectorKpiIntelligenceResult,
} from "../../lib/sector-kpi-intelligence";

import {
  buildDashboardCommercialPriorities,
  type DashboardTodayPriority,
} from "../../lib/dashboard-commercial-adapter";

import type { RelationshipRecord } from "../../lib/relationship-repository";

export const dynamic = "force-dynamic";

type Profile = ProfileAccess & {
  id: string;
  email?: string | null;
  full_name?: string | null;
  created_at?: string | null;
};

type BusinessSettings = {
  user_id?: string | null;
  company_name?: string | null;
  business_name?: string | null;
  name?: string | null;
  business_type?: string | null;
  business_sector?: string | null;
  sector?: string | null;
  industry?: string | null;
  rubro?: string | null;
  category?: string | null;
  business_tone?: string | null;
  tone?: string | null;
  business_email?: string | null;
  business_phone?: string | null;
  whatsapp_number?: string | null;
  country_label?: string | null;
  city?: string | null;
  ai_prompt?: string | null;
};

type PriorityTone =
  | "red"
  | "amber"
  | "emerald"
  | "sky"
  | "slate";

const primaryActionButtonClass =
  "inline-flex items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800";

const secondaryActionButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50";

function normalizeText(
  value: string | null | undefined,
) {
  return (value || "")
    .toLowerCase()
    .trim();
}

function todayISO() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function formatDate(
  value: string | null | undefined,
) {
  if (!value) return "—";

  const [
    year,
    month,
    day,
  ] = value
    .slice(0, 10)
    .split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatGs(
  value: number | null | undefined,
) {
  return `Gs.\u00A0${Number(
    value || 0,
  ).toLocaleString("es-PY")}`;
}

function getBadgeClasses(
  tone: PriorityTone,
) {
  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "sky") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusClasses(
  status: string | null | undefined,
) {
  const value =
    normalizeText(status);

  if (
    value.includes("pag")
  ) {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (
    value.includes("interes")
  ) {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }

  if (
    value.includes("sin")
  ) {
    return "border-orange-200 bg-orange-100 text-orange-700";
  }

  if (
    value.includes("contact")
  ) {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (
    value.includes("cerr")
  ) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getGreetingName(
  profile: Profile | null,
  email?: string | null,
) {
  const fullName =
    profile?.full_name?.trim();

  if (fullName) {
    return fullName.split(" ")[0];
  }

  const emailName =
    email?.split("@")[0];

  return emailName || "Founder";
}

function getCompanyName(
  businessSettings: BusinessSettings | null,
  profile: Profile | null,
  email?: string | null,
) {
  const companyName =
    businessSettings?.company_name?.trim();

  const businessName =
    businessSettings?.business_name?.trim();

  const name =
    businessSettings?.name?.trim();

  return (
    companyName ||
    businessName ||
    name ||
    getGreetingName(
      profile,
      email,
    )
  );
}

function getConfiguredSectorValue(
  businessSettings: BusinessSettings | null,
) {
  return (
    businessSettings?.business_type ||
    businessSettings?.business_sector ||
    businessSettings?.sector ||
    businessSettings?.industry ||
    businessSettings?.rubro ||
    businessSettings?.category ||
    "general"
  );
}

function getDashboardIntro(
  businessType: string,
) {
  const normalized =
    normalizeBusinessType(
      businessType,
    );

  const sectorLabel =
    getBusinessTypeLabel(
      normalized,
    );

  if (
    normalized ===
    "restaurant"
  ) {
    return {
      sectorLabel,
      title:
        "Relaciones que pueden volver hoy",
      description:
        "ClienteYA detecta relaciones ausentes, reservas pendientes y oportunidades de nueva visita.",
    };
  }

  if (
    normalized ===
    "real_estate"
  ) {
    return {
      sectorLabel,
      title:
        "Interesados que necesitan seguimiento",
      description:
        "ClienteYA detecta visitas pendientes, interesados activos y oportunidades que pueden enfriarse.",
    };
  }

  if (
    normalized ===
    "fitness"
  ) {
    return {
      sectorLabel,
      title:
        "Miembros que necesitan atención",
      description:
        "ClienteYA detecta miembros inactivos, renovaciones pendientes y riesgo de cancelación.",
    };
  }

  if (
    normalized ===
    "retail"
  ) {
    return {
      sectorLabel,
      title:
        "Relaciones con recompra probable",
      description:
        "ClienteYA detecta relaciones sin retorno, ventas abiertas y oportunidades de recompra.",
    };
  }

  if (
    normalized ===
    "beauty"
  ) {
    return {
      sectorLabel,
      title:
        "Relaciones que pueden volver a reservar",
      description:
        "ClienteYA detecta citas pendientes, relaciones sin retorno y oportunidades de nueva reserva.",
    };
  }

  if (
    normalized ===
    "automotive"
  ) {
    return {
      sectorLabel,
      title:
        "Relaciones con interés por convertir",
      description:
        "ClienteYA detecta cotizaciones pendientes, interés enfriándose y oportunidades de venta.",
    };
  }

  if (
    normalized ===
    "medical"
  ) {
    return {
      sectorLabel,
      title:
        "Pacientes que necesitan seguimiento",
      description:
        "ClienteYA detecta consultas por confirmar, seguimiento pendiente y continuidad en riesgo.",
    };
  }

  if (
    normalized ===
    "education"
  ) {
    return {
      sectorLabel,
      title:
        "Alumnos que necesitan orientación",
      description:
        "ClienteYA detecta inscripciones pendientes, interés por perder y oportunidades académicas.",
    };
  }

  return {
    sectorLabel,
    title:
      "Relaciones que necesitan atención",
    description:
      "ClienteYA ya preparó las prioridades que requieren tu atención.",
  };
}

function AccessNotice({
  accessState,
  trialEndsAt,
}: {
  accessState: string;
  trialEndsAt?: string | null;
}) {
  if (
    accessState === "active"
  ) {
    return null;
  }

  if (
    accessState === "trial"
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm">
        🟠 Prueba activa hasta{" "}
        {formatDate(
          trialEndsAt,
        )}
        .
      </div>
    );
  }

  if (
    accessState === "pending"
  ) {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 shadow-sm">
        🔎 Pago en revisión.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-sm">
      ⛔ Tu acceso está pausado.
    </div>
  );
}

function FounderTodayHero({
  name,
  priorityCount,
  introTitle,
  introDescription,
}: {
  name: string;
  priorityCount: number;
  introTitle: string;
  introDescription: string;
}) {
  return (
    <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Buenos días {name}
            </h1>

            <p className="mt-4 text-base font-black leading-7 text-blue-700 sm:text-lg">
              {priorityCount === 0
                ? "Todo está bajo control."
                : `${introTitle}: ${priorityCount}`}
            </p>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
              {introDescription}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
            <Link
              href="/dashboard/relationships"
              className={
                primaryActionButtonClass
              }
            >
              Ver relaciones
            </Link>

            <Link
              href="/dashboard/cockpit"
              className={
                secondaryActionButtonClass
              }
            >
              Abrir Cockpit
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FounderPriorityCard({
  priority,
  index,
}: {
  priority: DashboardTodayPriority;
  index: number;
}) {
  const isExternal =
    priority.actionHref.startsWith(
      "https://",
    );

  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_44px_rgba(15,23,42,0.06)]">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                #{index + 1}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getBadgeClasses(
                  priority.tone,
                )}`}
              >
                {priority.sectorHeadline}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusClasses(
                  priority.status,
                )}`}
              >
                {priority.status}
              </span>

              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">
                COS{" "}
                {priority.commercialScore}
                /100
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {priority.name}
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-black leading-6 text-blue-700">
              {priority.sectorActionPhrase}
            </p>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              {priority.sectorReason}
            </p>

            {priority.amount > 0 ? (
              <p className="mt-2 text-sm font-black text-emerald-700">
                {formatGs(
                  priority.amount,
                )}{" "}
                potencial
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 sm:min-w-[240px]">
            <a
              href={
                priority.actionHref
              }
              target={
                isExternal
                  ? "_blank"
                  : undefined
              }
              rel={
                isExternal
                  ? "noreferrer"
                  : undefined
              }
              className={
                primaryActionButtonClass
              }
            >
              {priority.actionLabel} →
            </a>

            <Link
              href={`/dashboard/relationships/${priority.id}`}
              className={
                secondaryActionButtonClass
              }
            >
              Ver detalle
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FounderTodaySection({
  priorities,
}: {
  priorities: DashboardTodayPriority[];
}) {
  return (
    <SectionCard
      badge="Hoy"
      title="Prioridades de hoy"
      description="ClienteYA muestra únicamente las acciones que requieren atención ahora."
    >
      {priorities.length === 0 ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold leading-6 text-emerald-800">
          ✅ No hay prioridades críticas ahora.
          Mantén el ritmo y añade nuevas relaciones
          cuando sea necesario.
        </div>
      ) : (
        <div className="grid gap-3">
          {priorities.map(
            (
              priority,
              index,
            ) => (
              <FounderPriorityCard
                key={priority.id}
                priority={
                  priority
                }
                index={index}
              />
            ),
          )}
        </div>
      )}
    </SectionCard>
  );
}

function CompactFounderActions({
  intelligence,
}: {
  intelligence: SectorKpiIntelligenceResult;
}) {
  return (
    <SectionCard
      badge="Señales clave"
      title={
        intelligence.dashboardTitle
      }
      description={
        intelligence.dashboardDescription
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {intelligence.metrics.map(
          (metric) => (
            <KpiCard
              key={metric.key}
              label={metric.label}
              value={
                metric.formattedValue
              }
              tone={
                metric.tone ===
                "slate"
                  ? "sky"
                  : metric.tone
              }
            />
          ),
        )}
      </div>
    </SectionCard>
  );
}

export default async function DashboardPage() {
  const authSupabase =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    {
      data:
        profileData,
    },
    {
      data:
        businessSettingsData,
    },
    {
      data:
        relationshipsData,
    },
  ] =
    await Promise.all([
      authSupabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          user.id,
        )
        .maybeSingle(),

      authSupabase
        .from(
          "business_settings",
        )
        .select("*")
        .eq(
          "user_id",
          user.id,
        )
        .maybeSingle(),

      authSupabase
        .from(
          "relationships",
        )
        .select("*")
        .eq(
          "owner_id",
          user.id,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        ),
    ]);

  const profile =
    (
      profileData ||
      null
    ) as Profile | null;

  const businessSettings =
    (
      businessSettingsData ||
      null
    ) as BusinessSettings | null;

  const relationships =
    (
      relationshipsData ||
      []
    ) as RelationshipRecord[];

  const profileAccess = {
    ...(profile || {}),

    email:
      profile?.email ||
      user.email ||
      null,
  } as ProfileAccess;

  const platformAccess =
    hasPlatformAccess(
      profileAccess,
    );

  const cockpitAccess =
    canAccessAICockpit(
      profileAccess,
    );

  const hasAccess =
    platformAccess.allowed;

  const hasCockpitAccess =
    cockpitAccess.allowed;

  const accessState =
    platformAccess.reason ===
    "founder_mode"
      ? "active"
      : profile?.subscription_status ===
          "pending"
        ? "pending"
        : platformAccess.reason ===
            "active"
          ? "active"
          : platformAccess.reason ===
              "trial"
            ? "trial"
            : "inactive";

  const today =
    todayISO();

  const greetingName =
    getCompanyName(
      businessSettings,
      profile,
      user.email ||
        null,
    );

  const configuredSectorValue =
    getConfiguredSectorValue(
      businessSettings,
    );

  const businessType =
    normalizeBusinessType(
      configuredSectorValue,
    );

  const dashboardIntro =
    getDashboardIntro(
      businessType,
    );

  const sectorKpiIntelligence =
    buildSectorKpiIntelligence({
      relationships:
        relationships as Parameters<
          typeof buildSectorKpiIntelligence
        >[0]["relationships"],

      businessType,
      today,
    });

  const priorities =
    buildDashboardCommercialPriorities({
      relationships,
      businessType,
      businessSettings,

      companyName:
        greetingName,

      limit:
        3,
    });

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen w-full bg-slate-50/60">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="min-w-0 flex-1 px-4 pb-36 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-7">
            <div className="mx-auto w-full max-w-[1180px]">
              <div className="space-y-5">
                <FounderTodayHero
                  name={
                    greetingName
                  }
                  priorityCount={
                    priorities.length
                  }
                  introTitle={
                    dashboardIntro.title
                  }
                  introDescription={
                    dashboardIntro.description
                  }
                />

                <AccessNotice
                  accessState={
                    accessState
                  }
                  trialEndsAt={
                    profile?.trial_ends_at ||
                    null
                  }
                />

                {!hasAccess ? (
                  <EmptyState
                    icon="⛔"
                    title="Acceso limitado"
                    description="Activa tu plan desde la sección de billing."
                    actionHref="/dashboard/billing"
                    actionLabel="Gestionar suscripción"
                  />
                ) : null}

                {hasAccess &&
                relationships.length ===
                  0 ? (
                  <EmptyState
                    icon="🚀"
                    title="Bienvenido a ClienteYA"
                    description="Crea tu primera relación para empezar a construir memoria, contexto y seguimiento."
                    actionHref="/dashboard/new"
                    actionLabel="+ Nueva relación"
                  />
                ) : null}

                {hasAccess &&
                relationships.length >
                  0 ? (
                  <>
                    <FounderTodaySection
                      priorities={
                        priorities
                      }
                    />

                    <CompactFounderActions
                      intelligence={
                        sectorKpiIntelligence
                      }
                    />

                    <SectionCard
                      badge="Menos información"
                      title="La inteligencia trabaja bajo la superficie"
                      description="El dashboard muestra sólo lo importante. Para comprender patrones, riesgos y oportunidades, abre el Cockpit."
                    >
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Link
                          href="/dashboard/relationships"
                          className={
                            primaryActionButtonClass
                          }
                        >
                          Ver relaciones
                        </Link>

                        <Link
                          href="/dashboard/new"
                          className={
                            secondaryActionButtonClass
                          }
                        >
                          + Nueva relación
                        </Link>

                        <Link
                          href="/dashboard/cockpit"
                          className={
                            hasCockpitAccess
                              ? secondaryActionButtonClass
                              : primaryActionButtonClass
                          }
                        >
                          Abrir Cockpit
                        </Link>
                      </div>
                    </SectionCard>

                    {!hasCockpitAccess ? (
                      <UpgradeTriggerCard
                        title="Desbloquea el Cockpit de ClienteYA"
                        description="El dashboard permanece simple. El análisis profundo vive en el Cockpit: previsiones, señales, historial y prioridades avanzadas."
                        features={[
                          "Cockpit",
                          "Inteligencia del founder",
                          "Previsión de ingresos",
                          "Automatización inteligente",
                        ]}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}