import type {
  SupportEntity,
  SupportTeamId,
  SupportUserId,
} from "./support-model";

export type SupportTeamType =
  | "general"
  | "technical"
  | "billing"
  | "customer_success"
  | "knowledge"
  | "management";

export type SupportTeam = SupportEntity & {
  id: SupportTeamId;
  name: string;
  description?: string;

  type: SupportTeamType;

  managerId?: SupportUserId;

  memberIds: SupportUserId[];

  isActive: boolean;
};