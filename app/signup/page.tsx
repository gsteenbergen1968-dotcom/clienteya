import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { BRANDING, formatGs } from "../../lib/branding";
import { ensureProfileForNewUser } from "../../lib/onboarding";
import { redirect } from "next/navigation";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  async function signup(formData: FormData) {
    "use server";

    const name = String(formData.get("nombre") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const supabase = await createAuthServerClient();

    if (!name || !email || !password) {
      redirect("/signup?error=missing");
    }

    if (password.length < 6) {
      redirect("/signup?error=password");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: name,
          full_name: name,
        },
      },
    });

    if (error) {
      redirect("/signup?error=signup");
    }

    const userId = data.user?.id;

    if (!userId) {
      redirect("/signup?error=signup");
    }

    await ensureProfileForNewUser({
      userId,
      email,
      name,
    });

    const authCheck = await createAuthServerClient();
    const {
      data: { session },
    } = await authCheck.auth.getSession();

    if (!session) {
      redirect("/login?ok=check-email");
    }

    redirect("/dashboard");
  }

  function getMessage() {
    if (error === "missing") {
      return "Completa nombre, email y contraseña.";
    }

    if (error === "password") {
      return "La contraseña debe tener al menos 6 caracteres.";
    }

    if (error === "signup") {
      return "No pudimos crear tu cuenta. Intenta otra vez.";
    }

    if (ok === "created") {
      return "Cuenta creada correctamente. Ahora puedes iniciar sesión.";
    }

    return null;
  }

  const message = getMessage();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_520px]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
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

          <div className="max-w-xl">
            <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Prueba gratis
            </div>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              Organiza clientes, seguimientos y pagos en un solo lugar
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Crea tu cuenta, activa tu trial y empieza hoy mismo a usar dashboard,
              calendario, WhatsApp y control de pagos sin complicaciones.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">CRM simple</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Guarda clientes y controla el siguiente paso de cada uno.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">WhatsApp listo</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Usa mensajes sugeridos y seguimiento más rápido.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Pagos visibles</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Registra ventas y revisa ingresos desde el dashboard.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">
              Trial: {BRANDING.trialDaysLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              Después del trial, el plan mensual es de{" "}
              <span className="font-semibold">
                {formatGs(BRANDING.monthlyPrice)}
              </span>
              .
            </p>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Crear cuenta
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Empieza tu prueba y entra directo al dashboard.
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
                ok
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {ok ? "✅ " : "⚠️ "}
              {message}
            </div>
          )}

          <form action={signup} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                placeholder="Juan Pérez"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="tu@email.com"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Crear cuenta
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="font-semibold text-blue-600 hover:underline">
              Inicia sesión
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}