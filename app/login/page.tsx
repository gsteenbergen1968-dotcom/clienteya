import { redirect } from "next/navigation";

import { BrandMark } from "../components/BrandMark";
import { createAuthServerClient } from "../../lib/supabase/auth-server";

async function getLoginDestination(
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

export default async function LoginPage({
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
      await getLoginDestination(
        user.id,
      );

    redirect(destination);
  }

  async function signIn(
    formData: FormData,
  ) {
    "use server";

    const supabase =
      await createAuthServerClient();

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

    if (!email || !password) {
      redirect(
        "/login?error=missing",
      );
    }

    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (
      error ||
      !data.user
    ) {
      redirect(
        "/login?error=credentials",
      );
    }

    const {
      data: businessSettings,
    } = await supabase
      .from("business_settings")
      .select("onboarding_completed")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (
      businessSettings?.onboarding_completed === true
    ) {
      redirect("/dashboard");
    }

    redirect(
      "/onboarding/relationships",
    );
  }

  function getErrorMessage() {
    if (error === "missing") {
      return "Completa tu email y contraseña.";
    }

    if (error === "credentials") {
      return "El email o la contraseña no son correctos.";
    }

    if (error) {
      return "No pudimos iniciar sesión. Intenta nuevamente.";
    }

    return null;
  }

  function getSuccessMessage() {
    if (ok === "check-email") {
      return "Cuenta creada. Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.";
    }

    return null;
  }

  const errorMessage =
    getErrorMessage();

  const successMessage =
    getSuccessMessage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center">
          <BrandMark showTagline />
        </div>

        <form
          action={signIn}
          className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Iniciar sesión
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Accede a tus relaciones, prioridades e inteligencia de ClienteYA.
            </p>
          </div>

          {successMessage ? (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
              ✅ {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">
              ⚠️ {errorMessage}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Contraseña
              </label>

              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            Entrar
          </button>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            ¿Todavía no tienes cuenta?{" "}
            <a
              href="/signup"
              className="font-bold text-blue-600 hover:underline"
            >
              Crear cuenta
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}