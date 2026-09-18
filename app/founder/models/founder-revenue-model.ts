export type FounderRevenueTotals = {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  monthlyGrowth: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  monthlyChurnRate: number;
  annualChurnRate: number;
};

export type FounderRevenueCountry = {
  countryCode: string;
  countryName: string;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  activeSubscriptions: number;
  averageRevenuePerUser: number;
  monthlyGrowth: number;
};

export type FounderRevenueRegion = {
  regionCode: string;
  regionName: string;
  countries: FounderRevenueCountry[];
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  activeSubscriptions: number;
  averageRevenuePerUser: number;
  monthlyGrowth: number;
};

export type FounderRevenueSnapshot = {
  generatedAt: string;
  totals: FounderRevenueTotals;
  regions: FounderRevenueRegion[];
};