import type {
  FounderActionQueue,
  FounderIntelligenceSnapshot,
} from "../models";

import { buildFounderActionQueueFromSnapshot } from "../orchestrators";

export async function getFounderActionQueue(
  snapshot: FounderIntelligenceSnapshot
): Promise<FounderActionQueue> {
  return buildFounderActionQueueFromSnapshot(snapshot);
}