import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
};

type ActivityLog = {
  id: string;
  type: string;
  created_at: string;
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

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getActivityLabel(type: string) {
  if (type === "contactado") {
    return "✅ Cliente contactado";
  }

  if (type === "followup_scheduled") {
    return "⏰ Follow-up agendado";
  }

  if (type === "closed") {
    return "💰 Oportunidad cerrada";
  }

  if (type === "no_response") {
    return "🚫 Cliente sin respuesta";
  }

  if (type === "followup") {
    return "📨 Automation ejecutada";
  }

  return "📌 Actividad registrada";
}

export default async function EditarClientePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;

  const clienteId = params.id;

  if (!clienteId) {
    redirect("/dashboard/clientes");
  }

  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data: cliente, error } = await admin
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .eq("user_id", user.id)
    .single();

  if (error || !cliente) {
    redirect("/dashboard/clientes");
  }

  const { data: logs } = await admin
    .from("activity_logs")
    .select("id,type,created_at")
    .eq("cliente_id", clienteId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  async function updateCliente(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const admin = createAdminClient();

    const id = String(formData.get("id") || "");

    const nombre = String(formData.get("nombre") || "");
    const telefono = String(formData.get("telefono") || "");
    const estado = String(formData.get("estado") || "");
    const notas = String(formData.get("notas") || "");
    const recordatorio = String(formData.get("recordatorio") || "");
    const proximo_contacto = String(
      formData.get("proximo_contacto") || ""
    );

    await admin
      .from("clientes")
      .update({
        nombre,
        telefono,
        estado,
        notas,
        recordatorio,
        proximo_contacto: proximo_contacto || null,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    await admin.from("activity_logs").insert({
      user_id: user.id,
      cliente_id: id,
      type: "manual_update",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");
    revalidatePath(`/dashboard/editar?id=${id}`);

    redirect(`/dashboard/editar?id=${id}`);
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
            <div className="mx-auto max-w-5xl">
              <PageHeader
                title={cliente.nombre}
                description="Editar cliente y revisar actividad."
              />

              <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <form action={updateCliente} className="space-y-5">
                    <input type="hidden" name="id" value={cliente.id} />

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Nombre
                      </label>

                      <input
                        name="nombre"
                        defaultValue={cliente.nombre}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Teléfono
                      </label>

                      <input
                        name="telefono"
                        defaultValue={cliente.telefono}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Estado
                      </label>

                      <input
                        name="estado"
                        defaultValue={cliente.estado || ""}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Próximo contacto
                      </label>

                      <input
                        type="date"
                        name="proximo_contacto"
                        defaultValue={cliente.proximo_contacto || ""}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Recordatorio
                      </label>

                      <textarea
                        name="recordatorio"
                        defaultValue={cliente.recordatorio || ""}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Notas
                      </label>

                      <textarea
                        name="notas"
                        defaultValue={cliente.notas || ""}
                        rows={6}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Guardar cambios
                    </button>
                  </form>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Cliente snapshot
                    </h2>

                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Estado
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {cliente.estado || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Próximo contacto
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(cliente.proximo_contacto)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Reminder
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {cliente.recordatorio || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Activity history
                      </h2>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {logs?.length || 0}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      {!logs || logs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          No hay actividad todavía.
                        </div>
                      ) : (
                        logs.map((log: ActivityLog) => (
                          <div
                            key={log.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <p className="text-sm font-medium text-slate-800">
                              {getActivityLabel(log.type)}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDateTime(log.created_at)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
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