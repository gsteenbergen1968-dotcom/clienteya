import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import MobileDashboardNav from "../MobileDashboardNav";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_status: string | null;
  plan_type: string | null;
  payment_amount: number | null;
  payment_method: string | null;
  payment_notes: string | null;
  created_at: string | null;
};

function formatGs(value: number | null) {
  if (!value) return "—";

  return `Gs. ${Number(value).toLocaleString("es-PY")}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusBadge(status: string | null) {
  if (status === "active") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (status === "pending_review") {
    return "border border-amber-200 bg-amber-100 text-amber-700";
  }

  if (status === "canceled" || status === "expired") {
    return "border border-red-200 bg-red-100 text-red-700";
  }

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function planBadge(plan: string | null) {
  if (plan === "pro") {
    return "border border-blue-200 bg-blue-100 text-blue-700";
  }

  if (plan === "enterprise") {
    return "border border-violet-200 bg-violet-100 text-violet-700";
  }

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function isAdminEmail(email?: string | null) {
  if (!email) return false;

  return (
    email.toLowerCase().trim() ===
    (process.env.ADMIN_EMAIL || "").toLowerCase().trim()
  );
}

export default async function AdminPage() {
  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  async function activatePro(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      redirect("/dashboard");
    }

    const id = String(formData.get("profileId") || "");

    if (!id) {
      redirect("/dashboard/admin");
    }

    const admin = createAdminClient();

    await admin
      .from("profiles")
      .update({
        plan_type: "pro",
        subscription_status: "active",
      })
      .eq("id", id);

    revalidatePath("/dashboard/admin");
  }

  async function activateBasic(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      redirect("/dashboard");
    }

    const id = String(formData.get("profileId") || "");

    if (!id) {
      redirect("/dashboard/admin");
    }

    const admin = createAdminClient();

    await admin
      .from("profiles")
      .update({
        plan_type: "basic",
        subscription_status: "active",
      })
      .eq("id", id);

    revalidatePath("/dashboard/admin");
  }

  async function pauseUser(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      redirect("/dashboard");
    }

    const id = String(formData.get("profileId") || "");

    if (!id) {
      redirect("/dashboard/admin");
    }

    const admin = createAdminClient();

    await admin
      .from("profiles")
      .update({
        subscription_status: "expired",
      })
      .eq("id", id);

    revalidatePath("/dashboard/admin");
  }

  const admin = createAdminClient();

  const { data } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, subscription_status, plan_type, payment_amount, payment_method, payment_notes, created_at",
    )
    .order("created_at", { ascending: false });

  const profiles = (data || []) as Profile[];

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 pb-36 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                  ClienteYA Admin
                </p>

                <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                  Admin panel
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Gestión interna de usuarios, planes y estado de suscripción.
                  Esta página solo está disponible para cuentas autorizadas de
                  ClienteYA.
                </p>
              </div>

              <div className="space-y-5">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-950">
                            {profile.full_name || profile.email || "Usuario"}
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${planBadge(
                              profile.plan_type,
                            )}`}
                          >
                            {profile.plan_type || "basic"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                              profile.subscription_status,
                            )}`}
                          >
                            {profile.subscription_status || "trial"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {profile.email || "Sin email"}
                        </p>

                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Monto
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-950">
                              {formatGs(profile.payment_amount)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Método
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-950">
                              {profile.payment_method || "—"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Creado
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-950">
                              {formatDate(profile.created_at)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 xl:col-span-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Nota
                            </p>

                            <p className="mt-2 break-words text-sm font-semibold text-slate-950">
                              {profile.payment_notes || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <form action={activatePro}>
                          <input
                            type="hidden"
                            name="profileId"
                            value={profile.id}
                          />

                          <button className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                            Activar Pro
                          </button>
                        </form>

                        <form action={activateBasic}>
                          <input
                            type="hidden"
                            name="profileId"
                            value={profile.id}
                          />

                          <button className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                            Básico
                          </button>
                        </form>

                        <form action={pauseUser}>
                          <input
                            type="hidden"
                            name="profileId"
                            value={profile.id}
                          />

                          <button className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100">
                            Pausar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}

                {profiles.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                    <p className="font-semibold text-slate-900">
                      No hay perfiles todavía
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Cuando existan usuarios registrados, aparecerán aquí.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileDashboardNav />
    </div>
  );
}