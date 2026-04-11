import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  const authSupabase = await createAuthServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await request.formData();
  const profileId = String(formData.get("profile_id") || "").trim();
  const nextStatus = String(formData.get("status") || "").trim();

  if (!profileId || !nextStatus) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const supabase = createAdminClient();

  await supabase
    .from("profiles")
    .update({
      subscription_status: nextStatus,
    })
    .eq("id", profileId);

  return NextResponse.redirect(new URL("/admin", request.url));
}