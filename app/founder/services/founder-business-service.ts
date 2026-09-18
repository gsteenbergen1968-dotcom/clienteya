import type { FounderBusinessSnapshot } from "../models";

import { buildFounderBusinessSnapshot } from "../orchestrators";

export async function getFounderBusinessSnapshot(): Promise<FounderBusinessSnapshot> {
  return buildFounderBusinessSnapshot();
}