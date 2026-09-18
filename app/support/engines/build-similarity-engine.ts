import type {
  KnowledgeItem,
  SupportLocale,
} from "../models";

import type {
  SimilarityCandidate,
  SimilarityEngine,
  SimilarityResult,
} from "./similarity-engine";

export type BuildSimilarityEngineOptions = {
  threshold?: number;
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

function getTerms(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean);
}

function calculateSimilarity(
  query: string,
  item: KnowledgeItem,
): SimilarityCandidate {
  const queryTerms = new Set(getTerms(query));

  const itemTerms = new Set(
    getTerms(
      [
        item.title,
        item.canonicalQuestion,
        ...item.keywords,
      ].join(" "),
    ),
  );

  const matchedTerms = [...queryTerms].filter((term) =>
    itemTerms.has(term),
  );

  const totalTerms = new Set([
    ...queryTerms,
    ...itemTerms,
  ]).size;

  const score =
    totalTerms === 0
      ? 0
      : matchedTerms.length / totalTerms;

  return {
    item,
    score,
    matchedTerms,
  };
}

export function buildSimilarityEngine(
  options: BuildSimilarityEngineOptions = {},
): SimilarityEngine {
  const threshold = options.threshold ?? 0.35;

  return {
    async compare(
      query: string,
      items: KnowledgeItem[],
      locale: SupportLocale,
    ): Promise<SimilarityResult> {
      const candidates = items
        .filter(
          (item) =>
            item.status === "approved" &&
            item.visibility !== "internal",
        )
        .map((item) => calculateSimilarity(query, item))
        .sort((left, right) => right.score - left.score);

      const bestCandidate = candidates[0];

      return {
        query,
        locale,
        candidates,
        bestCandidate,
        threshold,
        hasReliableMatch:
          Boolean(bestCandidate) &&
          bestCandidate.score >= threshold,
      };
    },
  };
}