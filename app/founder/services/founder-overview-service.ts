import type { FounderSystemOverview } from "../models/founder-system-model";

import { collectFounderEvidence } from "../engines/founder-evidence-collector-engine";
import { buildFounderOverview } from "../orchestrators/founder-overview-orchestrator";

export async function getFounderOverview(): Promise<FounderSystemOverview> {
  const evidence = await collectFounderEvidence();

  return buildFounderOverview(evidence);
}