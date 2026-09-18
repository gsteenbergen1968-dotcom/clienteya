export type FounderPaymentTotals = {
  activeSubscriptions: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  monthlyCollectedRevenue: number;
  collectionRate: number;
};

export type FounderPaymentCountry = {
  countryCode: string;
  countryName: string;
  activeSubscriptions: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  monthlyCollectedRevenue: number;
  collectionRate: number;
};

export type FounderPaymentRegion = {
  regionCode: string;
  regionName: string;
  countries: FounderPaymentCountry[];
  activeSubscriptions: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  monthlyCollectedRevenue: number;
  collectionRate: number;
};

export type FounderPaymentsSnapshot = {
  generatedAt: string;
  totals: FounderPaymentTotals;
  regions: FounderPaymentRegion[];
};