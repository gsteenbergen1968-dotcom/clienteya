import {
  collectFounderGrowthSnapshot,
} from "./founder-growth-adapter";
import {
  collectFounderPaymentsSnapshot,
} from "./founder-payments-adapter";
import {
  collectFounderRelationshipsEvidence,
} from "./founder-relationships-adapter";
import {
  collectFounderRevenueSnapshot,
} from "./founder-revenue-adapter";

export const founderBusinessAdapters = {
  growth: collectFounderGrowthSnapshot,
  revenue: collectFounderRevenueSnapshot,
  payments: collectFounderPaymentsSnapshot,
  relationships: collectFounderRelationshipsEvidence,
};

export type FounderBusinessAdapters =
  typeof founderBusinessAdapters;