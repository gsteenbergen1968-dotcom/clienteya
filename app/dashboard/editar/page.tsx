import { createAdminClient } from "../../../lib/supabase/server";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { redirect } from "next/navigation";

async function updateCliente(formData: FormData) {
  "use server";

  const authSupabase = await createAuthServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") || "").trim();
  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim();
  const estado = String(formData.get("estado") || "Nuevo").trim();
  const notas = String(formData.get("notas") || "").trim();
  const recordatorio = String(formData.get("recordatorio") || "").trim();
  const proximo_contacto = String(formData.get("proximo_contacto") || "").trim();

  if (!id || !nombre || !telefono) {
    redirect("/dashboard");
  }

  const supabase = createAdminClient();

  const { error } = await supabase
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

  if (error) {
    redirect("/dashboard");
  }

  redirect("/dashboard");
}

function Sidebar() {
  return (
    <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-lg font-bold text-white">
            C
          </div>
          <div>
            <p className="text-lg font-bold">ClienteYA</p>
            <p className="text-sm text-slate-500">Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          <a
            href="/dashboard"
            className="block rounded-2xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100"
          >
            Resumen
          </a>

          <a
            href="/dashboard/nuevo"
            className="block rounded-2xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100"
          >
            + Nuevo cliente
          </a>

          <a
            href="/dashboard/calendario"
            className="block rounded-2xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100"
          >
            Calendario
          </a>

          <a
            href="/dashboard"
            className="block rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
          >
            Clientes
          </a>
        </div>
      </nav>
    </aside>
  );
}

export default async function EditarClientePage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>;
}) {
  const authSupabase = await createAuthServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const id = params?.id || "";

  if (!id) {
    redirect("/dashboard");
  }

  const supabase = createAdminClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !cliente) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Editar cliente</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Actualiza los datos del cliente
                </p>
              </div>

              <a
                href="/dashboard"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Volver
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <form action={updateCliente} className="space-y-6">
                <input type="hidden" name="id" value={cliente.id} />

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Nombre
                  </label>
                  <input
                    name="nombre"
                    type="text"
                    defaultValue={cliente.nombre}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Teléfono
                  </label>
                  <input
                    name="telefono"
                    type="text"
                    defaultValue={cliente.telefono}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Estado
                  </label>
                  <select
                    name="estado"
                    defaultValue={cliente.estado}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                  >
                    <option value="Nuevo">Nuevo</option>
                    <option value="Interesado">Interesado</option>
                    <option value="Pagó">Pagó</option>
                    <option value="Entregado">Entregado</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Notas
                  </label>
                  <textarea
                    name="notas"
                    defaultValue={cliente.notas || ""}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Recordatorio
                  </label>
                  <input
                    name="recordatorio"
                    type="text"
                    defaultValue={cliente.recordatorio || ""}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Próximo contacto
                  </label>
                  <input
                    name="proximo_contacto"
                    type="date"
                    defaultValue={cliente.proximo_contacto || ""}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <a
                    href="/dashboard"
                    className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </a>

                  <button
                    type="submit"
                    className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}