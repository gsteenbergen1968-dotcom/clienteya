import type { FounderActionQueue } from "./founder-action-model";
import type { FounderBusinessSnapshot } from "./founder-business-model";
import type {
  FounderExecutiveBriefing,
} from "../engines/founder-executive-briefing-engine";
import type { FounderIntelligenceSnapshot } from "./founder-model";
import type { FounderSystemOverview } from "./founder-system-model";

export type FounderDashboardData = {
  business: FounderBusinessSnapshot;
  snapshot: FounderIntelligenceSnapshot;
  overview: FounderSystemOverview;
  actions: FounderActionQueue;
  briefing: FounderExecutiveBriefing;
};