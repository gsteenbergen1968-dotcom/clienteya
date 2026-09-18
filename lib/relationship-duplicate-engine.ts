import type {
  RelationshipImportCandidate,
} from "./relationship-import-engine";

export type RelationshipDuplicateConfidence =
  | "low"
  | "medium"
  | "high";

export type RelationshipDuplicateReason =
  | "phone"
  | "email"
  | "name"
  | "company"
  | "combined";

export type RelationshipDuplicateMatch = {
  existingIndex: number;
  confidence: RelationshipDuplicateConfidence;
  score: number;
  reasons: RelationshipDuplicateReason[];
};

export type RelationshipDuplicateResult = {
  relationship: RelationshipImportCandidate;
  duplicate: boolean;
  match: RelationshipDuplicateMatch | null;
};

export type RelationshipDuplicateEngineInput = {
  importedRelationships: RelationshipImportCandidate[];
  existingRelationships: RelationshipImportCandidate[];
};

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizePhone(phone: string | null) {
  return normalize(phone).replace(/\D/g, "");
}

function calculateSimilarity(first: string, second: string) {
  if (!first || !second) return 0;

  if (first === second) return 100;

  if (first.includes(second) || second.includes(first)) {
    return 85;
  }

  const firstWords = first.split(" ");
  const secondWords = second.split(" ");

  const matches = firstWords.filter((word) =>
    secondWords.includes(word)
  ).length;

  return Math.round(
    (matches / Math.max(firstWords.length, secondWords.length)) * 100
  );
}

function compareRelationship(
  imported: RelationshipImportCandidate,
  existing: RelationshipImportCandidate,
  existingIndex: number
): RelationshipDuplicateMatch | null {
  let score = 0;

  const reasons: RelationshipDuplicateReason[] = [];

  const importedPhone = normalizePhone(imported.phone);
  const existingPhone = normalizePhone(existing.phone);

  if (
    importedPhone &&
    existingPhone &&
    importedPhone === existingPhone
  ) {
    score += 60;
    reasons.push("phone");
  }

  const importedEmail = normalize(imported.email);
  const existingEmail = normalize(existing.email);

  if (
    importedEmail &&
    existingEmail &&
    importedEmail === existingEmail
  ) {
    score += 50;
    reasons.push("email");
  }

  const importedName = normalize(imported.name);
  const existingName = normalize(existing.name);

  const nameSimilarity = calculateSimilarity(
    importedName,
    existingName
  );

  if (nameSimilarity >= 90) {
    score += 30;
    reasons.push("name");
  }

  const importedCompany = normalize(imported.company);
  const existingCompany = normalize(existing.company);

  const companySimilarity = calculateSimilarity(
    importedCompany,
    existingCompany
  );

  if (companySimilarity >= 90) {
    score += 15;
    reasons.push("company");
  }

  if (reasons.length >= 2) {
    reasons.push("combined");
  }

  if (score < 40) {
    return null;
  }

  let confidence: RelationshipDuplicateConfidence = "low";

  if (score >= 90) {
    confidence = "high";
  } else if (score >= 65) {
    confidence = "medium";
  }

  return {
    existingIndex,
    confidence,
    score,
    reasons,
  };
}

export function detectRelationshipDuplicates(
  input: RelationshipDuplicateEngineInput
): RelationshipDuplicateResult[] {
  return input.importedRelationships.map((relationship) => {
    let bestMatch: RelationshipDuplicateMatch | null = null;

    input.existingRelationships.forEach(
      (existingRelationship, index) => {
        const match = compareRelationship(
          relationship,
          existingRelationship,
          index
        );

        if (!match) return;

        if (
          !bestMatch ||
          match.score > bestMatch.score
        ) {
          bestMatch = match;
        }
      }
    );

    return {
      relationship,
      duplicate: bestMatch !== null,
      match: bestMatch,
    };
  });
}

export function countRelationshipDuplicates(
  results: RelationshipDuplicateResult[]
) {
  return results.filter(
    (result) => result.duplicate
  ).length;
}

export function getRelationshipsReadyForImport(
  results: RelationshipDuplicateResult[]
) {
  return results
    .filter((result) => !result.duplicate)
    .map((result) => result.relationship);
}

export function getRelationshipsForReview(
  results: RelationshipDuplicateResult[]
) {
  return results.filter(
    (result) => result.duplicate
  );
}