import type {
  FounderEvidence,
  FounderEvidenceMetadata,
  FounderEvidenceSource,
  FounderEvidenceStrength,
  FounderEvidenceValue,
  FounderIntelligenceDomain,
} from "../models/founder-model";

export type FounderManualEvidenceInput = {
  id?: string;
  domain: FounderIntelligenceDomain;
  title: string;
  description: string;
  value?: FounderEvidenceValue;
  strength: FounderEvidenceStrength;
  observedAt?: string;
  validUntil?: string | null;
  sourceReference?: string | null;
  metadata?: FounderEvidenceMetadata;
};

export function adaptManualFounderEvidence(
  input: FounderManualEvidenceInput
): FounderEvidence {
  const observedAt = input.observedAt ?? new Date().toISOString();

  const source: FounderEvidenceSource = "manual";

  return {
    id: input.id ?? crypto.randomUUID(),
    domain: input.domain,
    source,
    title: input.title,
    description: input.description,
    value: input.value,
    strength: input.strength,
    status: "active",
    observedAt,
    validUntil: input.validUntil ?? null,
    sourceReference: input.sourceReference ?? null,
    metadata: input.metadata,
  };
}