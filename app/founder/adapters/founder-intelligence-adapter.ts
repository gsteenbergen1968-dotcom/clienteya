import type { FounderIntelligenceSnapshot } from "../models";

export async function collectFounderIntelligenceSnapshot(): Promise<FounderIntelligenceSnapshot> {
  return {
    generatedAt: new Date().toISOString(),
    insights: [],
    primaryInsightId: null,
  };
}