import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createWhatsAppLog } from "../../../lib/whatsapp-logs";

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const clienteId = String(body.clienteId || "");
    const message = String(body.message || "");
    const source =
      body.source === "ai_preview" ? "ai_preview" : "manual";
    const direction =
      body.direction === "incoming" ? "incoming" : "outgoing";

    if (!clienteId || !message) {
      return NextResponse.json(
        { error: "Missing clienteId or message" },
        { status: 400 }
      );
    }

    const { error } = await createWhatsAppLog({
      userId: user.id,
      clienteId,
      message,
      source,
      direction,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}