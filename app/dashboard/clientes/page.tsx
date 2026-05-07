import { createAdminClient } from "../../../lib/supabase/server";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";

export const dynamic = "force-dynamic";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  estado: string;
  notas: string | null;
  recordatorio: string | null;
  proximo_contacto: string | null;
  created_at: string;
  monto?: number | null;
  pagado?: boolean | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function getBadgeClasses(estado: string) {
  const v = estado.toLowerCase();

  if (v.includes("pag")) return "border-emerald-200 bg-emerald-100 text-emerald-700";
  if (v.includes("interes")) return "border-amber-200 bg-amber-100 text-amber-700";
  if (v.includes("sin")) return "border-orange-200 bg-orange-100 text-orange-700";
  if (v.includes("contact")) return "border-blue-200 bg-blue-100 text-blue-700";
  if (v.includes("cerr")) return "border-red-200 bg-red-100 text-red-700";

  return "border-slate-200 bg-slate-100 text-slate-700";
}



function FeedbackBanner({ ok }: { ok?: string }) {
  if (!ok) return null;

  const messages: Record<string, string> = {
    contactado: "Clientes marcados como contactados.",
    seguimiento: "Seguimiento programado para los clientes seleccionados.",
    pagado: "Clientes marcados como pagados.",
    cerrado: "Clientes cerrados correctamente.",
    eliminado: "Clientes eliminados correctamente.",
  };

  return (
    <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
      ✅ {messages[ok] || "Cambios guardados correctamente."}
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </a>
  );
}

