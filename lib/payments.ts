"use server";

import { createClient } from "@/lib/supabase/server";

export async function markAsPaid(id: string, monto: number) {
  const supabase = createClient();

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