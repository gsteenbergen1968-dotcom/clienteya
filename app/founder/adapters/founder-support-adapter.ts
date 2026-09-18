import type { FounderSupportSnapshot } from "../models";

export async function collectFounderSupportSnapshot(): Promise<FounderSupportSnapshot> {
  return {
    generatedAt: new Date().toISOString(),

    totals: {
      openTickets: 0,
      resolvedTickets: 0,
      averageResponseTimeMinutes: 0,
      averageResolutionTimeHours: 0,
      customerSatisfactionScore: 0,
      firstResponseRate: 0,
    },

    regions: [],
  };
}