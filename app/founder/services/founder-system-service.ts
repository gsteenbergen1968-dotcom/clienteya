import type {
  FounderIntelligenceSnapshot,
} from "../models";

import { buildFounderSystemSnapshot } from "../orchestrators";

export async function getFounderSystemSnapshot(): Promise<FounderIntelligenceSnapshot> {
  return buildFounderSystemSnapshot();
}