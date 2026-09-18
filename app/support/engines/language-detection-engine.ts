import type { SupportLocale } from "../models";

export type LanguageDetectionResult = {
  locale: SupportLocale;
  confidence: number;
  isSupported: boolean;
};

export interface LanguageDetectionEngine {
  detect(text: string): Promise<LanguageDetectionResult>;

  isSupported(locale: SupportLocale): boolean;
}