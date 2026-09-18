"use server";

import { createAuthServerClient } from "@/lib/supabase/auth-server";

export async function updateRelationshipStatus(
  id: string,
  status: string
) {
  const supabase = await createAuthServerClient();

  await supabase
    .from("relationships")
    .update({ status })
    .eq("id", id);
}