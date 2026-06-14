import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import MobileDashboardNav from "../MobileDashboardNav";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";

export const dynamic = "force-dynamic";

type BusinessSettings = {
  user_id: string;
  company_name: string | null;
  business_type: string | null;
  business_tone: string | null;
  business_email: string | null;
  business_phone: string | null;
  whatsapp_number: string | null;
  country_label: string | null;
  city: string | null;
  ai_prompt: string | null;
};

const defaultPrompt =
  "Escribe mensajes claros, útiles y breves. Mantén un tono humano y orientado a convertir sin sonar agresivo.";

const businessTypeOptions = [
  {
    value: "general",
    label: "General",
    description: "Para ventas y seguimiento comercial general.",
    example: "Seguimiento pendiente",
  },
  {
    value: "restaurant",
    label: "Restaurante / Gastronomía",
    description: "Clientes, pedidos, reservas, visitas y recompra.",
    example: "Cliente ausente",
  },
  {
    value: "consulting",
    label: "Consultoría",
    description: "Propuestas, seguimiento, reuniones y próximos pasos.",
    example: "Siguiente paso comercial",
  },
  {
    value: "real_estate",
    label: "Inmobiliaria",
    description: "Propiedades, visitas, interesados y cierre de operación.",
    example: "Cliente esperando seguimiento",
  },
  {
    value: "fitness",
    label: "Fitness / Gimnasio",
    description: "Miembros, entrenamiento, renovación y reactivación.",
    example: "Cliente dejó de entrenar",
  },
  {
    value: "beauty",
    label: "Belleza / Peluquería / Spa",
    description: "Citas, reservas, recompra y clientes recurrentes.",
    example: "Cliente listo para nueva cita",
  },
  {
    value: "retail",
    label: "Retail / Tienda",
    description: "Ventas, recompra, productos y clientes frecuentes.",
    example: "Cliente sin retorno",
  },
  {
    value: "automotive",
    label: "Automotriz",
    description: "Interesados, cotizaciones, prueba y postventa.",
    example: "Interés enfriándose",
  },
  {
    value: "medical",
    label: "Salud / Clínica",
    description: "Pacientes, consultas, controles y continuidad.",
    example: "Seguimiento pendiente",
  },
  {
    value: "education",
    label: "Educación / Cursos",
    description: "Alumnos, inscripciones, clases y continuidad.",
    example: "Alumno potencial pendiente",
  },
  {
    value: "services",
    label: "Servicios",
    description: "Seguimiento, trabajos, presupuestos y clientes activos.",
    example: "Cliente en seguimiento",
  },
];

function ParaguayBadge() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1/3 bg-red-500" />
      <div className="absolute inset-x-0 top-1/3 h-1/3 bg-white" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-blue-600" />
      <span className="relative z-10 text-[10px] font-bold text-slate-900">
        PY
      </span>
    </div>
  );
}

function getBusinessTypeLabel(value: string | null | undefined) {
  return (
    businessTypeOptions.find((option) => option.value === value)?.label ||
    "General"
  );
}

function getBusinessTypeDescription(value: string | null | undefined) {
  return (
    businessTypeOptions.find((option) => option.value === value)?.description ||
    "Para ventas y seguimiento comercial general."
  );
}

function getBusinessTypeExample(value: string | null | undefined) {
  return (
    businessTypeOptions.find((option) => option.value === value)?.example ||
    "Seguimiento pendiente"
  );
}

