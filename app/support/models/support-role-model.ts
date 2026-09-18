import type {
  SupportEntity,
  SupportRoleId,
} from "./support-model";

export type SupportPermission =
  | "view_dashboard"
  | "view_conversations"
  | "reply_to_conversations"
  | "assign_conversations"
  | "manage_knowledge"
  | "approve_knowledge"
  | "view_analytics"
  | "manage_users"
  | "manage_teams"
  | "manage_settings"
  | "view_audit_log"
  | "manage_platform";

export type SupportRoleKey =
  | "support_agent"
  | "senior_support"
  | "knowledge_manager"
  | "support_lead"
  | "founder";

export type SupportRole = SupportEntity & {
  id: SupportRoleId;
  key: SupportRoleKey;
  name: string;
  description?: string;
  permissions: SupportPermission[];
  isSystemRole: boolean;
};