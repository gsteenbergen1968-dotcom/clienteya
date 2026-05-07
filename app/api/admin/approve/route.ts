import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const userId = String(formData.get("userId") || "").trim();

  if (!userId) {
    return NextResponse.redirect(new URL("/dashboard/admin", req.url));
  }

  const supabase = createAdminClient();

  await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
    })
    .eq("id", userId);

  return NextResponse.redirect(new URL("/dashboard/admin", req.url));
}