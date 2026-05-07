import { createAdminClient } from "../../lib/supabase/server";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppHeader } from "../components/AppHeader";
import SidebarNav from "./SidebarNav";
import {
  applySuggestionAction,
  type SuggestionActionType,
} from "../../lib/action-engine";
import { getAccessState } from "../../lib/access-control";
import { getWeeklyStats } from "../../lib/activity";
import TopReminders from "./TopReminders";
import UpgradeTriggerCard from "./UpgradeTriggerCard";

export const dynamic = "force-dynamic";

type Cliente = {
  id: string;
  user_id: string | null;
  nombre: string;
  telefono: string;
  estado: string;
  notas: string | null;
  recordatorio: string | null;
  proximo_contacto: string | null;
  created_at: string;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  payment_proof_url: string | null;
  payment_notes: string | null;
  created_at: string | null;
  plan_type?: string | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatGs(value: number) {
  return `Gs. ${value.toLocaleString("es-ES")}`;
}

function getBadgeClasses(estado: string) {
  const value = estado.toLowerCase();

  if (value === "pagó" || value === "pagado") {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (value === "interesado") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }

  if (value === "sin respuesta") {
    return "border-orange-200 bg-orange-100 text-orange-700";
  }

  if (value === "contactado") {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (value === "cerrado") {
    return "border-red-200 bg-red-100 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}




function FeedbackBanner({ ok }: { ok?: string }) {
  if (!ok) return null;

  const messages: Record<string, string> = {
    contactado: "Cliente actualizado como contactado.",
    listo: "Cliente marcado como listo.",
    pagado: "Pago registrado correctamente.",
    agendado: "Siguiente acción agendada correctamente.",
  };

  return (
    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
      ✅ {messages[ok] || "Cambios guardados correctamente."}
    </div>
  );
}

function AccessNotice({
  accessState,
  trialEndsAt,
}: {
  accessState: string;
  trialEndsAt?: string | null;
}) {
  if (accessState === "active") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
        ✅ Tu cuenta está activa.
      </div>
    );
  }

  if (accessState === "trial") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
        🟠 Trial activo hasta {formatDate(trialEndsAt)}.
      </div>
    );
  }

  if (accessState === "pending") {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 shadow-sm">
        🔎 Pago en revisión. Revisaremos tu comprobante y activaremos tu cuenta.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
      ⛔ Tu acceso está pausado. Activa tu plan desde billing.
    </div>
  );
}

function EmptyStateHero() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl shadow-sm">
        🚀
      </div>

      <h2 className="text-3xl font-bold tracking-tight text-slate-900">
        Bienvenido a ClienteYA
      </h2>

      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
        Carga tu primer cliente para empezar a usar seguimiento, WhatsApp y pagos desde un mismo lugar.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href="/dashboard/nuevo"
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Crear primer cliente
        </a>

        <a
          href="/billing"
          className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          Ver plan
        </a>
      </div>
    </div>
  );
}

