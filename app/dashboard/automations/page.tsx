import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";

import { buildWhatsAppLink } from "../../../lib/whatsapp-link";

import {
  applyAutomationRules,
  buildAutomationReminders,
} from "../../../lib/automation-engine";

export const dynamic = "force-dynamic";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  estado?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
};

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  const [y, m, d] = parts;

  return `${d}/${m}/${y}`;
}

function addDaysISO(days: number) {
  const d = new Date();

  d.setDate(d.getDate() + days);

  return d.toISOString().slice(0, 10);
}

function getPriorityClasses(priority: string) {
  if (priority === "urgent") {
    return "border-red-200 bg-red-50";
  }

  if (priority === "high") {
    return "border-amber-200 bg-amber-50";
  }

  if (priority === "medium") {
    return "border-sky-200 bg-sky-50";
  }

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
  if (priority === "urgent") {
    return "Urgente";
  }

  if (priority === "high") {
    return "Alta";
  }

  if (priority === "medium") {
    return "Media";
  }

  return "Normal";
}

export default async function AutomationsPage() {
  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function markContacted(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const id = String(formData.get("id") || "");

    if (!id) {
      redirect("/dashboard/automations");
    }

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Contactado",
        recordatorio: "Cliente contactado desde automations",
        proximo_contacto: addDaysISO(3),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/automations");
  }

  async function snoozeFollowup(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const id = String(formData.get("id") || "");

    if (!id) {
      redirect("/dashboard/automations");
    }

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Sin respuesta",
        recordatorio: "Reintentar contacto en 3 días",
        proximo_contacto: addDaysISO(3),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/automations");
  }

  async function closeDeal(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const id = String(formData.get("id") || "");

    if (!id) {
      redirect("/dashboard/automations");
    }

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Pagado",
        recordatorio: "Cliente convertido correctamente",
      })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/automations");
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("clientes")
    .select("id,nombre,telefono,estado,recordatorio,proximo_contacto")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error loading automations:", error.message);
  }

  const clientes = applyAutomationRules((data ?? []) as Cliente[]);

  const reminders = buildAutomationReminders(clientes);

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
              <PageHeader
                title="Automations"
                description="CRM intelligence, follow-ups y acciones recomendadas."
              />

              {reminders.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                  No hay automatizaciones todavía.
                </div>
              ) : (
                <div className="space-y-5">
                  {reminders.map((reminder) => {
                    const cliente = reminder.cliente;

                    const message =
                      cliente.recordatorio ||
                      `Hola ${cliente.nombre}, te escribo para hacer seguimiento 👋`;

                    const link = buildWhatsAppLink(
                      cliente.telefono,
                      message
                    );

                    return (
                      <div
                        key={cliente.id}
                        className={`rounded-3xl border p-6 shadow-sm transition ${getPriorityClasses(
                          reminder.priority
                        )}`}
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="max-w-3xl">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClasses(
                                  reminder.priority
                                )}`}
                              >
                                {getPriorityLabel(reminder.priority)}
                              </span>

                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                                Score {reminder.score}
                              </span>
                            </div>

                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                              {cliente.nombre}
                            </h2>

                            <p className="mt-1 text-base text-slate-500">
                              {cliente.telefono}
                            </p>

                            <p className="mt-2 text-sm text-slate-400">
                              Próximo contacto:{" "}
                              {formatDate(cliente.proximo_contacto)}
                            </p>

                            <div className="mt-5">
                              <p className="text-lg font-semibold text-slate-900">
                                {reminder.title}
                              </p>

                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {reminder.description}
                              </p>
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Next best action
                              </p>

                              <p className="mt-2 text-sm font-medium text-slate-700">
                                {reminder.nextBestAction}
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm text-slate-700">
                              {message}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-3">
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-2xl bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                              Quick send
                            </a>

                            <a
                              href={`/dashboard/whatsapp?id=${cliente.id}`}
                              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Editor
                            </a>

                            <a
                              href={`/dashboard/editar?id=${cliente.id}`}
                              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Abrir cliente
                            </a>

                            <form action={markContacted}>
                              <input
                                type="hidden"
                                name="id"
                                value={cliente.id}
                              />

                              <button
                                type="submit"
                                className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                              >
                                ✅ Contactado
                              </button>
                            </form>

                            <form action={snoozeFollowup}>
                              <input
                                type="hidden"
                                name="id"
                                value={cliente.id}
                              />

                              <button
                                type="submit"
                                className="w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                              >
                                ⏰ +3 días
                              </button>
                            </form>

                            <form action={closeDeal}>
                              <input
                                type="hidden"
                                name="id"
                                value={cliente.id}
                              />

                              <button
                                type="submit"
                                className="w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                              >
                                💰 Cerrado
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}