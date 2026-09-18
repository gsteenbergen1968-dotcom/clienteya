import type { FounderEvidence } from "../models/founder-model";
import { founderEvidenceAdapters } from "../adapters/founder-adapter-registry";

export async function collectFounderEvidence(): Promise<
  FounderEvidence[]
> {
  const evidenceCollections = await Promise.all(
    founderEvidenceAdapters.map((adapter) => adapter())
  );

  return evidenceCollections.flat();
}