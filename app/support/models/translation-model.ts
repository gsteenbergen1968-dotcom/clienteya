import type {
  KnowledgeItemId,
  SupportEntity,
  SupportLocale,
  SupportUserId,
} from "./support-model";

export type TranslationStatus =
  | "draft"
  | "review"
  | "approved"
  | "archived";

export type TranslationSource =
  | "human"
  | "ai"
  | "human_reviewed";

export type Translation = SupportEntity & {
  knowledgeItemId: KnowledgeItemId;

  sourceLocale: SupportLocale;
  targetLocale: SupportLocale;

  sourceText: string;
  translatedText: string;

  status: TranslationStatus;
  source: TranslationSource;

  version: number;

  createdByUserId?: SupportUserId;
  reviewedByUserId?: SupportUserId;
  approvedByUserId?: SupportUserId;

  reviewedAt?: string;
  approvedAt?: string;

  qualityScore?: number;
  lastUsedAt?: string;
};