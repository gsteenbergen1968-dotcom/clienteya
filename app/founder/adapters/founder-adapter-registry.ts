import { collectAIEvaluationEvidence } from "./founder-ai-evaluation-adapter";
import { collectAnalyticsEvidence } from "./founder-analytics-adapter";
import { collectBuildEvidence } from "./founder-build-adapter";
import { collectCICDEvidence } from "./founder-cicd-adapter";
import { collectDatabaseEvidence } from "./founder-database-adapter";
import { collectDeploymentEvidence } from "./founder-deployment-adapter";
import { collectEnvironmentEvidence } from "./founder-environment-adapter";
import { collectFinancialEvidence } from "./founder-financial-adapter";
import { collectGitEvidence } from "./founder-git-adapter";
import { collectManualEvidence } from "./founder-manual-adapter";
import { collectMonitoringEvidence } from "./founder-monitoring-adapter";
import { collectPerformanceEvidence } from "./founder-performance-adapter";
import { collectReleaseEvidence } from "./founder-release-adapter";
import { collectRepositoryEvidence } from "./founder-repository-adapter";
import { collectSecurityEvidence } from "./founder-security-adapter";
import { collectTestEvidence } from "./founder-test-adapter";
import { collectUserFeedbackEvidence } from "./founder-user-feedback-adapter";

export const founderEvidenceAdapters = [
  collectAIEvaluationEvidence,
  collectAnalyticsEvidence,
  collectBuildEvidence,
  collectCICDEvidence,
  collectDatabaseEvidence,
  collectDeploymentEvidence,
  collectEnvironmentEvidence,
  collectFinancialEvidence,
  collectGitEvidence,
  collectManualEvidence,
  collectMonitoringEvidence,
  collectPerformanceEvidence,
  collectReleaseEvidence,
  collectRepositoryEvidence,
  collectSecurityEvidence,
  collectTestEvidence,
  collectUserFeedbackEvidence,
];