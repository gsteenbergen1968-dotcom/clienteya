import { NextResponse } from "next/server";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";

import {
  logActivity,
  type ActivityType,
} from "../../../lib/activity";

export async function POST(req: Request) {
  const supabase =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false },
      { status: 401 },
    );
  }

  const body =
    await req.json().catch(
      () => null,
    );

  const type =
    String(
      body?.type || "",
    ) as ActivityType;

  const relationshipId =
    body?.relationshipId
      ? String(
          body.relationshipId,
        )
      : undefined;

  const allowedTypes: ActivityType[] = [
    "ai_message",
    "contacted",
    "followup",
    "whatsapp_opened",
  ];

  if (
    !allowedTypes.includes(
      type,
    )
  ) {
    return NextResponse.json(
      { ok: false },
      { status: 400 },
    );
  }

  await logActivity({
    userId: user.id,
    type,
    relationshipId,
  });

  return NextResponse.json({
    ok: true,
  });
}