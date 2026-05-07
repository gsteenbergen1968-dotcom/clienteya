import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppHeader } from "../components/AppHeader";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { createAdminClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

function formatGs(value: number) {
  return `Gs. ${value.toLocaleString("es-ES")}`;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  async function submitTransfer(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const plan = String(formData.get("plan") || "pro");
    const amount = plan === "pro" ? 90000 : 50000;

    const admin = createAdminClient();

    await admin
      .from("profiles")
      .update({
        plan_type: plan,
        payment_amount: amount,
        payment_method: "transferencia",
        subscription_status: "pending_review",
        payment_notes: `Solicitud de activación ${plan.toUpperCase()} por transferencia: ${formatGs(
          amount
        )}`,
      })
      .eq("id", user.id);

    revalidatePath("/billing");
    revalidatePath("/dashboard");

    redirect("/billing?ok=1");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_status, plan_type, payment_amount, payment_notes")
    .eq("id", user.id)
    .maybeSingle();

  const currentPlan = profile?.plan_type || "basic";

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-slate-950">
              Activar plan
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Elige tu plan y activa ClienteYA mediante transferencia bancaria.
            </p>
          </div>

          {ok === "1" && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              ✅ Solicitud enviada. Revisaremos tu transferencia y activaremos tu cuenta.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                Básico
              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                {formatGs(50000)}
                <span className="text-sm font-medium text-slate-500"> / mes</span>
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Para empezar simple y mantener tus clientes ordenados.
              </p>

              <div className="mt-6 space-y-3 text-sm text-slate-700">
                <p>✅ CRM de clientes</p>
                <p>✅ Dashboard básico</p>
                <p>✅ WhatsApp manual</p>
                <p>✅ Seguimientos simples</p>
              </div>

              <form action={submitTransfer} className="mt-6">
                <input type="hidden" name="plan" value="basic" />
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Activar Básico
                </button>
              </form>
            </div>

            <div className="relative rounded-[30px] border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
              <div className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                Recomendado
              </div>

              <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                Pro
              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                {formatGs(90000)}
                <span className="text-sm font-medium text-slate-500"> / mes</span>
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Para vender más rápido con AI, prioridades y follow-ups automáticos.
              </p>

              <div className="mt-6 space-y-3 text-sm text-slate-800">
                <p>✅ Todo lo de Básico</p>
                <p>✅ AI WhatsApp assistant</p>
                <p>✅ Mensajes según estado del cliente</p>
                <p>✅ Auto follow-up</p>
                <p>✅ Automations y prioridades</p>
                <p>✅ AI aprende tu estilo</p>
              </div>

              <form action={submitTransfer} className="mt-6">
                <input type="hidden" name="plan" value="pro" />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Activar Pro
                </button>
              </form>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">
                Datos para transferencia
              </h2>

              <div className="mt-5 grid gap-4 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Banco / Billetera
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    Completar con tus datos
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Titular
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    ClienteYA Paraguay
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Concepto
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    ClienteYA + tu email
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-500">
                Después de transferir, presiona el botón del plan elegido. Revisaremos
                el pago y activaremos tu cuenta.
              </p>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">
                Estado actual
              </h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Plan
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {currentPlan.toUpperCase()}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Estado
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {profile?.subscription_status || "trial"}
                  </p>
                </div>

                {profile?.payment_amount && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Monto solicitado
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatGs(Number(profile.payment_amount))}
                    </p>
                  </div>
                )}
              </div>

              <a
                href="/dashboard"
                className="mt-6 inline-block rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Volver al dashboard
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}