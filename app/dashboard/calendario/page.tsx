import { createAdminClient } from "../../../lib/supabase/server";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
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
import PageHeader from "../components/PageHeader";

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

function hoy() {
  return new Date().toISOString().split("T")[0];
}

function manana() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

async function getClienteWhatsAppMessage(cliente: Cliente, userId: string) {
  const today = hoy();

  let key: "nuevo" | "hoy" | "pendiente" | "proximo" | "postventa" = "nuevo";

  if (cliente.proximo_contacto && cliente.proximo_contacto < today) {
    key = "pendiente";
  } else if (cliente.proximo_contacto === today) {
    key = "hoy";
  } else if (cliente.proximo_contacto && cliente.proximo_contacto > today) {
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
    fallback = defaultTemplates.nuevo(cliente.nombre);
  } else if (key === "hoy") {
    fallback = defaultTemplates.hoy(cliente.nombre, cliente.recordatorio);
  } else if (key === "pendiente") {
    fallback = defaultTemplates.pendiente(cliente.nombre, cliente.recordatorio);
  } else if (key === "proximo") {
    fallback = defaultTemplates.proximo(
      cliente.nombre,
      cliente.proximo_contacto
    );
  } else {
    fallback = defaultTemplates.postventa(cliente.nombre);
  }

  const template = savedTemplate || fallback;

  return renderTemplate(template, {
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
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
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
    const actionType = String(formData.get("actionType") || "") as SuggestionActionType;

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
    redirect("/dashboard/calendario");
  }

  const admin = createAdminClient();

  const { data: clientesData } = await admin
    .from("clientes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const clientes: Cliente[] = clientesData || [];
  const hoyDate = hoy();
  const mananaDate = manana();

  const atrasados = clientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto < hoyDate
  );

  const hoyClientes = clientes.filter((c) => c.proximo_contacto === hoyDate);

  const proximosClientes = clientes.filter(
    (c) => c.proximo_contacto === mananaDate
  );

  const whatsappMessages = await Promise.all(
    clientes.map(async (cliente) => ({
      id: cliente.id,
      message: await getClienteWhatsAppMessage(cliente, user.id),
    }))
  );

  const whatsappMap = new Map(
    whatsappMessages.map((item) => [item.id, item.message])
  );

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-6 py-10">
  <div className="mx-auto max-w-7xl">

    <PageHeader
      title="Calendario"
      description="Revisa seguimientos atrasados, tareas para hoy y próximos contactos."
    />

              <div className="mb-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
                  <p className="text-sm font-medium text-red-700">Atrasados</p>
                  <p className="mt-4 text-4xl font-bold tracking-tight text-red-900">
                    {atrasados.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <p className="text-sm font-medium text-amber-700">Hoy</p>
                  <p className="mt-4 text-4xl font-bold tracking-tight text-amber-900">
                    {hoyClientes.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
                  <p className="text-sm font-medium text-sky-700">Mañana</p>
                  <p className="mt-4 text-4xl font-bold tracking-tight text-sky-900">
                    {proximosClientes.length}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
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
                      {atrasados.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4"
                        >
                          <p className="font-semibold text-slate-900">{c.nombre}</p>
                          <p className="mt-1 text-xs text-red-700">
                            {c.proximo_contacto || "—"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {c.recordatorio || "Sin recordatorio"}
                          </p>

                          <div className="mt-3 flex gap-2">
                            <a
                              href={createWhatsAppUrl(
                                c.telefono,
                                whatsappMap.get(c.id) || ""
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                            >
                              WhatsApp
                            </a>

                            <form action={aplicarAccion}>
                              <input type="hidden" name="id" value={c.id} />
                              <input
                                type="hidden"
                                name="actionType"
                                value="contactado"
                              />
                              <button
                                type="submit"
                                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                              >
                                ✔ Contactado
                              </button>
                            </form>
                          </div>
                        </div>
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
                      {hoyClientes.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4"
                        >
                          <p className="font-semibold text-slate-900">{c.nombre}</p>
                          <p className="mt-2 text-sm text-slate-600">
                            {c.recordatorio || "Sin nota"}
                          </p>

                          <div className="mt-3 flex gap-2">
                            <a
                              href={createWhatsAppUrl(
                                c.telefono,
                                whatsappMap.get(c.id) || ""
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                            >
                              WhatsApp
                            </a>

                            <form action={aplicarAccion}>
                              <input type="hidden" name="id" value={c.id} />
                              <input type="hidden" name="actionType" value="listo" />
                              <button
                                type="submit"
                                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                              >
                                ✔ Listo
                              </button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Mañana
                    </h2>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {proximosClientes.length}
                    </span>
                  </div>

                  {proximosClientes.length === 0 ? (
                    <EmptyColumn
                      title="Sin tareas mañana"
                      text="No tienes próximos seguimientos para mañana."
                    />
                  ) : (
                    <div className="space-y-4">
                      {proximosClientes.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4"
                        >
                          <p className="font-semibold text-slate-900">{c.nombre}</p>
                          <p className="mt-1 text-xs text-sky-700">
                            {c.proximo_contacto || "—"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {c.recordatorio || "Sin recordatorio"}
                          </p>

                          <div className="mt-3 flex gap-2">
                            <a
                              href={createWhatsAppUrl(
                                c.telefono,
                                whatsappMap.get(c.id) || ""
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                            >
                              WhatsApp
                            </a>

                            <form action={aplicarAccion}>
                              <input type="hidden" name="id" value={c.id} />
                              <input
                                type="hidden"
                                name="actionType"
                                value="schedule"
                              />
                              <button
                                type="submit"
                                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                              >
                                Agendar siguiente
                              </button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}