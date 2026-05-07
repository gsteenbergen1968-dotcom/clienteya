import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";
import { buildAssistantVariants } from "../../../lib/whatsapp-assistant";
import { getPlanAccess } from "../../../lib/plan-access";
import {
  getDailyUsage,
  consumeDailyUsage,
  type UsageResult,
} from "../../../lib/usage";
import { logActivity } from "../../../lib/activity";
import { scheduleAutoFollowup } from "../../../lib/followup-engine";
import PreviewEditor from "./PreviewEditor";
import { getWhatsAppLogsByCliente } from "../../../lib/whatsapp-logs";

type Cliente = {
  id: string;
  user_id: string | null;
  nombre: string;
  telefono: string;
  estado: string;
  notas: string | null;
  recordatorio: string | null;
  proximo_contacto: string | null;
};

const BASIC_AI_DAILY_LIMIT = 3;
const AI_FEATURE = "ai_whatsapp_preview";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-ES");
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildLockedPreview(cliente: Cliente) {
  return `Hola ${cliente.nombre} 👋

Te escribo porque quería retomar nuestro seguimiento.

${
    cliente.recordatorio
      ? `Recordatorio: ${cliente.recordatorio}.`
      : "Si quieres, podemos avanzar con el siguiente paso."
  }

Quedo atento 😊`;
}

function ParaguayBadge() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1/3 bg-red-500" />
      <div className="absolute inset-x-0 top-1/3 h-1/3 bg-white" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-blue-600" />
      <span className="relative z-10 text-[10px] font-bold text-slate-900">
        PY
      </span>
    </div>
  );
}

