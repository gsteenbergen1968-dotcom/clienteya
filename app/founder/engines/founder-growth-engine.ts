import type { FounderGrowthSnapshot } from "../models";

import { collectFounderGrowthSnapshot } from "../adapters/founder-growth-adapter";

export async function buildFounderGrowthSnapshot(): Promise<FounderGrowthSnapshot> {
  return collectFounderGrowthSnapshot();
}