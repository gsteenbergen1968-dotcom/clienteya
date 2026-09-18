import type {
  KnowledgeCategoryId,
  KnowledgeItemId,
  SupportCountryCode,
  SupportEntity,
  SupportLocale,
  SupportTenantId,
  SupportUserId,
} from "./support-model";

export type KnowledgeItemStatus =
  | "draft"
  | "review"
  | "approved"
  | "archived";

export type KnowledgeItemVisibility =
  | "internal"
  | "customer"
  | "both";

export type KnowledgeItemScope = {
  tenantId?: SupportTenantId;
  countryCode?: SupportCountryCode;
};

export type KnowledgeItem = SupportEntity & {
  id: KnowledgeItemId;

  title: string;
  canonicalQuestion: string;
  canonicalAnswer: string;
  canonicalLanguage: "en";

  categoryId: KnowledgeCategoryId;

  status: KnowledgeItemStatus;
  visibility: KnowledgeItemVisibility;

  scope: KnowledgeItemScope;

  keywords: string[];
  supportedLocales: SupportLocale[];

  createdByUserId?: SupportUserId;
  approvedByUserId?: SupportUserId;
  approvedAt?: string;

  usageCount: number;
  automaticResolutionCount: number;
  humanResolutionCount: number;

  averageConfidence?: number;
  averageSatisfaction?: number;

  lastUsedAt?: string;
};