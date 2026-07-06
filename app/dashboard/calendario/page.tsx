import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import MobileDashboardNav from "../MobileDashboardNav";

import { createWhatsAppUrl, defaultTemplates } from "../../../lib/whatsapp";

import { getTemplate, renderTemplate } from "../../../lib/get-whatsapp-template";

import {
  applySuggestionAction,
  type SuggestionActionType,
} from "../../../lib/action-engine";

import {
  buildCalendarCommercialOverview,
  getCalendarCommercialEmptyText,
  getCalendarCommercialWhatsAppKey,
  type CalendarCommercialBucketKey,
  type CalendarCommercialItem,
} from "../../../lib/calendar-commercial-adapter";

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
  updated_at?: string | null;
  memory?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
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
    updated_at: cliente.updated_at ?? null,
    memory: cliente.memory ?? null,
    monto: cliente.monto ?? null,
    pagado: cliente.pagado ?? false,
    fecha_pago: cliente.fecha_pago ?? null,
  };
}

async function getClienteWhatsAppMessage(item: CalendarCommercialItem, userId: string) {
  const key = getCalendarCommercialWhatsAppKey(item);
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
    nombre: item.nombre,
    nota: item.recordatorio,
    fecha: item.proximo_contacto,
  });
}

function EmptyColumn({ bucket }: { bucket: CalendarCommercialBucketKey }) {
  const empty = getCalendarCommercialEmptyText(bucket);

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="font-semibold text-slate-900">{empty.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{empty.text}</p>
    </div>
  );
}

function getColumnClasses(tone: CalendarCommercialItem["tone"]) {
  if (tone === "red") return "border-red-200";
  if (tone === "amber") return "border-amber-200";
  if (tone === "emerald") return "border-emerald-200";
  if (tone === "violet") return "border-violet-200";
  if (tone === "sky") return "border-sky-200";

  return "border-slate-200";
}

function getCountClasses(tone: CalendarCommercialItem["tone"]) {
  if (tone === "red") return "bg-red-100 text-red-700";
  if (tone === "amber") return "bg-amber-100 text-amber-700";
  if (tone === "emerald") return "bg-emerald-100 text-emerald-700";
  if (tone === "violet") return "bg-violet-100 text-violet-700";
  if (tone === "sky") return "bg-sky-100 text-sky-700";

  return "bg-slate-100 text-slate-700";
}

function getCardClasses(tone: CalendarCommercialItem["tone"]) {
  if (tone === "red") return "border-red-100 bg-red-50";
  if (tone === "amber") return "border-amber-100 bg-amber-50";
  if (tone === "emerald") return "border-emerald-100 bg-emerald-50";
  if (tone === "violet") return "border-violet-100 bg-violet-50";
  if (tone === "sky") return "border-sky-100 bg-sky-50";

  return "border-slate-200 bg-slate-50";
}

function getDateClasses(tone: CalendarCommercialItem["tone"]) {
  if (tone === "red") return "text-red-700";
  if (tone === "amber") return "text-amber-700";
  if (tone === "emerald") return "text-emerald-700";
  if (tone === "violet") return "text-violet-700";
  if (tone === "sky") return "text-sky-700";

  return "text-slate-600";
}

