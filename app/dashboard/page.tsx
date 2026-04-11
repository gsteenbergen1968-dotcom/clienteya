import { createAdminClient } from "../../lib/supabase/server";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import LogoutButton from "../components/logout-button";
import { redirect } from "next/navigation";

type Cliente = {
  id: string;
  user_id: string | null;
  nombre: string;
  telefono: string;
  estado: string;
  notas: string;
  recordatorio: string | null;
  proximo_contacto: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  subscription_status: string | null;
  trial_ends_at: string | null;
  payment_proof_url: string | null;
  payment_notes: string | null;
};

function getBadgeClasses(estado: string) {
  if (estado === "Pagó") return "bg-emerald-100 text-emerald-700";
  if (estado === "Interesado") return "bg-amber-100 text-amber-700";
  if (estado === "Entregado") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-700";
}

function whatsappUrl(telefono: string, mensaje: string) {
  const cleanPhone = `595${telefono.replace(/\D/g, "")}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
}

function hoy() {
  return new Date().toISOString().split("T")[0];
}

function manana() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES");
}

function Sidebar() {
  return (
    <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
            C
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">ClienteYA</p>
            <p className="text-sm text-slate-500">Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          <a
            href="/dashboard"
            className="block rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Resumen
          </a>

          <a
            href="/dashboard/nuevo"
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            + Nuevo cliente
          </a>

          <a
            href="/dashboard/calendario"
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Calendario
          </a>

          <a
            href="/dashboard"
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Clientes
          </a>

          <a
            href="/billing"
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Activar plan
          </a>
        </div>
      </nav>
    </aside>
  );
}

export default async function DashboardPage() {
  const authSupabase = await createAuthServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  const [{ data: clientesData }, { data: profile }] = await Promise.all([
    supabase
      .from("clientes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  const clientes: Cliente[] = clientesData || [];
  const userProfile: Profile | null = profile || null;

  const hoyDate = hoy();
  const mananaDate = manana();

  const atrasados = clientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto < hoyDate
  );

  const hoyClientes = clientes.filter((c) => c.proximo_contacto === hoyDate);
  const mananaClientes = clientes.filter(
    (c) => c.proximo_contacto === mananaDate
  );
  const proximosClientes = clientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto > hoyDate
  );

  const nuevos = clientes.filter((c) => c.estado === "Nuevo");
  const interesados = clientes.filter((c) => c.estado === "Interesado");
  const pagados = clientes.filter((c) => c.estado === "Pagó");
  const entregados = clientes.filter((c) => c.estado === "Entregado");

  const conversionRate =
    clientes.length > 0
      ? Math.round((pagados.length / clientes.length) * 100)
      : 0;

  const status = userProfile?.subscription_status || "trial";
  const isActive = status === "active";
  const isPending = status === "pending_review";
  const isTrial = status === "trial";
  const isCanceled = status === "canceled";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/dashboard/nuevo"
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  + Nuevo cliente
                </a>

                <a
                  href="/billing"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Activar plan
                </a>

                <LogoutButton />
              </div>
            </div>

            <div className="mb-6 space-y-3">
              {isActive && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  ✅ Tu cuenta está activa.
                </div>
              )}

              {isPending && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  🔵 Tu comprobante fue enviado y está pendiente de revisión.
                </div>
              )}

              {isTrial && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  🟠 Estás usando el período de prueba. Trial hasta:{" "}
                  <span className="font-semibold">
                    {formatDate(userProfile?.trial_ends_at || null)}
                  </span>{" "}
                  ·{" "}
                  <a href="/billing" className="font-semibold underline">
                    Activar ahora
                  </a>
                </div>
              )}

              {isCanceled && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  🔴 Tu cuenta no está activa.{" "}
                  <a href="/billing" className="font-semibold underline">
                    Sube tu comprobante para activar el plan
                  </a>
                </div>
              )}

              {atrasados.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  🔴 Tienes {atrasados.length} cliente(s) atrasado(s) para seguimiento.
                </div>
              )}

              {hoyClientes.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  🟠 Tienes {hoyClientes.length} contacto(s) para hoy.
                </div>
              )}

              {mananaClientes.length > 0 && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  🔵 Tienes {mananaClientes.length} contacto(s) programado(s) para mañana.
                </div>
              )}

              {atrasados.length === 0 &&
                hoyClientes.length === 0 &&
                mananaClientes.length === 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    ✅ Todo al día. No tienes alertas pendientes.
                  </div>
                )}
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Clientes</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{clientes.length}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Nuevos</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{nuevos.length}</p>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <p className="text-sm text-amber-700">Interesados</p>
                <p className="mt-2 text-3xl font-bold text-amber-800">
                  {interesados.length}
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-sm text-emerald-700">Pagados</p>
                <p className="mt-2 text-3xl font-bold text-emerald-800">
                  {pagados.length}
                </p>
              </div>

              <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
                <p className="text-sm text-red-700">Atrasados</p>
                <p className="mt-2 text-3xl font-bold text-red-800">
                  {atrasados.length}
                </p>
              </div>

              <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
                <p className="text-sm text-sky-700">Conversión</p>
                <p className="mt-2 text-3xl font-bold text-sky-800">
                  {conversionRate}%
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Clientes</h2>

                {clientes.length === 0 && (
                  <p className="text-sm text-slate-500">No hay clientes todavía.</p>
                )}

                {clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="border-b border-slate-200 py-4 last:border-b-0"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{cliente.nombre}</p>
                        <p className="text-sm text-slate-500">{cliente.telefono}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClasses(
                              cliente.estado
                            )}`}
                          >
                            {cliente.estado}
                          </span>

                          {cliente.proximo_contacto && cliente.proximo_contacto < hoyDate && (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                              Atrasado
                            </span>
                          )}

                          {cliente.proximo_contacto === hoyDate && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              Hoy
                            </span>
                          )}

                          {cliente.proximo_contacto === mananaDate && (
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                              Mañana
                            </span>
                          )}
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                          <p>
                            <span className="font-medium">Notas:</span>{" "}
                            {cliente.notas || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Recordatorio:</span>{" "}
                            {cliente.recordatorio || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Próximo contacto:</span>{" "}
                            {cliente.proximo_contacto || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/dashboard/editar?id=${cliente.id}`}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </a>

                        <a
                          href={whatsappUrl(
                            cliente.telefono,
                            `Hola ${cliente.nombre}, te escribo desde ClienteYA.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Hoy</h2>

                  {hoyClientes.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No tienes seguimientos hoy.
                    </p>
                  )}

                  {hoyClientes.map((c) => (
                    <div key={c.id} className="border-b border-slate-200 py-3 last:border-b-0">
                      <p className="font-semibold text-slate-900">{c.nombre}</p>
                      <p className="text-sm text-slate-500">
                        {c.recordatorio || "Sin nota"}
                      </p>

                      <a
                        href={whatsappUrl(
                          c.telefono,
                          `Hola ${c.nombre}, te escribo por el seguimiento de hoy.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                      >
                        Abrir WhatsApp
                      </a>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Próximos contactos</h2>

                  {proximosClientes.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No hay próximos contactos.
                    </p>
                  )}

                  {proximosClientes.slice(0, 5).map((c) => (
                    <div key={c.id} className="border-b border-slate-200 py-3 last:border-b-0">
                      <p className="font-semibold text-slate-900">{c.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {c.proximo_contacto || "—"}
                      </p>
                      <p className="text-sm text-slate-600">
                        {c.recordatorio || "Sin recordatorio"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Estado del negocio</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Nuevos</span>
                      <span className="font-semibold text-slate-900">{nuevos.length}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Interesados</span>
                      <span className="font-semibold text-slate-900">{interesados.length}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Pagados</span>
                      <span className="font-semibold text-slate-900">{pagados.length}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Entregados</span>
                      <span className="font-semibold text-slate-900">{entregados.length}</span>
                    </div>
                  </div>
                </div>

                {!isActive && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-2 text-lg font-semibold text-slate-900">Activar plan</h2>
                    <p className="text-sm text-slate-500">
                      Sube tu comprobante de transferencia para activar ClienteYA.
                    </p>

                    <a
                      href="/billing"
                      className="mt-4 inline-block rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Ir a activación
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}