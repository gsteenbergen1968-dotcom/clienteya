import { redirect } from "next/navigation";

import { BrandMark } from "../components/BrandMark";
import { createAuthServerClient } from "../../lib/supabase/auth-server";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    ok?: string;
  }>;
}) {
  const { error, ok } = await searchParams;

  async function requestPasswordReset(
    formData: FormData,
  ) {
    "use server";

    const email = String(
      formData.get("email") || "",
    )
      .trim()
      .toLowerCase();

    if (!email) {
      redirect(
        "/forgot-password?error=missing",
      );
    }

    const supabase =
      await createAuthServerClient();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const {
      error: resetError,
    } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${appUrl}/reset-password`,
        },
      );

    if (resetError) {
      console.error(
        "PASSWORD RESET ERROR:",
        resetError,
      );

      redirect(
        "/forgot-password?error=send",
      );
    }

    redirect(
      "/forgot-password?ok=sent",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center">
          <BrandMark showTagline />
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Recuperar contraseña
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
            </p>
          </div>

          {ok === "sent" ? (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
              ✅ Revisa tu correo electrónico. Si existe una cuenta con este email, recibirás un enlace para cambiar tu contraseña.
            </div>
          ) : null}

          {error === "missing" ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">
              ⚠️ Ingresa tu email.
            </div>
          ) : null}

          {error === "send" ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">
              ⚠️ No pudimos enviar el enlace. Intenta nuevamente.
            </div>
          ) : null}

          <form
            action={requestPasswordReset}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="tu@email.com"
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              Enviar enlace
            </button>
          </form>

          <div className="mt-5 text-center">
            <a
              href="/login"
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              ← Volver a iniciar sesión
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}