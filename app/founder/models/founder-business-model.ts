import type { FounderGeographySnapshot } from "./founder-geography-model";
import type { FounderGrowthSnapshot } from "./founder-growth-model";
import type { FounderInfrastructureSnapshot } from "./founder-infrastructure-model";
import type { FounderPaymentsSnapshot } from "./founder-payments-model";
import type { FounderProductSnapshot } from "./founder-product-model";
import type { FounderRevenueSnapshot } from "./founder-revenue-model";
import type { FounderSupportSnapshot } from "./founder-support-model";

export type FounderBusinessSnapshot = {
  generatedAt: string;

  growth: FounderGrowthSnapshot;
  revenue: FounderRevenueSnapshot;
  payments: FounderPaymentsSnapshot;

  product: FounderProductSnapshot;
  support: FounderSupportSnapshot;
  geography: FounderGeographySnapshot;
  infrastructure: FounderInfrastructureSnapshot;
};