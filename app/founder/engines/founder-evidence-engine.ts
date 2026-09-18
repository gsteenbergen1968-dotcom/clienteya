import type {
  FounderEvidence,
  FounderEvidenceAssessment,
  FounderEvidenceStrength,
} from "../models/founder-model";

const founderEvidenceStrengthScore: Record<
  FounderEvidenceStrength,
  number
> = {
  insufficient: 0,
  weak: 1,
  moderate: 2,
  strong: 3,
  conclusive: 4,
};

export type FounderEvidenceAssessmentInput = {
  evidence: FounderEvidence[];
  assessedAt?: string;
};

function isEvidenceCurrentlyValid(
  evidence: FounderEvidence,
  assessedAt: Date
): boolean {
  if (evidence.status !== "active") {
    return false;
  }

  if (!evidence.validUntil) {
    return true;
  }

  const validUntil = new Date(evidence.validUntil);

  if (Number.isNaN(validUntil.getTime())) {
    return false;
  }

  return validUntil.getTime() >= assessedAt.getTime();
}

function getLowestEvidenceStrength(
  evidence: FounderEvidence[]
): FounderEvidenceStrength {
  if (evidence.length === 0) {
    return "insufficient";
  }

  return evidence.reduce<FounderEvidenceStrength>(
    (lowestStrength, currentEvidence) => {
      const currentScore =
        founderEvidenceStrengthScore[currentEvidence.strength];
      const lowestScore =
        founderEvidenceStrengthScore[lowestStrength];

      return currentScore < lowestScore
        ? currentEvidence.strength
        : lowestStrength;
    },
    evidence[0].strength
  );
}

function buildEvidenceExplanation(
  validEvidence: FounderEvidence[],
  invalidEvidence: FounderEvidence[],
  strength: FounderEvidenceStrength
): string {
  if (validEvidence.length === 0) {
    return "No valid evidence is available.";
  }

  if (invalidEvidence.length > 0) {
    return `${validEvidence.length} valid evidence item(s) were assessed. ${invalidEvidence.length} item(s) were excluded because they were inactive, outdated, conflicting, invalid, or expired. The lowest valid evidence strength is ${strength}.`;
  }

  return `${validEvidence.length} valid evidence item(s) were assessed. The lowest evidence strength is ${strength}.`;
}

export function assessFounderEvidence(
  input: FounderEvidenceAssessmentInput
): FounderEvidenceAssessment {
  const assessedAtValue =
    input.assessedAt ?? new Date().toISOString();
  const assessedAt = new Date(assessedAtValue);

  if (Number.isNaN(assessedAt.getTime())) {
    throw new Error(
      "Founder evidence assessment requires a valid assessedAt value."
    );
  }

  const validEvidence = input.evidence.filter((evidence) =>
    isEvidenceCurrentlyValid(evidence, assessedAt)
  );

  const invalidEvidence = input.evidence.filter(
    (evidence) =>
      !isEvidenceCurrentlyValid(evidence, assessedAt)
  );

  const strength = getLowestEvidenceStrength(validEvidence);

  const sufficient =
    validEvidence.length > 0 &&
    (strength === "strong" || strength === "conclusive");

  return {
    evidenceIds: validEvidence.map((evidence) => evidence.id),
    strength,
    sufficient,
    explanation: buildEvidenceExplanation(
      validEvidence,
      invalidEvidence,
      strength
    ),
    assessedAt: assessedAt.toISOString(),
  };
}