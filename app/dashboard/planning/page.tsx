import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";

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

import type { RelationshipRecord } from "../../../lib/relationship-repository";

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function getParaguayToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
}

function addPlanningDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

function formatPlanningDate(date: Date) {
  return new Intl.DateTimeFormat("es-PY", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(date)
    .replace(".", "");
}

function formatPlanningRange(start: Date, end: Date) {
  const startDay = new Intl.DateTimeFormat("es-PY", {
    day: "numeric",
    timeZone: "UTC",
  }).format(start);

  const endLabel = formatPlanningDate(end);

  return `${startDay}–${endLabel}`;
}

async function getRelationshipWhatsAppMessage(
  item: CalendarCommercialItem,
  userId: string,
) {
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

function CalendarRelationshipCard({
  item,
  whatsappMessage,
  applyAction,
}: {
  item: CalendarCommercialItem;
  whatsappMessage: string;
  applyAction: (formData: FormData) => Promise<void>;
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
          ClienteYA {item.commercialScore}/100
        </span>

        <span className="rounded-full border border-white bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
          Memoria {item.memoryScore}/100
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/dashboard/relationships/${item.id}`}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Ver relación
        </a>

        <a
          href={createWhatsAppUrl(item.telefono, whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          WhatsApp
        </a>

        <form action={applyAction}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="actionType" value={item.actionType} />

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            {item.actionLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

function PlanningColumn({
  bucket,
  title,
  dateLabel,
  items,
  whatsappMap,
  applyAction,
}: {
  bucket: CalendarCommercialBucketKey;
  title: string;
  dateLabel?: string;
  items: CalendarCommercialItem[];
  whatsappMap: Map<string, string>;
  applyAction: (formData: FormData) => Promise<void>;
}) {
  const tone = items[0]?.tone || "slate";

  return (
    <div
      className={`rounded-3xl border bg-white p-6 shadow-sm ${getColumnClasses(
        tone,
      )}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

          {dateLabel ? (
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {dateLabel}
            </p>
          ) : null}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getCountClasses(
            tone,
          )}`}
        >
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyColumn bucket={bucket} />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <CalendarRelationshipCard
              key={item.id}
              item={item}
              whatsappMessage={whatsappMap.get(item.id) || ""}
              applyAction={applyAction}
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
      <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default async function PlanningPage() {
  const authSupabase = await createAuthServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) redirect("/login");

  async function applyAction(formData: FormData) {
    "use server";

    const authSupabase = await createAuthServerClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) redirect("/login");

    const id = String(formData.get("id") || "");
    const actionType = String(
      formData.get("actionType") || "",
    ) as SuggestionActionType;

    if (!id) redirect("/dashboard/planning");

    await applySuggestionAction({
      userId: user.id,
      relationshipId: id,
      actionType,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/planning");
    revalidatePath("/dashboard/relationships");
    revalidatePath("/dashboard/automations");
    revalidatePath("/dashboard/cockpit");
    revalidatePath(`/dashboard/relationships/${id}`);

    redirect("/dashboard/planning");
  }

  const { data: relationshipsData, error: relationshipsError } =
    await authSupabase
      .from("relationships")
      .select("*")
      .eq("owner_id", user.id)
      .order("next_contact_at", { ascending: true });

  if (relationshipsError) {
    throw new Error(relationshipsError.message);
  }

  const relationships =
    (relationshipsData || []) as RelationshipRecord[];

  const overview =
    buildCalendarCommercialOverview(relationships);

  const whatsappMessages = await Promise.all(
    overview.all.map(async (item) => ({
      id: item.id,
      message: await getRelationshipWhatsAppMessage(item, user.id),
    })),
  );

  const whatsappMap = new Map(
    whatsappMessages.map((item) => [item.id, item.message]),
  );

  const planningToday = getParaguayToday();
  const planningTomorrow = addPlanningDays(planningToday, 1);
  const planningDayAfterTomorrow = addPlanningDays(planningToday, 2);
  const planningRangeStart = addPlanningDays(planningToday, 3);
  const planningRangeEnd = addPlanningDays(planningToday, 14);

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
                    Planificación
                  </p>

                  <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                    Planificación
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Las próximas acciones que requieren tu atención, organizadas por
                    momento: atrasados, hoy, mañana, pasado mañana y próximos 14 días.
                  </p>
                </div>
              </div>

              <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <OverviewCard
                  label="Atrasados"
                  value={overview.counts.atrasados}
                  tone="red"
                />

                <OverviewCard
                  label="Hoy"
                  value={overview.counts.hoy}
                  tone="amber"
                />

                <OverviewCard
                  label="Mañana"
                  value={overview.counts.manana}
                  tone="emerald"
                />

                <OverviewCard
                  label="Pasado mañana"
                  value={overview.counts.pasadoManana}
                  tone="violet"
                />

                <OverviewCard
                  label="Próximos 14 días"
                  value={overview.counts.proximos14}
                  tone="sky"
                />

                <OverviewCard
                  label="Sin fecha"
                  value={overview.counts.sinFecha}
                  tone="slate"
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <PlanningColumn
                  bucket="atrasados"
                  title="Atrasados"
                  items={overview.atrasados}
                  whatsappMap={whatsappMap}
                  applyAction={applyAction}
                />

                <PlanningColumn
                  bucket="hoy"
                  title="Hoy"
                  dateLabel={formatPlanningDate(planningToday)}
                  items={overview.hoy}
                  whatsappMap={whatsappMap}
                  applyAction={applyAction}
                />

                <PlanningColumn
                  bucket="manana"
                  title="Mañana"
                  dateLabel={formatPlanningDate(planningTomorrow)}
                  items={overview.manana}
                  whatsappMap={whatsappMap}
                  applyAction={applyAction}
                />

                <PlanningColumn
                  bucket="pasadoManana"
                  title="Pasado mañana"
                  dateLabel={formatPlanningDate(planningDayAfterTomorrow)}
                  items={overview.pasadoManana}
                  whatsappMap={whatsappMap}
                  applyAction={applyAction}
                />

                <PlanningColumn
                  bucket="proximos14"
                  title="Próximos 14 días"
                  dateLabel={formatPlanningRange(
                    planningRangeStart,
                    planningRangeEnd,
                  )}
                  items={overview.proximos14}
                  whatsappMap={whatsappMap}
                  applyAction={applyAction}
                />

                <PlanningColumn
                  bucket="sinFecha"
                  title="Sin fecha"
                  items={overview.sinFecha}
                  whatsappMap={whatsappMap}
                  applyAction={applyAction}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}