function ContextPaywallCard({
  cliente,
  usage,
}: {
  cliente: Cliente;
  usage: UsageResult | null;
}) {
  const preview = buildLockedPreview(cliente);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Cliente
          </h2>

          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Nombre
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {cliente.nombre}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Teléfono
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {cliente.telefono}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Estado
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {cliente.estado}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Próximo
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(cliente.proximo_contacto)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700">
            Límite diario
          </div>

          <h2 className="text-xl font-semibold text-slate-900">
            Llegaste al límite gratuito de hoy
          </h2>

          <p className="mt-3 text-sm leading-6 text-amber-800">
            Usaste {usage?.used || 0}/{usage?.limit || BASIC_AI_DAILY_LIMIT}{" "}
            mensajes AI gratuitos hoy. El siguiente mensaje ya está casi listo;
            activa Pro para desbloquearlo y enviarlo ahora.
          </p>

          <a
            href="/billing"
            className="mt-5 inline-block rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Activar Pro
          </a>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none select-none opacity-45 blur-[3px]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Mensaje listo para enviar
            </h2>

            <div className="mt-5 min-h-[360px] rounded-[24px] border border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-900">
              <p className="whitespace-pre-wrap">{preview}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Copiar
              </span>
              <span className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Regenerar
              </span>
              <span className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Abrir WhatsApp
              </span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-6 max-w-md rounded-[28px] border border-blue-200 bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-xl">
              🔒
            </div>

            <h2 className="text-2xl font-bold text-slate-950">
              Este mensaje ya está listo
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Estabas a punto de enviar un mensaje inteligente a{" "}
              <strong>{cliente.nombre}</strong>. Activa Pro para desbloquearlo,
              usar variantes y continuar sin límites.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="/billing"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Activar Pro ahora
              </a>

              <a
                href="/dashboard/clientes"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Volver a clientes
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function WhatsAppPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; ok?: string }>;
}) {
  const { id, ok } = await searchParams;

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!id) redirect("/dashboard/clientes");

  async function marcarContactado(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const plan = await getPlanAccess(user.id);
    if (!plan.isPro) redirect("/billing");

    const clienteId = String(formData.get("clienteId") || "");
    if (!clienteId) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Contactado",
        recordatorio: "Cliente contactado desde WhatsApp AI",
      })
      .eq("id", clienteId)
      .eq("user_id", user.id);

    await logActivity({
      userId: user.id,
      type: "contacted",
      clienteId,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");
    revalidatePath(`/dashboard/whatsapp?id=${clienteId}`);

    redirect(`/dashboard/whatsapp?id=${clienteId}&ok=contactado`);
  }

  async function marcarSinRespuesta(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const plan = await getPlanAccess(user.id);
    if (!plan.isPro) redirect("/billing");

    const clienteId = String(formData.get("clienteId") || "");
    if (!clienteId) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Sin respuesta",
        recordatorio: "Reintentar contacto en 3 días",
        proximo_contacto: addDaysISO(3),
      })
      .eq("id", clienteId)
      .eq("user_id", user.id);

    await scheduleAutoFollowup({
      userId: user.id,
      clienteId,
      days: 3,
    });

    await logActivity({
      userId: user.id,
      type: "followup",
      clienteId,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");
    revalidatePath(`/dashboard/whatsapp?id=${clienteId}`);

    redirect(`/dashboard/whatsapp?id=${clienteId}&ok=sin-respuesta`);
  }

  async function cerrarOportunidad(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const plan = await getPlanAccess(user.id);
    if (!plan.isPro) redirect("/billing");

    const clienteId = String(formData.get("clienteId") || "");
    if (!clienteId) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Cerrado",
        recordatorio: "Oportunidad cerrada desde WhatsApp AI",
        proximo_contacto: null,
      })
      .eq("id", clienteId)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");
    revalidatePath(`/dashboard/whatsapp?id=${clienteId}`);

    redirect(`/dashboard/whatsapp?id=${clienteId}&ok=cerrado`);
  }

  const admin = createAdminClient();

  const { data } = await admin
    .from("clientes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const cliente = data as Cliente | null;

  if (!cliente) redirect("/dashboard/clientes");

  const plan = await getPlanAccess(user.id);

  const logs = await getWhatsAppLogsByCliente({
    userId: user.id,
    clienteId: cliente.id,
  });

  const okMessage =
    ok === "contactado"
      ? "Cliente marcado como contactado."
      : ok === "sin-respuesta"
      ? "Cliente marcado como sin respuesta. Se agendó seguimiento automático en 3 días."
      : ok === "cerrado"
      ? "Oportunidad cerrada correctamente."
      : null;

  const isBasicActive = plan.planType === "basic" && plan.isActive;
  const isPro = plan.isPro;

  let usage: UsageResult | null = null;
  let variants: Awaited<ReturnType<typeof buildAssistantVariants>> = [];
  let initialMessage = "";
  let canGenerateAI = false;

  if (isPro) {
    canGenerateAI = true;
  }

  if (isBasicActive && !isPro) {
    const currentUsage = await getDailyUsage({
      userId: user.id,
      feature: AI_FEATURE,
      limit: BASIC_AI_DAILY_LIMIT,
    });

    if (currentUsage.allowed) {
      usage = await consumeDailyUsage({
        userId: user.id,
        feature: AI_FEATURE,
        limit: BASIC_AI_DAILY_LIMIT,
      });

      canGenerateAI = usage.allowed;
    } else {
      usage = currentUsage;
      canGenerateAI = false;
    }
  }

  if (canGenerateAI) {
    variants = await buildAssistantVariants({
      userId: user.id,
      cliente,
    });

    initialMessage = variants?.[0]?.message || `Hola ${cliente.nombre}`;

    if (!isPro) {
      await logActivity({
        userId: user.id,
        type: "ai_message",
        clienteId: cliente.id,
      });
    }
  }

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-6 py-10">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                      <ParaguayBadge />
                      Paraguay
                    </span>
                  </div>

                  <h1 className="text-5xl font-bold tracking-tight text-slate-950">
                    Asistente WhatsApp
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    Edita, envía y actualiza el estado del cliente desde un mismo lugar.
                  </p>
                </div>

                <a
                  href="/dashboard/clientes"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                >
                  Volver a clientes
                </a>
              </div>

              {okMessage && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
                  ✅ {okMessage}
                </div>
              )}

              {!canGenerateAI ? (
                <ContextPaywallCard cliente={cliente} usage={usage} />
              ) : (
                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
                  <div className="space-y-6">
                    {!isPro && usage && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
                        ⚡ Te quedan <strong>{usage.remaining}</strong>{" "}
                        mensajes AI gratis hoy.
                      </div>
                    )}

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                      <h2 className="mb-4 text-xl font-semibold text-slate-900">
                        Cliente
                      </h2>

                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Nombre
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {cliente.nombre}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Teléfono
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {cliente.telefono}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Estado
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {cliente.estado}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Próximo
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {formatDate(cliente.proximo_contacto)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isPro && (
                      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 text-xl font-semibold text-slate-900">
                          Acciones CRM
                        </h2>

                        <div className="space-y-3">
                          <form action={marcarContactado}>
                            <input
                              type="hidden"
                              name="clienteId"
                              value={cliente.id}
                            />
                            <button
                              type="submit"
                              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                              ✅ Marcar contactado
                            </button>
                          </form>

                          <form action={marcarSinRespuesta}>
                            <input
                              type="hidden"
                              name="clienteId"
                              value={cliente.id}
                            />
                            <button
                              type="submit"
                              className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                            >
                              🟠 Sin respuesta — reintentar en 3 días
                            </button>
                          </form>

                          <form action={cerrarOportunidad}>
                            <input
                              type="hidden"
                              name="clienteId"
                              value={cliente.id}
                            />
                            <button
                              type="submit"
                              className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                            >
                              🔴 Cerrar oportunidad
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                      <h2 className="mb-4 text-xl font-semibold text-slate-900">
                        Historial de mensajes
                      </h2>

                      {logs.length === 0 && (
                        <p className="text-sm text-slate-500">
                          Aún no hay mensajes registrados.
                        </p>
                      )}

                      <div className="space-y-3">
                        {logs.map((log) => (
                          <div
                            key={log.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm"
                          >
                            <div className="mb-2 text-xs text-slate-400">
                              {formatDateTime(log.created_at)}
                            </div>

                            <div className="whitespace-pre-wrap leading-6 text-slate-700">
                              {log.message}
                            </div>

                            <div className="mt-2 text-xs text-slate-400">
                              {log.source}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <PreviewEditor
                    cliente={{
                      id: cliente.id,
                      nombre: cliente.nombre,
                      telefono: cliente.telefono,
                    }}
                    initialMessage={initialMessage}
                    variants={variants}
                    isPro={isPro}
                    usage={usage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}