"use client";

import { useMemo, useState } from "react";

type ClientSearchItem = {
  id: string;
  nombre: string;
  telefono?: string | null;
  estado?: string | null;
};

type ClientSearchProps = {
  clientes: ClientSearchItem[];
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

export default function ClientSearch({
  clientes,
  title = "Buscar clientes",
  description = "Encuentra clientes rápidamente por nombre, teléfono o estado.",
  compact = false,
}: ClientSearchProps) {
  const [query, setQuery] = useState("");

  const filteredClientes = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) return clientes.slice(0, compact ? 3 : 6);

    return clientes
      .filter((cliente) => {
        const haystack = [
          cliente.nombre,
          cliente.telefono || "",
          cliente.estado || "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .slice(0, compact ? 3 : 8);
  }, [clientes, compact, query]);

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
          <div className="mb-2 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">
            Búsqueda de clientes
          </div>

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
        {filteredClientes.length > 0 ? (
          filteredClientes.map((cliente) => (
            <a
              key={cliente.id}
              href={`/dashboard/editar?id=${cliente.id}`}
              className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {cliente.nombre}
                  </p>

                  {cliente.telefono ? (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {cliente.telefono}
                    </p>
                  ) : null}
                </div>

                {cliente.estado ? (
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${getBadgeClasses(
                      cliente.estado
                    )}`}
                  >
                    {cliente.estado}
                  </span>
                ) : null}
              </div>
            </a>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
            No se encontraron clientes.
          </div>
        )}
      </div>
    </section>
  );
}