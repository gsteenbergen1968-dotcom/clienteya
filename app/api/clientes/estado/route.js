import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/server";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const id = String(formData.get("id") || "").trim();
    const estado = String(formData.get("estado") || "").trim();

    if (!id || !estado) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const supabase = createAdminClient();

    await supabase.from("clientes").update({ estado }).eq("id", id);

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}