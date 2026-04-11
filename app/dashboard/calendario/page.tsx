import { createAdminClient } from "../../../lib/supabase/server";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  estado: string;
  notas: string;
  recordatorio: string | null;
  proximo_contacto: string | null;
  created_at: string;
};

function getBadgeClasses(estado: string) {
  if (estado === "Pagó") return "bg-emerald-100 text-emerald-700";
  if (estado === "Interesado") return "bg-amber-100 text-amber-700";
  if (estado === "Entregado") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-700";
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
            className="block rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
          >
            Calendario
          </a>

          <a
            href="/dashboard"
            className="block rounded-2xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100"
          >
            Clientes
          </a>

          <a className="block rounded-2xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100">
            Seguimientos
          </a>

          <a className="block rounded-2xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100">
            Configuración
          </a>
        </div>
      </nav>
    </aside>
  );
}

function whatsappUrl(telefono: string, mensaje: string) {
  const cleanPhone = `595${telefono.replace(/\D/g, "")}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
}

function formatFecha(fecha: string) {
  return fecha;
}

export default async function CalendarioPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("clientes")
    .select("*")
    .not("proximo_contacto", "is", null)
    .order("proximo_contacto", { ascending: true });

  const clientes: Cliente[] = data || [];

  const grupos = clientes.reduce<Record<string, Cliente[]>>((acc, cliente) => {
    const fecha = cliente.proximo_contacto || "Sin fecha";
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(cliente);
    return acc;
  }, {});

  const fechas = Object.keys(grupos).sort();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Calendario de contactos</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Vista de próximos seguimientos y recordatorios
                </p>
              </div>

              <a
                href="/dashboard"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Volver al dashboard
              </a>
            </div>

            {fechas.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-sm text-slate-500">
                  No hay contactos programados todavía.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {fechas.map((fecha) => (
                  <section
                    key={fecha}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">
                          {formatFecha(fecha)}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {grupos[fecha].length} contacto(s)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {grupos[fecha].map((cliente) => (
                        <div
                          key={cliente.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <p className="text-lg font-semibold">
                                  {cliente.nombre}
                                </p>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClasses(
                                    cliente.estado
                                  )}`}
                                >
                                  {cliente.estado}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-slate-500">
                                {cliente.telefono}
                              </p>

                              <div className="mt-3 space-y-1 text-sm text-slate-600">
                                <p>
                                  <span className="font-medium">
                                    Recordatorio:
                                  </span>{" "}
                                  {cliente.recordatorio || "—"}
                                </p>
                                <p>
                                  <span className="font-medium">Notas:</span>{" "}
                                  {cliente.notas || "—"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <a
                                href={`/dashboard/editar?id=${cliente.id}`}
                                className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                              >
                                Editar
                              </a>

                              <a
                                href={whatsappUrl(
                                  cliente.telefono,
                                  `Hola ${cliente.nombre}, te escribo por el seguimiento programado.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl bg-green-600 px-3 py-2 text-xs text-white"
                              >
                                WhatsApp
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}