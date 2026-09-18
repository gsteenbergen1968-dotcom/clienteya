import { BrandMark } from "./components/BrandMark";
import { BRANDING } from "../lib/branding";

const MONTHLY_PRICE = "Gs. 200.000";
const YEARLY_PRICE = "Gs. 2.000.000";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="mb-12">
          <BrandMark showTagline />
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_420px]">
          <div>
            <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Relaciones + contexto + inteligencia + acción
            </div>

            <h2 className="mt-5 max-w-3xl text-5xl font-bold tracking-tight text-slate-900">
              Mejores relaciones.
              <br />
              Mejores decisiones.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              {BRANDING.appName} mantiene tus relaciones, contexto y
              seguimientos bajo control y convierte esa información en
              inteligencia clara para ayudarte a decidir qué requiere atención,
              cuándo actuar y cuál es el siguiente mejor paso.
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
                <p className="font-semibold text-slate-900">
                  Relaciones
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Mantén personas, empresas, conversaciones, contexto y
                  próximos pasos en una sola relación.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">
                  Prioridades
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  ClienteYA identifica qué necesita atención y te ayuda a
                  mantener el ritmo comercial.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">
                  Inteligencia
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Convierte la información de tus relaciones en señales,
                  riesgos, oportunidades y próximos pasos.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-5">
              <p className="text-sm font-bold text-blue-950">
                ClienteYA piensa contigo
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-900">
                No sólo registra lo que pasó. Analiza el contexto de tus
                relaciones y de tu negocio para ayudarte a entender qué está
                pasando, qué no deberías ignorar y dónde conviene actuar.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-slate-900">
              Empieza hoy
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Prueba ClienteYA y decide después qué período encaja mejor con tu
              negocio.
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Prueba gratis
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {BRANDING.trialDaysLabel}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-blue-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                    Profesional mensual
                  </p>

                  <p className="mt-2 text-xl font-black text-slate-950">
                    {MONTHLY_PRICE}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    por mes
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                        Profesional anual
                      </p>

                      <p className="mt-2 text-xl font-black text-slate-950">
                        {YEARLY_PRICE}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        por año
                      </p>
                    </div>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                      Ahorra Gs. 400.000
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Corporativo
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Para organizaciones con equipos, múltiples sucursales y
                  necesidades avanzadas.
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Configuración a medida
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Una plataforma que aprende contigo
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Cuanto mejor conoce ClienteYA tus relaciones y tu negocio,
                  mejor contexto tiene para ayudarte a decidir.
                </p>
              </div>
            </div>

            <a
              href="/signup"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Crear cuenta
            </a>

            <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
              La suscripción se renueva según el período elegido hasta su
              cancelación.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}