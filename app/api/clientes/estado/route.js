import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request) {
  try {
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const formData = await request.formData();

    const id = String(formData.get("id") || "").trim();
    const estado = String(formData.get("estado") || "").trim();

    if (!id || !estado) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const supabase = createAdminClient();

    await supabase
      .from("clientes")
      .update({ estado })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}