"use client";

import { useMemo, useState } from "react";

type Variant = {
  id?: string;
  label?: string;
  tone?: string;
  message: string;
};

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
};

type Usage = {
  used: number;
  limit: number;
  remaining: number;
};

function createWhatsAppUrl(phone: string, text: string) {
  const clean = (phone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text || "")}`;
}

export default function PreviewEditor({
  cliente,
  initialMessage,
  variants = [],
  isPro = true,
  usage = null,
}: {
  cliente: Cliente;
  initialMessage: string;
  variants?: Variant[];
  isPro?: boolean;
  usage?: Usage | null;
}) {
  const safeVariants = Array.isArray(variants) ? variants : [];

  const [message, setMessage] = useState(
    safeVariants[0]?.message || initialMessage || ""
  );

  const [selectedTone, setSelectedTone] = useState(
    safeVariants[0]?.tone || "base"
  );

  const url = useMemo(() => {
    return createWhatsAppUrl(cliente.telefono, message);
  }, [cliente.telefono, message]);

  function applyVariant(v: Variant, index: number) {
    if (!isPro && index > 0) return;

    setMessage(v.message || "");
    setSelectedTone(v.tone || "base");
  }

  function regenerate() {
    if (!isPro) return;
    if (!safeVariants.length) return;

    const random =
      safeVariants[Math.floor(Math.random() * safeVariants.length)];

    setMessage(random.message || "");
    setSelectedTone(random.tone || "base");
  }

  async function trackWhatsAppOpen() {
    try {
      await fetch("/api/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "whatsapp_opened",
          clienteId: cliente.id,
        }),
      });
    } catch {
      // Tracking mag WhatsApp openen nooit blokkeren.
    }
  }

  async function copyText() {
    await navigator.clipboard.writeText(message || "");
  }

  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Editar mensaje antes de enviar
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ajusta el mensaje, cambia el tono y abre WhatsApp cuando esté listo.
          </p>
        </div>

        {!isPro ? (
          <a
            href="/billing"
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Activar Pro
          </a>
        ) : (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Pro activo
          </span>
        )}
      </div>

      {!isPro && usage && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚡ Te quedan <strong>{usage.remaining}</strong> mensajes AI gratis hoy.
          Activa Pro para usar AI sin límites.
        </div>
      )}

      {safeVariants.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {safeVariants.map((v, index) => {
            const toneKey = v.tone || `variant-${index}`;
            const active = selectedTone === toneKey;
            const locked = !isPro && index > 0;

            return (
              <button
                key={v.id || toneKey}
                type="button"
                onClick={() => applyVariant(v, index)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  locked
                    ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                    : active
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {locked ? "🔒 " : ""}
                {v.label || v.tone || `Variante ${index + 1}`}
              </button>
            );
          })}
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={14}
        className="w-full rounded-[24px] border border-slate-300 px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-blue-500"
      />

      {!isPro && (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          🔒 En Básico puedes probar AI con límite diario. Pro desbloquea
          regeneración, variantes completas y uso ilimitado.
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copyText}
          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Copiar
        </button>

        <button
          type="button"
          onClick={regenerate}
          disabled={!isPro}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
            isPro
              ? "border-slate-300 text-slate-700 hover:bg-slate-100"
              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          }`}
        >
          {!isPro ? "🔒 Regenerar" : "Regenerar"}
        </button>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackWhatsAppOpen}
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Abrir WhatsApp
        </a>
      </div>
    </div>
  );
}