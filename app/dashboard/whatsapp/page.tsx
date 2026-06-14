import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { ui } from "../../../lib/ui";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";
import KpiCard from "../../components/KpiCard";
import SectionCard from "../../components/SectionCard";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";

import {
  buildClientMemory,
  getClientMemoryClasses,
  type ClientMemoryProfile,
} from "../../../lib/client-memory";

export const dynamic = "force-dynamic";

type Cliente = {
  id: string;
  user_id: string | null;
  nombre: string;
  telefono: string;
  estado: string;
  notas: string | null;
  recordatorio: string | null;
  proximo_contacto: string | null;
  created_at?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

type MessageVariant = {
  id: string;
  label: string;
  tone: string;
  title: string;
  message: string;
  reason: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function cleanPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function buildWhatsAppUrl(phone: string, message: string) {
  const clean = cleanPhone(phone);

  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

function daysBetween(date: string | null | undefined, today: string) {
  if (!date) return null;

  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);

  return Math.round(
    (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getClientPhase(cliente: Cliente, today: string) {
  const estado = cliente.estado.toLowerCase();
  const delta = daysBetween(cliente.proximo_contacto, today);

  if (cliente.pagado || estado.includes("pag")) {
    return {
      label: "Cliente pagado",
      tone: "emerald",
      description: "Ya convirtió. El mejor mensaje es de continuidad o recompra.",
    };
  }

  if (delta !== null && delta < 0) {
    return {
      label: "Follow-up vencido",
      tone: "red",
      description: "Este cliente necesita una reactivación simple y directa.",
    };
  }

  if (delta === 0) {
    return {
      label: "Seguimiento hoy",
      tone: "amber",
      description: "Buen momento para escribir con un mensaje corto.",
    };
  }

  if (estado.includes("interes")) {
    return {
      label: "Oportunidad",
      tone: "amber",
      description: "El cliente mostró interés. Conviene empujar el siguiente paso.",
    };
  }

  if (estado.includes("sin")) {
    return {
      label: "Sin respuesta",
      tone: "orange",
      description: "Necesita un mensaje suave para retomar conversación.",
    };
  }

  if (estado.includes("contact")) {
    return {
      label: "Contactado",
      tone: "sky",
      description: "Ya existe contacto previo. Mantener el ritmo.",
    };
  }

  return {
    label: "Nuevo lead",
    tone: "slate",
    description: "Cliente nuevo o sin suficiente información todavía.",
  };
}

function getPhaseClasses(tone: string) {
  if (tone === "red") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "orange") return "border-orange-200 bg-orange-50 text-orange-800";
  if (tone === "sky") return "border-sky-200 bg-sky-50 text-sky-800";

  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function buildMemoryMessage(cliente: Cliente, memory: ClientMemoryProfile) {
  const name = cliente.nombre;

  if (memory.recommendedTone === "post_sale") {
    return `Hola ${name} 👋

Quería agradecerte nuevamente y asegurarme de que todo esté bien.

Si necesitas algo más o quieres avanzar con el siguiente paso, estoy atento.`;
  }

  if (memory.recommendedTone === "soft") {
    return `Hola ${name} 👋

Espero que estés muy bien.

Solo quería retomar nuestra conversación con calma y ver si todavía tiene sentido avanzar.

Quedo atento 😊`;
  }

  if (memory.recommendedTone === "direct") {
    return `Hola ${name} 👋

Te escribo para confirmar si avanzamos con el siguiente paso.

Puedo ayudarte a dejarlo listo hoy si te parece bien.`;
  }

  return `Hola ${name} 👋

Te escribo para dar seguimiento y ver si podemos avanzar de forma simple con el siguiente paso.

¿Te parece bien que lo revisemos?`;
}

function buildVariants(
  cliente: Cliente,
  memory: ClientMemoryProfile
): MessageVariant[] {
  const best = buildMemoryMessage(cliente, memory);

  return [
    {
      id: "best",
      label: "Recomendado",
      tone:
        memory.recommendedTone === "soft"
          ? "Suave"
          : memory.recommendedTone === "direct"
          ? "Directo"
          : memory.recommendedTone === "post_sale"
          ? "Post-venta"
          : "Balanceado",
      title: "Mejor siguiente mensaje",
      message: best,
      reason: memory.nextBestStep,
    },
    {
      id: "soft",
      label: "Suave",
      tone: "Amable",
      title: "Mensaje menos directo",
      message: `Hola ${cliente.nombre} 👋

Espero que estés muy bien.

Solo quería retomar nuestra conversación con calma y ver si todavía tiene sentido avanzar.

Quedo atento 😊`,
      reason: "Útil cuando hay riesgo de ghosting o demasiados seguimientos.",
    },
    {
      id: "direct",
      label: "Directo",
      tone: "Comercial",
      title: "Mensaje más enfocado en acción",
      message: `Hola ${cliente.nombre} 👋

Te escribo para confirmar si avanzamos con el siguiente paso.

Puedo ayudarte a dejarlo listo hoy si te parece bien.`,
      reason: "Útil cuando el cliente está caliente y falta decisión.",
    },
  ];
}

function SuccessBanner({ ok }: { ok?: string }) {
  if (!ok) return null;

  const messages: Record<string, string> = {
    contactado: "Cliente marcado como contactado.",
    seguimiento: "Seguimiento programado correctamente.",
    cerrado: "Cliente cerrado correctamente.",
  };

  return (
    <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
      ✅ {messages[ok] || "Acción guardada correctamente."}
    </div>
  );
}

function VariantCard({
  variant,
  cliente,
  isPrimary = false,
}: {
  variant: MessageVariant;
  cliente: Cliente;
  isPrimary?: boolean;
}) {
  const whatsappUrl = buildWhatsAppUrl(cliente.telefono, variant.message);

  return (
    <div
      className={`min-w-0 rounded-[28px] border p-4 shadow-sm sm:p-5 ${
        isPrimary
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-4 flex flex-col gap-3">
        <div className="min-w-0">
          <div
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
              isPrimary
                ? "border-emerald-200 bg-white text-emerald-700"
                : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            {variant.label}
          </div>

          <h2 className="mt-3 break-words text-lg font-bold leading-tight text-slate-950 sm:text-xl">
            {variant.title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tono: {variant.tone}
          </p>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Abrir WhatsApp
        </a>
      </div>

      <div className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800">
        <p className="whitespace-pre-wrap break-words">{variant.message}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
        💡 {variant.reason}
      </div>
    </div>
  );
}

function ClientMemoryPanel({ memory }: { memory: ClientMemoryProfile }) {
  return (
    <div
      className={`rounded-[28px] border p-5 shadow-sm ${getClientMemoryClasses(
        memory
      )}`}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-current bg-white/60 px-3 py-1 text-xs font-semibold">
            AI Follow-up Memory
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            {memory.label}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6">
            {memory.summary}
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm font-semibold">
          Memory score: {memory.score}/100
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Riesgo
          </p>
          <p className="mt-2 text-sm font-medium leading-6">
            {memory.risk}
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Tono recomendado
          </p>
          <p className="mt-2 text-sm font-medium leading-6">
            {memory.recommendedTone}
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Próximo mejor paso
          </p>
          <p className="mt-2 text-sm font-medium leading-6">
            {memory.nextBestStep}
          </p>
        </div>
      </div>
    </div>
  );
}

function ClienteContextCard({
  cliente,
  phase,
  score,
  memory,
}: {
  cliente: Cliente;
  phase: ReturnType<typeof getClientPhase>;
  score: number;
  memory: ClientMemoryProfile;
}) {
  return (
    <SectionCard
      badge="Contexto"
      title={cliente.nombre}
      description={cliente.telefono || "Sin teléfono"}
      actions={
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPhaseClasses(
            phase.tone
          )}`}
        >
          {phase.label}
        </span>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Estado
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {cliente.estado}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Próximo contacto
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {formatDate(cliente.proximo_contacto)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            AI score
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {score}/100
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Memory
          </p>

          <p className="mt-1 line-clamp-2 font-semibold text-slate-900">
            {memory.label}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${getPhaseClasses(
          phase.tone
        )}`}
      >
        {phase.description}
      </div>
    </SectionCard>
  );
}

function ActionPanel({
  cliente,
  onContacted,
  onSchedule,
  onClose,
}: {
  cliente: Cliente;
  onContacted: (formData: FormData) => Promise<void>;
  onSchedule: (formData: FormData) => Promise<void>;
  onClose: (formData: FormData) => Promise<void>;
}) {
  return (
    <SectionCard
      badge="CRM"
      title="Después de enviar"
      description="Mantén el CRM limpio con una acción rápida."
    >
      <div className="grid gap-3">
        <form action={onContacted}>
          <input type="hidden" name="id" value={cliente.id} />

          <button
            type="submit"
            className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            Marcar contactado
          </button>
        </form>

        <form action={onSchedule}>
          <input type="hidden" name="id" value={cliente.id} />

          <button
            type="submit"
            className="w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            Seguimiento en 3 días
          </button>
        </form>

        <form action={onClose}>
          <input type="hidden" name="id" value={cliente.id} />

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            Cerrar como pagado
          </button>
        </form>
      </div>
    </SectionCard>
  );
}

export default async function WhatsAppPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; ok?: string }>;
}) {
  const { id, ok } = await searchParams;

  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!id) redirect("/dashboard/clientes");

  async function actionContacted(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const clienteId = String(formData.get("id") || "");

    if (!clienteId) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Contactado",
        recordatorio: "Contactado desde WhatsApp AI",
      })
      .eq("id", clienteId)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");
    revalidatePath("/dashboard/whatsapp");

    redirect(`/dashboard/whatsapp?id=${clienteId}&ok=contactado`);
  }

  async function actionSchedule(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const clienteId = String(formData.get("id") || "");

    if (!clienteId) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Sin respuesta",
        recordatorio: "Reintentar contacto en 3 días",
        proximo_contacto: addDaysISO(3),
      })
      .eq("id", clienteId)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");
    revalidatePath("/dashboard/whatsapp");

    redirect(`/dashboard/whatsapp?id=${clienteId}&ok=seguimiento`);
  }

  async function actionClose(formData: FormData) {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const clienteId = String(formData.get("id") || "");

    if (!clienteId) redirect("/dashboard/clientes");

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Pagó",
        pagado: true,
        monto: 50000,
        fecha_pago: new Date().toISOString(),
        recordatorio: "Cerrado como pagado desde WhatsApp AI",
      })
      .eq("id", clienteId)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/automations");
    revalidatePath("/dashboard/whatsapp");

    redirect(`/dashboard/whatsapp?id=${clienteId}&ok=cerrado`);
  }

  const admin = createAdminClient();

  const { data: clienteData } = await admin
    .from("clientes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!clienteData) redirect("/dashboard/clientes");

const cliente = clienteData as Cliente;
const today = todayISO();
const phase = getClientPhase(cliente, today);
const memory = buildClientMemory(cliente);
const score = memory.score;
const variants = buildVariants(cliente, memory);
const primary = variants[0];
const otherVariants = variants.slice(1);

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1500px]">
              <SuccessBanner ok={ok} />

              <PageHeader
                title="WhatsApp AI"
                description="Elige el mejor mensaje, abre WhatsApp y actualiza el CRM en un clic."
                badge="Message Intelligence"
                actionHref="/dashboard/clientes"
                actionLabel="Volver a clientes"
              />

              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard label="AI score" value={`${score}/100`} tone="sky" />
                  <KpiCard label="Memory" value={memory.label} tone="amber" />
                  <KpiCard
                    label="Próximo"
                    value={formatDate(cliente.proximo_contacto)}
                  />
                  <KpiCard label="Estado" value={cliente.estado} tone="emerald" />
                </div>

                <ClientMemoryPanel memory={memory} />

                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                  <div className="space-y-6">
                    <ClienteContextCard
                      cliente={cliente}
                      phase={phase}
                      score={score}
                      memory={memory}
                    />

                    <ActionPanel
                      cliente={cliente}
                      onContacted={actionContacted}
                      onSchedule={actionSchedule}
                      onClose={actionClose}
                    />
                  </div>

                  <div className="min-w-0 space-y-6">
                    <SectionCard
                      badge="Recomendado"
                      title="Mensaje principal"
                      description="ClienteYA recomienda este mensaje usando memoria comercial y contexto del cliente."
                    >
                      <VariantCard
                        variant={primary}
                        cliente={cliente}
                        isPrimary
                      />
                    </SectionCard>

                    <SectionCard
                      badge="Alternativas"
                      title="Otros tonos"
                      description="Elige un mensaje más suave o más directo según el contexto."
                    >
                      <div className="grid min-w-0 gap-5">
                        {otherVariants.map((variant) => (
                          <VariantCard
                            key={variant.id}
                            variant={variant}
                            cliente={cliente}
                          />
                        ))}
                      </div>
                    </SectionCard>
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