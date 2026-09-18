import type { SupportFounderAdapter } from "./support-founder-adapter";

export type BuildSupportFounderAdapter =
  () => SupportFounderAdapter;

export function buildSupportFounderAdapter(
  factory: BuildSupportFounderAdapter,
): SupportFounderAdapter {
  return factory();
}