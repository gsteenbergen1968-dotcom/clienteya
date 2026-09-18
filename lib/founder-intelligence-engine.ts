export type FounderIntelligenceScopeType =
  | "global"
  | "region"
  | "country";

export type FounderIntelligenceChapterKey =
  | "business-health"
  | "growth"
  | "revenue"
  | "product"
  | "expansion"
  | "founder-priorities";

export type FounderIntelligenceStatus =
  | "stable"
  | "attention"
  | "warning"
  | "critical"
  | "growth"
  | "neutral";

export type FounderIntelligenceTone =
  | "blue"
  | "emerald"
  | "amber"
  | "red"
  | "purple"
  | "slate";

export type FounderIntelligenceScope = {
  type: FounderIntelligenceScopeType;
  code: string;
  name: string;
  region?: string | null;
  currency?: string | null;
  locale?: string | null;
};

export type FounderIntelligenceMetric = {
  key: string;
  label: string;
  value: string | number;
  description?: string;
  trend?: number | null;
  trendLabel?: string | null;
};

export type FounderIntelligenceEvidence = {
  key: string;
  label: string;
  value: string;
  description?: string;
  status?: FounderIntelligenceStatus;
};

export type FounderIntelligenceAction = {
  key: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  href?: string;
  label?: string;
};

export type FounderIntelligenceChapter = {
  key: FounderIntelligenceChapterKey;
  index: number;
  title: string;
  question: string;
  conclusion: string;
  status: FounderIntelligenceStatus;
  tone: FounderIntelligenceTone;
  metrics: FounderIntelligenceMetric[];
  evidence: FounderIntelligenceEvidence[];
  action: FounderIntelligenceAction | null;
};

export type FounderCountryPerformance = {
  countryCode: string;
  countryName: string;
  region: string;
  currency: string;
  activeBusinesses: number;
  trialBusinesses: number;
  professionalBusinesses: number;
  corporateBusinesses: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  trialConversionRate: number;
  retentionRate: number;
  churnRate: number;
  productEngagementRate: number;
  relationshipGrowthRate: number;
};

export type FounderRelationshipSummary = {
  businessRelationships: number;
  corporateRelationships: number;
  activeRelationships: number;
  atRiskRelationships: number;
  newRelationships: number;
  relationshipGrowthRate: number;
};

export type FounderRevenueSummary = {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  monthlyRevenueGrowthRate: number;
  annualPlanShare: number;
  overdueRevenue: number;
  averageRevenuePerBusiness: number;
};

export type FounderProductSummary = {
  activeBusinesses: number;
  weeklyActiveBusinesses: number;
  monthlyActiveBusinesses: number;
  onboardingCompletionRate: number;
  relationshipActivationRate: number;
  whatsappUsageRate: number;
  strategicCenterUsageRate: number;
  automationUsageRate: number;
};

export type FounderExpansionMarket = {
  countryCode: string;
  countryName: string;
  region: string;
  language: string;
  readinessScore: number;
  marketDemandScore: number;
  localizationReadinessScore: number;
  operationalReadinessScore: number;
  relationshipSignalScore: number;
  status: "current" | "planned" | "exploring" | "not-ready";
};

export type FounderIntelligenceInput = {
  generatedAt?: string;
  scope: FounderIntelligenceScope;
  countries: FounderCountryPerformance[];
  relationships: FounderRelationshipSummary;
  revenue: FounderRevenueSummary;
  product: FounderProductSummary;
  expansionMarkets: FounderExpansionMarket[];
  chapters: FounderIntelligenceChapter[];
};

export type FounderCockpitSummary = {
  title: string;
  question: string;
  conclusion: string;
  status: FounderIntelligenceStatus;
  primaryAction: FounderIntelligenceAction | null;
};

export type FounderCockpitReport = {
  version: "24.0";
  language: "en";
  generatedAt: string;
  scope: FounderIntelligenceScope;
  summary: FounderCockpitSummary;
  countries: FounderCountryPerformance[];
  relationships: FounderRelationshipSummary;
  revenue: FounderRevenueSummary;
  product: FounderProductSummary;
  expansionMarkets: FounderExpansionMarket[];
  chapters: FounderIntelligenceChapter[];
};

const CHAPTER_ORDER: FounderIntelligenceChapterKey[] = [
  "business-health",
  "growth",
  "revenue",
  "product",
  "expansion",
  "founder-priorities",
];

const CHAPTER_DEFINITIONS: Record<
  FounderIntelligenceChapterKey,
  {
    index: number;
    title: string;
    question: string;
    tone: FounderIntelligenceTone;
  }
