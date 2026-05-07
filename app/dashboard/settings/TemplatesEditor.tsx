"use client";

import { useState } from "react";

type TemplateKey =
  | "nuevo"
  | "hoy"
  | "pendiente"
  | "proximo"
  | "postventa";

type TemplatesMap = Record<TemplateKey, string>;

export default function TemplatesEditor({
  initialTemplates,
  saveAction,
  deleteAction,
}: {
  initialTemplates: TemplatesMap;
  saveAction: (key: TemplateKey, content: string) => Promise<void>;
  deleteAction: (key: TemplateKey) => Promise<void>;
}) {
  const [templates, setTemplates] = useState<TemplatesMap>(initialTemplates);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const labels: Record<TemplateKey, string> = {
    nuevo: "Nuevo cliente",
    hoy: "Seguimiento hoy",
    pendiente: "Seguimiento pendiente",
    proximo: "Próximo paso",
    postventa: "Post-venta",
  };

  async function handleSave(key: TemplateKey) {
    setSavingKey(key);
    await saveAction(key, templates[key]);
    setSavingKey(null);
  }

  async function handleReset(key: TemplateKey) {
    setSavingKey(key);
    await deleteAction(key);

    setTemplates((prev) => ({
      ...prev,
      [key]: "",
    }));

    setSavingKey(null);
  }

  return (
    <div className="space-y-6">
      {Object.keys(templates).map((key) => {
        const k = key as TemplateKey;

        return (
          <div
            key={k}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {labels[k]}
              </h3>

              <span className="text-xs text-slate-400">
                {templates[k] ? "Personalizado" : "AI por defecto"}
              </span>
            </div>

            <textarea
              value={templates[k]}
              onChange={(e) =>
                setTemplates((prev) => ({
                  ...prev,
                  [k]: e.target.value,
                }))
              }
              placeholder="Escribe tu template personalizado..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500"
              rows={5}
            />

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleSave(k)}
                disabled={savingKey === k}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingKey === k ? "Guardando..." : "Guardar"}
              </button>

              <button
                onClick={() => handleReset(k)}
                disabled={savingKey === k}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Reset AI
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}