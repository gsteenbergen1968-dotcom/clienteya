import type { FounderDashboardData } from "../models";

import {
  buildFounderActionQueue,
  buildFounderExecutiveBriefing,
} from "../engines";
import { getFounderExecutiveSnapshot } from "../services";
import { getFounderOverview } from "../services/founder-overview-service";

export async function buildFounderDashboard(): Promise<FounderDashboardData> {
  const executive = await getFounderExecutiveSnapshot();

  const overview = await getFounderOverview();

  const actions = buildFounderActionQueue(
    executive.intelligence.insights
  );

  const briefing = buildFounderExecutiveBriefing(
    actions,
    executive.intelligence.insights
  );

  return {
    business: executive.business,
    snapshot: executive.intelligence,
    overview,
    actions,
    briefing,
  };
}