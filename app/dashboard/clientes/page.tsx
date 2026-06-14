import { createAdminClient } from "../../../lib/supabase/server";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ui } from "../../../lib/ui";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import SectionCard from "../../components/SectionCard";

import {
  buildClientMemory,
  getClientMemoryClasses,
  type ClientMemoryProfile,
} from "../../../lib/client-memory";

import {
  buildAIRecommendations,
  type AIRecommendation,
} from "../../../lib/ai-recommendations";

import {
  getLeadTemperature,
  getLeadTemperatureClasses,
  type LeadTemperatureResult,
} from "../../../lib/lead-temperature";

import {
  buildTimelineInsight,
  getTimelineClasses,
  type TimelineInsight,
} from "../../../lib/timeline-intelligence";

import {
  buildClientTimelineSummary,
  getClientTimelineToneClasses,
  type ClientTimelineEvent,
} from "../../../lib/client-timeline-events";

export const dynamic = "force-dynamic";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  estado: string;
  notas: string | null;
  recordatorio: string | null;
  proximo_contacto: string | null;
  created_at: string;
  updated_at?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

type ClientIntelligence = {
  phase: string;
  score: number;
  priority: "Alta" | "Media" | "Baja";
  reason: string;
};

type ClientTimelineSummary = {
  headline: string;
  recommendation: string;
  eventCount: number;
  timeline: ClientTimelineEvent[];
};

