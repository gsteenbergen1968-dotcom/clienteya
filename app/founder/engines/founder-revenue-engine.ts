import type { FounderRevenueSnapshot } from "../models";

import { collectFounderRevenueSnapshot } from "../adapters/founder-revenue-adapter";

export async function buildFounderRevenueSnapshot(): Promise<FounderRevenueSnapshot> {
  return collectFounderRevenueSnapshot();
}