export type FounderInfrastructureTotals = {
  systemHealthScore: number;
  uptimePercentage: number;
  activeServices: number;
  degradedServices: number;
  incidents: number;
  averageResponseTimeMs: number;
  deploymentSuccessRate: number;
};

export type FounderInfrastructureCountry = {
  countryCode: string;
  countryName: string;
  activeServices: number;
  uptimePercentage: number;
  incidents: number;
  averageResponseTimeMs: number;
};

export type FounderInfrastructureRegion = {
  regionCode: string;
  regionName: string;
  countries: FounderInfrastructureCountry[];
  activeServices: number;
  uptimePercentage: number;
  incidents: number;
  averageResponseTimeMs: number;
};

export type FounderInfrastructureSnapshot = {
  generatedAt: string;
  totals: FounderInfrastructureTotals;
  regions: FounderInfrastructureRegion[];
};