export type FounderGrowthCountry = {
  countryCode: string;
  countryName: string;
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  professionalUsers: number;
  corporateUsers: number;
  conversionRate: number;
  growthToday: number;
  growthThisWeek: number;
  growthThisMonth: number;
};

export type FounderGrowthRegion = {
  regionCode: string;
  regionName: string;
  countries: FounderGrowthCountry[];
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  professionalUsers: number;
  corporateUsers: number;
  conversionRate: number;
  growthToday: number;
  growthThisWeek: number;
  growthThisMonth: number;
};

export type FounderGrowthTotals = {
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  professionalUsers: number;
  corporateUsers: number;
  conversionRate: number;
  growthToday: number;
  growthThisWeek: number;
  growthThisMonth: number;
};

export type FounderGrowthSnapshot = {
  generatedAt: string;
  totals: FounderGrowthTotals;
  regions: FounderGrowthRegion[];
};