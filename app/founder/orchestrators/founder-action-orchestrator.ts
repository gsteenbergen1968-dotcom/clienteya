import type {
  FounderActionQueue,
  FounderIntelligenceSnapshot,
} from "../models";

import { buildFounderActionQueue } from "../engines";

export function buildFounderActionQueueFromSnapshot(
  snapshot: FounderIntelligenceSnapshot
): FounderActionQueue {
  return buildFounderActionQueue(snapshot.insights);
}