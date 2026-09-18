"use client";

import { useMemo, useState } from "react";

type RelationshipSearchItem = {
  id: string;
  nombre: string;
  telefono?: string | null;
  estado?: string | null;
};

type RelationshipSearchProps = {
  relationships: RelationshipSearchItem[];
  title?: string;
  description?: string;
  compact?: boolean;
};

function getBadgeClasses(estado?: string | null) {
  const value = (estado || "").toLowerCase();

  if (value.includes("pag")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value.includes("cerr")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value.includes("sin")) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (value.includes("contact")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function RelationshipSearch({
  relationships,
  title = "Buscar relaciones",
  description = "Encuentra relaciones rápidamente por nombre, teléfono o estado.",
  compact = false,
}: RelationshipSearchProps) {
  const [query, setQuery] = useState("");

  const filteredRelationships = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return relationships.slice(0, compact ? 3 : 6);
    }

    return relationships
      .filter((relationship) => {
        const haystack = [
          relationship.nombre,
          relationship.telefono || "",
          relationship.estado || "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .slice(0, compact ? 3 : 8);
  }, [relationships, compact, query]);

  return (
    <section
      className={
        compact
          ? "w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:w-80"
          : "rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
      }
    >
      {!compact ? (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Búsqueda de relaciones
          </p>

          <h2 className="text-xl font-black tracking-tight text-slate-950">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      ) : null}

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nombre, teléfono o estado..."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
      />

      <div className="mt-4 space-y-2.5">
        {filteredRelationships.length > 0 ? (
          filteredRelationships.map((relationship) => (
            <a
              key={relationship.id}
              href={`/dashboard/relationships/${relationship.id}`}
              className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {relationship.nombre}
                  </p>

                  {relationship.telefono ? (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {relationship.telefono}
                    </p>
                  ) : null}
                </div>

                {relationship.estado ? (
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${getBadgeClasses(
                      relationship.estado
                    )}`}
                  >
                    {relationship.estado}
                  </span>
                ) : null}
              </div>
            </a>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
            No se encontraron relaciones.
          </div>
        )}
      </div>
    </section>
  );
}