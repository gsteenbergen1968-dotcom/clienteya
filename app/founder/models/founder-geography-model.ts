export type FounderGeographyCountry = {
  countryCode: string;
  countryName: string;
  totalUsers: number;
  activeUsers: number;
  cities: number;
  adoptionRate: number;
  growthRate: number;
};

export type FounderGeographyRegion = {
  regionCode: string;
  regionName: string;
  countries: FounderGeographyCountry[];
  totalUsers: number;
  activeUsers: number;
  adoptionRate: number;
  growthRate: number;
};

export type FounderGeographyTotals = {
  totalRegions: number;
  totalCountries: number;
  totalUsers: number;
  activeUsers: number;
  averageAdoptionRate: number;
};

export type FounderGeographySnapshot = {
  generatedAt: string;
  totals: FounderGeographyTotals;
  regions: FounderGeographyRegion[];
};