import { BRANDING, formatGs } from "../lib/branding";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm lg:p-12">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-2xl shadow-sm">
              {BRANDING.countryFlag}
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {BRANDING.appName}
              </h1>
              <p className="text-sm text-slate-500">
                Hecho para {BRANDING.countryLabel}
              </p>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_420px]">
            <div>
              <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                CRM + seguimiento + WhatsApp
              </div>

              <h2 className="mt-5 text-5xl font-bold tracking-tight text-slate-900">
                Controla clientes, seguimientos y pagos sin complicarte
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
                {BRANDING.appName} te ayuda a registrar clientes, priorizar seguimiento,
                usar WhatsApp y medir ingresos en una sola app.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/signup"
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Empezar prueba gratis
                </a>

                <a
                  href="/login"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Iniciar sesión
                </a>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Clientes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Guarda contactos y estados de venta.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Calendario</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Mira qué hacer hoy, mañana o qué está atrasado.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Pagos</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Controla ingresos y clientes pagados.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold text-slate-900">
                Empieza hoy
              </h3>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Trial gratis
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {BRANDING.trialDaysLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Plan mensual
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatGs(BRANDING.monthlyPrice)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Ideal para
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    vendedores, independientes y pequeños negocios.
                  </p>
                </div>
              </div>

              <a
                href="/signup"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Crear cuenta
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}