import { redirect } from "next/navigation";

import { BrandMark } from "../components/BrandMark";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { BRANDING } from "../../lib/branding";
import { ensureProfileForNewUser } from "../../lib/onboarding";

const MONTHLY_PRICE = "Gs. 200.000";
const YEARLY_PRICE = "Gs. 2.000.000";

async function getSignupDestination(
  userId: string,
) {
  const supabase =
    await createAuthServerClient();

  const {
    data: businessSettings,
  } = await supabase
    .from("business_settings")
    .select("onboarding_completed")
    .eq("user_id", userId)
    .maybeSingle();

  if (
    businessSettings?.onboarding_completed === true
  ) {
    return "/dashboard";
  }

  return "/onboarding/relationships";
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    ok?: string;
  }>;
}) {
  const { error, ok } = await searchParams;

  const supabase =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (user) {
    const destination =
      await getSignupDestination(
        user.id,
      );

    redirect(destination);
  }

  async function signup(
    formData: FormData,
  ) {
    "use server";

    const name =
      String(
        formData.get("nombre") || "",
      ).trim();

    const email =
      String(
        formData.get("email") || "",
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        formData.get("password") || "",
      );

    const supabase =
      await createAuthServerClient();

    if (
      !name ||
      !email ||
      !password
    ) {
      redirect(
        "/signup?error=missing",
      );
    }

    if (
      password.length < 6
    ) {
      redirect(
        "/signup?error=password",
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            appUrl,
          data: {
            nombre: name,
            full_name: name,
          },
        },
      });

    if (error) {
      console.error(
        "SIGNUP ERROR:",
        error,
      );

      redirect(
        "/signup?error=signup",
      );
    }

    const userId =
      data.user?.id;

    if (!userId) {
      redirect(
        "/signup?error=signup",
      );
    }

    await ensureProfileForNewUser({
      userId,
      email,
      name,
    });

    const authCheck =
      await createAuthServerClient();

    const {
      data: { session },
    } =
      await authCheck.auth.getSession();

    if (!session) {
      redirect(
        "/login?ok=check-email",
      );
    }

    const destination =
      await getSignupDestination(
        userId,
      );

    redirect(destination);
  }

  function getMessage() {
    if (
      error === "missing"
    ) {
      return "Completa nombre, email y contraseña.";
    }

    if (
      error === "password"
    ) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }

    if (
      error === "signup"
    ) {
      return "No pudimos crear tu cuenta. Intenta otra vez.";
    }

    if (
      ok === "created"
    ) {
      return "Cuenta creada correctamente. Ahora puedes iniciar sesión.";
    }

    return null;
  }

  const message =
    getMessage();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-8">
          <BrandMark
            showTagline
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_460px] lg:items-start">
          <section className="min-w-0">
            <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Prueba gratis ·{" "}
              {
                BRANDING.trialDaysLabel
              }
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Mejores relaciones.
              <br />
              Mejores decisiones.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Crea tu cuenta y empieza a organizar tus relaciones, mantener el
              contexto bajo control y convertir esa información en inteligencia
              para decidir qué requiere atención y cuál es el siguiente mejor
              paso.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-slate-950">
                  Relaciones
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Personas, empresas, contexto y próximos pasos en una sola
                  relación.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-slate-950">
                  Prioridades
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  ClienteYA identifica qué necesita atención y cuándo conviene
                  actuar.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-slate-950">
                  Inteligencia
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Señales, riesgos, oportunidades y recomendaciones a partir del
                  contexto real.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-950">
                ClienteYA piensa contigo
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-900">
                No se limita a registrar lo ocurrido. Usa la información de tus
                relaciones y de tu negocio para ayudarte a comprender qué está
                pasando y tomar mejores decisiones.
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-bold text-amber-950">
                Prueba gratis:{" "}
                {
                  BRANDING.trialDaysLabel
                }
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-900">
                Después de la prueba puedes continuar con Profesional por{" "}
                <span className="font-black">
                  {MONTHLY_PRICE} al mes
                </span>{" "}
                o{" "}
                <span className="font-black">
                  {YEARLY_PRICE} al año
                </span>
                .
              </p>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-6">
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Crear cuenta
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Empieza en pocos minutos
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Crea tu cuenta y activa tu prueba gratis.
              </p>
            </div>

            {message ? (
              <div
                className={`mb-6 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  ok
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {ok
                  ? "✅ "
                  : "⚠️ "}
                {message}
              </div>
            ) : null}

            <form
              action={signup}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombre
                </label>

                <input
                  type="text"
                  name="nombre"
                  required
                  autoComplete="name"
                  placeholder="Juan Pérez"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Contraseña
                </label>

                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                Crear cuenta
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              ¿Ya tienes cuenta?{" "}
              <a
                href="/login"
                className="font-bold text-blue-600 hover:underline"
              >
                Inicia sesión
              </a>
            </div>

            <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
              No necesitas elegir un plan para comenzar la prueba.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}