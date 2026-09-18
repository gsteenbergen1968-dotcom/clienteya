import type { FounderInfrastructureSnapshot } from "../models";

import { collectFounderInfrastructureSnapshot } from "../adapters/founder-infrastructure-adapter";

export async function buildFounderInfrastructureSnapshot(): Promise<FounderInfrastructureSnapshot> {
  return collectFounderInfrastructureSnapshot();
}