"use server";

import { createAuthServerClient } from "@/lib/supabase/auth-server";

export async function markAsPaid(id: string, monto: number) {
  const supabase = await createAuthServerClient();

  await supabase
    .from("clientes")
    .update({
      estado: "pagado",
      pagado: true,
      monto,
      fecha_pago: new Date().toISOString(),
    })
    .eq("id", id);
}