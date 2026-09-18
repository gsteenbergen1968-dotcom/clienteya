import type {
  SupportLocale,
} from "../models";

import type {
  TranslationProvider,
} from "../engines/build-translation-engine";

type OpenAIResponseContent = {
  type?: string;
  text?: string;
};

type OpenAIResponseOutput = {
  type?: string;
  content?: OpenAIResponseContent[];
};

type OpenAIResponse = {
  output?: OpenAIResponseOutput[];
  error?: {
    message?: string;
  };
};

function getTranslatedText(
  response: OpenAIResponse,
): string | null {
  const texts =
    response.output
      ?.flatMap(
        (item) =>
          item.content ?? [],
      )
      .filter(
        (content) =>
          content.type === "output_text" &&
          typeof content.text === "string",
      )
      .map(
        (content) =>
          content.text?.trim() ?? "",
      )
      .filter(Boolean) ?? [];

  const translatedText =
    texts.join("\n").trim();

  return translatedText || null;
}

export const openAITranslationProvider: TranslationProvider = {
  async translate(
    sourceText: string,
    sourceLocale: SupportLocale,
    targetLocale: SupportLocale,
  ) {
    if (sourceLocale === targetLocale) {
      return {
        translatedText: sourceText,
        confidence: 1,
      };
    }

    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured for SIP translation.",
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          instructions:
            "You are the translation layer for ClienteYA SIP. Translate the provided support text faithfully into the requested target language. Preserve meaning, tone, product names, field names, numbers, URLs and formatting. Do not explain, summarize, answer the support question, or add any commentary. Return only the translated text.",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: [
                    `Source language: ${sourceLocale}`,
                    `Target language: ${targetLocale}`,
                    "",
                    sourceText,
                  ].join("\n"),
                },
              ],
            },
          ],
        }),
      },
    );

    const payload =
      (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      throw new Error(
        `SIP translation failed: ${
          payload.error?.message ??
          response.statusText
        }`,
      );
    }

    const translatedText =
      getTranslatedText(payload);

    if (!translatedText) {
      throw new Error(
        "SIP translation returned no translated text.",
      );
    }

    return {
      translatedText,
      confidence: 1,
    };
  },
};