import type {
  CommercialRelationship,
} from "./commercial-action-engine";

import {
  buildExecutiveMetrics,
} from "./executive-metrics-engine";

import {
  buildExecutiveHealthReport,
  type ExecutiveHealthReport,
} from "./executive-health-engine";

import {
  buildExecutiveCommercialPipelineChapter,
  type ExecutiveCommercialPipelineChapter,
} from "./executive-commercial-pipeline-engine";

import {
  buildExecutiveCustomerIntelligenceChapter,
  type ExecutiveCustomerIntelligenceChapter,
} from "./executive-customer-intelligence-engine";

import {
  buildExecutiveKpiIntelligenceChapter,
  type ExecutiveKpiChapter,
} from "./executive-kpi-intelligence-engine";

import {
  buildExecutiveFounderInsightsChapter,
  type ExecutiveFounderInsightsChapter,
} from "./executive-founder-insights-engine";

import {
  buildExecutiveActionsChapter,
  type ExecutiveActionsChapter,
} from "./executive-actions-engine";

export type ExecutiveCockpitRelationship = {
  id: string;
  owner_id?: string | null;

  name?: string | null;
  company?: string | null;

  phone?: string | null;
  email?: string | null;

  status?: string | null;
  notes?: string | null;
  reminder?: string | null;

  next_contact_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_contact_at?: string | null;

  expected_amount?: number | null;
  paid_amount?: number | null;
  currency?: "PYG" | "USD" | null;
  paid_at?: string | null;
  invoice_number?: string | null;
  payment_description?: string | null;

  paid?: boolean | null;

  /*
   * Compatibility fields used by existing intelligence layers.
   * The relationship payment fields above remain the source of truth.
   */
  temperature?: string | null;
  temperatura?: string | null;
  priority?: string | null;
  prioridad?: string | null;
  riskLevel?: string | null;
  riesgo?: string | null;
  expectedValue?: number | null;
  expected_value?: number | null;
  nextContact?: string | null;
  next_contact?: string | null;
};

export type ExecutiveCockpitCommercialAction = {
  id: string;
  relationshipId: string;
  relationshipName: string;
  title: string;
  description: string;
  priority:
    | "urgent"
    | "high"
    | "medium"
    | "normal";
  category:
    | "overdue"
    | "today"
    | "upcoming"
    | "opportunity"
    | "risk"
    | "payment"
    | "relationship"
    | "followup";
  expectedRevenue?: number;
  dueDate?: string | null;
};

export type ExecutiveCockpitSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "stable"
  | "risk"
  | "attention"
  | "healthy"
  | "excellent";

export type ExecutiveCockpitTrend =
  | "improving"
  | "stable"
  | "declining"
  | "unknown";

export type ExecutiveCockpitDecisionType =
  | "growth"
  | "risk"
  | "focus"
  | "revenue"
  | "relationship"
  | "operation";

export type ExecutiveCockpitAction = {
  id: string;
  title: string;
  description: string;
  type: ExecutiveCockpitDecisionType;
  severity: ExecutiveCockpitSeverity;
  recommendation: string;
};

export type ExecutiveCockpitReport = {
  generatedAt: string;
  executiveHealth: ExecutiveHealthReport;
  commercialPipeline: ExecutiveCommercialPipelineChapter;
  customerIntelligence: ExecutiveCustomerIntelligenceChapter;
  kpiIntelligence: ExecutiveKpiChapter;
  founderInsights: ExecutiveFounderInsightsChapter;
  executiveActions: ExecutiveActionsChapter;
};

function normalizeText(
  value: string | null | undefined,
): string {
  return (value || "")
    .trim()
    .toLowerCase();
}

function safeNumber(
  value: number | null | undefined,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    value,
  );
}

function getRelationshipName(
  relationship: ExecutiveCockpitRelationship,
): string {
  return (
    relationship.name?.trim() ||
    relationship.company?.trim() ||
    "Relación sin nombre"
  );
}

function getRelationshipPaid(
  relationship: ExecutiveCockpitRelationship,
): boolean {
  if (
    relationship.paid === true ||
    Boolean(
      relationship.paid_at,
    )
  ) {
    return true;
  }

  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("pag") ||
    status.includes("convert")
  );
}

function getExpectedAmount(
  relationship: ExecutiveCockpitRelationship,
): number {
  const relationshipAmount =
    safeNumber(
      relationship.expected_amount,
    );

  if (
    relationshipAmount > 0
  ) {
    return relationshipAmount;
  }

  return safeNumber(
    relationship.expectedValue ??
      relationship.expected_value,
  );
}

function getPaidAmount(
  relationship: ExecutiveCockpitRelationship,
): number {
  const paidAmount =
    safeNumber(
      relationship.paid_amount,
    );

  if (
    paidAmount > 0
  ) {
    return paidAmount;
  }

  if (
    getRelationshipPaid(
      relationship,
    )
  ) {
    return getExpectedAmount(
      relationship,
    );
  }

  return 0;
}

function getRelationshipAmount(
  relationship: ExecutiveCockpitRelationship,
): number {
  return getRelationshipPaid(
    relationship,
  )
    ? getPaidAmount(
        relationship,
      )
    : getExpectedAmount(
        relationship,
      );
}