function MiniStat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "red" | "amber" | "emerald" | "sky";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    red: "border-red-200 bg-red-50 text-red-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
  };

  const labels = {
    slate: "text-slate-500",
    red: "text-red-700",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    sky: "text-sky-700",
  };

  return (
    <div className={`rounded-[22px] border p-4 shadow-sm ${tones[tone]}`}>
      <p className={`text-xs font-medium ${labels[tone]}`}>{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function ClienteCard({
  cliente,
  today,
  tomorrow,
}: {
  cliente: Cliente;
  today: string;
  tomorrow: string;
}) {
  const overdue = cliente.proximo_contacto && cliente.proximo_contacto < today;
  const isToday = cliente.proximo_contacto === today;
  const isTomorrow = cliente.proximo_contacto === tomorrow;
  const paid = cliente.pagado || cliente.estado.toLowerCase().includes("pag");

  return (
    <div
      className={`rounded-[24px] border p-5 shadow-sm ${
        overdue ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <label className="mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white shadow-sm">
            <input
              type="checkbox"
              name="ids"
              value={cliente.id}
              className="h-4 w-4 accent-slate-900"
            />
          </label>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-semibold leading-tight text-slate-900">
                {cliente.nombre}
              </p>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getBadgeClasses(
                  cliente.estado
                )}`}
              >
                {cliente.estado}
              </span>

              {overdue && (
                <span className="rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                  atrasado
                </span>
              )}

              {isToday && (
                <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  hoy
                </span>
              )}

              {isTomorrow && (
                <span className="rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  mañana
                </span>
              )}

              {paid && (
                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  pagado
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">{cliente.telefono}</p>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Próximo
                </p>
                <p className="mt-1 text-slate-700">
                  {formatDate(cliente.proximo_contacto)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Recordatorio
                </p>
                <p className="mt-1 line-clamp-2 text-slate-700">
                  {cliente.recordatorio || cliente.notas || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <a
            href={`/dashboard/whatsapp?id=${cliente.id}`}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            WhatsApp AI
          </a>

          <a
            href={`/dashboard/editar?id=${cliente.id}`}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Editar
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; ok?: string }>;
}) {
  const { q = "", filter = "todos", ok } = await searchParams;

  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  async function bulkContactado(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const ids = formData.getAll("ids").map(String).filter(Boolean);
    if (ids.length === 0) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Contactado",
        recordatorio: "Marcado como contactado en acción masiva",
      })
      .in("id", ids)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/clientes?ok=contactado");
  }

  async function bulkSeguimiento(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const ids = formData.getAll("ids").map(String).filter(Boolean);
    if (ids.length === 0) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Sin respuesta",
        recordatorio: "Seguimiento programado desde acción masiva",
        proximo_contacto: addDaysISO(3),
      })
      .in("id", ids)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/clientes?ok=seguimiento");
  }

  async function bulkPagado(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const ids = formData.getAll("ids").map(String).filter(Boolean);
    if (ids.length === 0) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Pagó",
        pagado: true,
        monto: 50000,
        fecha_pago: new Date().toISOString(),
      })
      .in("id", ids)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/clientes?ok=pagado");
  }

  async function bulkCerrar(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const ids = formData.getAll("ids").map(String).filter(Boolean);
    if (ids.length === 0) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Cerrado",
        recordatorio: "Cerrado desde acción masiva",
        proximo_contacto: null,
      })
      .in("id", ids)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/clientes?ok=cerrado");
  }

  async function bulkEliminar(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const ids = formData.getAll("ids").map(String).filter(Boolean);
    if (ids.length === 0) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin.from("clientes").delete().in("id", ids).eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");

    redirect("/dashboard/clientes?ok=eliminado");
  }

  const admin = createAdminClient();

  const { data } = await admin
    .from("clientes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const clientes: Cliente[] = data || [];

  const today = todayISO();
  const tomorrow = tomorrowISO();
  const query = q.trim().toLowerCase();

  const total = clientes.length;

  const atrasados = clientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto < today
  );

  const hoy = clientes.filter((c) => c.proximo_contacto === today);
  const manana = clientes.filter((c) => c.proximo_contacto === tomorrow);

  const pagados = clientes.filter(
    (c) => c.pagado || c.estado.toLowerCase().includes("pag")
  );

  const interesados = clientes.filter((c) =>
    c.estado.toLowerCase().includes("interes")
  );

  const filteredByStatus = clientes.filter((c) => {
    if (filter === "atrasados") return !!c.proximo_contacto && c.proximo_contacto < today;
    if (filter === "hoy") return c.proximo_contacto === today;
    if (filter === "manana") return c.proximo_contacto === tomorrow;
    if (filter === "pagados") return c.pagado || c.estado.toLowerCase().includes("pag");
    if (filter === "interesados") return c.estado.toLowerCase().includes("interes");

    return true;
  });

  const visibleClientes = filteredByStatus.filter((c) => {
    if (!query) return true;

    const haystack = [
      c.nombre,
      c.telefono,
      c.estado,
      c.recordatorio || "",
      c.notas || "",
      c.proximo_contacto || "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  const qParam = query ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-6 py-8">
            <div className="mx-auto max-w-7xl">
              <FeedbackBanner ok={ok} />


    <PageHeader
  title="Clientes"
  description="Busca, filtra y actualiza varios clientes a la vez."
  actionHref={`/dashboard/nuevo${qParam}`}
  actionLabel="+ Nuevo cliente"
/>

 

              <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                <MiniStat label="Total" value={total} />
                <MiniStat label="Atrasados" value={atrasados.length} tone="red" />
                <MiniStat label="Hoy" value={hoy.length} tone="amber" />
                <MiniStat label="Mañana" value={manana.length} tone="sky" />
                <MiniStat label="Interesados" value={interesados.length} tone="amber" />
                <MiniStat label="Pagados" value={pagados.length} tone="emerald" />
              </div>

              <div className="mb-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <form className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Buscar por nombre, teléfono, estado o nota..."
                    className="min-h-11 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500"
                  />

                  <input type="hidden" name="filter" value={filter} />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      Buscar
                    </button>

                    <a
                      href="/dashboard/clientes"
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      Limpiar
                    </a>
                  </div>
                </form>

                <div className="mt-4 flex flex-wrap gap-2">
                  <FilterLink
                    href={`/dashboard/clientes?filter=todos${qParam}`}
                    label="Todos"
                    active={filter === "todos"}
                  />
                  <FilterLink
                    href={`/dashboard/clientes?filter=atrasados${qParam}`}
                    label="Atrasados"
                    active={filter === "atrasados"}
                  />
                  <FilterLink
                    href={`/dashboard/clientes?filter=hoy${qParam}`}
                    label="Hoy"
                    active={filter === "hoy"}
                  />
                  <FilterLink
                    href={`/dashboard/clientes?filter=manana${qParam}`}
                    label="Mañana"
                    active={filter === "manana"}
                  />
                  <FilterLink
                    href={`/dashboard/clientes?filter=interesados${qParam}`}
                    label="Interesados"
                    active={filter === "interesados"}
                  />
                  <FilterLink
                    href={`/dashboard/clientes?filter=pagados${qParam}`}
                    label="Pagados"
                    active={filter === "pagados"}
                  />
                </div>
              </div>

              <form>
                <div className="sticky top-4 z-20 mb-5 rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Acciones masivas
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Selecciona uno o más clientes y aplica una acción.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        formAction={bulkContactado}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                      >
                        Marcar contactado
                      </button>

                      <button
                        formAction={bulkSeguimiento}
                        className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                      >
                        Seguimiento 3 días
                      </button>

                      <button
                        formAction={bulkPagado}
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        Marcar pagado
                      </button>

                      <button
                        formAction={bulkCerrar}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                      >
                        Cerrar
                      </button>

                      <button
                        formAction={bulkEliminar}
                        className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Lista de clientes
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {visibleClientes.length} resultado(s)
                      </p>
                    </div>
                  </div>

                  {visibleClientes.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl shadow-sm">
                        🔎
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        No hay clientes con este filtro
                      </h3>
                      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        Prueba otro filtro o limpia la búsqueda.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visibleClientes.map((cliente) => (
                        <ClienteCard
                          key={cliente.id}
                          cliente={cliente}
                          today={today}
                          tomorrow={tomorrow}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}