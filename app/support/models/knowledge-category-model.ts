import type {
  KnowledgeCategoryId,
  SupportEntity,
} from "./support-model";

export type KnowledgeCategoryStatus =
  | "active"
  | "inactive"
  | "archived";

export type KnowledgeCategory = SupportEntity & {
  id: KnowledgeCategoryId;

  key: string;
  name: string;
  description?: string;

  parentCategoryId?: KnowledgeCategoryId;

  sortOrder: number;
  status: KnowledgeCategoryStatus;

  isSystemCategory: boolean;
};