function NextActionCard({
  cliente,
  type,
}: {
  cliente: Cliente | null;
  type: "overdue" | "today" | "tomorrow" | "none";
}) {
  if (!cliente) {
    return (
      <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-sm font-semibold text-emerald-800">
          ✅ Todo al día
        </p>
        <p className="mt-2 text-sm text-emerald-700">
          No tienes seguimientos urgentes ahora.
        </p>
      </div>
    );
  }

  const copy =
    type === "overdue"
      ? {
          badge: "Urgente",
          title: "Siguiente acción recomendada",
          text: "Este cliente está atrasado. Conviene contactarlo primero.",
          styles: "border-red-200 bg-red-50 text-red-800",
        }
      : type === "today"
      ? {
          badge: "Hoy",
          title: "Siguiente acción para hoy",
          text: "Este cliente tiene seguimiento programado para hoy.",
          styles: "border-amber-200 bg-amber-50 text-amber-800",
        }
      : {
          badge: "Mañana",
          title: "Prepara este seguimiento",
          text: "Este cliente tiene seguimiento próximo. Puedes dejar WhatsApp listo.",
          styles: "border-sky-200 bg-sky-50 text-sky-800",
        };

  return (
    <div className={`rounded-[28px] border p-5 shadow-sm ${copy.styles}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="rounded-full border border-current bg-white/60 px-3 py-1 text-xs font-semibold">
            {copy.badge}
          </span>

          <h2 className="mt-3 text-xl font-bold text-slate-950">
            {copy.title}
          </h2>

          <p className="mt-1 text-sm">{copy.text}</p>

          <p className="mt-3 text-lg font-semibold text-slate-950">
            {cliente.nombre}
          </p>

          <p className="text-sm">
            {formatDate(cliente.proximo_contacto)} · {cliente.telefono}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/dashboard/whatsapp?id=${cliente.id}`}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Abrir WhatsApp
          </a>

          <a
            href="/dashboard/automations"
            className="rounded-2xl border border-current bg-white px-5 py-3 text-sm font-semibold shadow-sm transition hover:bg-white/80"
          >
            Ver automations
          </a>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "amber" | "emerald" | "red" | "sky";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    red: "border-red-200 bg-red-50 text-red-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
  };

  const labels = {
    slate: "text-slate-500",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    red: "text-red-700",
    sky: "text-sky-700",
  };

  return (
    <div className={`rounded-[22px] border p-4 shadow-sm ${tones[tone]}`}>
      <p className={`text-xs font-medium ${labels[tone]}`}>{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function ActivityStatsCard({
  ai,
  contacted,
  followup,
  whatsapp,
}: {
  ai: number;
  contacted: number;
  followup: number;
  whatsapp: number;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Actividad semanal
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            Tu impacto
          </h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <MiniStat label="AI" value={ai} />
        <MiniStat label="WhatsApp" value={whatsapp} tone="sky" />
        <MiniStat label="Contactados" value={contacted} tone="emerald" />
        <MiniStat label="Seguimientos" value={followup} tone="amber" />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {whatsapp > 0 ? (
          <>
            📲 Abriste <strong>{whatsapp}</strong> conversaciones en WhatsApp.
          </>
        ) : (
          <>Empieza usando WhatsApp AI para generar actividad.</>
        )}
      </div>
    </div>
  );
}

function QuickSummary({
  clientes,
  atrasados,
  hoyClientes,
  mananaClientes,
  pagados,
  totalRevenue,
}: {
  clientes: Cliente[];
  atrasados: Cliente[];
  hoyClientes: Cliente[];
  mananaClientes: Cliente[];
  pagados: Cliente[];
  totalRevenue: number;
}) {
  const conversion =
    clientes.length > 0 ? Math.round((pagados.length / clientes.length) * 100) : 0;

  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <MiniStat label="Clientes" value={clientes.length} />
      <MiniStat label="Atrasados" value={atrasados.length} tone="red" />
      <MiniStat label="Hoy" value={hoyClientes.length} tone="amber" />
      <MiniStat label="Mañana" value={mananaClientes.length} tone="sky" />
      <MiniStat label="Pagados" value={pagados.length} tone="emerald" />
      <MiniStat label="Conv." value={`${conversion}%`} tone="sky" />

      <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm md:col-span-3 xl:col-span-6">
        <p className="text-xs font-medium text-slate-500">Ingresos acumulados</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {formatGs(totalRevenue)}
        </p>
      </div>
    </div>
  );
}

function ClientCompactCard({
  cliente,
  today,
  tomorrow,
  onMarkPaid,
}: {
  cliente: Cliente;
  today: string;
  tomorrow: string;
  onMarkPaid: (formData: FormData) => Promise<void>;
}) {
  const isOverdue = cliente.proximo_contacto && cliente.proximo_contacto < today;
  const isToday = cliente.proximo_contacto === today;
  const isTomorrow = cliente.proximo_contacto === tomorrow;

  return (
    <div
      className={`rounded-[22px] border p-4 shadow-sm ${
        isOverdue
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold leading-tight text-slate-900">
              {cliente.nombre}
            </p>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getBadgeClasses(
                cliente.estado
              )}`}
            >
              {cliente.estado}
            </span>

            {isOverdue && (
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
          </div>

          <p className="mt-1 text-sm text-slate-500">{cliente.telefono}</p>

          <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Próximo
              </p>
              <p className="mt-1 text-slate-700">
                {formatDate(cliente.proximo_contacto)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 md:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Recordatorio
              </p>
              <p className="mt-1 line-clamp-2 text-slate-700">
                {cliente.recordatorio || cliente.notas || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <a
            href={`/dashboard/editar?id=${cliente.id}`}
            className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Editar
          </a>

          <a
            href={`/dashboard/whatsapp?id=${cliente.id}`}
            className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            WhatsApp AI
          </a>

          <form action={onMarkPaid}>
            <input type="hidden" name="id" value={cliente.id} />
            <button
              type="submit"
              className="rounded-2xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              💰 Pagado
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;

  const authSupabase = await createAuthServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) redirect("/login");

  async function marcarPagado(formData: FormData) {
    "use server";

    const authSupabase = await createAuthServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) redirect("/login");

    const id = String(formData.get("id") || "");
    if (!id) redirect("/dashboard");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Pagó",
        pagado: true,
        monto: 50000,
        fecha_pago: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard?ok=pagado");
  }

  async function aplicarSugerencia(formData: FormData) {
    "use server";

    const authSupabase = await createAuthServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) redirect("/login");

    const id = String(formData.get("id") || "");
    const actionType = String(
      formData.get("actionType") || ""
    ) as SuggestionActionType;

    if (!id) redirect("/dashboard");

    await applySuggestionAction({
      userId: user.id,
      clienteId: id,
      actionType,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    if (actionType === "contactado") redirect("/dashboard?ok=contactado");
    if (actionType === "listo") redirect("/dashboard?ok=listo");

    redirect("/dashboard?ok=agendado");
  }

  const admin = createAdminClient();

  const [{ data: profileData }, { data: clientesData }, stats] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      admin
        .from("clientes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      getWeeklyStats(user.id),
    ]);

  const profile = (profileData || null) as Profile | null;
  const clientes: Cliente[] = clientesData || [];

  const access = getAccessState({
    subscription_status: profile?.subscription_status || null,
    trial_ends_at: profile?.trial_ends_at || null,
  });

  const today = todayISO();
  const tomorrow = tomorrowISO();

  const atrasados = clientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto < today
  );

  const hoyClientes = clientes.filter((c) => c.proximo_contacto === today);
  const mananaClientes = clientes.filter((c) => c.proximo_contacto === tomorrow);

  const pagados = clientes.filter(
    (c) =>
      c.pagado === true ||
      c.estado === "Pagó" ||
      c.estado.toLowerCase() === "pagado"
  );

  const totalRevenue = clientes.reduce((sum, c) => {
    if (
      c.pagado ||
      c.estado === "Pagó" ||
      c.estado.toLowerCase() === "pagado"
    ) {
      return sum + Number(c.monto || 0);
    }

    return sum;
  }, 0);

  const compactClients = [...clientes].slice(0, 8);

  const nextActionCliente =
    atrasados[0] || hoyClientes[0] || mananaClientes[0] || null;

  const nextActionType = atrasados[0]
    ? "overdue"
    : hoyClientes[0]
    ? "today"
    : mananaClientes[0]
    ? "tomorrow"
    : "none";

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-6 py-8">
            <div className="mx-auto max-w-7xl">
              <FeedbackBanner ok={ok} />

              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3">
                    
                  </div>

                  <h1 className="text-5xl font-bold tracking-tight text-slate-950">
                    Dashboard
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    Resumen compacto de clientes, seguimiento, WhatsApp AI e ingresos.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="/dashboard/nuevo"
                    className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    + Nuevo cliente
                  </a>

                  <a
                    href="/billing"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                  >
                    Activar plan
                  </a>
                </div>
              </div>

              <div className="mb-5">
                <AccessNotice
                  accessState={access.accessState}
                  trialEndsAt={profile?.trial_ends_at || null}
                />
              </div>

              {!access.hasAccess && (
                <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-center shadow-sm">
                  <h2 className="text-2xl font-bold text-red-700">
                    Acceso limitado
                  </h2>
                  <p className="mt-2 text-sm text-red-600">
                    Activa tu plan desde billing para usar el dashboard completo.
                  </p>
                  <a
                    href="/billing"
                    className="mt-4 inline-block rounded-2xl bg-blue-600 px-6 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Ir a billing
                  </a>
                </div>
              )}

              {access.hasAccess && clientes.length === 0 && <EmptyStateHero />}

              {access.hasAccess && clientes.length > 0 && (
                <div className="space-y-5">
                  <NextActionCard
                    cliente={nextActionCliente}
                    type={nextActionType}
                  />

                  <QuickSummary
                    clientes={clientes}
                    atrasados={atrasados}
                    hoyClientes={hoyClientes}
                    mananaClientes={mananaClientes}
                    pagados={pagados}
                    totalRevenue={totalRevenue}
                  />

                  <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    <ActivityStatsCard
                      ai={stats.ai}
                      contacted={stats.contacted}
                      followup={stats.followup}
                      whatsapp={stats.whatsapp}
                    />

                    <UpgradeTriggerCard
                      planType={profile?.plan_type}
                      subscriptionStatus={profile?.subscription_status}
                      stats={stats}
                    />
                  </div>

                  <TopReminders
                    clientes={clientes}
                    onQuickAction={aplicarSugerencia}
                  />

                  <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900">
                            Clientes recientes
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            Vista compacta de tu base actual.
                          </p>
                        </div>

                        <a
                          href="/dashboard/clientes"
                          className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                        >
                          Ver todos
                        </a>
                      </div>

                      <div className="space-y-3">
                        {compactClients.map((cliente) => (
                          <ClientCompactCard
                            key={cliente.id}
                            cliente={cliente}
                            today={today}
                            tomorrow={tomorrow}
                            onMarkPaid={marcarPagado}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-slate-900">
                            Atrasados
                          </h2>
                          <span className="rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            {atrasados.length}
                          </span>
                        </div>

                        {atrasados.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No tienes seguimientos atrasados.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {atrasados.slice(0, 4).map((c) => (
                              <div
                                key={c.id}
                                className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm"
                              >
                                <p className="font-semibold text-slate-900">
                                  {c.nombre}
                                </p>
                                <p className="mt-1 text-xs text-red-700">
                                  {formatDate(c.proximo_contacto)}
                                </p>
                                <a
                                  href={`/dashboard/whatsapp?id=${c.id}`}
                                  className="mt-3 inline-block rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                >
                                  WhatsApp AI
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-[28px] border border-sky-200 bg-sky-50 p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-slate-900">
                            Próximos
                          </h2>
                          <span className="rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            {mananaClientes.length}
                          </span>
                        </div>

                        {mananaClientes.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No tienes contactos para mañana.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {mananaClientes.slice(0, 4).map((c) => (
                              <div
                                key={c.id}
                                className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm"
                              >
                                <p className="font-semibold text-slate-900">
                                  {c.nombre}
                                </p>
                                <p className="mt-1 text-xs text-sky-700">
                                  {formatDate(c.proximo_contacto)}
                                </p>
                                <a
                                  href={`/dashboard/whatsapp?id=${c.id}`}
                                  className="mt-3 inline-block rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                >
                                  Preparar WhatsApp
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">
                          Estado del negocio
                        </h2>

                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Clientes</span>
                            <span className="font-semibold text-slate-900">
                              {clientes.length}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Pagados</span>
                            <span className="font-semibold text-slate-900">
                              {pagados.length}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <span className="text-slate-600">Ingresos</span>
                            <span className="font-semibold text-slate-900">
                              {formatGs(totalRevenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}