import type { SupportLearningAdapter } from "./support-learning-adapter";

export type BuildSupportLearningAdapter =
  () => SupportLearningAdapter;

export function buildSupportLearningAdapter(
  factory: BuildSupportLearningAdapter,
): SupportLearningAdapter {
  return factory();
}