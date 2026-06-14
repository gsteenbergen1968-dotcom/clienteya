import {
  buildRevenueAnalytics,
  formatGuarani,
} from "../../../lib/revenue-analytics";

type Cliente = {
  id: string;
  nombre: string;
  estado?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  proximo_contacto?: string | null;
};

type FounderBriefingCardProps = {
  clientes: Cliente[];
};

function getCriticalClients(clientes: Cliente[]) {
  return clientes.filter((cliente) => {
    const estado = cliente.estado?.toLowerCase() || "";

    return (
      estado.includes("sin") ||
      estado.includes("cerr") ||
      estado.includes("riesgo")
    );
  });
}

function getHotLeads(clientes: Cliente[]) {
  return clientes.filter((cliente) => {
    const estado = cliente.estado?.toLowerCase() || "";

    return (
      estado.includes("interes") ||
      estado.includes("caliente") ||
      estado.includes("hot")
    );
  });
}

function getTodayFocus(
  criticalCount: number,
  hotLeadCount: number,
  expectedRevenue: number
) {
  if (criticalCount >= 3) {
    return {
      title: "Riesgo operativo detectado",
      description:
        "Existen múltiples clientes con señales de enfriamiento o seguimiento atrasado.",
      tone: "red",
    };
  }

  if (hotLeadCount >= 3) {
    return {
      title: "Momentum comercial positivo",
      description:
        "Hay oportunidades activas con intención alta de conversión.",
      tone: "emerald",
    };
  }

  if (expectedRevenue >= 500000) {
    return {
      title: "Pipeline fuerte esta semana",
      description:
        "La proyección comercial muestra potencial sólido de ingresos.",
      tone: "sky",
    };
  }

  return {
    title: "Operación estable",
    description:
      "El pipeline está balanceado. Mantener ritmo de seguimiento.",
    tone: "slate",
  };
}

function getToneClasses(tone: string) {
  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "sky") {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}

export default function FounderBriefingCard({
  clientes,
}: FounderBriefingCardProps) {
  const revenue = buildRevenueAnalytics(clientes);

  const criticalClients = getCriticalClients(clientes);
  const hotLeads = getHotLeads(clientes);

  const focus = getTodayFocus(
    criticalClients.length,
    hotLeads.length,
    revenue.expectedRevenue || 0
  );

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700">
            Founder Briefing
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Resumen ejecutivo del día
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            ClienteYA analizó pipeline, riesgo comercial, oportunidades activas
            y comportamiento de seguimiento para generar una vista ejecutiva
            rápida.
          </p>
        </div>

        <div
          className={`rounded-3xl border px-5 py-4 shadow-sm ${getToneClasses(
            focus.tone
          )}`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
            Estado operativo
          </p>

          <h3 className="mt-2 text-lg font-black">{focus.title}</h3>

          <p className="mt-2 max-w-xs text-sm leading-6 opacity-80">
            {focus.description}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Pipeline esperado
          </p>

          <p className="mt-3 whitespace-nowrap text-[1.85rem] font-black leading-tight tracking-tight text-emerald-700 sm:text-3xl xl:text-[1.75rem] 2xl:text-3xl">
            {formatGuarani(revenue.expectedRevenue || 0)}
          </p>
        </div>

        <div className="min-w-0 rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
            Riesgos detectados
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-red-700">
            {criticalClients.length}
          </p>
        </div>

        <div className="min-w-0 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
            Hot leads
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-emerald-700">
            {hotLeads.length}
          </p>
        </div>

        <div className="min-w-0 rounded-3xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-600">
            Clientes activos
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-sky-700">
            {clientes.length}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Recomendación AI
        </p>

        <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
          Prioriza seguimiento sobre adquisición nueva. Existen oportunidades
          activas dentro del pipeline actual que pueden convertirse más rápido
          que generar tráfico nuevo.
        </p>
      </div>
    </section>
  );
}