> = {
  "business-health": {
    index: 1,
    title: "Business Health",
    question: "How healthy is ClienteYA?",
    tone: "blue",
  },
  growth: {
    index: 2,
    title: "Growth Intelligence",
    question: "Where is ClienteYA growing?",
    tone: "emerald",
  },
  revenue: {
    index: 3,
    title: "Revenue Intelligence",
    question: "What explains ClienteYA's recurring revenue?",
    tone: "amber",
  },
  product: {
    index: 4,
    title: "Product Intelligence",
    question: "Which product behaviors explain adoption and retention?",
    tone: "purple",
  },
  expansion: {
    index: 5,
    title: "Expansion Intelligence",
    question: "Which market should ClienteYA prepare for next?",
    tone: "blue",
  },
  "founder-priorities": {
    index: 6,
    title: "Founder Priorities",
    question: "Where should I invest my attention now?",
    tone: "slate",
  },
};

const STATUS_WEIGHT: Record<FounderIntelligenceStatus, number> = {
  critical: 6,
  warning: 5,
  attention: 4,
  growth: 3,
  stable: 2,
  neutral: 1,
};

const ACTION_PRIORITY_WEIGHT: Record<
  FounderIntelligenceAction["priority"],
  number
> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function normalizeChapter(
  chapter: FounderIntelligenceChapter
): FounderIntelligenceChapter {
  const definition = CHAPTER_DEFINITIONS[chapter.key];

  return {
    ...chapter,
    index: definition.index,
    title: definition.title,
    question: definition.question,
    tone: chapter.tone || definition.tone,
    metrics: chapter.metrics || [],
    evidence: chapter.evidence || [],
    action: chapter.action || null,
  };
}

function sortChapters(
  chapters: FounderIntelligenceChapter[]
): FounderIntelligenceChapter[] {
  const chapterMap = new Map(
    chapters.map((chapter) => [chapter.key, normalizeChapter(chapter)])
  );

  return CHAPTER_ORDER.flatMap((key) => {
    const chapter = chapterMap.get(key);
    return chapter ? [chapter] : [];
  });
}

function getPrimaryAction(
  chapters: FounderIntelligenceChapter[]
): FounderIntelligenceAction | null {
  const actions = chapters
    .map((chapter) => chapter.action)
    .filter(
      (action): action is FounderIntelligenceAction => action !== null
    );

  if (actions.length === 0) return null;

  return [...actions].sort(
    (first, second) =>
      ACTION_PRIORITY_WEIGHT[second.priority] -
      ACTION_PRIORITY_WEIGHT[first.priority]
  )[0];
}

function getOverallStatus(
  chapters: FounderIntelligenceChapter[]
): FounderIntelligenceStatus {
  if (chapters.length === 0) return "neutral";

  return [...chapters].sort(
    (first, second) =>
      STATUS_WEIGHT[second.status] - STATUS_WEIGHT[first.status]
  )[0].status;
}

function getOverallConclusion(
  chapters: FounderIntelligenceChapter[]
): string {
  if (chapters.length === 0) {
    return "ClienteYA does not yet have enough evidence to form a reliable founder conclusion.";
  }

  const priorityChapter = [...chapters].sort(
    (first, second) =>
      STATUS_WEIGHT[second.status] - STATUS_WEIGHT[first.status]
  )[0];

  return priorityChapter.conclusion;
}

function buildFounderCockpitSummary(
  chapters: FounderIntelligenceChapter[]
): FounderCockpitSummary {
  return {
    title: "Founder Cockpit",
    question: "What should I know about ClienteYA today?",
    conclusion: getOverallConclusion(chapters),
    status: getOverallStatus(chapters),
    primaryAction: getPrimaryAction(chapters),
  };
}

export function buildFounderIntelligenceReport(
  input: FounderIntelligenceInput
): FounderCockpitReport {
  const chapters = sortChapters(input.chapters);

  return {
    version: "24.0",
    language: "en",
    generatedAt: input.generatedAt || new Date().toISOString(),
    scope: input.scope,
    summary: buildFounderCockpitSummary(chapters),
    countries: input.countries,
    relationships: input.relationships,
    revenue: input.revenue,
    product: input.product,
    expansionMarkets: input.expansionMarkets,
    chapters,
  };
}

export function getFounderChapterDefinition(
  key: FounderIntelligenceChapterKey
) {
  return CHAPTER_DEFINITIONS[key];
}

export function getFounderChapterOrder(): FounderIntelligenceChapterKey[] {
  return [...CHAPTER_ORDER];
}