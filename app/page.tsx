"use client";

import { useState } from "react";

export default function HomePage() {
  const [email, setEmail] = useState("");

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="px-6 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Nunca pierdas un cliente de WhatsApp
        </h1>

        <p className="text-slate-600 mb-8">
          Diseñado para vendedores de Paraguay.
        </p>

        <div className="flex justify-center gap-4">
          {/* PRIMARY BUTTON */}
          <a
            href="/login"
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Empezar gratis
          </a>

          {/* SECONDARY BUTTON */}
          <a
            href="/login"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Ver demo
          </a>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="font-semibold mb-2">📲 Todo en WhatsApp</p>
            <p className="text-sm text-slate-600">
              Envía mensajes, seguimientos y recordatorios con un solo clic.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="font-semibold mb-2">🗓 Nunca olvides clientes</p>
            <p className="text-sm text-slate-600">
              Recordatorios automáticos para hoy, mañana o cuando necesites.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="font-semibold mb-2">💰 Más ventas</p>
            <p className="text-sm text-slate-600">
              Convierte más interesados en clientes pagados fácilmente.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-10">Así funciona</h2>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <div>
            <div className="mb-3 text-xl">1️⃣</div>
            <p className="font-semibold">Agrega clientes</p>
            <p className="text-sm text-slate-600">
              Guarda contactos en segundos
            </p>
          </div>

          <div>
            <div className="mb-3 text-xl">2️⃣</div>
            <p className="font-semibold">Haz seguimiento</p>
            <p className="text-sm text-slate-600">
              Usa recordatorios y WhatsApp
            </p>
          </div>

          <div>
            <div className="mb-3 text-xl">3️⃣</div>
            <p className="font-semibold">Cierra ventas</p>
            <p className="text-sm text-slate-600">
              Convierte más clientes fácilmente
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-16 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">
          Empieza hoy y vende más
        </h2>

        <p className="mb-6 text-slate-300">
          No necesitas experiencia técnica.
        </p>

        <a
          href="/login"
          className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Crear cuenta gratis
        </a>
      </section>
    </main>
  );
}