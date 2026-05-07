import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type AssistantSettings = {
  user_id: string;
  business_type: string | null;
  business_tone: string | null;
  ai_prompt: string | null;
  brand_name: string | null;
  country_label: string | null;
  company_name: string | null;
  support_email: string | null;
};

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

  async function saveSettings(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const businessType = String(formData.get("business_type") || "").trim();
    const businessTone = String(formData.get("business_tone") || "").trim();
    const aiPrompt = String(formData.get("ai_prompt") || "").trim();
    const brandName = String(formData.get("brand_name") || "").trim();
    const countryLabel = String(formData.get("country_label") || "").trim();
    const companyName = String(formData.get("company_name") || "").trim();
    const supportEmail = String(formData.get("support_email") || "").trim();

    const admin = createAdminClient();

    const { error } = await admin.from("user_settings").upsert(
      {
        user_id: user.id,
        business_type: businessType || "ventas_generales",
        business_tone: businessTone || "cercano",
        ai_prompt:
          aiPrompt ||
          "Escribe mensajes claros, útiles y breves. Mantén un tono humano y orientado a convertir sin sonar agresivo.",
        brand_name: brandName || "ClienteYA",
        country_label: countryLabel || "Paraguay",
        company_name: companyName || "ClienteYA Paraguay",
        support_email: supportEmail || "soporte@clienteya.com",
      },
      { onConflict: "user_id" }
    );

    if (error) {
      redirect("/dashboard/settings?error=1");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/whatsapp");

    redirect("/dashboard/settings?ok=1");
  }

  const admin = createAdminClient();

  const { data } = await admin
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const settings = (data || null) as AssistantSettings | null;

  const businessType = settings?.business_type || "ventas_generales";
  const businessTone = settings?.business_tone || "cercano";
  const aiPrompt =
    settings?.ai_prompt ||
    "Escribe mensajes claros, útiles y breves. Mantén un tono humano y orientado a convertir sin sonar agresivo.";
  const brandName = settings?.brand_name || "ClienteYA";
  const countryLabel = settings?.country_label || "Paraguay";
  const companyName = settings?.company_name || "ClienteYA Paraguay";
  const supportEmail = settings?.support_email || "soporte@clienteya.com";

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-6 py-10">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                      <ParaguayBadge />
                      Paraguay
                    </span>
                  </div>

                  <h1 className="text-5xl font-bold tracking-tight text-slate-950">
                    Settings
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    Ajusta marca, tono y prompt del asistente para que ClienteYA
                    escriba mensajes más claros y más alineados con tu negocio.
                  </p>
                </div>
              </div>

              {ok === "1" && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
                  ✅ Configuración guardada correctamente.
                </div>
              )}

              {error === "1" && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
                  ⚠️ No pudimos guardar la configuración.
                </div>
              )}

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <form
                    action={saveSettings}
                    className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-5">
                      <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        Asistente WhatsApp
                      </div>
                      <h2 className="text-2xl font-semibold text-slate-900">
                        Configuración principal
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Define el tipo de negocio, el tono y la instrucción base
                        del asistente.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Tipo de negocio
                        </label>
                        <select
                          name="business_type"
                          defaultValue={businessType}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        >
                          <option value="ventas_generales">
                            Ventas generales
                          </option>
                          <option value="inmobiliaria">Inmobiliaria</option>
                          <option value="automotor">Automotor</option>
                          <option value="servicios">Servicios</option>
                          <option value="salud_belleza">Salud y belleza</option>
                          <option value="educacion">Educación</option>
                          <option value="gastronomia">Gastronomía</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Tono del mensaje
                        </label>
                        <select
                          name="business_tone"
                          defaultValue={businessTone}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        >
                          <option value="cercano">Cercano</option>
                          <option value="formal">Formal</option>
                          <option value="vendedor">Vendedor</option>
                          <option value="directo">Directo</option>
                          <option value="amable">Amable</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Prompt personalizado
                      </label>
                      <textarea
                        name="ai_prompt"
                        rows={6}
                        defaultValue={aiPrompt}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Puedes indicar cosas como: “más breve”, “sin emojis”,
                        “más vendedor”, “más humano” o “más directo”.
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        Guardar asistente
                      </button>
                    </div>
                  </form>

                  <form
                    action={saveSettings}
                    className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-5">
                      <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        Marca
                      </div>
                      <h2 className="text-2xl font-semibold text-slate-900">
                        Identidad y soporte
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Personaliza cómo se presenta tu marca dentro del sistema
                        y en la ayuda al usuario.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Nombre de la app
                        </label>
                        <input
                          type="text"
                          name="brand_name"
                          defaultValue={brandName}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          País principal
                        </label>
                        <input
                          type="text"
                          name="country_label"
                          defaultValue={countryLabel}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Empresa
                        </label>
                        <input
                          type="text"
                          name="company_name"
                          defaultValue={companyName}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Email de soporte
                        </label>
                        <input
                          type="email"
                          name="support_email"
                          defaultValue={supportEmail}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        Guardar marca
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      Vista actual del asistente
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Negocio
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {businessType}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Tono
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {businessTone}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Prompt activo
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {aiPrompt}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
                        <p className="text-sm font-semibold text-sky-900">
                          Asistente listo
                        </p>
                        <p className="mt-1 text-sm leading-6 text-sky-800">
                          ClienteYA usará esta configuración para mensajes y sugerencias.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      Marca actual
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Nombre
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {brandName}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          País
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {countryLabel}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Empresa
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {companyName}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Soporte
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {supportEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      Ideas de prompts
                    </div>

                    <div className="space-y-3 text-sm text-slate-600">
                      <p>• Escribe breve y sin emojis.</p>
                      <p>• Usa tono más vendedor y directo.</p>
                      <p>• Habla como una asesora inmobiliaria profesional.</p>
                      <p>• Mantén un estilo humano, amable y claro.</p>
                      <p>• Evita sonar insistente.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}