import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { ui } from "../../../lib/ui";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import KpiCard from "../../components/KpiCard";
import SectionCard from "../../components/SectionCard";
import FounderModeBadge from "../../components/FounderModeBadge";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";
import { buildWhatsAppLink } from "../../../lib/whatsapp-link";

import {
  buildAutomationRemindersV2,
  type AutomationReminderV2,
} from "../../../lib/automation-engine-v2";

import {
  buildRevenueAnalyticsV2,
  formatGuaraniV2,
} from "../../../lib/revenue-analytics-v2";

import {
  buildBusinessHealthV2,
  getBusinessHealthClassesV2,
} from "../../../lib/business-health-v2";

import { adaptRelationshipMemory } from "../../../lib/relationship-memory-adapter";
import { buildRelationshipMemory } from "../../../lib/relationship-memory";
import type { RelationshipRecord } from "../../../lib/relationship-repository";

import {
  canAccessAutomations,
  type ProfileAccess,
} from "../../../lib/access-control";

export const dynamic = "force-dynamic";

type Profile = ProfileAccess & {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

type FilterType = "todos" | "urgente" | "alta" | "media" | "normal";

type RelationshipMemoryV2 = ReturnType<typeof buildRelationshipMemory>;

function buildAutomationRelationshipMemory(
  relationship: RelationshipRecord,
) {
  const relationshipMemoryModel = adaptRelationshipMemory({
    id: relationship.id,
    name: relationship.name,
    phone: relationship.phone,
    status: relationship.status,
    notes: relationship.notes,
    reminder: relationship.reminder,
    next_follow_up_at: relationship.next_contact_at,
    estimated_value: 0,
    pagado: false,
    payment_date: null,
    created_at: relationship.created_at,
  });

  return buildRelationshipMemory(relationshipMemoryModel);
}

function getRelationshipMemoryLabel(memory: RelationshipMemoryV2) {
  if ("label" in memory && typeof memory.label === "string") {
    return memory.label;
  }

  if (memory.score >= 75) return "Relación prioritaria";
  if (memory.score >= 50) return "Seguimiento activo";

  return "Seguimiento normal";
}

function getRelationshipMemoryClasses(memory: RelationshipMemoryV2) {
  if (memory.score >= 75) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (memory.score >= 50) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  const cleanDate = date.slice(0, 10);
  const parts = cleanDate.split("-");

  if (parts.length != 3) return date;

  const [y, m, d] = parts;

  if (!y || !m || !d) return date;

  return `${d}/${m}/${y}`;
}

function filterToPriority(filter: FilterType) {
  if (filter === "urgente") return "urgent";
  if (filter === "alta") return "high";
  if (filter === "media") return "medium";
  if (filter === "normal") return "low";

  return null;
}

function filterHref(filter: FilterType) {
  if (filter === "todos") return "/dashboard/automations";

  return `/dashboard/automations?filter=${filter}`;
}

function getActionSuccessMessage(ok?: string) {
  if (ok === "contactado") return "Relación marcada como contactada.";
  if (ok === "seguimiento") return "Seguimiento programado en 3 días.";
  if (ok === "cerrado") return "Oportunidad cerrada.";

  return null;
}

function getPriorityClasses(priority: AutomationReminderV2["priority"]) {
  if (priority === "urgent") return "border-red-200 bg-red-50";
  if (priority === "high") return "border-amber-200 bg-amber-50";
  if (priority === "medium") return "border-sky-200 bg-sky-50";

  return "border-slate-200 bg-white";
}

function getPriorityBadgeClasses(priority: AutomationReminderV2["priority"]) {
  if (priority === "urgent") return "bg-red-600 text-white";
  if (priority === "high") return "bg-amber-500 text-white";
  if (priority === "medium") return "bg-sky-600 text-white";

  return "bg-slate-900 text-white";
}

function getPriorityLabel(priority: AutomationReminderV2["priority"]) {
  if (priority === "urgent") return "Urgente";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";

  return "Normal";
}

function FeedbackBanner({ ok }: { ok?: string }) {
  const message = getActionSuccessMessage(ok);

  if (!message) return null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm">
      ✅ {message}
    </div>
  );
}

