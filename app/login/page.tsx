import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { redirect } from "next/navigation";

function ParaguayBadge() {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1/3 bg-red-500" />
      <div className="absolute inset-x-0 top-1/3 h-1/3 bg-white" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-blue-600" />
      <span className="relative z-10 text-[11px] font-bold text-slate-900">
        PY
      </span>
    </div>
  );
}

export default async function LoginPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  async function signIn(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect("/login?error=1");
    }

    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <ParaguayBadge />
          <span className="text-xl font-semibold">ClienteYA</span>
        </div>

        <form
          action={signIn}
          className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h1 className="mb-6 text-2xl font-bold text-slate-900">
            Iniciar sesión
          </h1>

          <div className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}