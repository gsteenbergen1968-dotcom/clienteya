import type { FounderGeographySnapshot } from "../models";

import { collectFounderGeographySnapshot } from "../adapters/founder-geography-adapter";

export async function buildFounderGeographySnapshot(): Promise<FounderGeographySnapshot> {
  return collectFounderGeographySnapshot();
}