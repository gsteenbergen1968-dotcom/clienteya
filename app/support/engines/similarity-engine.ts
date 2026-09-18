import type {
  KnowledgeItem,
  SupportLocale,
} from "../models";

export type SimilarityCandidate = {
  item: KnowledgeItem;
  score: number;
  matchedTerms: string[];
};

export type SimilarityResult = {
  query: string;
  locale: SupportLocale;

  candidates: SimilarityCandidate[];

  bestCandidate?: SimilarityCandidate;

  threshold: number;
  hasReliableMatch: boolean;
};

export interface SimilarityEngine {
  compare(
    query: string,
    items: KnowledgeItem[],
    locale: SupportLocale,
  ): Promise<SimilarityResult>;
}