export type FounderProductTotals = {
  totalFeatures: number;
  releasedFeatures: number;
  plannedFeatures: number;
  deprecatedFeatures: number;
  activeExperiments: number;
  averageReleaseCycleDays: number;
  productHealthScore: number;
};

export type FounderProductCountry = {
  countryCode: string;
  countryName: string;
  releasedFeatures: number;
  activeUsers: number;
  adoptionRate: number;
  satisfactionScore: number;
};

export type FounderProductRegion = {
  regionCode: string;
  regionName: string;
  countries: FounderProductCountry[];
  releasedFeatures: number;
  activeUsers: number;
  adoptionRate: number;
  satisfactionScore: number;
};

export type FounderProductSnapshot = {
  generatedAt: string;
  totals: FounderProductTotals;
  regions: FounderProductRegion[];
};