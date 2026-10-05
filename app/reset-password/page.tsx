"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import { BrandMark } from "../components/BrandMark";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [saving, setSaving] = useState(false);

  const supabase = useMemo(() => {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey
    ) {
      throw new Error(
        "Missing Supabase environment variables.",
      );
    }

    return createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
    );
  }, []);

  useEffect(() => {
    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "El enlace no es válido o ha expirado. Solicita uno nuevo.",
        );
        setReady(true);
        return;
      }

      setReady(true);
    }

    void checkRecoverySession();
  }, [supabase]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Las contraseñas no coinciden.",
      );
      return;
    }

    setSaving(true);

    const { error: updateError } =
      await supabase.auth.updateUser({
        password,
      });

    if (updateError) {
      setError(
        "No pudimos cambiar tu contraseña. Intenta nuevamente.",
      );
      setSaving(false);
      return;
    }

    await supabase.auth.signOut();

    router.replace(
      "/login?ok=password-updated",
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm font-semibold text-slate-500">
          Verificando enlace...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center">
          <BrandMark showTagline />
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Nueva contraseña
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Crea una nueva contraseña para tu cuenta de ClienteYA.
            </p>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">
              ⚠️ {error}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nueva contraseña
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Confirmar contraseña
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || Boolean(error && !password)}
            className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Guardando..."
              : "Guardar nueva contraseña"}
          </button>

          <div className="mt-5 text-center">
            <a
              href="/login"
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              ← Volver a iniciar sesión
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}