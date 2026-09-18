"use server";

import { createAuthServerClient } from "@/lib/supabase/auth-server";

export async function markRelationshipAsPaid(
  id: string,
  amount: number,
) {
  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const paidAt = new Date().toISOString();

  const { error } = await supabase
    .from("relationships")
    .update({
      status: "Pagó",
      paid: true,
      amount,
      paid_at: paidAt,
      updated_at: paidAt,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}