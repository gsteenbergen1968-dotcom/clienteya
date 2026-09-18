import type {
  SupportEntity,
  SupportLocale,
  SupportRoleId,
  SupportTeamId,
} from "./support-model";

export type SupportUserStatus =
  | "active"
  | "inactive"
  | "invited"
  | "suspended";

export type SupportUser = SupportEntity & {
  firstName: string;
  lastName: string;
  email: string;

  roleId: SupportRoleId;
  teamId?: SupportTeamId;

  locale: SupportLocale;
  timeZone: string;

  status: SupportUserStatus;

  lastLoginAt?: string;
};