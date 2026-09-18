import ExecutiveHealthChapter from "./ExecutiveHealthChapter";
import CommercialPipelineChapter from "./CommercialPipelineChapter";
import CustomerIntelligenceChapter from "./CustomerIntelligenceChapter";
import KPIIntelligenceChapter from "./KPIIntelligenceChapter";
import FounderInsightsChapter from "./FounderInsightsChapter";
import ExecutiveActionsChapter from "./ExecutiveActionsChapter";

import type { ExecutiveCockpitReport } from "../../../../lib/executive-cockpit-engine";
import type {
  CommercialRelationship,
} from "../../../../lib/commercial-action-engine";

type ExecutiveHealthChapterMetrics = {
  founderScore: number;
  revenueMomentum: number;
  operationalPressure: number;
  executionQuality: number;
  pipelineVelocity: number;
  confirmedRevenue: number;
  openRevenue: number;
  confirmedRevenueUsd: number;
  openRevenueUsd: number;
  overdueFollowups: number;
  dueSoonFollowups: number;
  paidRelationships: number;
  unpaidRelationships: number;
};

type ExecutiveCockpitChaptersSkeletonProps = {
  report: ExecutiveCockpitReport;
  healthMetrics: ExecutiveHealthChapterMetrics;
  relationships: CommercialRelationship[];
};

export default function ExecutiveCockpitChaptersSkeleton({
  report,
  healthMetrics,
  relationships,
}: ExecutiveCockpitChaptersSkeletonProps) {
  return (
    <div className="space-y-6">
      <ExecutiveHealthChapter
        healthScore={healthMetrics.founderScore}
        founderScore={healthMetrics.founderScore}
        revenueMomentum={healthMetrics.revenueMomentum}
        operationalPressure={healthMetrics.operationalPressure}
        executionQuality={healthMetrics.executionQuality}
        pipelineVelocity={healthMetrics.pipelineVelocity}
        confirmedRevenue={healthMetrics.confirmedRevenue}
        openRevenue={healthMetrics.openRevenue}
        confirmedRevenueUsd={healthMetrics.confirmedRevenueUsd}
        openRevenueUsd={healthMetrics.openRevenueUsd}
        overdueFollowups={healthMetrics.overdueFollowups}
        dueSoonFollowups={healthMetrics.dueSoonFollowups}
        paidRelationships={healthMetrics.paidRelationships}
        unpaidRelationships={healthMetrics.unpaidRelationships}
      />

      <CommercialPipelineChapter
        relationships={relationships}
      />

      <CustomerIntelligenceChapter
        relationships={relationships}
      />

      <KPIIntelligenceChapter
        chapter={report.kpiIntelligence}
      />

      <FounderInsightsChapter
        chapter={report.founderInsights}
      />

      <ExecutiveActionsChapter
        chapter={report.executiveActions}
      />
    </div>
  );
}