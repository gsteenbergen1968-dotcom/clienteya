import type { SupportKnowledgeAdapter } from "../adapters";

import type {
  KnowledgeAnswer,
  KnowledgeItem,
  SupportLocale,
} from "../models";

import type {
  KnowledgeEngine,
  KnowledgeMatch,
  KnowledgeSearchResult,
} from "./knowledge-engine";

export type BuildKnowledgeEngineOptions = {
  reliableMatchThreshold?: number;
  automaticResponseThreshold?: number;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateMatchScore(
  question: string,
  item: KnowledgeItem,
): number {
  const normalizedQuestion = normalizeText(question);
  const normalizedCanonicalQuestion = normalizeText(
    item.canonicalQuestion,
  );
  const normalizedTitle = normalizeText(item.title);

  if (
    normalizedQuestion === normalizedCanonicalQuestion ||
    normalizedQuestion === normalizedTitle
  ) {
    return 1;
  }

  const questionTerms = new Set(
    normalizedQuestion.split(" ").filter(Boolean),
  );

  const searchableTerms = new Set(
    [
      normalizedCanonicalQuestion,
      normalizedTitle,
      ...item.keywords.map(normalizeText),
    ]
      .join(" ")
      .split(" ")
      .filter(Boolean),
  );

  if (questionTerms.size === 0 || searchableTerms.size === 0) {
    return 0;
  }

  let matchedTerms = 0;

  for (const term of questionTerms) {
    if (searchableTerms.has(term)) {
      matchedTerms += 1;
    }
  }

  return matchedTerms / questionTerms.size;
}

async function findApprovedAnswer(
  adapter: SupportKnowledgeAdapter,
  knowledgeItemId: string,
  locale: SupportLocale,
): Promise<KnowledgeAnswer | null> {
  const answers =
    await adapter.getKnowledgeAnswersByItemId(knowledgeItemId);

  return (
    answers.find(
      (answer) =>
        answer.locale === locale &&
        answer.status === "approved",
    ) ??
    answers.find(
      (answer) =>
        answer.locale === "en" &&
        answer.status === "approved",
    ) ??
    null
  );
}

export function buildKnowledgeEngine(
  adapter: SupportKnowledgeAdapter,
  options: BuildKnowledgeEngineOptions = {},
): KnowledgeEngine {
  const reliableMatchThreshold =
    options.reliableMatchThreshold ?? 0.7;

  const automaticResponseThreshold =
    options.automaticResponseThreshold ?? 0.85;

  return {
    async findKnowledge(
      question: string,
      locale: SupportLocale,
    ): Promise<KnowledgeSearchResult> {
      const items = await adapter.getKnowledgeItems();

      const availableItems = items.filter(
        (item) =>
          item.status === "approved" &&
          item.visibility !== "internal",
      );

      const matches: KnowledgeMatch[] = [];

      for (const item of availableItems) {
        const confidence = calculateMatchScore(question, item);

        if (confidence < reliableMatchThreshold) {
          continue;
        }

        const answer = await findApprovedAnswer(
          adapter,
          item.id,
          locale,
        );

        matches.push({
          item,
          answer: answer ?? undefined,
          confidence,
          exactMatch: confidence === 1,
          automaticResponse:
            confidence >= automaticResponseThreshold &&
            Boolean(answer),
        });
      }

      matches.sort(
        (left, right) => right.confidence - left.confidence,
      );

      const bestMatch = matches[0];

      return {
        matches,
        bestMatch,
        requiresHumanReview:
          !bestMatch || !bestMatch.automaticResponse,
        requiresNewKnowledge: matches.length === 0,
      };
    },

    async findKnowledgeById(
      knowledgeItemId: string,
    ): Promise<KnowledgeItem | null> {
      return adapter.getKnowledgeItemById(knowledgeItemId);
    },

    async getAnswer(
      knowledgeItemId: string,
      locale: SupportLocale,
    ): Promise<KnowledgeAnswer | null> {
      return findApprovedAnswer(
        adapter,
        knowledgeItemId,
        locale,
      );
    },
  };
}