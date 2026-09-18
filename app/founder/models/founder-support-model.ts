export type FounderSupportTotals = {
  openTickets: number;
  resolvedTickets: number;
  averageResponseTimeMinutes: number;
  averageResolutionTimeHours: number;
  customerSatisfactionScore: number;
  firstResponseRate: number;
};

export type FounderSupportCountry = {
  countryCode: string;
  countryName: string;
  openTickets: number;
  resolvedTickets: number;
  averageResponseTimeMinutes: number;
  customerSatisfactionScore: number;
};

export type FounderSupportRegion = {
  regionCode: string;
  regionName: string;
  countries: FounderSupportCountry[];
  openTickets: number;
  resolvedTickets: number;
  averageResponseTimeMinutes: number;
  customerSatisfactionScore: number;
};

export type FounderSupportSnapshot = {
  generatedAt: string;
  totals: FounderSupportTotals;
  regions: FounderSupportRegion[];
};