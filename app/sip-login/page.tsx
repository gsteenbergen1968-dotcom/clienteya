import { redirect } from "next/navigation";

import { createSipAuthServerClient } from "../../lib/supabase/sip-auth-server";
import { createSipAdminClient } from "../../lib/supabase/sip-server";

function ParaguayBadge() {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1/3 bg-red-500" />
      <div className="absolute inset-x-0 top-1/3 h-1/3 bg-white" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-blue-600" />

      <span className="relative z-10 text-[11px] font-black text-slate-900">
        PY
      </span>
    </div>
  );
}

type SipLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    reset?: string;
  }>;
};

export default async function SipLoginPage({
  searchParams,
}: SipLoginPageProps) {
  const supabase = await createSipAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const admin = createSipAdminClient();

    const {
      data: supportUser,
      error: supportUserError,
    } = await admin
      .from("support_users")
      .select("id,status")
      .eq("id", user.id)
      .maybeSingle();

    if (
      !supportUserError &&
      supportUser?.status === "invited"
    ) {
      const now = new Date().toISOString();

      const {
        error: activationError,
      } = await admin
        .from("support_users")
        .update({
          status: "active",
          last_login_at: now,
          updated_at: now,
        })
        .eq("id", user.id);

      if (!activationError) {
        redirect("/support");
      }
    }

    if (supportUser?.status === "active") {
      await admin
        .from("support_users")
        .update({
          last_login_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      redirect("/support");
    }
  }

  const params =
    (await searchParams) ?? {};

  async function signIn(formData: FormData) {
    "use server";

    const authSupabase =
      await createSipAuthServerClient();

    const email = String(
      formData.get("email") ?? "",
    )
      .trim()
      .toLowerCase();

    const password = String(
      formData.get("password") ?? "",
    );

    if (!email || !password) {
      redirect("/sip-login?error=missing");
    }

    const {
      data,
      error,
    } =
      await authSupabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data.user) {
      redirect("/sip-login?error=credentials");
    }

    const admin = createSipAdminClient();

    const {
      data: supportUser,
      error: supportUserError,
    } = await admin
      .from("support_users")
      .select("id,status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (
      supportUserError ||
      !supportUser
    ) {
      await authSupabase.auth.signOut();

      redirect("/sip-login?error=access");
    }

    if (supportUser.status === "invited") {
      const now = new Date().toISOString();

      const {
        error: activationError,
      } = await admin
        .from("support_users")
        .update({
          status: "active",
          last_login_at: now,
          updated_at: now,
        })
        .eq("id", data.user.id);

      if (activationError) {
        await authSupabase.auth.signOut();

        redirect("/sip-login?error=access");
      }

      redirect("/support");
    }

    if (supportUser.status !== "active") {
      await authSupabase.auth.signOut();

      redirect("/sip-login?error=access");
    }

    await admin
      .from("support_users")
      .update({
        last_login_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    redirect("/support");
  }

  async function sendPasswordReset(
    formData: FormData,
  ) {
    "use server";

    const email = String(
      formData.get("email") ?? "",
    )
      .trim()
      .toLowerCase();

    if (!email) {
      redirect("/sip-login?error=reset-email");
    }

    const authSupabase =
      await createSipAuthServerClient();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      "http://localhost:3000";

    const { error } =
      await authSupabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            `${appUrl}/sip-reset-password`,
        },
      );

    if (error) {
      redirect("/sip-login?error=reset");
    }

    redirect("/sip-login?reset=sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <ParaguayBadge />

          <div>
            <p className="text-xl font-black tracking-tight text-slate-950">
              ClienteYA SIP
            </p>

            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Support Intelligence Platform
            </p>
          </div>
        </div>

        <form
          action={signIn}
          className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.06)]"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Secure Access
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-950">
            Sign in to SIP
          </h1>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Use your authorized SIP account to access support operations.
          </p>

          {params.reset === "sent" ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Password reset email sent. Use the newest email to set your SIP password.
            </div>
          ) : null}

          {params.reset === "1" ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Your SIP password has been updated. You can now sign in.
            </div>
          ) : null}

          {params.error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {params.error === "missing"
                ? "Enter your email and password."
                : params.error === "credentials"
                  ? "The email or password is incorrect."
                  : params.error === "reset-email"
                    ? "Enter your email address first."
                    : params.error === "reset"
                      ? "The password reset email could not be sent."
                      : "This account does not have active SIP access."}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-black text-slate-950"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="support@clienteya.com"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-sm font-black text-slate-950"
                >
                  Password
                </label>

                <button
                  type="submit"
                  formAction={sendPasswordReset}
                  formNoValidate
                  className="text-xs font-black text-blue-700 hover:text-blue-800"
                >
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-blue-700 py-3 text-sm font-black text-white transition hover:bg-blue-800"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}