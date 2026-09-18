import type { FounderSupportSnapshot } from "../models";

import { collectFounderSupportSnapshot } from "../adapters/founder-support-adapter";

export async function buildFounderSupportSnapshot(): Promise<FounderSupportSnapshot> {
  return collectFounderSupportSnapshot();
}