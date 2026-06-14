"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type QuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  emoji: string;
  keywords?: string[];
};

const actions: QuickAction[] = [
  {
    id: "nuevo",
    label: "Nuevo cliente",
    description: "Agregar nuevo cliente al CRM",
    href: "/dashboard/nuevo",
    emoji: "➕",
    keywords: ["crear", "cliente", "nuevo"],
  },

  {
    id: "clientes",
    label: "Ver clientes",
    description: "Abrir lista completa de clientes",
    href: "/dashboard/clientes",
    emoji: "👥",
    keywords: ["clientes", "crm"],
  },

  {
    id: "automations",
    label: "Automatizaciones",
    description: "Abrir follow-ups y AI automations",
    href: "/dashboard/automations",
    emoji: "🤖",
    keywords: ["automation", "seguimiento", "followup"],
  },

  {
    id: "today",
    label: "Seguimiento hoy",
    description: "Ver clientes con seguimiento hoy",
    href: "/dashboard/automations?filter=urgente",
    emoji: "📅",
    keywords: ["hoy", "urgente", "seguimiento"],
  },

  {
    id: "whatsapp",
    label: "WhatsApp AI",
    description: "Abrir workspace de WhatsApp",
    href: "/dashboard/whatsapp",
    emoji: "💬",
    keywords: ["mensaje", "whatsapp", "chat"],
  },
];

export default function QuickActions() {
  const [query, setQuery] = useState("");

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;

    const normalized = query.toLowerCase();

    return actions.filter((action) => {
      const searchable = [
        action.label,
        action.description,
        ...(action.keywords || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [query]);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <div className="mb-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Quick Actions
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Acciones rápidas
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Navega rápido dentro de ClienteYA y ejecuta acciones comunes.
        </p>
      </div>

      <div className="mb-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar acción..."
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
        />
      </div>

      <div className="grid gap-3">
        {filteredActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl">
              {action.emoji}
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">
                {action.label}
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {action.description}
              </p>
            </div>
          </Link>
        ))}

        {filteredActions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            No se encontraron acciones.
          </div>
        )}
      </div>
    </div>
  );
}