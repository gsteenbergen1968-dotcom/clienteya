import type { FounderBusinessSnapshot } from "../models";

import {
  buildFounderGeographySnapshot,
  buildFounderGrowthSnapshot,
  buildFounderInfrastructureSnapshot,
  buildFounderPaymentsSnapshot,
  buildFounderProductSnapshot,
  buildFounderRevenueSnapshot,
  buildFounderSupportSnapshot,
} from "../engines";

export async function buildFounderBusinessSnapshot(): Promise<FounderBusinessSnapshot> {
  const [
    growth,
    revenue,
    payments,
    product,
    support,
    geography,
    infrastructure,
  ] = await Promise.all([
    buildFounderGrowthSnapshot(),
    buildFounderRevenueSnapshot(),
    buildFounderPaymentsSnapshot(),
    buildFounderProductSnapshot(),
    buildFounderSupportSnapshot(),
    buildFounderGeographySnapshot(),
    Promise.resolve(buildFounderInfrastructureSnapshot()),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    growth,
    revenue,
    payments,
    product,
    support,
    geography,
    infrastructure,
  };
}