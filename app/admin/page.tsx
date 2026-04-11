import { redirect } from "next/navigation";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { createAdminClient } from "../../lib/supabase/server";

type ProfileRow = {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  created_at: string | null;
};

type AuthUser = {
  id: string;
  email?: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-ES");
}

function getStatusBadge(status: string | null) {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "trial") {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "canceled") {
    return "bg-red-100 text-red-700";
  }
  return "bg-slate-100 text-slate-700";
}

export default async function AdminPage() {
  const authSupabase = await createAuthServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const supabase = createAdminClient();

  const [{ data: profiles }, usersResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers(),
  ]);

  const authUsers: AuthUser[] = (usersResult.data?.users || []).map((u) => ({
    id: u.id,
    email: u.email,
  }));

  const profileRows: ProfileRow[] = profiles || [];

  const users = profileRows.map((profile) => {
    const authUser = authUsers.find((u) => u.id === profile.id);

    return {
      ...profile,
      email: authUser?.email || "Sin email",
    };
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestiona usuarios y activaciones de ClienteYA
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Volver al dashboard
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold">Usuarios</h2>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">
              No hay usuarios todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">Estado</th>
                    <th className="px-6 py-4 text-left">Trial hasta</th>
                    <th className="px-6 py-4 text-left">Creado</th>
                    <th className="px-6 py-4 text-left">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="px-6 py-4">
                        <div className="font-medium">{item.email}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {item.id}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                            item.subscription_status
                          )}`}
                        >
                          {item.subscription_status || "sin estado"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {formatDate(item.trial_ends_at)}
                      </td>

                      <td className="px-6 py-4">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <form
                            action="/api/admin/subscription"
                            method="POST"
                          >
                            <input
                              type="hidden"
                              name="profile_id"
                              value={item.id}
                            />
                            <input
                              type="hidden"
                              name="status"
                              value="active"
                            />
                            <button
                              type="submit"
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white"
                            >
                              Activar
                            </button>
                          </form>

                          <form
                            action="/api/admin/subscription"
                            method="POST"
                          >
                            <input
                              type="hidden"
                              name="profile_id"
                              value={item.id}
                            />
                            <input
                              type="hidden"
                              name="status"
                              value="trial"
                            />
                            <button
                              type="submit"
                              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700"
                            >
                              Poner trial
                            </button>
                          </form>

                          <form
                            action="/api/admin/subscription"
                            method="POST"
                          >
                            <input
                              type="hidden"
                              name="profile_id"
                              value={item.id}
                            />
                            <input
                              type="hidden"
                              name="status"
                              value="canceled"
                            />
                            <button
                              type="submit"
                              className="rounded-xl bg-red-600 px-3 py-2 text-xs font-medium text-white"
                            >
                              Desactivar
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}