import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { ui } from "../../../lib/ui";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";
import KpiCard from "../../components/KpiCard";
import SectionCard from "../../components/SectionCard";
import EmptyState from "../../components/EmptyState";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";

import {
  canAccessPro,
  type ProfileAccess,
} from "../../../lib/access-control";

import {
  buildAIClientSummary,
  getAIClientSummaryClasses,
} from "../../../lib/ai-client-summary";

export const dynamic = "force-dynamic";

type Cliente = {
  id: string;
  user_id?: string | null;
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

type ActivityLog = {
  id: string;
  type: string;
  created_at: string;
};

type Profile = ProfileAccess & {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  const cleanDate = date.slice(0, 10);
  const parts = cleanDate.split("-");

  if (parts.length !== 3) return date;

  const [y, m, d] = parts;

  return `${d}/${m}/${y}`;
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function daysBetween(date: string | null | undefined, today: string) {
  if (!date) return null;

  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);

  return Math.round(
    (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function cleanPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function buildWhatsAppUrl(phone: string, message: string) {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(
    message,
  )}`;
}

function getActivityLabel(type: string) {
  if (type === "contactado") return "Cliente contactado";
  if (type === "followup_scheduled") return "Follow-up agendado";
  if (type === "closed") return "Oportunidad cerrada";
  if (type === "no_response") return "Cliente sin respuesta";
  if (type === "followup") return "Automation ejecutada";
  if (type === "manual_update") return "Cliente actualizado";

  return "Actividad registrada";
}

function getActivityIcon(type: string) {
  if (type === "contactado") return "✅";
  if (type === "followup_scheduled") return "⏰";
  if (type === "closed") return "💰";
  if (type === "no_response") return "🚫";
  if (type === "followup") return "📨";
  if (type === "manual_update") return "✏️";

  return "📌";
}

function getClientPhase(cliente: Cliente, today: string) {
  const estado = (cliente.estado || "").toLowerCase();
  const delta = daysBetween(cliente.proximo_contacto, today);

  if (cliente.pagado || estado.includes("pag")) {
    return {
      label: "Cliente pagado",
      tone: "emerald",
      description: "Cliente convertido. Mantener relación y buscar continuidad.",
    };
  }

  if (delta !== null && delta < 0) {
    return {
      label: "Follow-up vencido",
      tone: "red",
      description: "Este cliente necesita seguimiento inmediato.",
    };
  }

  if (delta === 0) {
    return {
      label: "Seguimiento hoy",
      tone: "amber",
      description: "El mejor momento para contactarlo es hoy.",
    };
  }

  if (estado.includes("interes")) {
    return {
      label: "Oportunidad",
      tone: "amber",
      description: "Cliente con interés comercial activo.",
    };
  }

  if (estado.includes("sin")) {
    return {
      label: "Sin respuesta",
      tone: "orange",
      description: "Conviene reactivar con un mensaje simple.",
    };
  }

  if (estado.includes("contact")) {
    return {
      label: "Contactado",
      tone: "sky",
      description: "Ya existe contacto. Mantener el ritmo.",
    };
  }

  return {
    label: "Nuevo lead",
    tone: "slate",
    description: "Cliente en etapa inicial.",
  };
}

function getPhaseClasses(tone: string) {
  if (tone === "red") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "orange") return "border-orange-200 bg-orange-50 text-orange-800";
  if (tone === "sky") return "border-sky-200 bg-sky-50 text-sky-800";
  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getScore(cliente: Cliente, today: string) {
  const estado = (cliente.estado || "").toLowerCase();
  const delta = daysBetween(cliente.proximo_contacto, today);

  let score = 45;

  if (estado.includes("interes")) score += 25;
  if (estado.includes("contact")) score += 15;
  if (estado.includes("sin")) score += 5;
  if (estado.includes("pag") || cliente.pagado) score += 30;
  if (estado.includes("cerr")) score -= 25;

  if (delta !== null && delta < 0) score += 25;
  if (delta === 0) score += 20;
  if (delta === 1) score += 10;

  if (cliente.monto && cliente.monto > 0) score += 10;

  return Math.max(0, Math.min(100, score));
}

function buildRecommendation(cliente: Cliente, today: string) {
  const estado = (cliente.estado || "").toLowerCase();
  const delta = daysBetween(cliente.proximo_contacto, today);

  if (cliente.pagado || estado.includes("pag")) {
    return {
      title: "Mantener relación",
      action: "Enviar mensaje de seguimiento post-venta.",
      description:
        "Este cliente ya convirtió. La mejor acción es cuidar la relación y preparar continuidad.",
    };
  }

  if (delta !== null && delta < 0) {
    return {
      title: "Contactar ahora",
      action: "Enviar WhatsApp y marcar como contactado.",
      description:
        "El follow-up está vencido. Este cliente debe aparecer como prioridad operativa.",
    };
  }

  if (delta === 0) {
    return {
      title: "Seguimiento de hoy",
      action: "Enviar WhatsApp hoy.",
      description:
        "El cliente está en el momento correcto para recibir seguimiento.",
    };
  }

  if (estado.includes("interes")) {
    return {
      title: "Convertir oportunidad",
      action: "Enviar mensaje directo con siguiente paso.",
      description:
        "El cliente mostró interés. Conviene reducir fricción y pedir una decisión simple.",
    };
  }

  if (estado.includes("sin")) {
    return {
      title: "Reactivar conversación",
      action: "Enviar mensaje corto y suave.",
      description:
        "Evita presionar. Busca una respuesta simple para reabrir la conversación.",
    };
  }

  return {
    title: "Mantener seguimiento",
    action: "Actualizar datos o programar próximo contacto.",
    description:
      "Todavía no hay señales fuertes. Mantén el cliente ordenado en el CRM.",
  };
}

function buildWhatsAppMessage(cliente: Cliente, today: string) {
  const estado = (cliente.estado || "").toLowerCase();
  const delta = daysBetween(cliente.proximo_contacto, today);

  if (delta !== null && delta < 0) {
    return `Hola ${cliente.nombre} 👋

Te escribo para retomar nuestro seguimiento. Vi que teníamos pendiente volver a conversar y no quería dejarlo pasar.

¿Te parece si revisamos el siguiente paso?`;
  }

  if (delta === 0) {
    return `Hola ${cliente.nombre} 👋

Tal como habíamos previsto, te escribo para dar seguimiento hoy.

¿Quieres que avancemos con el siguiente paso?`;
  }

  if (estado.includes("interes")) {
    return `Hola ${cliente.nombre} 👋

Gracias por el interés. Te escribo porque creo que podemos avanzar de forma simple con el siguiente paso.

¿Te gustaría que lo coordinemos?`;
  }

  if (estado.includes("sin")) {
    return `Hola ${cliente.nombre} 👋

Solo quería retomar por aquí de forma rápida.

¿Sigue siendo buen momento para conversar sobre esto?`;
  }

  return `Hola ${cliente.nombre} 👋

Te escribo para dar seguimiento y ver si podemos ayudarte con el siguiente paso.

Quedo atento.`;
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function AISummaryPanel({ cliente }: { cliente: Cliente }) {
  const summary = buildAIClientSummary(cliente);

  return (
    <div
      className={`rounded-[28px] border p-5 shadow-sm ${getAIClientSummaryClasses(
        summary.tone,
      )}`}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-current bg-white/60 px-3 py-1 text-xs font-semibold">
            AI Client Summary
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            ClienteYA piensa contigo
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6">
            {summary.summary}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Señal comercial
          </p>

          <p className="mt-2 text-sm font-medium leading-6">
            {summary.commercialSignal}
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Riesgo
          </p>

          <p className="mt-2 text-sm font-medium leading-6">
            {summary.risk}
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Próximo mejor paso
          </p>

          <p className="mt-2 text-sm font-medium leading-6">
            {summary.nextBestStep}
          </p>
        </div>
      </div>
    </div>
  );
}

async function getFounderModeForUser(userId: string, userEmail?: string | null) {
  const admin = createAdminClient();

  const { data: profileData } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const profile = (profileData || null) as Profile | null;

  const profileAccess = {
    ...(profile || {}),
    email: profile?.email || userEmail || null,
  } as ProfileAccess;

  const access = canAccessPro(profileAccess);

  return {
    admin,
    founderModeActive: access.reason === "founder_mode",
    hasAccess: access.allowed,
  };
}

export default async function EditarClientePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const clienteId = params.id;

  if (!clienteId) redirect("/dashboard/clientes");

  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { admin, founderModeActive, hasAccess } = await getFounderModeForUser(
    user.id,
    user.email,
  );

  if (!hasAccess) redirect("/dashboard");

  let clienteQuery = admin
    .from("clientes")
    .select("*")
    .eq("id", clienteId);

  if (!founderModeActive) {
    clienteQuery = clienteQuery.eq("user_id", user.id);
  }

  const { data: cliente, error } = await clienteQuery.maybeSingle();

  if (error || !cliente) redirect("/dashboard/clientes");

  let logsQuery = admin
    .from("activity_logs")
    .select("id,type,created_at")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (!founderModeActive) {
    logsQuery = logsQuery.eq("user_id", user.id);
  }

  const { data: logs } = await logsQuery;

  async function updateCliente(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { admin, founderModeActive, hasAccess } =
      await getFounderModeForUser(user.id, user.email);

    if (!hasAccess) redirect("/dashboard");

    const id = String(formData.get("id") || "");

    if (!id) redirect("/dashboard/clientes");

    let updateQuery = admin
      .from("clientes")
      .update({
        nombre: String(formData.get("nombre") || ""),
        telefono: String(formData.get("telefono") || ""),
        estado: String(formData.get("estado") || ""),
        notas: String(formData.get("notas") || ""),
        recordatorio: String(formData.get("recordatorio") || ""),
        proximo_contacto:
          String(formData.get("proximo_contacto") || "") || null,
      })
      .eq("id", id);

    if (!founderModeActive) {
      updateQuery = updateQuery.eq("user_id", user.id);
    }

    await updateQuery;

    await admin.from("activity_logs").insert({
      user_id: user.id,
      cliente_id: id,
      type: "manual_update",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");
    revalidatePath(`/dashboard/clientes/${id}`);
    revalidatePath(`/dashboard/editar?id=${id}`);

    redirect(`/dashboard/editar?id=${id}`);
  }

  const typedCliente = cliente as Cliente;
  const today = todayISO();
  const phase = getClientPhase(typedCliente, today);
  const score = getScore(typedCliente, today);
  const recommendation = buildRecommendation(typedCliente, today);
  const whatsappMessage = buildWhatsAppMessage(typedCliente, today);
  const whatsappUrl = buildWhatsAppUrl(typedCliente.telefono, whatsappMessage);

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1400px]">
              <PageHeader
                title={typedCliente.nombre}
                description="Editar cliente, revisar memoria comercial y preparar la próxima acción."
                badge={
                  founderModeActive
                    ? "Cliente Intelligence · Founder Mode"
                    : "Cliente Intelligence"
                }
                actionHref="/dashboard/clientes"
                actionLabel="Volver a clientes"
              />

              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard label="AI score" value={`${score}/100`} tone="sky" />
                  <KpiCard label="Fase" value={phase.label} tone="amber" />
                  <KpiCard
                    label="Próximo contacto"
                    value={formatDate(typedCliente.proximo_contacto)}
                  />
                  <KpiCard
                    label="Actividades"
                    value={logs?.length || 0}
                    tone="emerald"
                  />
                </div>

                <AISummaryPanel cliente={typedCliente} />

                <div
                  className={`rounded-[28px] border p-5 shadow-sm ${getPhaseClasses(
                    phase.tone,
                  )}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-2 inline-flex rounded-full border border-current bg-white/60 px-3 py-1 text-xs font-semibold">
                        AI recomendación
                      </div>

                      <h2 className="text-2xl font-bold tracking-tight">
                        {recommendation.title}
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-6">
                        {recommendation.description}
                      </p>

                      <p className="mt-3 text-sm font-semibold">
                        Acción: {recommendation.action}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={ui.buttons.success}
                      >
                        Enviar WhatsApp
                      </a>

                      <Link
                        href={`/dashboard/whatsapp?id=${typedCliente.id}`}
                        className={ui.buttons.secondary}
                      >
                        WhatsApp AI
                      </Link>

                      <Link
                        href={`/dashboard/clientes/${typedCliente.id}`}
                        className={ui.buttons.secondary}
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                  <SectionCard
                    badge="Editar"
                    title="Datos del cliente"
                    description="Mantén la información actualizada para que ClienteYA pueda priorizar mejor."
                  >
                    <form action={updateCliente} className="space-y-5">
                      <input type="hidden" name="id" value={typedCliente.id} />

                      <FormField label="Nombre">
                        <input
                          name="nombre"
                          defaultValue={typedCliente.nombre}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Teléfono">
                        <input
                          name="telefono"
                          defaultValue={typedCliente.telefono}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Estado">
                        <select
                          name="estado"
                          defaultValue={typedCliente.estado || ""}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        >
                          <option value="">Seleccionar estado</option>
                          <option value="Nuevo lead">Nuevo lead</option>
                          <option value="Contactado">Contactado</option>
                          <option value="Interesado">Interesado</option>
                          <option value="Sin respuesta">Sin respuesta</option>
                          <option value="Pagó">Pagó</option>
                          <option value="Cerrado">Cerrado</option>
                        </select>
                      </FormField>

                      <FormField label="Próximo contacto">
                        <input
                          type="date"
                          name="proximo_contacto"
                          defaultValue={typedCliente.proximo_contacto || ""}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Recordatorio">
                        <textarea
                          name="recordatorio"
                          defaultValue={typedCliente.recordatorio || ""}
                          rows={3}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Notas">
                        <textarea
                          name="notas"
                          defaultValue={typedCliente.notas || ""}
                          rows={6}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <div className="flex flex-wrap gap-3">
                        <button type="submit" className={ui.buttons.primary}>
                          Guardar cambios
                        </button>

                        <Link
                          href={`/dashboard/clientes/${typedCliente.id}`}
                          className={ui.buttons.secondary}
                        >
                          Volver al detalle
                        </Link>

                        <Link
                          href="/dashboard/clientes"
                          className={ui.buttons.secondary}
                        >
                          Cancelar
                        </Link>
                      </div>
                    </form>
                  </SectionCard>

                  <div className="space-y-6">
                    <SectionCard
                      badge="Memoria"
                      title="Memoria del cliente"
                      description="Resumen comercial actual."
                    >
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Estado actual
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {typedCliente.estado || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Fase AI
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {phase.label}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Próximo contacto
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {formatDate(typedCliente.proximo_contacto)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Recordatorio
                          </p>

                          <p className="mt-1 font-medium leading-6 text-slate-700">
                            {typedCliente.recordatorio || "—"}
                          </p>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard
                      badge="Timeline"
                      title="Actividad reciente"
                      description={`${logs?.length || 0} actividad(es) registrada(s).`}
                    >
                      {!logs || logs.length === 0 ? (
                        <EmptyState
                          icon="📌"
                          title="No hay actividad todavía"
                          description="Cuando actualices o contactes al cliente, aparecerá aquí."
                        />
                      ) : (
                        <div className="space-y-3">
                          {logs.map((log: ActivityLog) => (
                            <div
                              key={log.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <p className="text-sm font-medium text-slate-800">
                                {getActivityIcon(log.type)}{" "}
                                {getActivityLabel(log.type)}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {formatDateTime(log.created_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}