import type {
  RelationshipImportIssueType,
  RelationshipImportResult,
} from "./relationship-import-engine";
import type { RelationshipSource } from "./relationship-onboarding-engine";

export type ImportRelationshipCategory =
  | "commercial"
  | "private"
  | "unknown";

export type ImportAnalysisDecision = {
  includeCommercial: boolean;
  includePrivate: boolean;
  includeUnknown: boolean;
  includeDuplicates: boolean;
  includeMissingName: boolean;
};

export type ImportAnalysisSummary = {
  total: number;
  commercial: number;
  private: number;
  unknown: number;
  duplicates: number;
  missingName: number;
  invalidPhone: number;
  invalidEmail: number;
  ready: number;
  requiresDecision: number;
};

export type ImportAnalysisRelationship = {
  sourceIndex: number;
  name: string;
  phone: string | null;
  email: string | null;
  category: ImportRelationshipCategory;
  issueTypes: RelationshipImportIssueType[];
};

export type ImportAnalysisGroups = {
  commercial: ImportAnalysisRelationship[];
  private: ImportAnalysisRelationship[];
  unknown: ImportAnalysisRelationship[];
  duplicates: ImportAnalysisRelationship[];
  missingName: ImportAnalysisRelationship[];
  invalidPhone: ImportAnalysisRelationship[];
  invalidEmail: ImportAnalysisRelationship[];
};

export type ImportAnalysisResult = {
  source: RelationshipSource;
  summary: ImportAnalysisSummary;
  relationships: ImportAnalysisRelationship[];
  groups: ImportAnalysisGroups;
  recommendedDecision: ImportAnalysisDecision;
  requiresConfirmation: true;
};

const COMMERCIAL_TYPE_VALUES = new Set([
  "business",
  "commercial",
  "company",
  "client",
  "customer",
  "lead",
  "prospect",
  "professional",
  "empresa",
  "empresarial",
  "comercial",
  "cliente",
  "prospecto",
]);

const PRIVATE_TYPE_VALUES = new Set([
  "private",
  "personal",
  "family",
  "friend",
  "familia",
  "familiar",
  "amigo",
  "amistad",
  "privado",
]);

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getRelationshipCategory(
  relationshipType: string | null
): ImportRelationshipCategory {
  const normalizedType = normalizeValue(relationshipType);

  if (COMMERCIAL_TYPE_VALUES.has(normalizedType)) {
    return "commercial";
  }

  if (PRIVATE_TYPE_VALUES.has(normalizedType)) {
    return "private";
  }

  return "unknown";
}

function hasIssue(
  issueTypes: RelationshipImportIssueType[],
  type: RelationshipImportIssueType
) {
  return issueTypes.includes(type);
}

export function buildImportAnalysisResult(
  importResult: RelationshipImportResult
): ImportAnalysisResult {
  const issueTypesBySourceIndex = new Map<
    number,
    RelationshipImportIssueType[]
  >();

  for (const issue of importResult.issues) {
    const currentIssueTypes =
      issueTypesBySourceIndex.get(issue.sourceIndex) ?? [];

    if (!currentIssueTypes.includes(issue.type)) {
      currentIssueTypes.push(issue.type);
    }

    issueTypesBySourceIndex.set(issue.sourceIndex, currentIssueTypes);
  }

  const relationships = importResult.relationships.map((relationship) => ({
    sourceIndex: relationship.sourceIndex,
    name: relationship.name,
    phone: relationship.phone,
    email: relationship.email,
    category: getRelationshipCategory(relationship.relationshipType),
    issueTypes: issueTypesBySourceIndex.get(relationship.sourceIndex) ?? [],
  }));

  const groups: ImportAnalysisGroups = {
    commercial: relationships.filter(
      (relationship) => relationship.category === "commercial"
    ),
    private: relationships.filter(
      (relationship) => relationship.category === "private"
    ),
    unknown: relationships.filter(
      (relationship) => relationship.category === "unknown"
    ),
    duplicates: relationships.filter((relationship) =>
      hasIssue(relationship.issueTypes, "possible-duplicate")
    ),
    missingName: relationships.filter((relationship) =>
      hasIssue(relationship.issueTypes, "missing-name")
    ),
    invalidPhone: relationships.filter((relationship) =>
      hasIssue(relationship.issueTypes, "invalid-phone")
    ),
    invalidEmail: relationships.filter((relationship) =>
      hasIssue(relationship.issueTypes, "invalid-email")
    ),
  };

  const summary: ImportAnalysisSummary = {
    total: relationships.length,
    commercial: relationships.filter(
      (relationship) => relationship.category === "commercial"
    ).length,
    private: relationships.filter(
      (relationship) => relationship.category === "private"
    ).length,
    unknown: relationships.filter(
      (relationship) => relationship.category === "unknown"
    ).length,
    duplicates: relationships.filter((relationship) =>
      hasIssue(relationship.issueTypes, "possible-duplicate")
    ).length,
    missingName: relationships.filter((relationship) =>
      hasIssue(relationship.issueTypes, "missing-name")
    ).length,
    invalidPhone: relationships.filter((relationship) =>
      hasIssue(relationship.issueTypes, "invalid-phone")
    ).length,
    invalidEmail: relationships.filter((relationship) =>
      hasIssue(relationship.issueTypes, "invalid-email")
    ).length,
    ready: importResult.summary.readyRelationships,
    requiresDecision: importResult.summary.reviewRelationships,
  };

  return {
    source: importResult.source,
    summary,
    relationships,
    groups,
    recommendedDecision: {
      includeCommercial: true,
      includePrivate: false,
      includeUnknown: true,
      includeDuplicates: false,
      includeMissingName: false,
    },
    requiresConfirmation: true,
  };
}