function FilterTab({
  label,
  count,
  filter,
  activeFilter,
}: {
  label: string;
  count: number;
  filter: FilterType;
  activeFilter: FilterType;
}) {
  const active = filter === activeFilter;

  return (
    <Link
      href={filterHref(filter)}
      className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}

      <span
        className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function AutomationAccessNotice({
  founderModeActive,
}: {
  founderModeActive: boolean;
}) {
  if (founderModeActive) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm">
        ⚡ Founder Mode activo: automatizaciones desbloqueadas en desarrollo.
      </div>
    );
  }

  return null;
}

function AutomationCommandCenter({
  remindersCount,
  urgentCount,
  highCount,
  todayCount,
  noDateCount,
  expectedRevenue,
}: {
  remindersCount: number;
  urgentCount: number;
  highCount: number;
  todayCount: number;
  noDateCount: number;
  expectedRevenue: string;
}) {
  return (
    <SectionCard
      badge="Commercial Action Engine"
      title="Cola comercial"
      description="Acciones generadas desde una sola verdad comercial. Automations ejecuta; no vuelve a calcular."
    >
      <div className="mb-5 flex justify-end">
        <Link href="/dashboard/new" className={ui.buttons.primary}>
          + Nueva relación
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Acciones" value={remindersCount} tone="sky" />
        <KpiCard label="Urgente" value={urgentCount} tone="red" />
        <KpiCard label="Alta" value={highCount} tone="amber" />
        <KpiCard label="Hoy" value={todayCount} tone="emerald" />
        <KpiCard label="Sin fecha" value={noDateCount} tone="default" />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm font-medium text-slate-700">
        Potencial estimado:{" "}
        <span className="font-bold text-slate-950">{expectedRevenue}</span>
      </div>
    </SectionCard>
  );
}

