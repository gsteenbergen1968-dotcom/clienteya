import type { SupportLocale } from "../models";

import type {
  LanguageDetectionEngine,
  LanguageDetectionResult,
} from "./language-detection-engine";

export type BuildLanguageDetectionEngineOptions = {
  supportedLocales?: SupportLocale[];
  fallbackLocale?: SupportLocale;
};

const DEFAULT_SUPPORTED_LOCALES: SupportLocale[] = [
  "en",
  "es",
  "nl",
  "pt",
];

function detectByPatterns(text: string): {
  locale: SupportLocale;
  confidence: number;
} {
  const normalizedText = text.toLowerCase();

  const patterns: Record<string, string[]> = {
    es: [
      "hola",
      "gracias",
      "como",
      "qué",
      "quiero",
      "necesito",
      "factura",
      "empresa",
      "whatsapp",
    ],
    nl: [
      "hallo",
      "bedankt",
      "hoe",
      "wat",
      "waar",
      "waarom",
      "factuur",
      "bedrijf",
      "ondersteuning",
    ],
    pt: [
      "olá",
      "obrigado",
      "como",
      "quero",
      "preciso",
      "fatura",
      "empresa",
      "suporte",
    ],
    en: [
      "hello",
      "thanks",
      "how",
      "what",
      "where",
      "why",
      "invoice",
      "company",
      "support",
    ],
  };

  let bestLocale: SupportLocale = "en";
  let bestMatches = 0;

  for (const [locale, words] of Object.entries(patterns)) {
    const matches = words.filter((word) =>
      normalizedText.includes(word),
    ).length;

    if (matches > bestMatches) {
      bestLocale = locale;
      bestMatches = matches;
    }
  }

  return {
    locale: bestLocale,
    confidence:
      bestMatches === 0
        ? 0.25
        : Math.min(0.5 + bestMatches * 0.1, 0.95),
  };
}

export function buildLanguageDetectionEngine(
  options: BuildLanguageDetectionEngineOptions = {},
): LanguageDetectionEngine {
  const supportedLocales =
    options.supportedLocales ?? DEFAULT_SUPPORTED_LOCALES;

  const fallbackLocale = options.fallbackLocale ?? "en";

  return {
    async detect(
      text: string,
    ): Promise<LanguageDetectionResult> {
      const detected = detectByPatterns(text);

      const isSupported = supportedLocales.includes(
        detected.locale,
      );

      return {
        locale: isSupported
          ? detected.locale
          : fallbackLocale,
        confidence: detected.confidence,
        isSupported,
      };
    },

    isSupported(locale: SupportLocale): boolean {
      return supportedLocales.includes(locale);
    },
  };
}