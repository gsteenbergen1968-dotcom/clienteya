import type { SupportKnowledgeAdapter } from "./support-knowledge-adapter";

export type BuildSupportKnowledgeAdapter = () => SupportKnowledgeAdapter;

export function buildSupportKnowledgeAdapter(
  factory: BuildSupportKnowledgeAdapter,
): SupportKnowledgeAdapter {
  return factory();
}