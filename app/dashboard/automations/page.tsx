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
  applyAutomationRules,
  buildAutomationReminders,
} from "../../../lib/automation-engine";

import { buildAIRecommendations } from "../../../lib/ai-recommendations";
import { buildWhatsAppDraft } from "../../../lib/whatsapp-drafts";

import {
  detectClientPhase,
  getPhaseClasses,
} from "../../../lib/phase-detection";

import {
  buildRevenueAnalytics,
  formatGuarani,
} from "../../../lib/revenue-analytics";

import {
  calculateOpportunityScore,
  getOpportunityClasses,
} from "../../../lib/opportunity-scoring";

import {
  buildTimelineInsight,
  getTimelineClasses,
} from "../../../lib/timeline-intelligence";

import {
  buildBusinessHealth,
  getBusinessHealthClasses,
} from "../../../lib/business-health";

import {
  markClientContacted,
  scheduleNextFollowup,
  closeOpportunity,
} from "../../../lib/client-actions";

import {
  buildClientMemory,
  getClientMemoryClasses,
} from "../../../lib/client-memory";

import {
  canAccessAutomations,
  type ProfileAccess,
} from "../../../lib/access-control";

export const dynamic = "force-dynamic";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
  created_at?: string | null;
};

type Profile = ProfileAccess & {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

type FilterType = "todos" | "urgente" | "alta" | "media" | "normal";

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  const cleanDate = date.slice(0, 10);
  const parts = cleanDate.split("-");

  if (parts.length !== 3) return date;

  const [y, m, d] = parts;

  return `${d}/${m}/${y}`;
}

function getPriorityClasses(priority: string) {
  if (priority === "urgent") return "border-red-200 bg-red-50";
  if (priority === "high") return "border-amber-200 bg-amber-50";
  if (priority === "medium") return "border-sky-200 bg-sky-50";

  return "border-slate-200 bg-white";
}

function getBadgeClasses(priority: string) {
  if (priority === "urgent") {
    return "border border-red-200 bg-red-100 text-red-700";
  }

  if (priority === "high") {
    return "border border-amber-200 bg-amber-100 text-amber-700";
  }

  if (priority === "medium") {
    return "border border-sky-200 bg-sky-100 text-sky-700";
  }

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function getPriorityLabel(priority: string) {
  if (priority === "urgent") return "Urgente";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";

  return "Normal";
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
  hotLeads,
  ghostingRisk,
  expectedRevenue,
}: {
  remindersCount: number;
  urgentCount: number;
  highCount: number;
  hotLeads: number;
  ghostingRisk: number;
  expectedRevenue: string;
}) {
  return (
    <SectionCard
      badge="AI Automation Command Center"
      title="Orden de trabajo inteligente"
      description="Automatizaciones, smart queue, client memory y business intelligence en una sola vista."
    >
      <div className="mb-5 flex justify-end">
        <Link href="/dashboard/nuevo" className={ui.buttons.primary}>
          + Nuevo cliente
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Automatizaciones" value={remindersCount} tone="sky" />
        <KpiCard label="Urgente" value={urgentCount} tone="red" />
        <KpiCard label="Alta" value={highCount} tone="amber" />
        <KpiCard label="Hot leads" value={hotLeads} tone="red" />
        <KpiCard label="Ghosting risk" value={ghostingRisk} tone="amber" />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm font-medium text-slate-700">
        Potencial estimado:{" "}
        <span className="font-bold text-slate-950">{expectedRevenue}</span>
      </div>
    </SectionCard>
  );
}

