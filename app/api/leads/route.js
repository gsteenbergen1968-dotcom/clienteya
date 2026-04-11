import { NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/server";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is verplicht." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Ongeldig emailadres." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("leads").insert([{ email }]);

    if (error) {
      const message = String(error.message || "").toLowerCase();

      if (
        message.includes("duplicate") ||
        message.includes("unique") ||
        message.includes("leads_email_unique_idx")
      ) {
        return NextResponse.json(
          { error: "Dit emailadres staat al op de wachtlijst." },
          { status: 409 }
        );
      }

      console.error("Supabase error:", error);

      return NextResponse.json(
        { error: error.message || "Kon lead niet opslaan." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Bedankt! Je staat op de wachtlijst." },
      { status: 200 }
    );
  } catch (e) {
    console.error("Route error:", e);

    return NextResponse.json(
      {
        error: e?.message || "Onbekende fout in de API route."
      },
      { status: 500 }
    );
  }
}