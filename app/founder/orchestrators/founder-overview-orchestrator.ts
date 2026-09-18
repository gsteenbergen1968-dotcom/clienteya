import type { FounderEvidence } from "../models/founder-model";

import { buildFounderSystemOverview } from "../engines/founder-system-overview-engine";

export type FounderOverview = ReturnType<
  typeof buildFounderSystemOverview
>;

export function buildFounderOverview(
  evidence: FounderEvidence[]
): FounderOverview {
  return buildFounderSystemOverview(evidence);
}