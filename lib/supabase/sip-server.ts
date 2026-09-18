import { createClient } from "@supabase/supabase-js";

export function createSipAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SIP_SUPABASE_URL?.trim();

  const serviceRoleKey =
    process.env.SIP_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SIP_SUPABASE_SECRET_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SIP Supabase server environment variables.",
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}