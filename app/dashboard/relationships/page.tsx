import { redirect } from "next/navigation";

import { AppHeader } from "../../components/AppHeader";
import EmptyState from "../../components/EmptyState";
import SectionCard from "../../components/SectionCard";
import SidebarNav from "../SidebarNav";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import {
  createRelationshipService,
  type RelationshipRecord,
} from "../../../lib/relationships";

export const dynamic = "force-dynamic";

type RelationshipsPageProps = {
  searchParams: Promise<{
    q?: string;
    filter?: string;
  }>;
};

type RelationshipFilter =
  | "all"
  | "new"
  | "contacted"
  | "interested"
  | "paid"
  | "closed";

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function isPaidRelationship(
  relationship: RelationshipRecord,
): boolean {
  const status = normalize(relationship.status);

  return (
    status.includes("pag") ||
    status.includes("convert") ||
    Boolean(relationship.paid_at)
  );
}

function getStatusClasses(status: string | null): string {
  const value = normalize(status);

  if (
    value.includes("pag") ||
    value.includes("convert")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value.includes("interes")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (value.includes("contact")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (value.includes("cerr")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function matchesFilter(
  relationship: RelationshipRecord,
  filter: RelationshipFilter,
): boolean {
  const status = normalize(relationship.status);

  if (filter === "new") {
    return !status || status.includes("nuev");
  }

  if (filter === "contacted") {
    return status.includes("contact");
  }

  if (filter === "interested") {
    return status.includes("interes");
  }

  if (filter === "paid") {
    return isPaidRelationship(relationship);
  }

  if (filter === "closed") {
    return status.includes("cerr");
  }

  return true;
}

function matchesSearch(
  relationship: RelationshipRecord,
  query: string,
): boolean {
  if (!query) return true;

  const searchable = [
    relationship.name,
    relationship.company,
    relationship.phone,
    relationship.email,
    relationship.relationship_type,
    relationship.status,
    relationship.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(query);
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
      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </a>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function RelationshipCard({
  relationship,
}: {
  relationship: RelationshipRecord;
}) {
  const name =
    relationship.name?.trim() ||
    "Relación sin nombre";

  const status =
    relationship.status?.trim() ||
    "Nuevo";

  const relationshipType =
    relationship.relationship_type?.trim() ||
    null;

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              {name}
            </h3>

            {relationship.company && (
              <span className="text-sm font-semibold text-slate-500">
                · {relationship.company}
              </span>
            )}

            {relationshipType && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {relationshipType}
              </span>
            )}

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                relationship.status,
              )}`}
            >
              {status}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <span>
              {relationship.phone ||
                "Sin teléfono"}
            </span>

            <span>
              {relationship.email ||
                "Sin correo"}
            </span>
          </div>

          {relationship.notes && (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              {relationship.notes}
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Próximo contacto
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {formatDate(
                  relationship.next_contact_at,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Creado
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {formatDate(
                  relationship.created_at,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <a
            href={`/dashboard/relationships/${relationship.id}`}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Ver relación
          </a>

          <a
            href={`/dashboard/whatsapp?id=${relationship.id}`}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}

export default async function RelationshipsPage({
  searchParams,
}: RelationshipsPageProps) {
  const {
    q = "",
    filter = "all",
  } = await searchParams;

  const auth =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await auth.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const relationshipService =
    createRelationshipService();

  const relationships =
    await relationshipService.getRelationships(
      user.id,
    );

  const query =
    q.trim().toLowerCase();

  const activeFilter: RelationshipFilter = [
    "all",
    "new",
    "contacted",
    "interested",
    "paid",
    "closed",
  ].includes(filter)
    ? (filter as RelationshipFilter)
    : "all";

  const visibleRelationships =
    relationships.filter(
      (relationship) =>
        matchesFilter(
          relationship,
          activeFilter,
        ) &&
        matchesSearch(
          relationship,
          query,
        ),
    );

  const newCount =
    relationships.filter(
      (relationship) =>
        matchesFilter(
          relationship,
          "new",
        ),
    ).length;

  const contactedCount =
    relationships.filter(
      (relationship) =>
        matchesFilter(
          relationship,
          "contacted",
        ),
    ).length;

  const interestedCount =
    relationships.filter(
      (relationship) =>
        matchesFilter(
          relationship,
          "interested",
        ),
    ).length;

  const paidCount =
    relationships.filter(
      (relationship) =>
        isPaidRelationship(
          relationship,
        ),
    ).length;

  const qParam =
    query
      ? `&q=${encodeURIComponent(q)}`
      : "";

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Relaciones
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Relaciones, contexto y seguimiento comercial en una sola lista.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href="/api/relationships/export"
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Exportar CSV
                  </a>

                  <a
                    href="/dashboard/new"
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    + Nueva relación
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
                <MetricCard
                  label="Total"
                  value={
                    relationships.length
                  }
                />

                <MetricCard
                  label="Nuevas"
                  value={newCount}
                />

                <MetricCard
                  label="Contactadas"
                  value={
                    contactedCount
                  }
                />

                <MetricCard
                  label="Interesadas"
                  value={
                    interestedCount
                  }
                />

                <MetricCard
                  label="Pagadas"
                  value={paidCount}
                />
              </div>

              <div className="mt-6 space-y-6">
                <SectionCard
                  badge="Buscar y filtrar"
                  title="Control rápido"
                  description="Encuentra relaciones por nombre, empresa, teléfono, correo, tipo de relación, estado o nota."
                >
                  <form className="flex flex-col gap-3 lg:flex-row">
                    <input
                      name="q"
                      defaultValue={q}
                      placeholder="Buscar relaciones..."
                      className="min-h-11 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500"
                    />

                    <input
                      type="hidden"
                      name="filter"
                      value={
                        activeFilter
                      }
                    />

                    <button
                      type="submit"
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Buscar
                    </button>

                    <a
                      href="/dashboard/relationships"
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Limpiar
                    </a>
                  </form>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <FilterLink
                      href={`/dashboard/relationships?filter=all${qParam}`}
                      label="Todas"
                      active={
                        activeFilter ===
                        "all"
                      }
                    />

                    <FilterLink
                      href={`/dashboard/relationships?filter=new${qParam}`}
                      label="Nuevas"
                      active={
                        activeFilter ===
                        "new"
                      }
                    />

                    <FilterLink
                      href={`/dashboard/relationships?filter=contacted${qParam}`}
                      label="Contactadas"
                      active={
                        activeFilter ===
                        "contacted"
                      }
                    />

                    <FilterLink
                      href={`/dashboard/relationships?filter=interested${qParam}`}
                      label="Interesadas"
                      active={
                        activeFilter ===
                        "interested"
                      }
                    />

                    <FilterLink
                      href={`/dashboard/relationships?filter=paid${qParam}`}
                      label="Pagadas"
                      active={
                        activeFilter ===
                        "paid"
                      }
                    />

                    <FilterLink
                      href={`/dashboard/relationships?filter=closed${qParam}`}
                      label="Cerradas"
                      active={
                        activeFilter ===
                        "closed"
                      }
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  badge="Relaciones"
                  title="Lista de relaciones"
                  description={`${visibleRelationships.length} resultado(s).`}
                >
                  {visibleRelationships.length ===
                  0 ? (
                    <EmptyState
                      icon="🔎"
                      title="No hay relaciones con este filtro"
                      description="Prueba otro filtro o limpia la búsqueda."
                      actionHref="/dashboard/relationships"
                      actionLabel="Limpiar filtros"
                    />
                  ) : (
                    <div className="space-y-3">
                      {visibleRelationships.map(
                        (
                          relationship,
                        ) => (
                          <RelationshipCard
                            key={
                              relationship.id
                            }
                            relationship={
                              relationship
                            }
                          />
                        ),
                      )}
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}