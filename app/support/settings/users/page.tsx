import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSipPermission } from "../../../../lib/sip-auth";
import { createAdminClient } from "../../../../lib/supabase/server";

import { buildSupportMemoryAdapter } from "../../adapters";

import type {
  SupportTeam,
  SupportUser,
} from "../../models";

export const dynamic = "force-dynamic";

function formatRoleName(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClasses(status: string) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "invited") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (status === "suspended") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

async function createSupportUser(formData: FormData) {
  "use server";

  await requireSipPermission("users.manage");

  const firstName = String(
    formData.get("firstName") ?? "",
  ).trim();

  const lastName = String(
    formData.get("lastName") ?? "",
  ).trim();

  const email = String(
    formData.get("email") ?? "",
  )
    .trim()
    .toLowerCase();

  const roleId = String(
    formData.get("roleId") ?? "",
  ).trim();

  const localeValue = String(
    formData.get("locale") ?? "en",
  ).trim();

  if (
    !firstName ||
    !lastName ||
    !email ||
    !roleId ||
    !["en", "es"].includes(localeValue)
  ) {
    redirect(
      "/support/settings/users?error=missing",
    );
  }

  const adapter = buildSupportMemoryAdapter();

  const [users, roles] = await Promise.all([
    adapter.getUsers(),
    adapter.getRoles(),
  ]);

  const existingUser = users.find(
    (user) =>
      user.email.trim().toLowerCase() === email,
  );

  if (existingUser) {
    redirect(
      "/support/settings/users?error=exists",
    );
  }

  const role = roles.find(
    (item) => item.id === roleId,
  );

  if (!role) {
    redirect(
      "/support/settings/users?error=role",
    );
  }

  const supabase = createAdminClient();

  const {
    data: authUsersData,
    error: authUsersError,
  } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authUsersError) {
    redirect(
      `/support/settings/users?error=auth&message=${encodeURIComponent(
        authUsersError.message,
      )}`,
    );
  }

  const existingAuthUser =
    authUsersData.users.find(
      (authUser) =>
        authUser.email?.trim().toLowerCase() === email,
    );

  let authUserId: string;
  let supportUserStatus: SupportUser["status"];
  let reusedExistingAuthUser = false;

  if (existingAuthUser) {
    authUserId = existingAuthUser.id;
    supportUserStatus = "active";
    reusedExistingAuthUser = true;
  } else {
    const {
      data: inviteData,
      error: inviteError,
    } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          first_name: firstName,
          last_name: lastName,
          sip_role: role.key,
        },
      },
    );

    if (inviteError || !inviteData.user) {
      redirect(
        `/support/settings/users?error=invite&message=${encodeURIComponent(
          inviteError?.message ??
            "Unable to create SIP invitation.",
        )}`,
      );
    }

    authUserId = inviteData.user.id;
    supportUserStatus = "invited";
  }

  const now = new Date().toISOString();

  const supportUser: SupportUser = {
    id: authUserId,
    firstName,
    lastName,
    email,
    roleId: role.id,
    locale:
      localeValue as SupportUser["locale"],
    timeZone: "America/Asuncion",
    status: supportUserStatus,
    createdAt: now,
    updatedAt: now,
  };

  await adapter.saveUser(
    supportUser,
  );

  revalidatePath(
    "/support/settings/users",
  );

  redirect(
    reusedExistingAuthUser
      ? "/support/settings/users?linked=1"
      : "/support/settings/users?created=1",
  );
}

