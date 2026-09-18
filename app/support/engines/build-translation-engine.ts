import type { SupportTranslationAdapter } from "../adapters";

import type {
  SupportLocale,
  Translation,
} from "../models";

import type {
  TranslationEngine,
  TranslationRequest,
  TranslationResult,
} from "./translation-engine";

export type TranslationProvider = {
  translate(
    sourceText: string,
    sourceLocale: SupportLocale,
    targetLocale: SupportLocale,
  ): Promise<{
    translatedText: string;
    confidence: number;
  }>;
};

export type BuildTranslationEngineOptions = {
  humanReviewThreshold?: number;
};

function findReusableTranslation(
  translations: Translation[],
  request: TranslationRequest,
): Translation | undefined {
  return translations
    .filter(
      (translation) =>
        translation.sourceLocale === request.sourceLocale &&
        translation.targetLocale === request.targetLocale &&
        translation.sourceText === request.sourceText &&
        translation.status === "approved",
    )
    .sort((left, right) => right.version - left.version)[0];
}

export function buildTranslationEngine(
  adapter: SupportTranslationAdapter,
  provider: TranslationProvider,
  options: BuildTranslationEngineOptions = {},
): TranslationEngine {
  const humanReviewThreshold =
    options.humanReviewThreshold ?? 0.85;

  return {
    async translate(
      request: TranslationRequest,
    ): Promise<TranslationResult> {
      if (request.sourceLocale === request.targetLocale) {
        return {
          translatedText: request.sourceText,
          sourceLocale: request.sourceLocale,
          targetLocale: request.targetLocale,
          confidence: 1,
          requiresHumanReview: false,
        };
      }

      const translations =
        await adapter.getTranslationsByItemId("");

      const reusableTranslation = findReusableTranslation(
        translations,
        request,
      );

      if (reusableTranslation) {
        return {
          translatedText: reusableTranslation.translatedText,
          sourceLocale: reusableTranslation.sourceLocale,
          targetLocale: reusableTranslation.targetLocale,
          confidence: reusableTranslation.qualityScore ?? 1,
          reusedTranslation: reusableTranslation,
          requiresHumanReview: false,
        };
      }

      const generated = await provider.translate(
        request.sourceText,
        request.sourceLocale,
        request.targetLocale,
      );

      return {
        translatedText: generated.translatedText,
        sourceLocale: request.sourceLocale,
        targetLocale: request.targetLocale,
        confidence: generated.confidence,
        requiresHumanReview:
          generated.confidence < humanReviewThreshold,
      };
    },
  };
}