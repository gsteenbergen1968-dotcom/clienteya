export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="px-6 py-20 text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="text-2xl">🇵🇾</span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Hecho para vendedores de Paraguay
          </span>
        </div>

        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          Nunca pierdas un cliente de WhatsApp
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600">
          Organiza tus contactos, seguimientos y ventas en un solo lugar.
          ClienteYA está pensado para negocios que venden todos los días por
          WhatsApp en Paraguay.
        </p>

        <div className="flex justify-center gap-4">
          <a
            href="/login"
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Empezar gratis
          </a>

          <a
            href="/login"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Ver demo
          </a>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="mb-2 font-semibold">📲 Todo en WhatsApp</p>
            <p className="text-sm text-slate-600">
              Envía mensajes, seguimientos y recordatorios con un solo clic.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="mb-2 font-semibold">🗓 Nunca olvides clientes</p>
            <p className="text-sm text-slate-600">
              Recordatorios automáticos para hoy, mañana o cuando necesites.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="mb-2 font-semibold">💰 Más ventas</p>
            <p className="text-sm text-slate-600">
              Convierte más interesados en clientes pagados fácilmente.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <h2 className="mb-10 text-2xl font-bold">Así funciona</h2>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
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
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="text-2xl">🇵🇾</span>
          <span className="text-sm text-slate-300">
            Plataforma local para Paraguay
          </span>
        </div>

        <h2 className="mb-4 text-2xl font-bold">Empieza hoy y vende más</h2>

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