function AutomationCard({
  cliente,
  reminder,
  actionContacted,
  actionSchedule3Days,
  actionClose,
}: {
  cliente: Cliente;
  reminder: ReturnType<typeof buildAutomationReminders>[number];
  actionContacted: (formData: FormData) => Promise<void>;
  actionSchedule3Days: (formData: FormData) => Promise<void>;
  actionClose: (formData: FormData) => Promise<void>;
}) {
  const memory = buildClientMemory(cliente);
  const aiRecommendations = buildAIRecommendations(cliente);
  const primaryRecommendation = aiRecommendations[0];

  const smartDraft = buildWhatsAppDraft(cliente, primaryRecommendation);
  const phase = detectClientPhase(cliente);
  const opportunity = calculateOpportunityScore(cliente);
  const timeline = buildTimelineInsight(cliente);

  const whatsappLink = buildWhatsAppLink(cliente.telefono, smartDraft);

  return (
    <div
      className={`rounded-[28px] border p-4 shadow-sm sm:p-5 ${getPriorityClasses(
        reminder.priority
      )}`}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClasses(
                reminder.priority
              )}`}
            >
              {getPriorityLabel(reminder.priority)}
            </span>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              Score {reminder.score}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getClientMemoryClasses(
                memory
              )}`}
            >
              {memory.label}
            </span>

            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Memory {memory.score}/100
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPhaseClasses(
                phase.tone
              )}`}
            >
              {phase.label}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getOpportunityClasses(
                opportunity.risk
              )}`}
            >
              {opportunity.label}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getTimelineClasses(
                timeline.tone
              )}`}
            >
              {timeline.label}
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {cliente.nombre}
          </h2>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            {cliente.telefono || "Sin teléfono"}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Próximo contacto:{" "}
            <span className="font-semibold text-slate-700">
              {formatDate(cliente.proximo_contacto)}
            </span>
          </p>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Memoria comercial
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {memory.summary}
              </p>

              <p className="mt-3 text-sm font-semibold text-slate-800">
                Próximo paso: {memory.nextBestStep}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Borrador WhatsApp AI
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {smartDraft}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            💡{" "}
            {primaryRecommendation?.description ||
              reminder.description ||
              memory.nextBestStep}
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
            href={`/dashboard/editar?id=${cliente.id}`}
            className={ui.buttons.secondary}
          >
            Abrir cliente
          </Link>

          <form action={actionContacted}>
            <input type="hidden" name="id" value={cliente.id} />

            <button
              type="submit"
              className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Contactado
            </button>
          </form>

          <form action={actionSchedule3Days}>
            <input type="hidden" name="id" value={cliente.id} />

            <button
              type="submit"
              className="w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              +3 días
            </button>
          </form>

          <form action={actionClose}>
            <input type="hidden" name="id" value={cliente.id} />

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
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "todos" } = await searchParams;

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

    await markClientContacted(user.id, id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/automations");
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

    await scheduleNextFollowup(user.id, id, 3);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/automations");
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

    await closeOpportunity(user.id, id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/automations");
  }

  const admin = createAdminClient();

  const [{ data: profileData }, { data: clientesData }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),

    admin
      .from("clientes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const profile = (profileData || null) as Profile | null;

  const profileAccess = {
    ...(profile || {}),
    email: profile?.email || user.email || null,
  } as ProfileAccess;

  const automationAccess = canAccessAutomations(profileAccess);
  const hasAutomationsAccess = automationAccess.allowed;
  const founderModeActive = automationAccess.reason === "founder_mode";

  const clientes = applyAutomationRules((clientesData ?? []) as Cliente[]);
  const reminders = buildAutomationReminders(clientes);

  const remindersWithMemory = reminders
    .map((reminder) => ({
      ...reminder,
      memory: buildClientMemory(reminder.cliente),
    }))
    .sort((a, b) => {
      const memoryDiff = b.memory.score - a.memory.score;

      if (memoryDiff !== 0) return memoryDiff;

      return b.score - a.score;
    });

  const revenue = buildRevenueAnalytics(clientes);
  const businessHealth = buildBusinessHealth(clientes);

  const counts = {
    todos: remindersWithMemory.length,
    urgente: remindersWithMemory.filter((r) => r.priority === "urgent").length,
    alta: remindersWithMemory.filter((r) => r.priority === "high").length,
    media: remindersWithMemory.filter((r) => r.priority === "medium").length,
    normal: remindersWithMemory.filter((r) => r.priority === "low").length,
  };

  const hotLeads = remindersWithMemory.filter(
    (r) => r.memory.salesTemperature === "hot"
  );

  const ghostingRisk = remindersWithMemory.filter(
    (r) => r.memory.ghostingRisk === "high"
  );

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
            <div className="mx-auto max-w-[1600px]">
              <div className="mb-4">
                <FounderModeBadge enabled={founderModeActive} />
              </div>

              <PageHeader
                title="Automatizaciones"
                description="Seguimientos, WhatsApp AI, oportunidades, revenue, client memory y salud comercial."
                badge="AI Follow-up Engine"
              />

              <div className="space-y-6">
                <AutomationAccessNotice
                  founderModeActive={founderModeActive}
                />

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
                      hotLeads={hotLeads.length}
                      ghostingRisk={ghostingRisk.length}
                      expectedRevenue={formatGuarani(
                        revenue.expectedRevenue || 0
                      )}
                    />

                    <div
                      className={`rounded-[28px] border p-5 shadow-sm ${getBusinessHealthClasses(
                        businessHealth.tone
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
                      title="Prioridad de seguimiento"
                      description="Filtra la cola por urgencia para trabajar primero lo importante."
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
                        description="Agrega clientes con próximos contactos y ClienteYA empezará a generar seguimientos automáticos."
                        actionHref="/dashboard/nuevo"
                        actionLabel="+ Nuevo cliente"
                      />
                    ) : (
                      <SectionCard
                        badge="Smart Queue"
                        title="Cola inteligente de seguimiento"
                        description={`${visibleReminders.length} seguimiento(s) detectado(s), ordenados por memory score, urgencia y oportunidad.`}
                      >
                        <div className="space-y-4">
                          {visibleReminders.map((reminder) => (
                            <AutomationCard
                              key={reminder.cliente.id}
                              cliente={reminder.cliente}
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