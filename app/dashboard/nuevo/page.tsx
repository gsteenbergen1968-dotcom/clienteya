import { createAdminClient } from "../../../lib/supabase/server";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { redirect } from "next/navigation";

async function createCliente(formData: FormData) {
  "use server";

  const authSupabase = await createAuthServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim();
  const estado = String(formData.get("estado") || "Nuevo").trim();
  const notas = String(formData.get("notas") || "").trim();
  const recordatorio = String(formData.get("recordatorio") || "").trim();
  const proximo_contacto = String(formData.get("proximo_contacto") || "").trim();

  if (!nombre || !telefono) {
    redirect("/dashboard/nuevo?error=Completa+nombre+y+telefono");
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("clientes").insert([
    {
      user_id: user.id,
      nombre,
      telefono,
      estado,
      notas,
      recordatorio,
      proximo_contacto: proximo_contacto || null,
    },
  ]);

  if (error) {
    redirect("/dashboard/nuevo?error=No+se+pudo+guardar+el+cliente");
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
            className="block rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
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
            className="block rounded-2xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100"
          >
            Clientes
          </a>
        </div>
      </nav>
    </aside>
  );
}

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Nuevo cliente</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Agrega un nuevo cliente a tu dashboard
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
              {error ? (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <form action={createCliente} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Nombre
                  </label>
                  <input
                    name="nombre"
                    type="text"
                    placeholder="Ej. María López"
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
                    placeholder="Ej. 0981 123 456"
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
                    defaultValue="Nuevo"
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
                    Guardar cliente
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