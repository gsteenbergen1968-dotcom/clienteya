import type { FounderGeographySnapshot } from "../models";

export async function collectFounderGeographySnapshot(): Promise<FounderGeographySnapshot> {
  return {
    generatedAt: new Date().toISOString(),

    totals: {
      totalRegions: 0,
      totalCountries: 0,
      totalUsers: 0,
      activeUsers: 0,
      averageAdoptionRate: 0,
    },

    regions: [],
  };
}