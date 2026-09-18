export type FounderSystemStatus =
  | "healthy"
  | "warning"
  | "critical";

export type FounderSystemHealth = {
  totalEvidence: number;
  activeEvidence: number;
  healthy: boolean;
};

export type FounderSystemConfidence = {
  score: number;
  level: "low" | "medium" | "high";
};

export type FounderSystemMetrics = {
  total: number;
  active: number;
  inactive: number;
  strong: number;
  conclusive: number;
};

export type FounderSystemReadiness = {
  ready: boolean;
  status: FounderSystemStatus;
  message: string;
};

export type FounderSystemSummary = {
  status: FounderSystemStatus;
  totalEvidence: number;
  activeEvidence: number;
  summary: string;
};

export type FounderSystemOverview = {
  health: FounderSystemHealth;
  confidence: FounderSystemConfidence;
  readiness: FounderSystemReadiness;
  metrics: FounderSystemMetrics;
  summary: FounderSystemSummary;
};