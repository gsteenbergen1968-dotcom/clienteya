import type { FounderDashboardData } from "../models";

import { buildFounderExecutiveBriefing } from "../engines";
import { buildFounderOverview } from "../orchestrators";
import { getFounderActionQueue } from "./founder-action-service";
import { getFounderExecutiveSnapshot } from "./founder-executive-service";

export async function getFounderDashboardData(): Promise<FounderDashboardData> {
  const executive = await getFounderExecutiveSnapshot();

  const evidence = executive.intelligence.insights.flatMap(
    (insight) => insight.evidence
  );

  const overview = buildFounderOverview(evidence);

  const actions = await getFounderActionQueue(
    executive.intelligence
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