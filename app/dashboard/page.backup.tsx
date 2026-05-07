import { createAdminClient } from "../../lib/supabase/server";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppHeader } from "../components/AppHeader";
import SidebarNav from "./SidebarNav";
import { createWhatsAppUrl, defaultTemplates } from "../../lib/whatsapp";
import {
  getTemplate,
  renderTemplate,
} from "../../lib/get-whatsapp-template";
import {
  applySuggestionAction,
  type SuggestionActionType,
} from "../../lib/action-engine";
import { runAutoActionsForUser } from "../../lib/auto-actions";
import { getAccessState } from "../../lib/access-control";
import AutomationAlerts from "./AutomationAlerts";
import TopReminders from "./TopReminders";
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
  created_at: string;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  payment_proof_url: string | null;
  payment_notes: string | null;
  created_at: string | null;
};

type Suggestion = {
  cliente: Cliente;
  score: number;
  title: string;
  description: string;
  actionLabel: string;
  actionType: SuggestionActionType;
  tone: "red" | "amber" | "sky" | "slate";
};

function hoy() {
  return new Date().toISOString().split("T")[0];
}

function manana() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES");
}

function formatGs(value: number) {
  return `Gs. ${value.toLocaleString("es-ES")}`;
}

function getBadgeClasses(estado: string) {
  if (estado === "Pagó" || estado === "pagado") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (estado === "Interesado" || estado === "interesado") {
    return "bg-amber-100 text-amber-700";
  }

  if (estado === "Entregado" || estado === "entregado") {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getPriorityBadge(
  cliente: Cliente,
  hoyDate: string,
  mananaDate: string
) {
  if (cliente.proximo_contacto && cliente.proximo_contacto < hoyDate) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Atrasado
      </span>
    );
  }

  if (cliente.proximo_contacto === hoyDate) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        Hoy
      </span>
    );
  }

  if (cliente.proximo_contacto === mananaDate) {
    return (
      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
        Mañana
      </span>
    );
  }

  return null;
}

async function getClienteWhatsAppMessage(cliente: Cliente, userId: string) {
  const today = hoy();

  let key: "nuevo" | "hoy" | "pendiente" | "proximo" | "postventa" = "nuevo";

  if (cliente.proximo_contacto && cliente.proximo_contacto < today) {
    key = "pendiente";
  } else if (cliente.proximo_contacto === today) {
    key = "hoy";
  } else if (cliente.proximo_contacto && cliente.proximo_contacto > today) {
    key = "proximo";
  } else if (
    cliente.estado === "Pagó" ||
    cliente.estado === "pagado" ||
    cliente.estado === "Entregado" ||
    cliente.estado === "entregado"
  ) {
    key = "postventa";
  }

  const savedTemplate = await getTemplate(userId, key);

  let fallback = "";

  if (key === "nuevo") {
    fallback = defaultTemplates.nuevo(cliente.nombre);
  } else if (key === "hoy") {
    fallback = defaultTemplates.hoy(cliente.nombre, cliente.recordatorio);
  } else if (key === "pendiente") {
    fallback = defaultTemplates.pendiente(cliente.nombre, cliente.recordatorio);
  } else if (key === "proximo") {
    fallback = defaultTemplates.proximo(
      cliente.nombre,
      cliente.proximo_contacto
    );
  } else {
    fallback = defaultTemplates.postventa(cliente.nombre);
  }

  const template = savedTemplate || fallback;

  return renderTemplate(template, {
    nombre: cliente.nombre,
    nota: cliente.recordatorio,
    fecha: cliente.proximo_contacto,
  });
}

