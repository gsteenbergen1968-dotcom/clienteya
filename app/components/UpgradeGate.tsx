import Link from "next/link";

type UpgradeGateProps = {
  title?: string;
  description?: string;
};

export default function UpgradeGate({
  title = "Función Premium",
  description = "Este módulo requiere un plan Pro o Enterprise para continuar.",
}: UpgradeGateProps) {
  return (
    <div className="rounded-[32px] border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm">
      <div className="max-w-2xl">
        <div className="inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-blue-700 shadow-sm">
          ClienteYA Pro
        </div>

        <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900">
          {title}
        </h2>

        <p className="mt-4 text-base leading-relaxed text-slate-600">
          {description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="rounded-full border border-white bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            AI Cockpit
          </div>

          <div className="rounded-full border border-white bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            Founder Briefing
          </div>

          <div className="rounded-full border border-white bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            Revenue Forecast
          </div>

          <div className="rounded-full border border-white bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            Smart Queue
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Ver planes y actualizar
          </Link>
        </div>
      </div>
    </div>
  );
}