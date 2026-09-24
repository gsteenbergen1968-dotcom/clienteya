// app/api/relationships/export/route.ts

import { createServerClient } from "@supabase/ssr";

import { createAdminClient } from "../../../../lib/supabase/server";

import { NextRequest } from "next/server";

function escapeCsvValue(value: unknown): string {
  const stringValue = String(value ?? "");
  const escaped = stringValue.replace(/"/g, '""');

  return `"${escaped}"`;
}

export async function GET(request: NextRequest): Promise<Response> {
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
    return new Response("Unauthorized.", {
      status: 401,
    });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("relationships")
    .select(`
      name,
      company,
      phone,
      status,
      notes,
      reminder,
      next_contact_at,
      created_at
    `)
    .eq("owner_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Relationship export failed:", error);

    return new Response("Unable to export relationships.", {
      status: 500,
    });
  }

  const headers = [
    "name",
    "company",
    "phone",
    "status",
    "notes",
    "reminder",
    "next_contact_at",
    "created_at",
  ];

  const rows = (data ?? []).map((relationship) =>
    [
      escapeCsvValue(relationship.name),
      escapeCsvValue(relationship.company),
      escapeCsvValue(relationship.phone),
      escapeCsvValue(relationship.status),
      escapeCsvValue(relationship.notes),
      escapeCsvValue(relationship.reminder),
      escapeCsvValue(relationship.next_contact_at),
      escapeCsvValue(relationship.created_at),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="relationships.csv"',
    },
  });
}