type ClienteWithAI = Cliente & {
  intelligence: ClientIntelligence;
  memory: ClientMemoryProfile;
  recommendations: AIRecommendation[];
  temperature: LeadTemperatureResult;
  timelineInsight: TimelineInsight;
  timelineSummary: ClientTimelineSummary;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatGs(value: number) {
  return `Gs. ${Math.round(value).toLocaleString("es-PY")}`;
}

function daysBetween(date: string | null | undefined, today: string) {
  if (!date) return null;

  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);

  return Math.round(
    (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getBadgeClasses(estado: string) {
  const value = estado.toLowerCase();

  if (value.includes("pag")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (value.includes("interes")) {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }

  if (value.includes("sin")) {
    return "border-orange-200 bg-orange-100 text-orange-700";
  }

  if (value.includes("contact")) {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (value.includes("cerr")) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getPriorityClasses(priority: ClientIntelligence["priority"]) {
  if (priority === "Alta") {
    return "border-red-200 bg-red-100 text-red-700";
  }

  if (priority === "Media") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getRecommendationClasses(tone: AIRecommendation["tone"]) {
  if (tone === "green") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}

function getClientIntelligence(
  cliente: Cliente,
  today: string
): ClientIntelligence {
  const estado = cliente.estado.toLowerCase();
  const delta = daysBetween(cliente.proximo_contacto, today);

  let score = 40;
  let phase = "Nuevo";
  let reason = "Cliente en seguimiento inicial.";

  if (estado.includes("interes")) {
    score += 25;
    phase = "Oportunidad";
    reason = "Cliente interesado. Buen candidato para seguimiento comercial.";
  }

  if (estado.includes("contact")) {
    score += 15;
    phase = "Contactado";
    reason = "Ya existe contacto previo. Mantener ritmo de seguimiento.";
  }

  if (estado.includes("sin")) {
    score += 5;
    phase = "Reactivación";
    reason = "Cliente sin respuesta. Conviene reactivar con mensaje corto.";
  }

  if (estado.includes("pag") || cliente.pagado) {
    score += 35;
    phase = "Cliente pagado";
    reason = "Cliente convertido. Puede generar continuidad o recompra.";
  }

  if (estado.includes("cerr")) {
    score -= 20;
    phase = "Cerrado";
    reason = "Cliente cerrado o con prioridad baja.";
  }

  if (delta !== null) {
    if (delta < 0) {
      score += 25;
      reason = "Seguimiento atrasado. Debe aparecer arriba en la cola.";
    }

    if (delta === 0) {
      score += 20;
      reason = "Seguimiento programado para hoy.";
    }

    if (delta === 1) {
      score += 10;
      reason = "Seguimiento próximo. Preparar WhatsApp.";
    }
  }

  if (cliente.monto && cliente.monto > 0) {
    score += 10;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    phase,
    score,
    priority: score >= 75 ? "Alta" : score >= 50 ? "Media" : "Baja",
    reason,
  };
}

function FeedbackBanner({ ok }: { ok?: string }) {
  if (!ok) return null;

  const messages: Record<string, string> = {
    contactado: "Clientes marcados como contactados.",
    seguimiento: "Seguimiento programado para los clientes seleccionados.",
    pagado: "Clientes marcados como pagados.",
    cerrado: "Clientes cerrados correctamente.",
    eliminado: "Clientes eliminados correctamente.",
  };

  return (
    <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
      ✅ {messages[ok] || "Cambios guardados correctamente."}
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </a>
  );
}

function ExecutiveMetricCard({
  label,
  value,
  tone = "slate",
  wide = false,
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "red" | "amber" | "sky" | "emerald";
  wide?: boolean;
}) {
  const toneClasses: Record<
    NonNullable<Parameters<typeof ExecutiveMetricCard>[0]["tone"]>,
    string
  > = {
    slate: "border-slate-200 bg-white text-slate-900",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <div
      className={`
        flex h-full min-h-[132px] flex-col justify-between
        rounded-[26px] border px-5 py-5 shadow-sm
        ${toneClasses[tone]}
      `}
    >
      <p className="max-w-full break-words text-[11px] font-black uppercase leading-tight tracking-[0.18em] opacity-70">
        {label}
      </p>

      <p
        className={`
          mt-5 font-black leading-none tracking-tight
          ${wide ? "text-[42px]" : "text-[38px]"}
        `}
      >
        {value}
      </p>
    </div>
  );
}

function AiClientesPanel({
  total,
  highPriority,
  opportunityClients,
  hotLeads,
  ghostingRisk,
  revenuePotential,
  overdue,
}: {
  total: number;
  highPriority: number;
  opportunityClients: number;
  hotLeads: number;
  ghostingRisk: number;
  revenuePotential: number;
  overdue: number;
}) {
  const healthText =
    ghostingRisk > 0
      ? `${ghostingRisk} cliente(s) con riesgo de ghosting. Usar tono suave y seguimiento inteligente.`
      : overdue > 0
      ? `${overdue} cliente(s) con seguimiento atrasado. Trabajar primero esta lista.`
      : hotLeads > 0
      ? `${hotLeads} hot lead(s). Buen momento para convertir.`
      : highPriority > 0
      ? `${highPriority} cliente(s) con alta prioridad. Mantener ritmo comercial.`
      : "Lista controlada. No hay presión crítica ahora.";

  const healthTone =
    ghostingRisk > 0 || overdue > 0
      ? "red"
      : hotLeads > 0 || highPriority > 0
      ? "amber"
      : "emerald";

  return (
    <SectionCard
      badge="AI Client Memory"
      title="Prioridad comercial por cliente"
      description="ClienteYA combina fase, seguimiento, oportunidad, memoria comercial, timeline y riesgo para ordenar la lista de trabajo."
      tone={healthTone}
    >
      <div className="mb-5">
        <a
          href="/dashboard/automations"
          className={`${ui.buttons.secondary} inline-flex`}
        >
          Ver automatizaciones
        </a>
      </div>

     <div className="grid grid-cols-2 gap-4 2xl:grid-cols-12">
  <div className="2xl:col-span-2">
    <ExecutiveMetricCard label="Clientes" value={total} />
  </div>

  <div className="2xl:col-span-2">
    <ExecutiveMetricCard
      label="Hot leads"
      value={hotLeads}
      tone="red"
    />
  </div>

  <div className="2xl:col-span-2">
    <ExecutiveMetricCard
      label="Ghosting risk"
      value={ghostingRisk}
      tone="amber"
    />
  </div>

  <div className="2xl:col-span-2">
    <ExecutiveMetricCard
      label="Oportunidades"
      value={opportunityClients}
      tone="sky"
    />
  </div>

  <div className="col-span-2 2xl:col-span-4">
    <ExecutiveMetricCard
      label="Potencial"
      value={formatGs(revenuePotential)}
      tone="emerald"
      wide
    />
  </div>
</div>

      <div className="mt-4 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-700">
        {healthText}
      </div>
    </SectionCard>
  );
}

function ClienteCard({
  cliente,
  today,
  tomorrow,
}: {
  cliente: ClienteWithAI;
  today: string;
  tomorrow: string;
}) {
  const overdue = cliente.proximo_contacto && cliente.proximo_contacto < today;
  const isToday = cliente.proximo_contacto === today;
  const isTomorrow = cliente.proximo_contacto === tomorrow;
  const paid = cliente.pagado || cliente.estado.toLowerCase().includes("pag");

  return (
    <div
      className={`rounded-[24px] border p-4 shadow-sm sm:p-5 ${
        overdue ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <label className="mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white shadow-sm">
            <input
              type="checkbox"
              name="ids"
              value={cliente.id}
              className="h-4 w-4 accent-slate-900"
            />
          </label>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold leading-tight text-slate-900 sm:text-xl">
                {cliente.nombre}
              </p>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getBadgeClasses(
                  cliente.estado
                )}`}
              >
                {cliente.estado}
              </span>

              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                AI {cliente.intelligence.score}/100
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                  cliente.intelligence.priority
                )}`}
              >
                {cliente.intelligence.priority}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getLeadTemperatureClasses(
                  cliente.temperature.temperature
                )}`}
              >
                🔥 {cliente.temperature.label} · {cliente.temperature.score}/100
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getClientMemoryClasses(
                  cliente.memory
                )}`}
              >
                {cliente.memory.label}
              </span>

              {overdue && (
                <span className="rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                  atrasado
                </span>
              )}

              {isToday && (
                <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  hoy
                </span>
              )}

              {isTomorrow && (
                <span className="rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  mañana
                </span>
              )}

              {paid && (
                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  pagado
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {cliente.telefono || "Sin teléfono"}
            </p>

            <div className="mt-4 grid gap-3 text-sm lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Fase AI
                </p>

                <p className="mt-1 text-slate-700">
                  {cliente.intelligence.phase}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Memory
                </p>

                <p className="mt-1 text-slate-700">
                  {cliente.memory.score}/100
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Momentum
                </p>

                <p className="mt-1 text-slate-700">
                  {cliente.timelineInsight.label}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Próximo
                </p>

                <p className="mt-1 text-slate-700">
                  {formatDate(cliente.proximo_contacto)}
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                💡 {cliente.memory.nextBestStep}
              </div>

              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${getTimelineClasses(
                  cliente.timelineInsight.tone
                )}`}
              >
                ⏱️ {cliente.timelineInsight.recommendation}
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                <p className="font-black">
                  🧠 {cliente.timelineSummary.headline}
                </p>

                <p className="mt-1 leading-relaxed">
                  {cliente.timelineSummary.recommendation}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <p className="font-black text-slate-900">
                  Timeline · {cliente.timelineSummary.eventCount} evento(s)
                </p>

                <div className="mt-2 space-y-2">
                  {cliente.timelineSummary.timeline.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`rounded-xl border px-3 py-2 text-xs ${getClientTimelineToneClasses(
                        event.tone
                      )}`}
                    >
                      <p className="font-black">{event.title}</p>

                      <p className="mt-1 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {cliente.recommendations.slice(0, 2).map((recommendation) => (
                <div
                  key={`${cliente.id}-${recommendation.title}`}
                  className={`rounded-2xl border px-4 py-3 text-sm ${getRecommendationClasses(
                    recommendation.tone
                  )}`}
                >
                  <p className="font-black">{recommendation.title}</p>

                  <p className="mt-1 leading-relaxed">
                    {recommendation.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              🧠 {cliente.memory.summary}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <a
            href={`/dashboard/clientes/${cliente.id}`}
            className={ui.buttons.primary}
          >
            Ver cliente
          </a>

          <a
            href={`/dashboard/whatsapp?id=${cliente.id}`}
            className={ui.buttons.success}
          >
            WhatsApp AI
          </a>

          <a
            href={`/dashboard/editar?id=${cliente.id}`}
            className={ui.buttons.secondary}
          >
            Editar
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; ok?: string }>;
}) {
  const { q = "", filter = "todos", ok } = await searchParams;

  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  async function bulkContactado(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const ids = formData.getAll("ids").map(String).filter(Boolean);

    if (ids.length === 0) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Contactado",
        recordatorio: "Marcado como contactado en acción masiva",
      })
      .in("id", ids)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/clientes?ok=contactado");
  }

  async function bulkSeguimiento(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const ids = formData.getAll("ids").map(String).filter(Boolean);

    if (ids.length === 0) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Sin respuesta",
        recordatorio: "Seguimiento programado desde acción masiva",
        proximo_contacto: addDaysISO(3),
      })
      .in("id", ids)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/clientes?ok=seguimiento");
  }

  async function bulkPagado(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const ids = formData.getAll("ids").map(String).filter(Boolean);

    if (ids.length === 0) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Pagó",
        pagado: true,
        monto: 50000,
        fecha_pago: new Date().toISOString(),
      })
      .in("id", ids)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/clientes?ok=pagado");
  }

  async function bulkCerrar(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const ids = formData.getAll("ids").map(String).filter(Boolean);

    if (ids.length === 0) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Cerrado",
        recordatorio: "Cerrado desde acción masiva",
        proximo_contacto: null,
      })
      .in("id", ids)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/clientes?ok=cerrado");
  }

  async function bulkEliminar(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const ids = formData.getAll("ids").map(String).filter(Boolean);

    if (ids.length === 0) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/clientes?ok=eliminado");
  }


  const { data, error } = await supabase
  .from("clientes")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