function AutomationCard({
  reminder,
  actionContacted,
  actionSchedule3Days,
  actionClose,
}: {
  reminder: AutomationReminderV2;
  actionContacted: (formData: FormData) => Promise<void>;
  actionSchedule3Days: (formData: FormData) => Promise<void>;
  actionClose: (formData: FormData) => Promise<void>;
}) {
  const relationship = reminder.relationship;
  const memory = buildAutomationRelationshipMemory(relationship);
  const relationshipName =
    relationship.name || "Relación sin nombre";
  const relationshipPhone = relationship.phone || "";
  const nextContactAt = relationship.next_contact_at;
  const whatsappDraft = `${relationshipName}, buen día. ${reminder.nextBestAction}.`;
  const whatsappLink = buildWhatsAppLink(relationshipPhone, whatsappDraft);

  return (
    <div
      className={`rounded-[28px] border p-4 shadow-sm sm:p-5 ${getPriorityClasses(
        reminder.priority,
      )}`}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClasses(
                reminder.priority,
              )}`}
            >
              {getPriorityLabel(reminder.priority)}
            </span>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              Score {reminder.score}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRelationshipMemoryClasses(
                memory,
              )}`}
            >
              {getRelationshipMemoryLabel(memory)}
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {relationshipName}
          </h2>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            {relationshipPhone || "Sin teléfono"}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Próximo contacto:{" "}
            <span className="font-semibold text-slate-700">
              {formatDate(nextContactAt)}
            </span>
          </p>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Acción generada
              </p>

              <p className="mt-3 text-sm font-bold leading-6 text-slate-900">
                {reminder.title}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {reminder.description}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Siguiente mejor acción
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {reminder.nextBestAction}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            💡 {memory.nextBestStep}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 xl:w-48 xl:flex-col">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Enviar WhatsApp
          </a>

          <Link
            href={`/dashboard/relationships/${relationship.id}`}
            className={ui.buttons.secondary}
          >
            Abrir relación
          </Link>

          <form action={actionContacted}>
            <input type="hidden" name="id" value={relationship.id} />

            <button
              type="submit"
              className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Contactado
            </button>
          </form>

          <form action={actionSchedule3Days}>
            <input type="hidden" name="id" value={relationship.id} />

            <button
              type="submit"
              className="w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              +3 días
            </button>
          </form>

          <form action={actionClose}>
            <input type="hidden" name="id" value={relationship.id} />

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Cerrado
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default async function AutomationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; ok?: string }>;
}) {
  const { filter = "todos", ok } = await searchParams;

  const activeFilter: FilterType = [
    "todos",
    "urgente",
    "alta",
    "media",
    "normal",
  ].includes(filter)
    ? (filter as FilterType)
    : "todos";

  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  async function actionContacted(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const id = String(formData.get("id") || "");

    if (!id) redirect("/dashboard/automations");

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("relationships")
      .update({
        status: "Contactado",
        reminder: null,
        next_contact_at: null,
        last_contact_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .eq("owner_id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/relationships");
    revalidatePath("/dashboard/automations");
    revalidatePath("/dashboard/planning");
    revalidatePath("/dashboard/cockpit");
    revalidatePath(`/dashboard/relationships/${id}`);

    redirect("/dashboard/automations?ok=contactado");
  }

  async function actionSchedule3Days(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const id = String(formData.get("id") || "");

    if (!id) redirect("/dashboard/automations");

    const nextContactAt = new Date();
    nextContactAt.setDate(nextContactAt.getDate() + 3);

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("relationships")
      .update({
        reminder: "Seguimiento programado",
        next_contact_at: nextContactAt.toISOString().slice(0, 10),
        updated_at: now,
      })
      .eq("id", id)
      .eq("owner_id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/relationships");
    revalidatePath("/dashboard/automations");
    revalidatePath("/dashboard/planning");
    revalidatePath("/dashboard/cockpit");
    revalidatePath(`/dashboard/relationships/${id}`);

    redirect("/dashboard/automations?ok=seguimiento");
  }

  async function actionClose(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const id = String(formData.get("id") || "");

    if (!id) redirect("/dashboard/automations");

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("relationships")
      .update({
        status: "Cerrado",
        reminder: null,
        next_contact_at: null,
        updated_at: now,
      })
      .eq("id", id)
      .eq("owner_id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/relationships");
    revalidatePath("/dashboard/automations");
    revalidatePath("/dashboard/planning");
    revalidatePath("/dashboard/cockpit");
    revalidatePath(`/dashboard/relationships/${id}`);

    redirect("/dashboard/automations?ok=cerrado");
  }

  const admin = createAdminClient();

  const { data: profileData } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData || null) as Profile | null;

  const profileAccess = {
    ...(profile || {}),
    email: profile?.email || user.email || null,
  } as ProfileAccess;

  const automationAccess = canAccessAutomations(profileAccess);
  const hasAutomationsAccess = automationAccess.allowed;
  const founderModeActive = automationAccess.reason === "founder_mode";

  const { data: relationshipsData, error: relationshipsError } = await supabase
    .from("relationships")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (relationshipsError) {
    console.error("AUTOMATIONS RELATIONSHIPS SELECT ERROR:", relationshipsError);
  }

  const relationshipRecords =
    (relationshipsData ?? []) as RelationshipRecord[];

  const remindersWithMemory = buildAutomationRemindersV2(relationshipRecords)
    .map((reminder) => ({
      ...reminder,
      memory: buildAutomationRelationshipMemory(reminder.relationship),
    }))
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;

      if (scoreDiff !== 0) return scoreDiff;

      return b.memory.score - a.memory.score;
    });

  const revenue = buildRevenueAnalyticsV2(relationshipRecords);
  const businessHealth = buildBusinessHealthV2(relationshipRecords);

  const counts = {
    todos: remindersWithMemory.length,
    urgente: remindersWithMemory.filter((r) => r.priority === "urgent").length,
    alta: remindersWithMemory.filter((r) => r.priority === "high").length,
    media: remindersWithMemory.filter((r) => r.priority === "medium").length,
    normal: remindersWithMemory.filter((r) => r.priority === "low").length,
  };

  const todayCount = remindersWithMemory.filter(
    (r) => r.type === "today",
  ).length;

  const noDateCount = remindersWithMemory.filter(
    (r) => r.type === "general" && !r.relationship.next_contact_at,
  ).length;

  const priorityFilter = filterToPriority(activeFilter);

  const visibleReminders = priorityFilter
    ? remindersWithMemory.filter((r) => r.priority === priorityFilter)
    : remindersWithMemory;

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1280px]">
              <div className="mb-4">
                <FounderModeBadge enabled={founderModeActive} />
              </div>

              <PageHeader
                title="Automatizaciones"
                description="Cola comercial ejecutable conectada a la misma verdad que Dashboard y Calendario."
                badge="V22 Commercial Action Engine"
              />

              <div className="space-y-6">
                <AutomationAccessNotice founderModeActive={founderModeActive} />

                <FeedbackBanner ok={ok} />

                {!hasAutomationsAccess ? (
                  <EmptyState
                    icon="🔒"
                    title="Automatizaciones bloqueadas"
                    description="Este módulo requiere un plan Pro o Enterprise."
                    actionHref="/dashboard/billing"
                    actionLabel="Ver billing"
                  />
                ) : (
                  <>
                    <AutomationCommandCenter
                      remindersCount={remindersWithMemory.length}
                      urgentCount={counts.urgente}
                      highCount={counts.alta}
                      todayCount={todayCount}
                      noDateCount={noDateCount}
                      expectedRevenue={formatGuaraniV2(
                        revenue.expectedRevenue || 0,
                      )}
                    />

                    <div
                      className={`rounded-[28px] border p-5 shadow-sm ${getBusinessHealthClassesV2(
                        businessHealth.tone,
                      )}`}
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                            Salud comercial
                          </p>

                          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                            {businessHealth.label}
                          </h2>

                          <p className="mt-2 max-w-3xl text-sm leading-6">
                            {businessHealth.summary}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/40 bg-white/50 px-5 py-4">
                          <p className="text-xs uppercase tracking-wide opacity-70">
                            Score de salud
                          </p>

                          <p className="mt-2 text-3xl font-bold">
                            {businessHealth.score}/100
                          </p>
                        </div>
                      </div>
                    </div>

                    <SectionCard
                      badge="Filtros"
                      title="Prioridad de ejecución"
                      description="Trabaja primero las acciones que la Commercial Action Engine marcó como más importantes."
                    >
                      <div className="flex flex-wrap gap-3">
                        <FilterTab
                          label="Todos"
                          count={counts.todos}
                          filter="todos"
                          activeFilter={activeFilter}
                        />

                        <FilterTab
                          label="Urgente"
                          count={counts.urgente}
                          filter="urgente"
                          activeFilter={activeFilter}
                        />

                        <FilterTab
                          label="Alta"
                          count={counts.alta}
                          filter="alta"
                          activeFilter={activeFilter}
                        />

                        <FilterTab
                          label="Media"
                          count={counts.media}
                          filter="media"
                          activeFilter={activeFilter}
                        />

                        <FilterTab
                          label="Normal"
                          count={counts.normal}
                          filter="normal"
                          activeFilter={activeFilter}
                        />
                      </div>
                    </SectionCard>

                    {visibleReminders.length === 0 ? (
                      <EmptyState
                        icon="🤖"
                        title="No hay automatizaciones todavía"
                        description="Agrega relaciones con próximos contactos y ClienteYA empezará a generar acciones comerciales."
                        actionHref="/dashboard/new"
                        actionLabel="+ Nueva relación"
                      />
                    ) : (
                      <SectionCard
                        badge="Smart Queue"
                        title="Cola de ejecución"
                        description={`${visibleReminders.length} acción(es) generada(s) desde la misma verdad comercial.`}
                      >
                        <div className="space-y-4">
                          {visibleReminders.map((reminder) => (
                            <AutomationCard
                              key={reminder.relationshipId}
                              reminder={reminder}
                              actionContacted={actionContacted}
                              actionSchedule3Days={actionSchedule3Days}
                              actionClose={actionClose}
                            />
                          ))}
                        </div>
                      </SectionCard>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}