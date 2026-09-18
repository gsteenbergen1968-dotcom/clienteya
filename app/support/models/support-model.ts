export type SupportId = string;

export type SupportTimestamp = string;

export type SupportLocale = string;

export type SupportCountryCode = string;

export type SupportTenantId = SupportId;

export type SupportUserId = SupportId;

export type SupportTeamId = SupportId;

export type SupportRoleId = SupportId;

export type SupportConversationId = SupportId;

export type SupportMessageId = SupportId;

export type KnowledgeItemId = SupportId;

export type KnowledgeCategoryId = SupportId;

export type SupportChannel =
  | "in_app"
  | "whatsapp"
  | "email"
  | "web"
  | "corporate_portal";

export type SupportPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

export type SupportStatus =
  | "new"
  | "analysing"
  | "answered"
  | "waiting_for_user"
  | "escalated"
  | "resolved"
  | "closed";

export type SupportResolutionType =
  | "automatic"
  | "knowledge_reuse"
  | "human"
  | "product_change"
  | "unresolved";

export type SupportActorType =
  | "customer"
  | "support_user"
  | "system"
  | "ai";

export type SupportScope = {
  tenantId: SupportTenantId;
  countryCode: SupportCountryCode;
  locale: SupportLocale;
};

export type SupportAuditFields = {
  createdAt: SupportTimestamp;
  updatedAt: SupportTimestamp;
};

export type SupportEntity = SupportAuditFields & {
  id: SupportId;
};

export type SupportPlatformIdentity = {
  name: "ClienteYA Support Intelligence Platform";
  shortName: "SIP";
  interfaceLanguage: "en";
};

export const SUPPORT_PLATFORM_IDENTITY: SupportPlatformIdentity = {
  name: "ClienteYA Support Intelligence Platform",
  shortName: "SIP",
  interfaceLanguage: "en",
};