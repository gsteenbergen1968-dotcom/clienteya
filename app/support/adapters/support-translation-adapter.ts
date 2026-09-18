import type {
  SupportLocale,
  Translation,
} from "../models";

export interface SupportTranslationAdapter {
  getTranslationsByItemId(
    knowledgeItemId: string,
  ): Promise<Translation[]>;

  getApprovedTranslation(
    knowledgeItemId: string,
    targetLocale: SupportLocale,
  ): Promise<Translation | null>;

  saveTranslation(
    translation: Translation,
  ): Promise<Translation>;
}