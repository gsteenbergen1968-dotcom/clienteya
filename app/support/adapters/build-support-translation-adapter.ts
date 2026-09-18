import type { SupportTranslationAdapter } from "./support-translation-adapter";

export type BuildSupportTranslationAdapter =
  () => SupportTranslationAdapter;

export function buildSupportTranslationAdapter(
  factory: BuildSupportTranslationAdapter,
): SupportTranslationAdapter {
  return factory();
}