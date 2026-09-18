import type { SupportMemoryAdapter } from "./support-memory-adapter";

import { createSupportSupabaseAdapter } from "./support-supabase-adapter";

export type BuildSupportMemoryAdapter = () => SupportMemoryAdapter;

export function buildSupportMemoryAdapter(
  factory?: BuildSupportMemoryAdapter,
): SupportMemoryAdapter {
  if (factory) {
    return factory();
  }

  return createSupportSupabaseAdapter();
}