function CalendarClientCard({
  item,
  whatsappMessage,
  aplicarAccion,
}: {
  item: CalendarCommercialItem;
  whatsappMessage: string;
  aplicarAccion: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-4 ${getCardClasses(item.tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{item.nombre}</p>
          <p className={`mt-1 text-xs ${getDateClasses(item.tone)}`}>
            {formatDate(item.proximo_contacto)}
          </p>
        </div>

        <span className="rounded-full border border-white bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
          {item.estado}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {item.reason || item.recordatorio || item.notas || "Sin recordatorio"}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-white bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
          COS {item.commercialScore}/100
        </span>

        <span className="rounded-full border border-white bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
          Memory {item.memoryScore}/100
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/dashboard/clientes/${item.id}`}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Ver cliente
        </a>

        <a
          href={createWhatsAppUrl(item.telefono, whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          WhatsApp
        </a>

        <form action={aplicarAccion}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="actionType" value={item.actionType} />

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            {item.actionLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

function CalendarColumn({
  bucket,
  title,
  items,
  whatsappMap,
  aplicarAccion,
}: {
  bucket: CalendarCommercialBucketKey;
  title: string;
  items: CalendarCommercialItem[];
  whatsappMap: Map<string, string>;
  aplicarAccion: (formData: FormData) => Promise<void>;
}) {
  const tone = items[0]?.tone || "slate";

  return (
    <div className={`rounded-3xl border bg-white p-6 shadow-sm ${getColumnClasses(tone)}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getCountClasses(tone)}`}>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyColumn bucket={bucket} />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <CalendarClientCard
              key={item.id}
              item={item}
              whatsappMessage={whatsappMap.get(item.id) || ""}
              aplicarAccion={aplicarAccion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: CalendarCommercialItem["tone"];
}) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${getCardClasses(tone)}`}>
      <p className={`text-sm font-medium ${getDateClasses(tone)}`}>{label}</p>
      <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default async function CalendarioPage() {
  const authSupabase = await createAuthServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) redirect("/login");

  async function aplicarAccion(formData: FormData) {
    "use server";

    const authSupabase = await createAuthServerClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) redirect("/login");

    const id = String(formData.get("id") || "");
    const actionType = String(formData.get("actionType") || "") as SuggestionActionType;

    if (!id) redirect("/dashboard/calendario");

    await applySuggestionAction({
      userId: user.id,
      clienteId: id,
      actionType,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendario");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");
    revalidatePath("/dashboard/cockpit");
    revalidatePath(`/dashboard/clientes/${id}`);

    redirect("/dashboard/calendario");
  }

  const { data: clientesData } = await authSupabase
    .from("clientes")
    .select("*")
    .eq("user_id", user.id)
    .order("proximo_contacto", { ascending: true });

  const clientes: Cliente[] = ((clientesData || []) as Partial<Cliente>[]).map(normalizeCliente);
  const overview = buildCalendarCommercialOverview(clientes);

  const whatsappMessages = await Promise.all(
    overview.all.map(async (item) => ({
      id: item.id,
      message: await getClienteWhatsAppMessage(item, user.id),
    })),
  );

  const whatsappMap = new Map(whatsappMessages.map((item) => [item.id, item.message]));

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
                    Planificación comercial conectada al Commercial Operating System: atrasados,
                    hoy, mañana, pasado mañana y próximos 14 días.
                  </p>
                </div>

                <a
                  href="/dashboard/nuevo"
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  + Nuevo cliente
                </a>
              </div>

              <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <OverviewCard label="Atrasados" value={overview.counts.atrasados} tone="red" />
                <OverviewCard label="Hoy" value={overview.counts.hoy} tone="amber" />
                <OverviewCard label="Mañana" value={overview.counts.manana} tone="emerald" />
                <OverviewCard label="Pasado mañana" value={overview.counts.pasadoManana} tone="violet" />
                <OverviewCard label="Próximos 14 días" value={overview.counts.proximos14} tone="sky" />
                <OverviewCard label="Sin fecha" value={overview.counts.sinFecha} tone="slate" />
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <CalendarColumn
                  bucket="atrasados"
                  title="Atrasados"
                  items={overview.atrasados}
                  whatsappMap={whatsappMap}
                  aplicarAccion={aplicarAccion}
                />

                <CalendarColumn
                  bucket="hoy"
                  title="Hoy"
                  items={overview.hoy}
                  whatsappMap={whatsappMap}
                  aplicarAccion={aplicarAccion}
                />

                <CalendarColumn
                  bucket="manana"
                  title="Mañana"
                  items={overview.manana}
                  whatsappMap={whatsappMap}
                  aplicarAccion={aplicarAccion}
                />

                <CalendarColumn
                  bucket="pasadoManana"
                  title="Pasado mañana"
                  items={overview.pasadoManana}
                  whatsappMap={whatsappMap}
                  aplicarAccion={aplicarAccion}
                />

                <CalendarColumn
                  bucket="proximos14"
                  title="Próximos 14 días"
                  items={overview.proximos14}
                  whatsappMap={whatsappMap}
                  aplicarAccion={aplicarAccion}
                />

                <CalendarColumn
                  bucket="sinFecha"
                  title="Sin fecha"
                  items={overview.sinFecha}
                  whatsappMap={whatsappMap}
                  aplicarAccion={aplicarAccion}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileDashboardNav />
    </div>
  );
}
