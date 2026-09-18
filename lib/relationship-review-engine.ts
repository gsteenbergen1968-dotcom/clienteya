import type {
  RelationshipImportCandidate,
  RelationshipImportIssue,
  RelationshipImportIssueType,
  RelationshipImportResult,
} from "./relationship-import-engine";

export type RelationshipReviewStatus =
  | "ready"
  | "review"
  | "ignore";

export type RelationshipReviewDecision =
  | "pending"
  | "import"
  | "keep-existing"
  | "create-new"
  | "ignore";

export type RelationshipReviewReason = {
  type: RelationshipImportIssueType;
  label: string;
  description: string;
};

export type RelationshipReviewItem = {
  sourceIndex: number;
  relationship: RelationshipImportCandidate;
  status: RelationshipReviewStatus;
  decision: RelationshipReviewDecision;
  reasons: RelationshipReviewReason[];
};

export type RelationshipReviewSummary = {
  total: number;
  ready: number;
  review: number;
  ignored: number;
  pendingDecisions: number;
};

export type RelationshipReviewReport = {
  title: string;
  description: string;
  summary: RelationshipReviewSummary;
  items: RelationshipReviewItem[];
};

export type RelationshipReviewResolutionInput = {
  sourceIndex: number;
  decision: Exclude<RelationshipReviewDecision, "pending">;
};

export type RelationshipReviewResolutionResult = {
  report: RelationshipReviewReport;
  importRelationships: RelationshipImportCandidate[];
  ignoredRelationships: RelationshipImportCandidate[];
};

const ISSUE_LABELS: Record<
  RelationshipImportIssueType,
  {
    label: string;
    description: string;
  }
> = {
  "missing-name": {
    label: "Falta el nombre",
    description:
      "Necesitamos un nombre antes de crear esta relación.",
  },
  "invalid-phone": {
    label: "Teléfono para revisar",
    description:
      "El número de teléfono parece incompleto o no válido.",
  },
  "invalid-email": {
    label: "Correo para revisar",
    description:
      "El correo electrónico no tiene un formato válido.",
  },
  "possible-duplicate": {
    label: "Posible duplicado",
    description:
      "Esta relación podría existir ya en ClienteYA.",
  },
  "empty-row": {
    label: "Fila vacía",
    description:
      "No encontramos información útil en esta fila.",
  },
};

function buildReason(
  issue: RelationshipImportIssue
): RelationshipReviewReason {
  const definition = ISSUE_LABELS[issue.type];

  return {
    type: issue.type,
    label: definition.label,
    description: issue.message || definition.description,
  };
}

function getIssuesForRelationship(
  sourceIndex: number,
  issues: RelationshipImportIssue[]
) {
  return issues.filter(
    (issue) => issue.sourceIndex === sourceIndex
  );
}

function getReviewStatus(
  relationship: RelationshipImportCandidate,
  issues: RelationshipImportIssue[]
): RelationshipReviewStatus {
  const relationshipIssues = getIssuesForRelationship(
    relationship.sourceIndex,
    issues
  );

  if (
    relationshipIssues.some(
      (issue) => issue.type === "empty-row"
    )
  ) {
    return "ignore";
  }

  if (relationshipIssues.length > 0) {
    return "review";
  }

  return "ready";
}

function getInitialDecision(
  status: RelationshipReviewStatus
): RelationshipReviewDecision {
  if (status === "ready") return "import";
  if (status === "ignore") return "ignore";

  return "pending";
}

function buildReviewItem(
  relationship: RelationshipImportCandidate,
  issues: RelationshipImportIssue[]
): RelationshipReviewItem {
  const status = getReviewStatus(relationship, issues);
  const relationshipIssues = getIssuesForRelationship(
    relationship.sourceIndex,
    issues
  );

  return {
    sourceIndex: relationship.sourceIndex,
    relationship,
    status,
    decision: getInitialDecision(status),
    reasons: relationshipIssues.map(buildReason),
  };
}

function buildSummary(
  items: RelationshipReviewItem[]
): RelationshipReviewSummary {
  return {
    total: items.length,
    ready: items.filter(
      (item) => item.status === "ready"
    ).length,
    review: items.filter(
      (item) => item.status === "review"
    ).length,
    ignored: items.filter(
      (item) => item.status === "ignore"
    ).length,
    pendingDecisions: items.filter(
      (item) => item.decision === "pending"
    ).length,
  };
}

function buildDescription(
  summary: RelationshipReviewSummary
) {
  if (summary.total === 0) {
    return "No encontramos relaciones para revisar.";
  }

  if (summary.review === 0) {
    return `${summary.ready} relaciones están listas para comenzar en ClienteYA.`;
  }

  return `${summary.ready} relaciones están listas. Solo necesitamos revisar ${summary.review}.`;
}

export function buildRelationshipReviewReport(
  importResult: RelationshipImportResult
): RelationshipReviewReport {
  const items = importResult.relationships.map(
    (relationship) =>
      buildReviewItem(
        relationship,
        importResult.issues
      )
  );

  const summary = buildSummary(items);

  return {
    title: "Revisa solo lo necesario",
    description: buildDescription(summary),
    summary,
    items,
  };
}

function applyResolution(
  item: RelationshipReviewItem,
  resolutions: Map<
    number,
    Exclude<RelationshipReviewDecision, "pending">
  >
): RelationshipReviewItem {
  const resolution = resolutions.get(item.sourceIndex);

  if (!resolution) return item;

  return {
    ...item,
    decision: resolution,
  };
}

function canImport(
  decision: RelationshipReviewDecision
) {
  return (
    decision === "import" ||
    decision === "create-new"
  );
}

function shouldIgnore(
  decision: RelationshipReviewDecision
) {
  return (
    decision === "ignore" ||
    decision === "keep-existing"
  );
}

export function resolveRelationshipReview(
  report: RelationshipReviewReport,
  resolutions: RelationshipReviewResolutionInput[]
): RelationshipReviewResolutionResult {
  const resolutionMap = new Map(
    resolutions.map((resolution) => [
      resolution.sourceIndex,
      resolution.decision,
    ])
  );

  const items = report.items.map((item) =>
    applyResolution(item, resolutionMap)
  );

  const resolvedReport: RelationshipReviewReport = {
    ...report,
    summary: buildSummary(items),
    items,
  };

  return {
    report: resolvedReport,
    importRelationships: items
      .filter((item) => canImport(item.decision))
      .map((item) => item.relationship),
    ignoredRelationships: items
      .filter((item) => shouldIgnore(item.decision))
      .map((item) => item.relationship),
  };
}

export function getRelationshipReviewItem(
  report: RelationshipReviewReport,
  sourceIndex: number
) {
  return (
    report.items.find(
      (item) => item.sourceIndex === sourceIndex
    ) || null
  );
}

export function getPendingRelationshipReviews(
  report: RelationshipReviewReport
) {
  return report.items.filter(
    (item) => item.decision === "pending"
  );
}

export function isRelationshipReviewComplete(
  report: RelationshipReviewReport
) {
  return report.summary.pendingDecisions === 0;
}