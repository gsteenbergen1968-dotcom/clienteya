import type {
  FounderCountryPerformance,
  FounderIntelligenceAction,
  FounderIntelligenceChapter,
  FounderIntelligenceEvidence,
  FounderIntelligenceMetric,
  FounderIntelligenceStatus,
  FounderProductSummary,
  FounderRelationshipSummary,
  FounderRevenueSummary,
} from "./founder-intelligence-engine";

export type FounderBusinessHealthInput = {
  countries: FounderCountryPerformance[];
  relationships: FounderRelationshipSummary;
  revenue: FounderRevenueSummary;
  product: FounderProductSummary;
};

type FounderBusinessHealthAssessment = {
  score: number;
  status: FounderIntelligenceStatus;
  conclusion: string;
  metrics: FounderIntelligenceMetric[];
  evidence: FounderIntelligenceEvidence[];
  action: FounderIntelligenceAction | null;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function round(value: number, decimals = 0) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function formatPercentage(value: number) {
  return `${round(value, 1)}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function calculateRevenueHealth(revenue: FounderRevenueSummary) {
  const growthScore = clamp(
    50 + revenue.monthlyRevenueGrowthRate * 2.5,
    0,
    100
  );

  const overduePenalty =
    revenue.monthlyRecurringRevenue > 0
      ? clamp(
          (revenue.overdueRevenue / revenue.monthlyRecurringRevenue) * 100,
          0,
          100
        )
      : revenue.overdueRevenue > 0
        ? 100
        : 0;

  return clamp(growthScore - overduePenalty * 0.6, 0, 100);
}

function calculateRelationshipHealth(
  relationships: FounderRelationshipSummary
) {
  if (relationships.activeRelationships <= 0) {
    return relationships.businessRelationships > 0 ||
      relationships.corporateRelationships > 0
      ? 35
      : 20;
  }

  const riskRate =
    (relationships.atRiskRelationships /
      relationships.activeRelationships) *
    100;

  const growthContribution = clamp(
    relationships.relationshipGrowthRate * 2,
    -30,
    30
  );

  return clamp(75 - riskRate + growthContribution, 0, 100);
}

function calculateProductHealth(product: FounderProductSummary) {
  const engagementScore = clamp(
    product.weeklyActiveBusinesses > 0 &&
      product.activeBusinesses > 0
      ? (product.weeklyActiveBusinesses / product.activeBusinesses) * 100
      : 0,
    0,
    100
  );

  const weightedScore =
    product.onboardingCompletionRate * 0.25 +
    product.relationshipActivationRate * 0.25 +
    product.whatsappUsageRate * 0.15 +
    product.strategicCenterUsageRate * 0.2 +
    product.automationUsageRate * 0.15;

  return clamp(weightedScore * 0.7 + engagementScore * 0.3, 0, 100);
}

function calculateMarketHealth(countries: FounderCountryPerformance[]) {
  if (countries.length === 0) return 20;

  const activeCountries = countries.filter(
    (country) => country.activeBusinesses > 0
  );

  if (activeCountries.length === 0) return 25;

  const averageRetention =
    activeCountries.reduce(
      (total, country) => total + country.retentionRate,
      0
    ) / activeCountries.length;

  const averageConversion =
    activeCountries.reduce(
      (total, country) => total + country.trialConversionRate,
      0
    ) / activeCountries.length;

  const averageEngagement =
    activeCountries.reduce(
      (total, country) => total + country.productEngagementRate,
      0
    ) / activeCountries.length;

  return clamp(
    averageRetention * 0.45 +
      averageConversion * 0.25 +
      averageEngagement * 0.3,
    0,
    100
  );
}

function getHealthStatus(score: number): FounderIntelligenceStatus {
  if (score >= 80) return "growth";
  if (score >= 65) return "stable";
  if (score >= 45) return "attention";
  if (score >= 25) return "warning";

  return "critical";
}

function getConclusion(
  score: number,
  revenueHealth: number,
  relationshipHealth: number,
  productHealth: number,
  marketHealth: number
) {
  const dimensions = [
    {
      key: "revenue",
      score: revenueHealth,
    },
    {
      key: "relationships",
      score: relationshipHealth,
    },
    {
      key: "product",
      score: productHealth,
    },
    {
      key: "market",
      score: marketHealth,
    },
  ].sort((first, second) => first.score - second.score);

  const weakestDimension = dimensions[0];

  if (score >= 80) {
    return "ClienteYA is healthy and showing strong foundations for sustainable growth.";
  }

  if (score >= 65) {
    return "ClienteYA is stable, with one area requiring attention before growth can accelerate confidently.";
  }

  if (weakestDimension.key === "revenue") {
    return "ClienteYA has operational potential, but recurring revenue quality is limiting overall business health.";
  }

  if (weakestDimension.key === "relationships") {
    return "ClienteYA is growing, but relationship quality and retention require founder attention.";
  }

  if (weakestDimension.key === "product") {
    return "ClienteYA has commercial potential, but product adoption is not yet strong enough to support reliable growth.";
  }

  if (weakestDimension.key === "market") {
    return "ClienteYA has not yet built enough market traction to confirm a healthy growth pattern.";
  }

  return "ClienteYA requires immediate founder attention before growth decisions should be accelerated.";
}

function buildMetrics(
  score: number,
  input: FounderBusinessHealthInput
): FounderIntelligenceMetric[] {
  const totalProfessionalBusinesses = input.countries.reduce(
    (total, country) => total + country.professionalBusinesses,
    0
  );

  const totalCorporateBusinesses = input.countries.reduce(
    (total, country) => total + country.corporateBusinesses,
    0
  );

  return [
    {
      key: "business-health-score",
      label: "Business health",
      value: `${round(score)} / 100`,
      description: "Combined view of revenue, relationships, product and market performance.",
    },
    {
      key: "active-businesses",
      label: "Active businesses",
      value: formatNumber(input.product.activeBusinesses),
      description: "Businesses currently active in ClienteYA.",
    },
    {
      key: "professional-businesses",
      label: "Professional",
      value: formatNumber(totalProfessionalBusinesses),
      description: "Businesses currently using the Professional plan.",
    },
    {
      key: "corporate-businesses",
      label: "Corporate",
      value: formatNumber(totalCorporateBusinesses),
      description: "Corporate relationships currently active.",
    },
  ];
}

function buildEvidence(
  revenueHealth: number,
  relationshipHealth: number,
  productHealth: number,
  marketHealth: number,
  input: FounderBusinessHealthInput
): FounderIntelligenceEvidence[] {
  return [
    {
      key: "revenue-health",
      label: "Revenue health",
      value: `${round(revenueHealth)} / 100`,
      description: `MRR ${formatCurrency(
        input.revenue.monthlyRecurringRevenue
      )} with ${formatPercentage(
        input.revenue.monthlyRevenueGrowthRate
      )} monthly growth.`,
      status: getHealthStatus(revenueHealth),
    },
    {
      key: "relationship-health",
      label: "Relationship health",
      value: `${round(relationshipHealth)} / 100`,
      description: `${formatNumber(
        input.relationships.activeRelationships
      )} active business relationships and ${formatNumber(
        input.relationships.atRiskRelationships
      )} at risk.`,
      status: getHealthStatus(relationshipHealth),
    },
    {
      key: "product-health",
      label: "Product health",
      value: `${round(productHealth)} / 100`,
      description: `${formatPercentage(
        input.product.onboardingCompletionRate
      )} onboarding completion and ${formatPercentage(
        input.product.strategicCenterUsageRate
      )} strategic center usage.`,
      status: getHealthStatus(productHealth),
    },
    {
      key: "market-health",
      label: "Market health",
      value: `${round(marketHealth)} / 100`,
      description: `${formatNumber(
        input.countries.filter((country) => country.activeBusinesses > 0)
          .length
      )} active markets currently contributing evidence.`,
      status: getHealthStatus(marketHealth),
    },
  ];
}

function buildAction(
  revenueHealth: number,
  relationshipHealth: number,
  productHealth: number,
  marketHealth: number
): FounderIntelligenceAction | null {
  const dimensions = [
    {
      key: "revenue",
      score: revenueHealth,
      title: "Strengthen recurring revenue quality",
      description:
        "Review conversion, overdue revenue and annual plan adoption before accelerating investment.",
      href: "/founder/cockpit/revenue",
      label: "Review revenue",
    },
    {
      key: "relationships",
      score: relationshipHealth,
      title: "Protect business relationships at risk",
      description:
        "Identify the business relationships showing weak engagement or retention signals.",
      href: "/founder/cockpit/relationships",
      label: "Review relationships",
    },
    {
      key: "product",
      score: productHealth,
      title: "Improve product adoption",
      description:
        "Focus on the product behavior that most strongly limits activation and retention.",
      href: "/founder/cockpit/product",
      label: "Review product adoption",
    },
    {
      key: "market",
      score: marketHealth,
      title: "Validate current market traction",
      description:
        "Strengthen evidence in the current market before committing to the next expansion step.",
      href: "/founder/cockpit/expansion",
      label: "Review market traction",
    },
  ].sort((first, second) => first.score - second.score);

  const weakestDimension = dimensions[0];

  if (weakestDimension.score >= 80) {
    return {
      key: "protect-business-health",
      title: "Protect the current growth pattern",
      description:
        "Maintain execution discipline and monitor whether growth remains healthy across every dimension.",
      priority: "low",
      href: "/founder/cockpit",
      label: "Review founder cockpit",
    };
  }

  return {
    key: `improve-${weakestDimension.key}-health`,
    title: weakestDimension.title,
    description: weakestDimension.description,
    priority:
      weakestDimension.score < 25
        ? "critical"
        : weakestDimension.score < 45
          ? "high"
          : "medium",
    href: weakestDimension.href,
    label: weakestDimension.label,
  };
}

function assessFounderBusinessHealth(
  input: FounderBusinessHealthInput
): FounderBusinessHealthAssessment {
  const revenueHealth = calculateRevenueHealth(input.revenue);
  const relationshipHealth = calculateRelationshipHealth(
    input.relationships
  );
  const productHealth = calculateProductHealth(input.product);
  const marketHealth = calculateMarketHealth(input.countries);

  const score = clamp(
    revenueHealth * 0.3 +
      relationshipHealth * 0.25 +
      productHealth * 0.3 +
      marketHealth * 0.15,
    0,
    100
  );

  return {
    score,
    status: getHealthStatus(score),
    conclusion: getConclusion(
      score,
      revenueHealth,
      relationshipHealth,
      productHealth,
      marketHealth
    ),
    metrics: buildMetrics(score, input),
    evidence: buildEvidence(
      revenueHealth,
      relationshipHealth,
      productHealth,
      marketHealth,
      input
    ),
    action: buildAction(
      revenueHealth,
      relationshipHealth,
      productHealth,
      marketHealth
    ),
  };
}

export function buildFounderBusinessHealthChapter(
  input: FounderBusinessHealthInput
): FounderIntelligenceChapter {
  const assessment = assessFounderBusinessHealth(input);

  return {
    key: "business-health",
    index: 1,
    title: "Business Health",
    question: "How healthy is ClienteYA?",
    conclusion: assessment.conclusion,
    status: assessment.status,
    tone: "blue",
    metrics: assessment.metrics,
    evidence: assessment.evidence,
    action: assessment.action,
  };
}