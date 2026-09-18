export type FounderRelationshipsTotals = {
  totalRelationships: number;
  activeRelationships: number;
  newRelationshipsThisMonth: number;
  inactiveRelationships: number;
  payingRelationships: number;
  averageRelationshipAgeDays: number;
  relationshipsWithNextAction: number;
};

export type FounderRelationshipsCountry = {
  countryCode: string;
  countryName: string;
  totalRelationships: number;
  activeRelationships: number;
  newRelationshipsThisMonth: number;
  payingRelationships: number;
};

export type FounderRelationshipsRegion = {
  regionCode: string;
  regionName: string;
  countries: FounderRelationshipsCountry[];
  totalRelationships: number;
  activeRelationships: number;
  newRelationshipsThisMonth: number;
  payingRelationships: number;
};

export type FounderRelationshipsSnapshot = {
  generatedAt: string;
  totals: FounderRelationshipsTotals;
  regions: FounderRelationshipsRegion[];
};