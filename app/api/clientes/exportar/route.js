import { createAdminClient } from "../../../../lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(request) {
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
    return new Response("No autorizado.", { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("nombre, telefono, estado, notas, recordatorio, proximo_contacto, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response("No se pudo exportar el CSV.", { status: 500 });
  }

  const headers = [
    "nombre",
    "telefono",
    "estado",
    "notas",
    "recordatorio",
    "proximo_contacto",
    "created_at",
  ];

  const rows = (data || []).map((cliente) =>
    [
      escapeCsvValue(cliente.nombre),
      escapeCsvValue(cliente.telefono),
      escapeCsvValue(cliente.estado),
      escapeCsvValue(cliente.notas),
      escapeCsvValue(cliente.recordatorio),
      escapeCsvValue(cliente.proximo_contacto),
      escapeCsvValue(cliente.created_at),
    ].join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clientes.csv"',
    },
  });
}