if (error) {
  console.error("CLIENTES SELECT ERROR:", error);
}

const clientes: Cliente[] = data || [];

  const today = todayISO();
  const tomorrow = tomorrowISO();
  const query = q.trim().toLowerCase();

  const clientesWithAi: ClienteWithAI[] = clientes
    .map((cliente) => {
      const intelligence = getClientIntelligence(cliente, today);
      const memory = buildClientMemory(cliente);
      const recommendations = buildAIRecommendations(cliente);
      const temperature = getLeadTemperature(cliente);
      const timelineInsight = buildTimelineInsight(cliente);
      const timelineSummary = buildClientTimelineSummary(cliente);

      return {
        ...cliente,
        intelligence,
        memory,
        recommendations,
        temperature,
        timelineInsight,
        timelineSummary,
      };
    })
    .sort((a, b) => {
      const temperatureDiff = b.temperature.score - a.temperature.score;

      if (temperatureDiff !== 0) return temperatureDiff;

      const memoryDiff = b.memory.score - a.memory.score;

      if (memoryDiff !== 0) return memoryDiff;

      return b.intelligence.score - a.intelligence.score;
    });

  const total = clientesWithAi.length;

  const atrasados = clientesWithAi.filter(
    (c) => c.proximo_contacto && c.proximo_contacto < today
  );

  const hoy = clientesWithAi.filter((c) => c.proximo_contacto === today);
  const manana = clientesWithAi.filter((c) => c.proximo_contacto === tomorrow);

  const altaPrioridad = clientesWithAi.filter(
    (c) => c.intelligence.priority === "Alta"
  );

  const oportunidades = clientesWithAi.filter(
    (c) =>
      c.intelligence.phase === "Oportunidad" ||
      c.estado.toLowerCase().includes("interes")
  );

  const hotLeads = clientesWithAi.filter(
    (c) => c.temperature.temperature === "hot"
  );

  const ghostingRisk = clientesWithAi.filter(
    (c) => c.memory.ghostingRisk === "high"
  );

  const revenuePotential = clientesWithAi
    .filter(
      (c) =>
        !c.pagado &&
        !c.estado.toLowerCase().includes("pag") &&
        c.memory.score >= 60
    )
    .reduce((sum, c) => sum + Number(c.monto || 50000), 0);

  const filteredByStatus = clientesWithAi.filter((c) => {
    if (filter === "atrasados") {
      return !!c.proximo_contacto && c.proximo_contacto < today;
    }

    if (filter === "hoy") return c.proximo_contacto === today;
    if (filter === "manana") return c.proximo_contacto === tomorrow;

    if (filter === "pagados") {
      return c.pagado || c.estado.toLowerCase().includes("pag");
    }

    if (filter === "interesados") {
      return c.estado.toLowerCase().includes("interes");
    }

    if (filter === "alta") {
      return c.intelligence.priority === "Alta";
    }

    if (filter === "oportunidades") {
      return (
        c.intelligence.phase === "Oportunidad" ||
        c.estado.toLowerCase().includes("interes")
      );
    }

    return true;
  });

  const visibleClientes = filteredByStatus.filter((c) => {
    if (!query) return true;

    const haystack = [
      c.nombre,
      c.telefono,
      c.estado,
      c.recordatorio || "",
      c.notas || "",
      c.proximo_contacto || "",
      c.intelligence.phase,
      c.intelligence.priority,
      String(c.intelligence.score),
      c.memory.label,
      c.memory.summary,
      c.memory.risk,
      c.memory.nextBestStep,
      c.memory.recommendedTone,
      String(c.memory.score),
      c.temperature.label,
      String(c.temperature.score),
      c.temperature.reason,
      c.timelineInsight.label,
      c.timelineInsight.description,
      c.timelineInsight.recommendation,
      c.timelineSummary.headline,
      c.timelineSummary.recommendation,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  const qParam = query ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl">
              <FeedbackBanner ok={ok} />

              <PageHeader
                title="Clientes"
                description="Busca, filtra y actualiza clientes con prioridad comercial AI."
                actionHref="/dashboard/nuevo"
                actionLabel="+ Nuevo cliente"
                badge="CRM Intelligence"
              />

              <div className="space-y-6">
                <AiClientesPanel
                  total={total}
                  highPriority={altaPrioridad.length}
                  opportunityClients={oportunidades.length}
                  hotLeads={hotLeads.length}
                  ghostingRisk={ghostingRisk.length}
                  revenuePotential={revenuePotential}
                  overdue={atrasados.length}
                />
<div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
                
                  <ExecutiveMetricCard label="Total" value={total} />
                  <ExecutiveMetricCard
                    label="Atrasados"
                    value={atrasados.length}
                    tone="red"
                  />
                  <ExecutiveMetricCard
                    label="Hoy"
                    value={hoy.length}
                    tone="amber"
                  />
                  <ExecutiveMetricCard
                    label="Mañana"
                    value={manana.length}
                    tone="sky"
                  />
                  <ExecutiveMetricCard
                    label="Hot leads"
                    value={hotLeads.length}
                    tone="red"
                  />
                  <ExecutiveMetricCard
                    label="Ghosting risk"
                    value={ghostingRisk.length}
                    tone="amber"
                  />
                </div>

                <SectionCard
                  badge="Buscar y filtrar"
                  title="Control rápido"
                  description="Encuentra clientes por nombre, teléfono, estado, fase, score, memory, timeline o nota."
                >
                  <form className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <input
                      name="q"
                      defaultValue={q}
                      placeholder="Buscar por nombre, teléfono, estado, fase, score, memory, timeline o nota..."
                      className="min-h-11 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500"
                    />

                    <input type="hidden" name="filter" value={filter} />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                      >
                        Buscar
                      </button>

                      <a
                        href="/dashboard/clientes"
                        className={ui.buttons.secondary}
                      >
                        Limpiar
                      </a>
                    </div>
                  </form>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <FilterLink
                      href={`/dashboard/clientes?filter=todos${qParam}`}
                      label="Todos"
                      active={filter === "todos"}
                    />

                    <FilterLink
                      href={`/dashboard/clientes?filter=alta${qParam}`}
                      label="Alta prioridad"
                      active={filter === "alta"}
                    />

                    <FilterLink
                      href={`/dashboard/clientes?filter=oportunidades${qParam}`}
                      label="Oportunidades"
                      active={filter === "oportunidades"}
                    />

                    <FilterLink
                      href={`/dashboard/clientes?filter=atrasados${qParam}`}
                      label="Atrasados"
                      active={filter === "atrasados"}
                    />

                    <FilterLink
                      href={`/dashboard/clientes?filter=hoy${qParam}`}
                      label="Hoy"
                      active={filter === "hoy"}
                    />

                    <FilterLink
                      href={`/dashboard/clientes?filter=manana${qParam}`}
                      label="Mañana"
                      active={filter === "manana"}
                    />

                    <FilterLink
                      href={`/dashboard/clientes?filter=interesados${qParam}`}
                      label="Interesados"
                      active={filter === "interesados"}
                    />

                    <FilterLink
                      href={`/dashboard/clientes?filter=pagados${qParam}`}
                      label="Pagados"
                      active={filter === "pagados"}
                    />
                  </div>
                </SectionCard>

                <form>
                  <div className="sticky top-4 z-20 mb-5 rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Acciones masivas
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Selecciona uno o más clientes y aplica una acción.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          formAction={bulkContactado}
                          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                        >
                          Contactado
                        </button>

                        <button
                          formAction={bulkSeguimiento}
                          className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                        >
                          Seguimiento 3 días
                        </button>

                        <button
                          formAction={bulkPagado}
                          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          Pagado
                        </button>

                        <button
                          formAction={bulkCerrar}
                          className={ui.buttons.secondary}
                        >
                          Cerrar
                        </button>

                        <button
                          formAction={bulkEliminar}
                          className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  <SectionCard
                    badge="Clientes"
                    title="Lista inteligente de clientes"
                    description={`${visibleClientes.length} resultado(s), ordenados por lead temperature, memory score y prioridad AI.`}
                  >
                    {visibleClientes.length === 0 ? (
                      <EmptyState
                        icon="🔎"
                        title="No hay clientes con este filtro"
                        description="Prueba otro filtro o limpia la búsqueda."
                        actionHref="/dashboard/clientes"
                        actionLabel="Limpiar filtros"
                      />
                    ) : (
                      <div className="space-y-3">
                        {visibleClientes.map((cliente) => (
                          <ClienteCard
                            key={cliente.id}
                            cliente={cliente}
                            today={today}
                            tomorrow={tomorrow}
                          />
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}