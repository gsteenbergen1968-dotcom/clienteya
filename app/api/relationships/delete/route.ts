// app/api/relationships/delete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "../../../../lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const auth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await auth.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const formData = await request.formData();
    const relationshipId = String(formData.get("id") ?? "").trim();

    if (!relationshipId) {
      return NextResponse.redirect(new URL("/dashboard/relationships", request.url));
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("relationships")
      .delete()
      .eq("id", relationshipId)
      .eq("owner_id", user.id);

    if (error) {
      console.error("Relationship delete failed:", error);

      return NextResponse.redirect(
        new URL("/dashboard/relationships", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard/relationships", request.url)
    );
  } catch (error) {
    console.error("Relationship delete error:", error);

    return NextResponse.redirect(
      new URL("/dashboard/relationships", request.url)
    );
  }
}