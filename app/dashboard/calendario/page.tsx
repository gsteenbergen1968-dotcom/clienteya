import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import MobileDashboardNav from "../MobileDashboardNav";

import {
  createWhatsAppUrl,
  defaultTemplates,
} from "../../../lib/whatsapp";

import {
  getTemplate,
  renderTemplate,
} from "../../../lib/get-whatsapp-template";

import {
  applySuggestionAction,
  type SuggestionActionType,
} from "../../../lib/action-engine";

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

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function addDaysISO(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString().split("T")[0];
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function normalizeCliente(cliente: Partial<Cliente>): Cliente {
  return {
    id: String(cliente.id || ""),
    user_id: cliente.user_id ?? null,
    nombre: cliente.nombre || "Cliente sin nombre",
    telefono: cliente.telefono || "",
    estado: cliente.estado || "Sin estado",
    notas: cliente.notas ?? null,
    recordatorio: cliente.recordatorio ?? null,
    proximo_contacto: cliente.proximo_contacto ?? null,
    created_at: cliente.created_at || new Date().toISOString(),
    monto: cliente.monto ?? null,
    pagado: cliente.pagado ?? false,
    fecha_pago: cliente.fecha_pago ?? null,
  };
}

async function getClienteWhatsAppMessage(
  cliente: Cliente,
  userId: string,
) {
  const today = todayISO();

  let key:
    | "nuevo"
    | "hoy"
    | "pendiente"
    | "proximo"
    | "postventa" = "nuevo";

  if (
    cliente.proximo_contacto &&
    cliente.proximo_contacto < today
  ) {
    key = "pendiente";
  } else if (cliente.proximo_contacto === today) {
    key = "hoy";
  } else if (
    cliente.proximo_contacto &&
    cliente.proximo_contacto > today
  ) {
    key = "proximo";
  } else if (
    cliente.estado === "Pagó" ||
    cliente.estado === "pagado" ||
    cliente.estado === "Entregado" ||
    cliente.estado === "entregado"
  ) {
    key = "postventa";
  }

  const savedTemplate = await getTemplate(userId, key);

  let fallback = "";

  if (key === "nuevo") {
    fallback = defaultTemplates.nuevo();
  } else if (key === "hoy") {
    fallback = defaultTemplates.hoy();
  } else if (key === "pendiente") {
    fallback = defaultTemplates.pendiente();
  } else if (key === "proximo") {
    fallback = defaultTemplates.proximo();
  } else {
    fallback = defaultTemplates.postventa();
  }

  return renderTemplate(savedTemplate || fallback, {
    nombre: cliente.nombre,
    nota: cliente.recordatorio,
    fecha: cliente.proximo_contacto,
  });
}

function EmptyColumn({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="font-semibold text-slate-900">{title}</p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function CalendarClientCard({
  cliente,
  tone,
  whatsappMessage,
  actionType,
  actionLabel,
  aplicarAccion,
}: {
  cliente: Cliente;
  tone: "red" | "amber" | "sky";
  whatsappMessage: string;
  actionType: SuggestionActionType;
  actionLabel: string;
  aplicarAccion: (formData: FormData) => Promise<void>;
}) {
  const toneClasses = {
    red: {
      card: "border-red-100 bg-red-50",
      date: "text-red-700",
    },
    amber: {
      card: "border-amber-100 bg-amber-50",
      date: "text-amber-700",
    },
    sky: {
      card: "border-sky-100 bg-sky-50",
      date: "text-sky-700",
    },
  }[tone];

  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${toneClasses.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">
            {cliente.nombre}
          </p>

          <p className={`mt-1 text-xs ${toneClasses.date}`}>
            {formatDate(cliente.proximo_contacto)}
          </p>
        </div>

        <span className="rounded-full border border-white bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
          {cliente.estado}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {cliente.recordatorio ||
          cliente.notas ||
          "Sin recordatorio"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/dashboard/clientes/${cliente.id}`}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Ver cliente
        </a>

        <a
          href={createWhatsAppUrl(
            cliente.telefono,
            whatsappMessage,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          WhatsApp
        </a>

        <form action={aplicarAccion}>
          <input
            type="hidden"
            name="id"
            value={cliente.id}
          />

          <input
            type="hidden"
            name="actionType"
            value={actionType}
          />

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            {actionLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function CalendarioPage() {
  const authSupabase = await createAuthServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function aplicarAccion(formData: FormData) {
    "use server";

    const authSupabase = await createAuthServerClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const id = String(formData.get("id") || "");
    const actionType = String(
      formData.get("actionType") || "",
    ) as SuggestionActionType;

    if (!id) {
      redirect("/dashboard/calendario");
    }

    await applySuggestionAction({
      userId: user.id,
      clienteId: id,
      actionType,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendario");
    revalidatePath("/dashboard/clientes");
    revalidatePath(`/dashboard/clientes/${id}`);

    redirect("/dashboard/calendario");
  }

  const { data: clientesData } = await authSupabase
    .from("clientes")
    .select("*")
    .eq("user_id", user.id)
    .order("proximo_contacto", { ascending: true });

  const clientes: Cliente[] = (
    (clientesData || []) as Partial<Cliente>[]
  ).map(normalizeCliente);

  const today = todayISO();
  const tomorrow = addDaysISO(1);
  const nextSevenDays = addDaysISO(7);

  const atrasados = clientes.filter(
    (cliente) =>
      cliente.proximo_contacto &&
      cliente.proximo_contacto < today,
  );

  const hoyClientes = clientes.filter(
    (cliente) => cliente.proximo_contacto === today,
  );

  const proximosClientes = clientes.filter(
    (cliente) =>
      cliente.proximo_contacto &&
      cliente.proximo_contacto >= tomorrow &&
      cliente.proximo_contacto <= nextSevenDays,
  );

  const sinFecha = clientes.filter(
    (cliente) => !cliente.proximo_contacto,
  );

  const whatsappMessages = await Promise.all(
    clientes.map(async (cliente) => ({
      id: cliente.id,
      message: await getClienteWhatsAppMessage(
        cliente,
        user.id,
      ),
    })),
  );

  const whatsappMap = new Map(
    whatsappMessages.map((item) => [item.id, item.message]),
  );

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 pb-36 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                    Agenda comercial
                  </p>

                  <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                    Calendario
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Seguimientos atrasados, contactos de hoy y próximos
                    movimientos comerciales conectados directamente con cada
                    relación.
                  </p>
                </div>

                <a
                  href="/dashboard/nuevo"
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  + Nuevo cliente
                </a>
              </div>

              <div className="mb-8 grid gap-4 md:grid-cols-4">
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
                  <p className="text-sm font-medium text-red-700">
                    Atrasados
                  </p>

                  <p className="mt-4 text-4xl font-bold tracking-tight text-red-900">
                    {atrasados.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <p className="text-sm font-medium text-amber-700">
                    Hoy
                  </p>

                  <p className="mt-4 text-4xl font-bold tracking-tight text-amber-900">
                    {hoyClientes.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
                  <p className="text-sm font-medium text-sky-700">
                    Próximos 7 días
                  </p>

                  <p className="mt-4 text-4xl font-bold tracking-tight text-sky-900">
                    {proximosClientes.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-slate-600">
                    Sin fecha
                  </p>

                  <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
                    {sinFecha.length}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Atrasados
                    </h2>

                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      {atrasados.length}
                    </span>
                  </div>

                  {atrasados.length === 0 ? (
                    <EmptyColumn
                      title="Nada urgente"
                      text="No tienes seguimientos atrasados."
                    />
                  ) : (
                    <div className="space-y-4">
                      {atrasados.map((cliente) => (
                        <CalendarClientCard
                          key={cliente.id}
                          cliente={cliente}
                          tone="red"
                          whatsappMessage={
                            whatsappMap.get(cliente.id) || ""
                          }
                          actionType="contactado"
                          actionLabel="✔ Contactado"
                          aplicarAccion={aplicarAccion}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Hoy
                    </h2>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {hoyClientes.length}
                    </span>
                  </div>

                  {hoyClientes.length === 0 ? (
                    <EmptyColumn
                      title="Todo despejado"
                      text="No tienes seguimientos para hoy."
                    />
                  ) : (
                    <div className="space-y-4">
                      {hoyClientes.map((cliente) => (
                        <CalendarClientCard
                          key={cliente.id}
                          cliente={cliente}
                          tone="amber"
                          whatsappMessage={
                            whatsappMap.get(cliente.id) || ""
                          }
                          actionType="listo"
                          actionLabel="✔ Listo"
                          aplicarAccion={aplicarAccion}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Próximos 7 días
                    </h2>

                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {proximosClientes.length}
                    </span>
                  </div>

                  {proximosClientes.length === 0 ? (
                    <EmptyColumn
                      title="Sin próximos contactos"
                      text="No tienes seguimientos programados para los próximos 7 días."
                    />
                  ) : (
                    <div className="space-y-4">
                      {proximosClientes.map((cliente) => (
                        <CalendarClientCard
                          key={cliente.id}
                          cliente={cliente}
                          tone="sky"
                          whatsappMessage={
                            whatsappMap.get(cliente.id) || ""
                          }
                          actionType="schedule"
                          actionLabel="Agendar siguiente"
                          aplicarAccion={aplicarAccion}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileDashboardNav />
    </div>
  );
}