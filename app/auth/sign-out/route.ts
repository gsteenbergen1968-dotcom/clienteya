import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { NextRequest, NextResponse } from "next/server";

async function handleSignOut(request: NextRequest) {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url));
}

export async function GET(request: NextRequest) {
  return handleSignOut(request);
}

export async function POST(request: NextRequest) {
  return handleSignOut(request);
}