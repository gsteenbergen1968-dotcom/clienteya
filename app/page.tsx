export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* HERO */}
      <section className="px-6 py-16 text-center">
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          Nunca pierdas un cliente de WhatsApp
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
          Organiza tus contactos, seguimientos y ventas en un solo lugar.
          Diseñado para vendedores de Paraguay.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/dashboard"
            className="rounded-2xl bg-black px-6 py-4 text-lg font-semibold text-white"
          >
            Empezar gratis
          </a>

          <a
            href="/dashboard"
            className="rounded-2xl border px-6 py-4 text-lg"
          >
            Ver demo
          </a>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">📲 Todo en WhatsApp</h3>
            <p className="mt-3 text-sm text-slate-600">
              Envía mensajes, seguimientos y recordatorios con un solo clic.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">📅 Nunca olvides clientes</h3>
            <p className="mt-3 text-sm text-slate-600">
              Recordatorios automáticos para hoy, mañana o cuando necesites.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">💰 Más ventas</h3>
            <p className="mt-3 text-sm text-slate-600">
              Convierte más interesados en clientes pagados fácilmente.
            </p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">
            Así funciona
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3 text-center">
            <div>
              <p className="text-4xl">1️⃣</p>
              <p className="mt-4 font-semibold">Agrega clientes</p>
              <p className="text-sm text-slate-600">
                Guarda contactos en segundos
              </p>
            </div>

            <div>
              <p className="text-4xl">2️⃣</p>
              <p className="mt-4 font-semibold">Haz seguimiento</p>
              <p className="text-sm text-slate-600">
                Usa recordatorios y WhatsApp
              </p>
            </div>

            <div>
              <p className="text-4xl">3️⃣</p>
              <p className="mt-4 font-semibold">Cierra ventas</p>
              <p className="text-sm text-slate-600">
                Convierte más clientes fácilmente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-black px-6 py-16 text-center text-white">
        <h2 className="text-3xl font-bold">
          Empieza hoy y vende más
        </h2>

        <p className="mt-4 text-slate-300">
          No necesitas experiencia técnica.
        </p>

        <a
          href="/dashboard"
          className="mt-8 inline-block rounded-2xl bg-white px-8 py-4 font-semibold text-black"
        >
          Crear mi CRM gratis
        </a>
      </section>
    </main>
  );
}