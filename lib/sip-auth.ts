import { redirect } from "next/navigation";

import type {
  SupportPermission,
  SupportRoleKey,
} from "../app/support/models";

import type {
  SipPermission,
} from "./sip-access";

import { createSipAuthServerClient } from "./supabase/sip-auth-server";
import { createSipAdminClient } from "./supabase/sip-server";

export type SipAccessContext = {
  userId: string;
  supportUserId: string;
  email: string;
  role: SupportRoleKey;
  permissions: SupportPermission[];
};

type SupportUserAccessRow = {
  id: string;
  email: string;
  role_id: string;
  status: string;
};

type SupportRoleAccessRow = {
  id: string;
  key: SupportRoleKey;
  permissions: SupportPermission[];
};

const permissionMap: Record<SipPermission, SupportPermission | null> = {
  "sip.access": "view_dashboard",
  "inbox.read": "view_conversations",
  "conversations.read": "view_conversations",
  "conversations.reply": "reply_to_conversations",
  "knowledge.read": "manage_knowledge",
  "knowledge.manage": "manage_knowledge",
  "escalations.read": "view_conversations",
  "escalations.manage": "assign_conversations",
  "learning.read": "manage_knowledge",
  "analytics.read": "view_analytics",
  "settings.read": "manage_settings",
  "users.manage": "manage_users",
};

export async function requireSipAccess(): Promise<SipAccessContext> {
  const authSupabase = await createSipAuthServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/sip-login");
  }

  if (!user.email) {
    await authSupabase.auth.signOut();
    redirect("/sip-login?error=access");
  }

  const supabase = createSipAdminClient();

  const { data: supportUserData, error: supportUserError } =
    await supabase
      .from("support_users")
      .select("id,email,role_id,status")
      .eq("id", user.id)
      .maybeSingle();

  if (supportUserError) {
    throw new Error(
      `Unable to load SIP user access: ${supportUserError.message}`,
    );
  }

  if (!supportUserData) {
    await authSupabase.auth.signOut();
    redirect("/sip-login?error=access");
  }

  const supportUser =
    supportUserData as SupportUserAccessRow;

  if (supportUser.status !== "active") {
    await authSupabase.auth.signOut();
    redirect("/sip-login?error=access");
  }

  const { data: roleData, error: roleError } =
    await supabase
      .from("support_roles")
      .select("id,key,permissions")
      .eq("id", supportUser.role_id)
      .maybeSingle();

  if (roleError) {
    throw new Error(
      `Unable to load SIP role access: ${roleError.message}`,
    );
  }

  if (!roleData) {
    await authSupabase.auth.signOut();
    redirect("/sip-login?error=access");
  }

  const role =
    roleData as SupportRoleAccessRow;

  return {
    userId: user.id,
    supportUserId: supportUser.id,
    email: supportUser.email,
    role: role.key,
    permissions: role.permissions,
  };
}

export async function requireSipPermission(
  permission: SipPermission,
): Promise<SipAccessContext> {
  const context = await requireSipAccess();

  const requiredPermission =
    permissionMap[permission];

  if (
    !requiredPermission ||
    !context.permissions.includes(requiredPermission)
  ) {
    redirect("/support");
  }

  return context;
}