function toCommercialRelationship(
  relationship: ExecutiveCockpitRelationship,
): CommercialRelationship {
  return {
    id:
      relationship.id,

    owner_id:
      relationship.owner_id ||
      null,

    name:
      getRelationshipName(
        relationship,
      ),

    phone:
      relationship.phone ||
      null,

    status:
      relationship.status ||
      null,

    notes:
      relationship.notes ||
      null,

    reminder:
      relationship.reminder ||
      null,

    memory:
      null,

    next_contact_at:
      relationship.next_contact_at ??
      relationship.nextContact ??
      relationship.next_contact ??
      null,

    created_at:
      relationship.created_at ||
      null,

    updated_at:
      relationship.updated_at ||
      relationship.last_contact_at ||
      null,

    expected_amount:
      getExpectedAmount(
        relationship,
      ),

    paid_amount:
      getPaidAmount(
        relationship,
      ),

    currency:
      relationship.currency === "USD"
        ? "USD"
        : "PYG",

    paid_at:
      relationship.paid_at ||
      null,

    invoice_number:
      relationship.invoice_number ||
      null,

    payment_description:
      relationship.payment_description ||
      null,

    amount:
      getRelationshipAmount(
        relationship,
      ),

    paid:
      getRelationshipPaid(
        relationship,
      ),
  };
}

function toCommercialRelationships(
  relationships: ExecutiveCockpitRelationship[],
): CommercialRelationship[] {
  return relationships.map(
    toCommercialRelationship,
  );
}

export function buildExecutiveCockpitReport(
  params: {
    relationships: ExecutiveCockpitRelationship[];
    actions: ExecutiveCockpitCommercialAction[];
  },
): ExecutiveCockpitReport {
  const relationships =
    params.relationships ??
    [];

  const actions =
    params.actions ??
    [];

  const metrics =
    buildExecutiveMetrics({
      relationships,
      actions,
    });

  const commercialRelationships =
    toCommercialRelationships(
      relationships,
    );

  const executiveHealth =
    buildExecutiveHealthReport({
      founderScore:
        metrics.founderScore,

      revenueMomentum:
        metrics.revenueMomentum,

      operationalPressure:
        metrics.operationalPressure,

      executionQuality:
        metrics.executionQuality,

      pipelineVelocity:
        metrics.pipelineVelocity,

      confirmedRevenue:
        metrics.confirmedRevenue,

      openRevenue:
        metrics.openRevenue,

      confirmedRevenueUsd:
        metrics.confirmedRevenueUsd,

      openRevenueUsd:
        metrics.openRevenueUsd,

      paidRelationships:
        metrics.paidRelationships,

      unpaidRelationships:
        metrics.unpaidRelationships,

      overdueFollowups:
        metrics.overdueRelationships,

      dueSoonFollowups:
        metrics.dueSoonRelationships,

      recentRelationships:
        metrics.recentRelationships,

      stalledRelationships:
        metrics.stalledRelationships,

      riskCount:
        metrics.risks,

      opportunityCount:
        metrics.opportunities,

      followupCount:
        metrics.followupCount,
    });

  const commercialPipeline =
    buildExecutiveCommercialPipelineChapter(
      commercialRelationships,
    );

  const customerIntelligence =
    buildExecutiveCustomerIntelligenceChapter(
      commercialRelationships,
    );

  const kpiIntelligence =
    buildExecutiveKpiIntelligenceChapter({
      totalRelationships:
        metrics.totalRelationships,

      activeRelationships:
        metrics.activeRelationships,

      overdueRelationships:
        metrics.overdueRelationships,

      relationshipsToContactToday:
        metrics.relationshipsToContactToday,

      paidRelationships:
        metrics.paidRelationships,

      unpaidRelationships:
        metrics.unpaidRelationships,

      totalRevenue:
        metrics.confirmedRevenue,

      totalRevenueUsd:
        metrics.confirmedRevenueUsd,
    });

  const founderInsights =
    buildExecutiveFounderInsightsChapter({
      activeRelationships:
        metrics.activeRelationships,

      overdueRelationships:
        metrics.overdueRelationships,

      opportunities:
        metrics.opportunities,

      responseRate:
        metrics.responseRate,

      conversionRate:
        metrics.conversionRate,
    });

  const executiveActions =
    buildExecutiveActionsChapter({
      overdueRelationships:
        metrics.overdueRelationships,

      dueSoonRelationships:
        metrics.dueSoonRelationships,

      unpaidRelationships:
        metrics.unpaidRelationships,

      paidRelationships:
        metrics.paidRelationships,

      openRevenue:
        metrics.openRevenue,

      confirmedRevenue:
        metrics.confirmedRevenue,

      openRevenueUsd:
        metrics.openRevenueUsd,

      confirmedRevenueUsd:
        metrics.confirmedRevenueUsd,

      opportunities:
        metrics.opportunities,
    });

  return {
    generatedAt:
      new Date().toISOString(),

    executiveHealth,
    commercialPipeline,
    customerIntelligence,
    kpiIntelligence,
    founderInsights,
    executiveActions,
  };
}