"use server";

import { createAuthServerClient } from "@/lib/supabase/auth-server";

export async function updateClientStatus(id: string, estado: string) {
  const supabase = await createAuthServerClient();
  await supabase
    .from("clientes")
    .update({ estado })
    .eq("id", id);
}