async function createSupportTeam(formData: FormData) {
  "use server";

  await requireSipPermission("users.manage");

  const name = String(
    formData.get("teamName") ?? "",
  ).trim();

  const description = String(
    formData.get("teamDescription") ?? "",
  ).trim();

  if (!name) {
    redirect(
      "/support/settings/users?teamError=missing",
    );
  }

  const adapter = buildSupportMemoryAdapter();
  const teams = await adapter.getTeams();

  const existingTeam = teams.find(
    (team) =>
      team.name.trim().toLowerCase() ===
      name.toLowerCase(),
  );

  if (existingTeam) {
    redirect(
      "/support/settings/users?teamError=exists",
    );
  }

  const now = new Date().toISOString();

  const team: SupportTeam = {
    id: crypto.randomUUID(),
    name,
    description: description || undefined,
    type: "general",
    memberIds: [],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await adapter.saveTeam(team);

  revalidatePath(
    "/support/settings/users",
  );

  redirect(
    "/support/settings/users?teamCreated=1",
  );
}


async function assignSupportUserTeam(formData: FormData) {
  "use server";

  await requireSipPermission("users.manage");

  const userId = String(
    formData.get("userId") ?? "",
  ).trim();

  const teamId = String(
    formData.get("teamId") ?? "",
  ).trim();

  if (!userId) {
    redirect(
      "/support/settings/users?assignError=user",
    );
  }

  const adapter = buildSupportMemoryAdapter();

  const [user, teams] = await Promise.all([
    adapter.getUserById(userId),
    adapter.getTeams(),
  ]);

  if (!user) {
    redirect(
      "/support/settings/users?assignError=user",
    );
  }

  const targetTeam = teamId
    ? teams.find((team) => team.id === teamId)
    : undefined;

  if (teamId && !targetTeam) {
    redirect(
      "/support/settings/users?assignError=team",
    );
  }

  const previousTeam = user.teamId
    ? teams.find((team) => team.id === user.teamId)
    : undefined;

  const now = new Date().toISOString();

  if (
    previousTeam &&
    previousTeam.id !== teamId
  ) {
    await adapter.saveTeam({
      ...previousTeam,
      memberIds: previousTeam.memberIds.filter(
        (memberId) => memberId !== user.id,
      ),
      updatedAt: now,
    });
  }

  if (targetTeam) {
    await adapter.saveTeam({
      ...targetTeam,
      memberIds: Array.from(
        new Set([
          ...targetTeam.memberIds,
          user.id,
        ]),
      ),
      updatedAt: now,
    });
  }

  await adapter.saveUser({
    ...user,
    teamId: teamId || undefined,
    updatedAt: now,
  });

  revalidatePath(
    "/support/settings/users",
  );

  redirect(
    "/support/settings/users?assigned=1",
  );
}


async function updateSupportUserAccess(formData: FormData) {
  "use server";

  const access =
    await requireSipPermission("users.manage");

  const userId = String(
    formData.get("userId") ?? "",
  ).trim();

  const roleId = String(
    formData.get("roleId") ?? "",
  ).trim();

  const status = String(
    formData.get("status") ?? "",
  ).trim();

  if (
    !userId ||
    !roleId ||
    !["active", "inactive", "suspended"].includes(status)
  ) {
    redirect(
      "/support/settings/users?accessError=missing",
    );
  }

  const adapter = buildSupportMemoryAdapter();

  const [user, roles] = await Promise.all([
    adapter.getUserById(userId),
    adapter.getRoles(),
  ]);

  if (!user) {
    redirect(
      "/support/settings/users?accessError=user",
    );
  }

  const currentRole = roles.find(
    (role) => role.id === user.roleId,
  );

  if (
    user.id === access.supportUserId ||
    currentRole?.key === "founder"
  ) {
    redirect(
      "/support/settings/users?accessError=founder",
    );
  }

  const role = roles.find(
    (item) =>
      item.id === roleId &&
      item.key !== "founder",
  );

  if (!role) {
    redirect(
      "/support/settings/users?accessError=role",
    );
  }

  await adapter.saveUser({
    ...user,
    roleId: role.id,
    status: status as SupportUser["status"],
    updatedAt: new Date().toISOString(),
  });

  revalidatePath(
    "/support/settings/users",
  );

  redirect(
    "/support/settings/users?accessUpdated=1",
  );
}

type SupportUsersPageProps = {
  searchParams?: Promise<{
    created?: string;
    linked?: string;
    error?: string;
    message?: string;
    teamCreated?: string;
    teamError?: string;
    assigned?: string;
    assignError?: string;
    accessUpdated?: string;
    accessError?: string;
  }>;
};

export default async function SupportUsersPage({
  searchParams,
}: SupportUsersPageProps) {
  await requireSipPermission("users.manage");

  const adapter = buildSupportMemoryAdapter();

  const [users, roles, teams] = await Promise.all([
    adapter.getUsers(),
    adapter.getRoles(),
    adapter.getTeams(),
  ]);

  const params =
    (await searchParams) ?? {};

  const roleNames = new Map(
    roles.map((role) => [role.id, role.name]),
  );

  const teamNames = new Map(
    teams.map((team) => [team.id, team.name]),
  );

  const founderRoleId =
    roles.find(
      (role) => role.key === "founder",
    )?.id;

  return (
    <main className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              SIP Access Management
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Users and Teams
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Manage support users, roles and team membership inside the
              standalone SIP environment.
            </p>
          </div>

          <Link
            href="/support/settings"
            className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
          >
            Back to Settings
          </Link>
        </div>
      </section>

      {params.created === "1" ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
          SIP user created and invitation sent.
        </div>
      ) : null}

      {params.linked === "1" ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
          Existing account connected to SIP and activated.
        </div>
      ) : null}

      {params.teamCreated === "1" ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
          Support team created.
        </div>
      ) : null}

      {params.assigned === "1" ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
          Support user team assignment updated.
        </div>
      ) : null}

      {params.accessUpdated === "1" ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
          Support user role and status updated.
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          {params.error === "missing"
            ? "Complete all required user fields."
            : params.error === "exists"
              ? "This email is already registered as a SIP user."
              : params.error === "role"
                ? "The selected SIP role is not available."
                : params.error === "auth"
                  ? params.message ??
                    "Unable to check existing authentication users."
                  : params.message ??
                    "Unable to create the SIP user."}
        </div>
      ) : null}

      {params.teamError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          {params.teamError === "missing"
            ? "Enter a team name."
            : params.teamError === "exists"
              ? "A support team with this name already exists."
              : "Unable to create the support team."}
        </div>
      ) : null}

      {params.assignError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          {params.assignError === "user"
            ? "The selected SIP user is not available."
            : params.assignError === "team"
              ? "The selected support team is not available."
              : "Unable to update the team assignment."}
        </div>
      ) : null}

      {params.accessError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          {params.accessError === "missing"
            ? "Select a valid role and status."
            : params.accessError === "user"
              ? "The selected SIP user is not available."
              : params.accessError === "founder"
                ? "The Founder account is protected and cannot be changed here."
                : params.accessError === "role"
                  ? "The selected SIP role is not available."
                  : "Unable to update the SIP user access."}
        </div>
      ) : null}

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Add User
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Invite Support User
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Create a standalone SIP account and assign its authorization role.
          </p>
        </div>

        <form
          action={createSupportUser}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label
              htmlFor="firstName"
              className="text-sm font-black text-slate-950"
            >
              First name
            </label>

            <input
              id="firstName"
              name="firstName"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="text-sm font-black text-slate-950"
            >
              Last name
            </label>

            <input
              id="lastName"
              name="lastName"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-sm font-black text-slate-950"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="roleId"
              className="text-sm font-black text-slate-950"
            >
              Role
            </label>

            <select
              id="roleId"
              name="roleId"
              required
              defaultValue=""
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option
                value=""
                disabled
              >
                Select role
              </option>

              {roles
                .filter(
                  (role) =>
                    role.key !== "founder",
                )
                .map((role) => (
                  <option
                    key={role.id}
                    value={role.id}
                  >
                    {role.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="locale"
              className="text-sm font-black text-slate-950"
            >
              Working language
            </label>

            <select
              id="locale"
              name="locale"
              defaultValue="en"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="en">
                English
              </option>

              <option value="es">
                Spanish
              </option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
            >
              Invite User
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-black text-slate-700">
            Support Users
          </p>

          <p className="mt-3 text-4xl font-black text-slate-950">
            {users.length}
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Registered SIP users.
          </p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-black text-slate-700">
            Roles
          </p>

          <p className="mt-3 text-4xl font-black text-slate-950">
            {roles.length}
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Available SIP authorization roles.
          </p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-black text-slate-700">
            Teams
          </p>

          <p className="mt-3 text-4xl font-black text-slate-950">
            {teams.length}
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Active and configured support teams.
          </p>
        </article>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Access Control
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Support Users
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Every active user receives access according to the assigned SIP
            role.
          </p>
        </div>

        {users.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-black text-slate-950">
              No support users yet
            </h3>

            <p className="mt-2 text-sm font-semibold text-slate-600">
              SIP users will appear here after they are added to the support
              environment.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-black">
                    User
                  </th>
                  <th className="px-5 py-4 font-black">
                    Role
                  </th>
                  <th className="px-5 py-4 font-black">
                    Team
                  </th>
                  <th className="px-5 py-4 font-black">
                    Locale
                  </th>
                  <th className="px-5 py-4 font-black">
                    Status
                  </th>
                  <th className="px-5 py-4 font-black">
                    Access Management
                  </th>
                  <th className="px-5 py-4 font-black">
                    Team Assignment
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-200 bg-white"
                  >
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-950">
                        {user.firstName} {user.lastName}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {user.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {roleNames.get(user.roleId) ??
                        formatRoleName(String(user.roleId))}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {user.teamId
                        ? teamNames.get(user.teamId) ?? user.teamId
                        : "—"}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {user.locale}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${getStatusClasses(
                          String(user.status),
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {user.roleId === founderRoleId ? (
                        <div className="min-w-[270px] rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">
                            Protected Founder
                          </p>

                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                            Founder role and access status cannot be changed from this screen.
                          </p>
                        </div>
                      ) : (
                        <form
                          action={updateSupportUserAccess}
                          className="grid min-w-[300px] gap-2"
                        >
                          <input
                            type="hidden"
                            name="userId"
                            value={user.id}
                          />

                          <select
                            name="roleId"
                            defaultValue={user.roleId}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          >
                            {roles
                              .filter(
                                (role) =>
                                  role.key !== "founder",
                              )
                              .map((role) => (
                                <option
                                  key={role.id}
                                  value={role.id}
                                >
                                  {role.name}
                                </option>
                              ))}
                          </select>

                          <select
                            name="status"
                            defaultValue={user.status}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          >
                            {user.status === "invited" ? (
                              <option
                                value="invited"
                                disabled
                              >
                                Invited
                              </option>
                            ) : null}

                            <option value="active">
                              Active
                            </option>

                            <option value="inactive">
                              Inactive
                            </option>

                            <option value="suspended">
                              Suspended
                            </option>
                          </select>

                          <button
                            type="submit"
                            className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                          >
                            Update Access
                          </button>
                        </form>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <form
                        action={assignSupportUserTeam}
                        className="flex min-w-[250px] items-center gap-2"
                      >
                        <input
                          type="hidden"
                          name="userId"
                          value={user.id}
                        />

                        <select
                          name="teamId"
                          defaultValue={user.teamId ?? ""}
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">
                            No team
                          </option>

                          {teams.map((team) => (
                            <option
                              key={team.id}
                              value={team.id}
                            >
                              {team.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="submit"
                          className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-800"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Roles
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Authorization Roles
          </h2>

          <div className="mt-5 space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-black text-slate-950">
                  {role.name}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {role.description ?? formatRoleName(role.key)}
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-blue-700">
                  {role.permissions.length} permissions
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Teams
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Support Teams
          </h2>

          <form
            action={createSupportTeam}
            className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div>
              <label
                htmlFor="teamName"
                className="text-sm font-black text-slate-950"
              >
                Team name
              </label>

              <input
                id="teamName"
                name="teamName"
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="teamDescription"
                className="text-sm font-black text-slate-950"
              >
                Description
              </label>

              <textarea
                id="teamDescription"
                name="teamDescription"
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
            >
              Create Team
            </button>
          </form>

          {teams.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="font-black text-slate-950">
                No teams configured
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-600">
                Create the first SIP support team above.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-950">
                        {team.name}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {team.description ?? team.type}
                      </p>
                    </div>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                      Active
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-blue-700">
                    {team.memberIds.length} members
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}