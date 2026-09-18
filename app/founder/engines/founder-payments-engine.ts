import type { FounderPaymentsSnapshot } from "../models";

import { collectFounderPaymentsSnapshot } from "../adapters/founder-payments-adapter";

export async function buildFounderPaymentsSnapshot(): Promise<FounderPaymentsSnapshot> {
  return collectFounderPaymentsSnapshot();
}