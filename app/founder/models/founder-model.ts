export type FounderIntelligenceDomain =
  | "product"
  | "business"
  | "ai"
  | "users"
  | "growth"
  | "release"
  | "architecture"
  | "operations";

export type FounderEvidenceSource =
  | "database"
  | "analytics"
  | "user-feedback"
  | "build"
  | "deployment"
  | "repository"
  | "ai-evaluation"
  | "performance"
  | "financial"
  | "manual";

export type FounderEvidenceStrength =
  | "insufficient"
  | "weak"
  | "moderate"
  | "strong"
  | "conclusive";

export type FounderEvidenceStatus =
  | "active"
  | "outdated"
  | "conflicting"
  | "invalid";

export type FounderConclusionStatus =
  | "insufficient-evidence"
  | "supported"
  | "confirmed"
  | "rejected";

export type FounderDecisionPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type FounderDecisionStatus =
  | "proposed"
  | "accepted"
  | "in-progress"
  | "completed"
  | "rejected";

export type FounderInsightStatus =
  | "open"
  | "accepted"
  | "resolved"
  | "dismissed";

export type FounderEvidenceValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | Record<string, unknown>;

export type FounderEvidenceMetadata = Record<
  string,
  string | number | boolean | null
>;

export type FounderEvidence = {
  id: string;
  domain: FounderIntelligenceDomain;
  source: FounderEvidenceSource;
  title: string;
  description: string;
  value?: FounderEvidenceValue;
  strength: FounderEvidenceStrength;
  status: FounderEvidenceStatus;
  observedAt: string;
  validUntil?: string | null;
  sourceReference?: string | null;
  metadata?: FounderEvidenceMetadata;
};

export type FounderEvidenceAssessment = {
  evidenceIds: string[];
  strength: FounderEvidenceStrength;
  sufficient: boolean;
  explanation: string;
  assessedAt: string;
};

export type FounderConclusion = {
  id: string;
  domain: FounderIntelligenceDomain;
  title: string;
  summary: string;
  status: FounderConclusionStatus;
  evidenceAssessment: FounderEvidenceAssessment;
  createdAt: string;
  updatedAt: string;
};

export type FounderDecisionImpact = {
  description: string;
  expectedOutcome?: string | null;
  measurableBy?: string | null;
};

export type FounderDecision = {
  id: string;
  conclusionId: string;
  title: string;
  reason: string;
  priority: FounderDecisionPriority;
  status: FounderDecisionStatus;
  impact: FounderDecisionImpact;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type FounderInsight = {
  id: string;
  domain: FounderIntelligenceDomain;
  title: string;
  conclusion: FounderConclusion;
  decision?: FounderDecision | null;
  evidence: FounderEvidence[];
  status: FounderInsightStatus;
  createdAt: string;
  updatedAt: string;
};

export type FounderIntelligenceSnapshot = {
  generatedAt: string;
  insights: FounderInsight[];
  primaryInsightId?: string | null;
};

export function hasSufficientFounderEvidence(
  assessment: FounderEvidenceAssessment
): boolean {
  return assessment.sufficient && assessment.strength !== "insufficient";
}

export function canCreateFounderDecision(
  conclusion: FounderConclusion
): boolean {
  return (
    conclusion.status === "supported" ||
    conclusion.status === "confirmed"
  ) && hasSufficientFounderEvidence(conclusion.evidenceAssessment);
}

export function getPrimaryFounderInsight(
  snapshot: FounderIntelligenceSnapshot
): FounderInsight | null {
  if (!snapshot.primaryInsightId) {
    return snapshot.insights[0] ?? null;
  }

  return (
    snapshot.insights.find(
      (insight) => insight.id === snapshot.primaryInsightId
    ) ?? null
  );
}