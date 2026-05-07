import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
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
  return `Gs. ${Number(value).toLocaleString("es-ES")}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES");
}

function statusBadge(status: string | null) {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
  if (status === "pending_review") {
    return "bg-amber-100 text-amber-700 border border-amber-200";
  }
  if (status === "canceled" || status === "expired") {
    return "bg-red-100 text-red-700 border border-red-200";
  }
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function planBadge(plan: string | null) {
  if (plan === "pro") {
    return "bg-blue-100 text-blue-700 border border-blue-200";
  }
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

export default async function AdminPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data: currentProfile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();

  // 🔒 ADMIN CHECK — zet hier jouw email
  const isAdmin =
    currentProfile?.email === "jouw@email.com" ||
    user.email === "jouw@email.com";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  async function activatePro(formData: FormData) {
    "use server";
    const id = String(formData.get("profileId"));
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
    const id = String(formData.get("profileId"));
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
    const id = String(formData.get("profileId"));
    const admin = createAdminClient();

    await admin
      .from("profiles")
      .update({
        subscription_status: "expired",
      })
      .eq("id", id);

    revalidatePath("/dashboard/admin");
  }

  const { data } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, subscription_status, plan_type, payment_amount, payment_method, payment_notes, created_at"
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

          <div className="flex-1 px-6 py-10">
            <div className="mx-auto max-w-6xl">
              <h1 className="mb-8 text-4xl font-bold text-slate-900">
                Admin panel
              </h1>

              <div className="space-y-5">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold">
                            {profile.full_name || profile.email}
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${planBadge(
                              profile.plan_type
                            )}`}
                          >
                            {profile.plan_type || "basic"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                              profile.subscription_status
                            )}`}
                          >
                            {profile.subscription_status || "trial"}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500">
                          {profile.email}
                        </p>

                        {/* 🔥 FIXED GRID */}
                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="card-mini">
                            <p className="label">Monto</p>
                            <p>{formatGs(profile.payment_amount)}</p>
                          </div>

                          <div className="card-mini">
                            <p className="label">Método</p>
                            <p>{profile.payment_method || "—"}</p>
                          </div>

                          <div className="card-mini">
                            <p className="label">Creado</p>
                            <p>{formatDate(profile.created_at)}</p>
                          </div>

                          {/* 🔥 FIX NOTE */}
                          <div className="card-mini md:col-span-2 xl:col-span-1">
                            <p className="label">Nota</p>
                            <p className="break-words">
                              {profile.payment_notes || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 🔥 BUTTONS */}
                      <div className="flex flex-wrap gap-2">
                        <form action={activatePro}>
                          <input
                            type="hidden"
                            name="profileId"
                            value={profile.id}
                          />
                          <button className="btn-primary">
                            Activar Pro
                          </button>
                        </form>

                        <form action={activateBasic}>
                          <input
                            type="hidden"
                            name="profileId"
                            value={profile.id}
                          />
                          <button className="btn-secondary">
                            Básico
                          </button>
                        </form>

                        <form action={pauseUser}>
                          <input
                            type="hidden"
                            name="profileId"
                            value={profile.id}
                          />
                          <button className="btn-danger">
                            Pausar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}