function buildSuggestions(
  clientes: Cliente[],
  hoyDate: string,
  mananaDate: string
) {
  const suggestions: Suggestion[] = clientes.map((cliente) => {
    if (cliente.proximo_contacto && cliente.proximo_contacto < hoyDate) {
      return {
        cliente,
        score: 100,
        title: "Seguimiento atrasado",
        description:
          "Este cliente ya pasó su fecha de contacto y requiere atención inmediata.",
        actionLabel: "Contactar ahora",
        actionType: "contactado",
        tone: "red",
      };
    }

    if (cliente.proximo_contacto === hoyDate) {
      return {
        cliente,
        score: 90,
        title: "Seguimiento para hoy",
        description:
          "Este cliente está programado para hoy. Conviene cerrar el contacto hoy mismo.",
        actionLabel: "Marcar listo",
        actionType: "listo",
        tone: "amber",
      };
    }

    if (cliente.proximo_contacto === mananaDate) {
      return {
        cliente,
        score: 75,
        title: "Preparar contacto de mañana",
        description:
          "Puedes adelantar el mensaje o dejar preparado el siguiente paso.",
        actionLabel: "Agendar siguiente",
        actionType: "schedule",
        tone: "sky",
      };
    }

    if (
      (cliente.estado === "Interesado" || cliente.estado === "interesado") &&
      !cliente.proximo_contacto
    ) {
      return {
        cliente,
        score: 70,
        title: "Interesado sin próxima fecha",
        description:
          "Este cliente mostró interés, pero no tiene seguimiento agendado.",
        actionLabel: "Agendar siguiente",
        actionType: "schedule",
        tone: "amber",
      };
    }

    if (
      (cliente.estado === "Nuevo" || cliente.estado === "nuevo") &&
      !cliente.proximo_contacto
    ) {
      return {
        cliente,
        score: 60,
        title: "Nuevo sin seguimiento",
        description:
          "Conviene enviar un primer mensaje para no perder el contacto.",
        actionLabel: "Agendar siguiente",
        actionType: "schedule",
        tone: "slate",
      };
    }

    return {
      cliente,
      score: 10,
      title: "Cliente estable",
      description: "No requiere acción inmediata.",
      actionLabel: "Ver detalle",
      actionType: "schedule",
      tone: "slate",
    };
  });

  return suggestions
    .filter((s) => s.score >= 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function FeedbackBanner({ ok }: { ok?: string }) {
  if (!ok) return null;

  const messages: Record<string, string> = {
    contactado: "Cliente actualizado como contactado.",
    listo: "Cliente marcado como listo.",
    pagado: "Pago registrado correctamente.",
    agendado: "Siguiente acción agendada correctamente.",
  };

  const text = messages[ok] || "Cambios guardados correctamente.";

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      ✅ {text}
    </div>
  );
}

function WelcomeChecklist({
  totalClientes,
  totalPaidClients,
  hasAccess,
}: {
  totalClientes: number;
  totalPaidClients: number;
  hasAccess: boolean;
}) {
  const hasClient = totalClientes > 0;
  const hasPayment = totalPaidClients > 0;

  let step2Label = "Pendiente";
  let step2Classes = "bg-slate-200 text-slate-700";

  if (hasAccess && hasClient) {
    step2Label = "Listo para usar";
    step2Classes = "bg-blue-100 text-blue-700";
  } else if (hasAccess && !hasClient) {
    step2Label = "Pendiente";
    step2Classes = "bg-slate-200 text-slate-700";
  } else {
    step2Label = "Bloqueado";
    step2Classes = "bg-slate-200 text-slate-700";
  }

  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Primeros pasos
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Sigue estos pasos para activar tu flujo de ventas y empezar a usar ClienteYA con claridad.
          </p>
        </div>

        <a
          href="/dashboard/nuevo"
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Crear cliente
        </a>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-900">
              1. Agrega tu primer cliente
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                hasClient
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {hasClient ? "Hecho" : "Pendiente"}
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Crea un cliente con nombre, teléfono y una próxima fecha de contacto.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-900">
              2. Envía seguimiento por WhatsApp
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${step2Classes}`}>
              {step2Label}
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Usa las sugerencias automáticas para saber a quién contactar primero.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-900">
              3. Registra un pago
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                hasPayment
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {hasPayment ? "Hecho" : "Pendiente"}
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Cuando cierres una venta, marca el pago para empezar a medir ingresos.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyStateHero() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-3xl shadow-sm">
          🚀
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Bienvenido a ClienteYA
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          Tu sistema ya está listo. Ahora solo falta cargar tu primer cliente para empezar a usar seguimiento, WhatsApp y pagos desde un mismo lugar.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/dashboard/nuevo"
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Crear primer cliente
          </a>

          <a
            href="/billing"
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Ver billing
          </a>
        </div>
      </div>
    </div>
  );
}

function TrialInfoCard({ trialEndsAt }: { trialEndsAt: string | null }) {
  return (
    <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-amber-900">
        Tu período de prueba
      </h2>
      <p className="mt-2 text-sm leading-6 text-amber-800">
        Estás probando ClienteYA. Usa estos días para cargar clientes, probar WhatsApp y registrar tu primer pago.
      </p>
      <p className="mt-3 text-sm font-semibold text-amber-900">
        Trial hasta: {formatDate(trialEndsAt)}
      </p>
    </div>
  );
}

function PendingReviewCard() {
  return (
    <div className="mb-6 rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-sky-900">
        Pago en revisión
      </h2>
      <p className="mt-2 text-sm leading-6 text-sky-800">
        Tu comprobante fue enviado correctamente. En cuanto se revise, tu cuenta pasará a activa.
      </p>
      <div className="mt-4">
        <a
          href="/billing"
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Ver billing
        </a>
      </div>
    </div>
  );
}

function ExpiredTrialCard() {
  return (
    <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-red-900">
        Tu trial terminó
      </h2>
      <p className="mt-2 text-sm leading-6 text-red-800">
        Para seguir usando el dashboard completo, activa tu plan desde billing y sube tu comprobante de pago.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href="/billing"
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Ir a billing
        </a>
        <a
          href="/dashboard/settings"
          className="rounded-2xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
        >
          Ver settings
        </a>
      </div>
    </div>
  );
}

function BlockedAccessCard() {
  return (
    <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
      <h2 className="text-2xl font-bold text-red-700">Acceso pausado</h2>
      <p className="mt-2 text-sm text-red-600">
        Tu plan no está activo. Activa tu cuenta desde billing para seguir usando el dashboard completo.
      </p>
      <a
        href="/billing"
        className="mt-4 inline-block rounded-2xl bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
      >
        Ir a billing
      </a>
    </div>
  );
}

function EmptySuggestionsCard() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl shadow-sm">
        ✨
      </div>

      <h3 className="text-lg font-semibold text-slate-900">
        No hay sugerencias por ahora
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Eso es una buena señal. Tus clientes no tienen alertas urgentes y tu flujo está al día.
      </p>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  whatsappUrl,
  onApplyAction,
}: {
  suggestion: Suggestion;
  whatsappUrl: string;
  onApplyAction: (formData: FormData) => Promise<void>;
}) {
  const toneClasses = {
    red: "border-red-200 bg-red-50",
    amber: "border-amber-200 bg-amber-50",
    sky: "border-sky-200 bg-sky-50",
    slate: "border-slate-200 bg-slate-50",
  };

  const badgeClasses = {
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClasses[suggestion.tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">
            {suggestion.cliente.nombre}
          </p>
          <p className="mt-1 text-sm text-slate-600">{suggestion.title}</p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses[suggestion.tone]}`}
        >
          {suggestion.score}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {suggestion.description}
      </p>

      <div className="mt-3 space-y-1 text-xs text-slate-500">
        <p>
          <span className="font-medium">Estado:</span>{" "}
          {suggestion.cliente.estado}
        </p>
        <p>
          <span className="font-medium">Próximo contacto:</span>{" "}
          {suggestion.cliente.proximo_contacto || "—"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
        >
          WhatsApp
        </a>

        <form action={onApplyAction}>
          <input type="hidden" name="id" value={suggestion.cliente.id} />
          <input
            type="hidden"
            name="actionType"
            value={suggestion.actionType}
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
          >
            {suggestion.actionLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "amber" | "emerald" | "red" | "sky";
}) {
  const toneClasses = {
    slate: "border-slate-200 bg-white text-slate-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    red: "border-red-200 bg-red-50 text-red-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
  };

  const labelClasses = {
    slate: "text-slate-500",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    red: "text-red-700",
    sky: "text-sky-700",
  };

  return (
    <div
      className={`min-h-[124px] rounded-3xl border p-5 shadow-sm ${toneClasses[tone]}`}
    >
      <p className={`text-sm font-medium ${labelClasses[tone]}`}>{label}</p>
      <div className="mt-5 flex items-end justify-between">
        <p className="text-4xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;

  const authSupabase = await createAuthServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await runAutoActionsForUser(user.id);

  async function marcarContactado(formData: FormData) {
    "use server";

    const authSupabase = await createAuthServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const id = String(formData.get("id") || "");
    if (!id) {
      redirect("/dashboard");
    }

    await applySuggestionAction({
      userId: user.id,
      clienteId: id,
      actionType: "contactado",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendario");
    revalidatePath("/dashboard/clientes");
    redirect("/dashboard?ok=contactado");
  }

  async function marcarListo(formData: FormData) {
    "use server";

    const authSupabase = await createAuthServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const id = String(formData.get("id") || "");
    if (!id) {
      redirect("/dashboard");
    }

    await applySuggestionAction({
      userId: user.id,
      clienteId: id,
      actionType: "listo",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendario");
    revalidatePath("/dashboard/clientes");
    redirect("/dashboard?ok=listo");
  }

  async function marcarPagado(formData: FormData) {
    "use server";

    const authSupabase = await createAuthServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const id = String(formData.get("id") || "");
    if (!id) {
      redirect("/dashboard");
    }

    const admin = createAdminClient();

    await admin
      .from("clientes")
      .update({
        estado: "Pagó",
        pagado: true,
        monto: 50000,
        fecha_pago: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendario");
    revalidatePath("/dashboard/clientes");
    redirect("/dashboard?ok=pagado");
  }

  async function aplicarSugerencia(formData: FormData) {
    "use server";

    const authSupabase = await createAuthServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const id = String(formData.get("id") || "");
    const actionType = String(formData.get("actionType") || "") as SuggestionActionType;

    if (!id) {
      redirect("/dashboard");
    }

    await applySuggestionAction({
      userId: user.id,
      clienteId: id,
      actionType,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendario");
    revalidatePath("/dashboard/clientes");

    if (actionType === "contactado") {
      redirect("/dashboard?ok=contactado");
    }

    if (actionType === "listo") {
      redirect("/dashboard?ok=listo");
    }

    redirect("/dashboard?ok=agendado");
  }

  const admin = createAdminClient();

  const [{ data: profileData }, { data: clientesData }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin
      .from("clientes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const profile = (profileData || null) as Profile | null;
  const clientes: Cliente[] = clientesData || [];
  const clientesMap = new Map(
    clientes.map((cliente) => [cliente.id, cliente])
  );

  const access = getAccessState({
    subscription_status: profile?.subscription_status || null,
    trial_ends_at: profile?.trial_ends_at || null,
  });

  const hoyDate = hoy();
  const mananaDate = manana();

  const atrasados = clientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto < hoyDate
  );

  const hoyClientes = clientes.filter((c) => c.proximo_contacto === hoyDate);
  const mananaClientes = clientes.filter(
    (c) => c.proximo_contacto === mananaDate
  );
  const proximosClientes = clientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto > hoyDate
  );

  const nuevos = clientes.filter(
    (c) => c.estado === "Nuevo" || c.estado === "nuevo"
  );
  const interesados = clientes.filter(
    (c) => c.estado === "Interesado" || c.estado === "interesado"
  );
  const pagados = clientes.filter(
    (c) => c.estado === "Pagó" || c.estado === "pagado" || c.pagado === true
  );
  const entregados = clientes.filter(
    (c) => c.estado === "Entregado" || c.estado === "entregado"
  );

  const conversionRate =
    clientes.length > 0
      ? Math.round((pagados.length / clientes.length) * 100)
      : 0;

  const totalRevenue = clientes.reduce((sum, c) => {
    if (c.pagado || c.estado === "Pagó" || c.estado === "pagado") {
      return sum + Number(c.monto || 0);
    }
    return sum;
  }, 0);

  const totalPaidClients = clientes.filter(
    (c) => c.pagado || c.estado === "Pagó" || c.estado === "pagado"
  ).length;

  const whatsappMessages = await Promise.all(
    clientes.map(async (cliente) => ({
      id: cliente.id,
      message: await getClienteWhatsAppMessage(cliente, user.id),
    }))
  );

  const whatsappMap = new Map(
    whatsappMessages.map((item) => [item.id, item.message])
  );

  const suggestions = buildSuggestions(clientes, hoyDate, mananaDate);

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-6 py-10">
            <div className="mx-auto max-w-7xl">
              <FeedbackBanner ok={ok} />

              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      <span className="text-sm">🇵🇾</span>
                      Paraguay
                    </span>
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                    Dashboard
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="/dashboard/nuevo"
                    className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    + Nuevo cliente
                  </a>

                  <a
                    href="/billing"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Activar plan
                  </a>
                </div>
              </div>

              {access.accessState === "trial" && (
                <TrialInfoCard trialEndsAt={profile?.trial_ends_at || null} />
              )}

              {access.accessState === "pending" && <PendingReviewCard />}

              {access.accessState === "expired" && <ExpiredTrialCard />}

              {access.accessState === "blocked" && <BlockedAccessCard />}

              {access.hasAccess && clientes.length === 0 && (
                <>
                  <EmptyStateHero />
                  <div className="mt-6">
                    <WelcomeChecklist
                      totalClientes={clientes.length}
                      totalPaidClients={totalPaidClients}
                      hasAccess={access.hasAccess}
                    />
                  </div>
                </>
              )}

              {access.hasAccess && clientes.length > 0 && (
               
                <WelcomeChecklist
                  totalClientes={clientes.length}
                  totalPaidClients={totalPaidClients}
                  hasAccess={access.hasAccess}
                />
              )}

              {access.hasAccess && clientes.length > 0 && (
                <>
                <AutomationAlerts clientes={clientes} />
                <TopReminders clientes={clientes} onQuickAction={aplicarSugerencia} />

                  <div className="mb-6 space-y-3">
                    {access.accessState === "active" && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        ✅ Tu cuenta está activa.
                      </div>
                    )}

                    {access.accessState === "trial" && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        🟠 Estás usando el período de prueba.
                      </div>
                    )}

                    {atrasados.length === 0 &&
                      hoyClientes.length === 0 &&
                      mananaClientes.length === 0 && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                          ✅ Todo al día. No tienes alertas pendientes.
                        </div>
                      )}

                    {atrasados.length > 0 && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        🔴 Tienes {atrasados.length} cliente(s) atrasado(s).
                      </div>
                    )}

                    {hoyClientes.length > 0 && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        🟠 Tienes {hoyClientes.length} contacto(s) para hoy.
                      </div>
                    )}

                    {mananaClientes.length > 0 && (
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                        🔵 Tienes {mananaClientes.length} contacto(s) programado(s) para mañana.
                      </div>
                    )}
                  </div>

                  <div className="mb-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-slate-500">
                        Ingresos acumulados
                      </p>
                      <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
                        {formatGs(totalRevenue)}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-slate-500">
                        Clientes que pagaron
                      </p>
                      <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
                        {totalPaidClients}
                      </p>
                    </div>
                  </div>

                  <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <StatCard label="Clientes" value={clientes.length} tone="slate" />
                    <StatCard label="Nuevos" value={nuevos.length} tone="slate" />
                    <StatCard label="Interesados" value={interesados.length} tone="amber" />
                    <StatCard label="Pagados" value={pagados.length} tone="emerald" />
                    <StatCard label="Atrasados" value={atrasados.length} tone="red" />
                    <StatCard label="Conversión" value={`${conversionRate}%`} tone="sky" />
                  </div>

                  <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Sugerencias automáticas
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          ClienteYA prioriza qué cliente conviene mover primero.
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {suggestions.length} sugerencia(s)
                      </span>
                    </div>

                    {suggestions.length === 0 ? (
                      <EmptySuggestionsCard />
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {suggestions.map((suggestion) => (
                          <SuggestionCard
                            key={suggestion.cliente.id}
                            suggestion={suggestion}
                            whatsappUrl={createWhatsAppUrl(
                              suggestion.cliente.telefono,
                              whatsappMap.get(suggestion.cliente.id) || ""
                            )}
                            onApplyAction={aplicarSugerencia}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-slate-900">
                          Clientes
                        </h2>

                        <a
                          href="/dashboard/nuevo"
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Agregar cliente
                        </a>
                      </div>

                      {clientes.map((cliente) => (
                        <div
                          key={cliente.id}
                          className="border-b border-slate-200 py-4 last:border-b-0"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold text-slate-900">
                                  {cliente.nombre}
                                </p>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClasses(
                                    cliente.estado
                                  )}`}
                                >
                                  {cliente.estado}
                                </span>

                                {getPriorityBadge(cliente, hoyDate, mananaDate)}

                                {(cliente.pagado ||
                                  cliente.estado === "Pagó" ||
                                  cliente.estado === "pagado") && (
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {formatGs(Number(cliente.monto || 0))}
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-sm text-slate-500">
                                {cliente.telefono}
                              </p>

                              <div className="mt-3 space-y-1 text-sm text-slate-600">
                                <p>
                                  <span className="font-medium">Notas:</span>{" "}
                                  {cliente.notas || "—"}
                                </p>
                                <p>
                                  <span className="font-medium">Recordatorio:</span>{" "}
                                  {cliente.recordatorio || "—"}
                                </p>
                                <p>
                                  <span className="font-medium">Próximo contacto:</span>{" "}
                                   {clientesMap.get(suggestion.cliente_id)?.proximo_contacto || "—"}
                                </p>
                                <p>
                                  <span className="font-medium">Último pago:</span>{" "}
                                  {formatDate(cliente.fecha_pago)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <a
                                href={`/dashboard/editar?id=${cliente.id}`}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                Editar
                              </a>

                              <a
                                href={createWhatsAppUrl(
                                  cliente.telefono,
                                  whatsappMap.get(cliente.id) || ""
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                              >
                                WhatsApp
                              </a>

                              <form action={marcarPagado}>
                                <input type="hidden" name="id" value={cliente.id} />
                                <button
                                  type="submit"
                                  className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-800"
                                >
                                  💰 Marcar pagado
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-slate-900">
                            Atrasados
                          </h2>
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            {atrasados.length}
                          </span>
                        </div>

                        {atrasados.length === 0 && (
                          <p className="text-sm text-slate-500">
                            No tienes seguimientos atrasados.
                          </p>
                        )}

                        <div className="space-y-4">
                          {atrasados.slice(0, 5).map((c) => (
                            <div
                              key={c.id}
                              className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4"
                            >
                              <p className="font-semibold text-slate-900">
                                {c.nombre}
                              </p>
                              <p className="mt-1 text-xs text-red-700">
                                {c.proximo_contacto || "—"}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                {c.recordatorio || "Sin recordatorio"}
                              </p>

                              <div className="mt-3 flex gap-2">
                                <a
                                  href={createWhatsAppUrl(
                                    c.telefono,
                                    whatsappMap.get(c.id) || ""
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                                >
                                  WhatsApp
                                </a>

                                <form action={marcarContactado}>
                                  <input type="hidden" name="id" value={c.id} />
                                  <button
                                    type="submit"
                                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                                  >
                                    ✔ Contactado
                                  </button>
                                </form>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-slate-900">
                            Hoy
                          </h2>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            {hoyClientes.length}
                          </span>
                        </div>

                        {hoyClientes.length === 0 && (
                          <p className="text-sm text-slate-500">
                            No tienes seguimientos hoy.
                          </p>
                        )}

                        <div className="space-y-4">
                          {hoyClientes.map((c) => (
                            <div
                              key={c.id}
                              className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4"
                            >
                              <p className="font-semibold text-slate-900">
                                {c.nombre}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                {c.recordatorio || "Sin nota"}
                              </p>

                              <div className="mt-3 flex gap-2">
                                <a
                                  href={createWhatsAppUrl(
                                    c.telefono,
                                    whatsappMap.get(c.id) || ""
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                                >
                                  WhatsApp
                                </a>

                                <form action={marcarListo}>
                                  <input type="hidden" name="id" value={c.id} />
                                  <button
                                    type="submit"
                                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                                  >
                                    ✔ Listo
                                  </button>
                                </form>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-slate-900">
                            Próximos contactos
                          </h2>
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            {proximosClientes.length}
                          </span>
                        </div>

                        {proximosClientes.length === 0 && (
                          <p className="text-sm text-slate-500">
                            No hay próximos contactos.
                          </p>
                        )}

                        <div className="space-y-4">
                          {proximosClientes.slice(0, 5).map((c) => (
                            <div
                              key={c.id}
                              className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4"
                            >
                              <p className="font-semibold text-slate-900">
                                {c.nombre}
                              </p>
                              <p className="mt-1 text-xs text-sky-700">
                                {c.proximo_contacto || "—"}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                {c.recordatorio || "Sin recordatorio"}
                              </p>

                              <a
                                href={createWhatsAppUrl(
                                  c.telefono,
                                  whatsappMap.get(c.id) || ""
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-block rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                              >
                                Preparar WhatsApp
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">
                          Estado del negocio
                        </h2>

                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Nuevos</span>
                            <span className="font-semibold text-slate-900">
                              {nuevos.length}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Interesados</span>
                            <span className="font-semibold text-slate-900">
                              {interesados.length}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Pagados</span>
                            <span className="font-semibold text-slate-900">
                              {pagados.length}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Entregados</span>
                            <span className="font-semibold text-slate-900">
                              {entregados.length}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <span className="text-slate-600">Ingresos</span>
                            <span className="font-semibold text-slate-900">
                              {formatGs(totalRevenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}