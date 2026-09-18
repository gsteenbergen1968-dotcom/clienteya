import { createServerClient } from "@supabase/ssr";

import { cookies } from "next/headers";

export async function createSipAuthServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SIP_SUPABASE_URL;

  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SIP_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing SIP Supabase auth environment variables.",
    );
  }

  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      auth: {
        storageKey: "clienteya-sip-auth",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(
                  name,
                  value,
                  options,
                );
              },
            );
          } catch {
            // ignored in server components
          }
        },
      },
    },
  );
}