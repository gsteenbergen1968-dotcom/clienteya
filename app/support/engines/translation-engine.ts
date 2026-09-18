import type {
  SupportLocale,
  Translation,
} from "../models";

export type TranslationRequest = {
  sourceText: string;
  sourceLocale: SupportLocale;
  targetLocale: SupportLocale;
};

export type TranslationResult = {
  translatedText: string;
  sourceLocale: SupportLocale;
  targetLocale: SupportLocale;

  confidence: number;

  reusedTranslation?: Translation;
  requiresHumanReview: boolean;
};

export interface TranslationEngine {
  translate(
    request: TranslationRequest,
  ): Promise<TranslationResult>;
}