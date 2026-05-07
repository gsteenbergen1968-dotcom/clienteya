import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";

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
  pagado?: boolean | null;
  monto?: number | null;
  fecha_pago?: string | null;
};

function formatDateDisplay(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function dateInputValue(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
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

export default async function EditarClientePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; ok?: string; error?: string }>;
}) {
  const { id, ok, error } = await searchParams;

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!id) {
    redirect("/dashboard/clientes");
  }

  async function saveCliente(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const clienteId = String(formData.get("id") || "").trim();
    const nombre = String(formData.get("nombre") || "").trim();
    const telefono = String(formData.get("telefono") || "").trim();
    const estado = String(formData.get("estado") || "Nuevo").trim();
    const notas = String(formData.get("notas") || "").trim();
    const recordatorio = String(formData.get("recordatorio") || "").trim();
    const proximoContacto = String(
      formData.get("proximo_contacto") || ""
    ).trim();

    if (!clienteId || !nombre || !telefono) {
      redirect(`/dashboard/editar?id=${clienteId}&error=missing`);
    }

    if (proximoContacto && !/^\d{4}-\d{2}-\d{2}$/.test(proximoContacto)) {
      redirect(`/dashboard/editar?id=${clienteId}&error=date`);
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("clientes")
      .update({
        nombre,
        telefono,
        estado,
        notas: notas || null,
        recordatorio: recordatorio || null,
        proximo_contacto: proximoContacto || null,
      })
      .eq("id", clienteId)
      .eq("user_id", user.id);

    if (error) {
      redirect(`/dashboard/editar?id=${clienteId}&error=save`);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");
    revalidatePath("/dashboard/calendario");
    revalidatePath(`/dashboard/whatsapp?id=${clienteId}`);
    revalidatePath(`/dashboard/editar?id=${clienteId}`);

    redirect(`/dashboard/editar?id=${clienteId}&ok=1`);
  }

  const admin = createAdminClient();

  const { data } = await admin
    .from("clientes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const cliente = data as Cliente | null;

  if (!cliente) {
    redirect("/dashboard/clientes");
  }

  const message =
    ok === "1"
      ? "Cliente actualizado correctamente."
      : error === "missing"
      ? "Completa nombre y teléfono."
      : error === "date"
      ? "La fecha debe tener formato válido."
      : error === "save"
      ? "No pudimos guardar los cambios."
      : null;

  const isSuccess = ok === "1";

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
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                      <ParaguayBadge />
                      Paraguay
                    </span>
                  </div>

                  <h1 className="text-5xl font-bold tracking-tight text-slate-950">
                    Editar cliente
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    Actualiza datos, seguimiento y fecha de próximo contacto sin
                    errores de zona horaria.
                  </p>
                </div>

                <a
                  href="/dashboard/clientes"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                >
                  Volver a clientes
                </a>
              </div>

              {message && (
                <div
                  className={`mb-6 rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    isSuccess
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {isSuccess ? "✅ " : "⚠️ "}
                  {message}
                </div>
              )}

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <form
                  action={saveCliente}
                  className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <input type="hidden" name="id" value={cliente.id} />

                  <div className="mb-5">
                    <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      Edición principal
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Datos del cliente
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Guarda nombre, teléfono, estado y fecha de seguimiento.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Nombre
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        defaultValue={cliente.nombre || ""}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        name="telefono"
                        defaultValue={cliente.telefono || ""}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Estado
                      </label>
                      <select
                        name="estado"
                        defaultValue={cliente.estado || "Nuevo"}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      >
                        <option value="Nuevo">Nuevo</option>
                        <option value="Interesado">Interesado</option>
                        <option value="Pagó">Pagó</option>
                        <option value="Entregado">Entregado</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Próximo contacto
                      </label>
                      <input
                        type="date"
                        name="proximo_contacto"
                        defaultValue={dateInputValue(cliente.proximo_contacto)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Esta fecha se guarda exactamente como la eliges.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Recordatorio
                    </label>
                    <input
                      type="text"
                      name="recordatorio"
                      defaultValue={cliente.recordatorio || ""}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Notas
                    </label>
                    <textarea
                      name="notas"
                      rows={6}
                      defaultValue={cliente.notas || ""}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Guardar cambios
                    </button>

                    <a
                      href={`/dashboard/whatsapp?id=${cliente.id}`}
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      Ver WhatsApp AI
                    </a>
                  </div>
                </form>

                <div className="space-y-6">
                  <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      Resumen actual
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Nombre
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {cliente.nombre}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Teléfono
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {cliente.telefono}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Estado
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {cliente.estado}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Próximo contacto
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDateDisplay(cliente.proximo_contacto)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      Nota importante
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      Esta página usa el valor de fecha en formato{" "}
                      <span className="font-semibold text-slate-900">
                        YYYY-MM-DD
                      </span>{" "}
                      internamente para evitar que el sistema reste un día por
                      error.
                    </p>
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