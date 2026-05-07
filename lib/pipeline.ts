"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateClientStatus(id: string, estado: string) {
  const supabase = createClient();

  await supabase
    .from("clientes")
    .update({ estado })
    .eq("id", id);
}