"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createBrowserClient } from "@supabase/ssr";

export default function SipResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [saving, setSaving] = useState(false);

  const supabase = useMemo(() => {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SIP_SUPABASE_URL;

    const supabasePublishableKey =
      process.env
        .NEXT_PUBLIC_SIP_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabasePublishableKey
    ) {
      throw new Error(
        "Missing SIP Supabase auth environment variables.",
      );
    }

    return createBrowserClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        auth: {
          storageKey: "clienteya-sip-auth",
        },
      },
    );
  }, []);

  useEffect(() => {
    async function prepareRecovery() {
      const searchParams =
        new URLSearchParams(
          window.location.search,
        );

      const code =
        searchParams.get("code");

      if (!code) {
        setError(
          "The recovery link is invalid or has expired.",
        );
        return;
      }

      const { error: sessionError } =
        await supabase.auth.exchangeCodeForSession(
          code,
        );

      if (sessionError) {
        setError(
          "The recovery session could not be opened.",
        );
        return;
      }

      window.history.replaceState(
        null,
        "",
        "/sip-reset-password",
      );

      setReady(true);
    }

    void prepareRecovery();
  }, [supabase]);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "The passwords do not match.",
      );
      return;
    }

    setSaving(true);
    setError("");

    const { error: updateError } =
      await supabase.auth.updateUser({
        password,
      });

    if (updateError) {
      setSaving(false);
      setError(
        "The password could not be updated.",
      );
      return;
    }

    await supabase.auth.signOut();

    window.location.href =
      "/sip-login?reset=1";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xl font-black tracking-tight text-slate-950">
            ClienteYA SIP
          </p>

          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Support Intelligence Platform
          </p>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Secure Access
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-950">
            Set new SIP password
          </h1>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Choose a new password for your SIP account.
          </p>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {error}
            </div>
          ) : null}

          {!ready && !error ? (
            <p className="mt-6 text-sm font-semibold text-slate-600">
              Checking recovery link...
            </p>
          ) : null}

          {ready ? (
            <form
              onSubmit={submit}
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-black text-slate-950"
                >
                  New password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-black text-slate-950"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-blue-700 py-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Set new password"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}