function getSafeErrorMessage(message: string | undefined) {
  if (!message) return "Error desconocido";
  return message.slice(0, 260);
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;

  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function saveBusinessSettings(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const companyName = String(formData.get("company_name") || "").trim();
    const businessEmail = String(formData.get("business_email") || "").trim();
    const businessPhone = String(formData.get("business_phone") || "").trim();
    const whatsappNumber = String(formData.get("whatsapp_number") || "").trim();
    const countryLabel = String(
      formData.get("country_label") || "Paraguay"
    ).trim();
    const city = String(formData.get("city") || "").trim();

    const businessType = String(
      formData.get("business_type") || "general"
    ).trim();

    const businessTone = String(
      formData.get("business_tone") || "cercano"
    ).trim();

    const aiPrompt = String(formData.get("ai_prompt") || "").trim();

    const { error } = await supabase.from("business_settings").upsert(
      {
        user_id: user.id,
        company_name: companyName,
        business_type: businessType || "general",
        business_tone: businessTone || "cercano",
        business_email: businessEmail,
        business_phone: businessPhone,
        whatsapp_number: whatsappNumber,
        country_label: countryLabel || "Paraguay",
        city,
        ai_prompt: aiPrompt || defaultPrompt,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      redirect(
        `/dashboard/settings?error=${encodeURIComponent(
          getSafeErrorMessage(error.message)
        )}`
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/whatsapp");

    redirect("/dashboard/settings?ok=1");
  }

  const { data: settingsData } = await supabase
    .from("business_settings")
    .select(
      "user_id,company_name,business_type,business_tone,business_email,business_phone,whatsapp_number,country_label,city,ai_prompt"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const settings = (settingsData || null) as BusinessSettings | null;

  const companyName = settings?.company_name || "";
  const businessType = settings?.business_type || "general";
  const businessTone = settings?.business_tone || "cercano";
  const businessEmail = settings?.business_email || "";
  const businessPhone = settings?.business_phone || "";
  const whatsappNumber = settings?.whatsapp_number || "";
  const countryLabel = settings?.country_label || "Paraguay";
  const city = settings?.city || "";
  const aiPrompt = settings?.ai_prompt || defaultPrompt;

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 pb-36 pt-6 sm:px-6 lg:px-10 lg:pb-10">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                      <ParaguayBadge />
                      Paraguay
                    </span>
                  </div>

                  <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                    Configuración
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                    Define empresa, sector, WhatsApp, tono y prompt. ClienteYA
                    usará esta configuración para adaptar decisiones, mensajes y
                    lenguaje comercial a la realidad de tu negocio.
                  </p>
                </div>
              </div>

              {ok === "1" ? (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm">
                  ✅ Configuración guardada correctamente.
                </div>
              ) : null}

              {error ? (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-sm">
                  ⚠️ No pudimos guardar la configuración: {error}
                </div>
              ) : null}

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <form
                  action={saveBusinessSettings}
                  className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-6">
                    <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                      V20.3.3 Auth Business Settings
                    </div>

                    <h2 className="text-2xl font-black text-slate-950">
                      Perfil inteligente del negocio
                    </h2>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                      Esta información define cómo ClienteYA interpreta clientes,
                      acciones, WhatsApp y mensajes. Es la base de la Sector
                      Intelligence Layer.
                    </p>
                  </div>

                  <div className="grid gap-5">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Nombre de la empresa
                      </label>

                      <input
                        type="text"
                        name="company_name"
                        defaultValue={companyName}
                        placeholder="Ej. Morphy"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                      />

                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                        ClienteYA usará este nombre para entender para qué
                        negocio trabaja.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Email del negocio
                        </label>

                        <input
                          type="email"
                          name="business_email"
                          defaultValue={businessEmail}
                          placeholder="empresa@email.com"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Teléfono del negocio
                        </label>

                        <input
                          type="text"
                          name="business_phone"
                          defaultValue={businessPhone}
                          placeholder="Ej. 0981 123 456"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Número principal de WhatsApp
                      </label>

                      <input
                        type="text"
                        name="whatsapp_number"
                        defaultValue={whatsappNumber}
                        placeholder="Ej. 0981 123 456"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                      />

                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                        Este número será la base para futuras acciones,
                        automatizaciones y mensajes inteligentes por WhatsApp.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          País
                        </label>

                        <input
                          type="text"
                          name="country_label"
                          defaultValue={countryLabel}
                          placeholder="Paraguay"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Ciudad
                        </label>

                        <input
                          type="text"
                          name="city"
                          defaultValue={city}
                          placeholder="Ej. Asunción"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Sector principal
                      </label>

                      <select
                        name="business_type"
                        defaultValue={businessType}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-blue-500"
                      >
                        {businessTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                        Actual: {getBusinessTypeDescription(businessType)}
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Tono del mensaje
                      </label>

                      <select
                        name="business_tone"
                        defaultValue={businessTone}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                      >
                        <option value="cercano">Cercano</option>
                        <option value="formal">Formal</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="directo">Directo</option>
                        <option value="amable">Amable</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Prompt AI personalizado
                      </label>

                      <textarea
                        name="ai_prompt"
                        rows={7}
                        defaultValue={aiPrompt}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500"
                      />

                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Ejemplos: “más breve”, “sin emojis”, “más vendedor”,
                        “más humano”, “más directo”, “usar tono premium”.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
                    >
                      Guardar configuración
                    </button>
                  </div>
                </form>

                <div className="space-y-6">
                  <div className="rounded-[30px] border border-blue-200 bg-blue-50 p-6 shadow-sm">
                    <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                      Vista actual
                    </div>

                    <div className="rounded-[26px] border border-blue-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                        Empresa
                      </p>

                      <h3 className="mt-2 text-2xl font-black text-slate-950">
                        {companyName || "Sin empresa definida"}
                      </h3>

                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                        {city || countryLabel
                          ? `${city ? `${city}, ` : ""}${countryLabel}`
                          : "Ubicación no definida"}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl border border-blue-200 bg-white px-4 py-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Sector activo
                        </p>

                        <p className="mt-2 text-sm font-black text-slate-950">
                          {getBusinessTypeLabel(businessType)}
                        </p>

                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                          {getBusinessTypeDescription(businessType)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-blue-200 bg-white px-4 py-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Ejemplo dashboard
                        </p>

                        <p className="mt-2 text-sm font-black text-slate-950">
                          {getBusinessTypeExample(businessType)}
                        </p>

                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                          ClienteYA adapta las palabras al sector elegido.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          WhatsApp
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {whatsappNumber || "No definido"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Email
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {businessEmail || "No definido"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Tono
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {businessTone}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Prompt activo
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {aiPrompt}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                      North Star
                    </div>

                    <div className="space-y-3 text-sm font-semibold leading-6 text-slate-600">
                      <p>
                        ClienteYA debe sentirse construido para cada negocio.
                      </p>
                      <p>
                        WhatsApp, sector y empresa son la base de las próximas
                        acciones inteligentes.
                      </p>
                      <p>
                        Sector + relación + memoria = lenguaje correcto para el
                        founder.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileDashboardNav />
    </div>
  );
}