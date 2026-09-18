import type { FounderProductSnapshot } from "../models";

import { collectFounderProductSnapshot } from "../adapters/founder-product-adapter";

export async function buildFounderProductSnapshot(): Promise<FounderProductSnapshot> {
  return collectFounderProductSnapshot();
}