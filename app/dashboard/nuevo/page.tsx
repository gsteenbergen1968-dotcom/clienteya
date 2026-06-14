import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";

export default async function NuevoClientePage() {
  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function createCliente(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const nombre = String(formData.get("nombre") || "").trim();
    const telefono = String(formData.get("telefono") || "").trim();
    const estado = String(formData.get("estado") || "Nuevo").trim();

    const proximoContacto = String(
      formData.get("proximo_contacto") || ""
    ).trim();

    const recordatorio = String(
      formData.get("recordatorio") || ""
    ).trim();

    const notas = String(formData.get("notas") || "").trim();

    if (!nombre || !telefono) {
      redirect("/dashboard/nuevo");
    }

    const { error } = await supabase.from("clientes").insert({
      user_id: user.id,
      nombre,
      telefono,
      estado,
      proximo_contacto: proximoContacto || null,
      recordatorio: recordatorio || null,
      notas: notas || null,
    });

    if (error) {
      console.error("CLIENTE INSERT ERROR:", error);

      redirect("/dashboard/nuevo");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard");
  }

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
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      <span className="text-sm">🇵🇾</span>
                      Paraguay
                    </span>
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                    Nuevo cliente
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Agrega un nuevo contacto para empezar a hacer seguimiento,
                    recordar tareas y cerrar más ventas.
                  </p>
                </div>

                <a
                  href="/dashboard"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Volver al dashboard
                </a>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <form
                  action={createCliente}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Datos del cliente
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Completa los datos básicos para guardar el cliente en tu
                      tablero.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Nombre
                      </label>

                      <input
                        name="nombre"
                        required
                        placeholder="Ej. María González"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Teléfono
                      </label>

                      <input
                        name="telefono"
                        required
                        placeholder="Ej. 981123456"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Estado
                      </label>

                      <select
                        name="estado"
                        defaultValue="Nuevo"
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
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Recordatorio
                    </label>

                    <input
                      name="recordatorio"
                      placeholder="Ej. seguimiento whatsapp"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Notas
                    </label>

                    <textarea
                      name="notas"
                      rows={6}
                      placeholder="Escribe detalles importantes del cliente."
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Guardar cliente
                    </button>

                    <a
                      href="/dashboard"
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Cancelar
                    </a>
                  </div>
                </form>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Consejo rápido
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Mientras más claro sea el seguimiento, más fácil será
                      convertir clientes y organizar ventas.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-amber-900">
                      Importante
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-amber-800">
                      Usa números reales y limpios para que los accesos rápidos
                      por WhatsApp funcionen correctamente.
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