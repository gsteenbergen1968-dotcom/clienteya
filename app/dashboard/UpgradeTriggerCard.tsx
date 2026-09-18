type Stats = {
  ai: number;
  contacted: number;
  followup: number;
  whatsapp: number;
};

export default function UpgradeTriggerCard({
  planType,
  subscriptionStatus,
  stats,
}: {
  planType?: string | null;
  subscriptionStatus?: string | null;
  stats: Stats;
}) {
  const isPro = planType === "pro" && subscriptionStatus === "active";
  const hasUsage = stats.ai > 0 || stats.whatsapp > 0 || stats.contacted > 0;

  if (isPro) {
    return (
      <div className="mb-6 rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-sm font-semibold text-emerald-800">
          ✅ Estás usando ClienteYA Pro
        </p>
        <p className="mt-2 text-sm leading-6 text-emerald-700">
          Esta semana generaste {stats.ai} mensajes AI y abriste{" "}
          {stats.whatsapp} conversaciones en WhatsApp.
        </p>
      </div>
    );
  }

  if (!hasUsage) {
    return (
      <div className="mb-6 rounded-[28px] border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-sm font-semibold text-blue-800">
          🚀 Prueba el poder de AI WhatsApp
        </p>
        <p className="mt-2 text-sm leading-6 text-blue-700">
          Genera tus primeros mensajes AI gratis. Cuando quieras automatizar sin
          límites, activa Pro.
        </p>
        <a
          href="/dashboard/billing"
          className="mt-4 inline-block rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Ver Pro
        </a>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-sm font-semibold text-amber-900">
        ⚡ Ya estás generando actividad comercial
      </p>
      <p className="mt-2 text-sm leading-6 text-amber-800">
        Esta semana: {stats.ai} mensajes AI, {stats.whatsapp} WhatsApp abiertos
        y {stats.contacted} relaciones trabajadas.
      </p>
      <p className="mt-2 text-sm leading-6 text-amber-800">
        Activa Pro para quitar límites y usar follow-ups automáticos completos.
      </p>
      <a
        href="/dashboard/billing"
        className="mt-4 inline-block rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        Activar Pro
      </a>
    </div>
  );
}