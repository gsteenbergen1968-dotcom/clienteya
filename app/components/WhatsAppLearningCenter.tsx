import {
  buildWhatsAppLearningStats,
  getBestPerformingPattern,
  getWorstPerformingPattern,
  type WhatsAppLearningEvent,
} from "../../lib/whatsapp-learning-engine";

type WhatsAppLearningCenterProps = {
  events: WhatsAppLearningEvent[];
};

function getSuccessTone(successRate: number) {
  if (successRate >= 70) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (successRate >= 45) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-red-200 bg-red-50 text-red-800";
}

function getPatternLabel(patternId: string | null | undefined) {
  if (!patternId) return "Sin datos suficientes";
  if (patternId === "third-delay") return "Tercer aplazamiento";
  if (patternId === "interest-no-response") return "Interés sin respuesta";
  if (patternId === "conversation-no-progress") return "Conversación sin avance";
  if (patternId === "hot-client") return "Relación caliente";
  if (patternId === "converted-client") return "Relación convertida";

  return patternId;
}

export default function WhatsAppLearningCenter({
  events,
}: WhatsAppLearningCenterProps) {
  const stats = buildWhatsAppLearningStats(events);
  const bestPattern = getBestPerformingPattern(events);
  const worstPattern = getWorstPerformingPattern(events);

  return (
    <section>
      <div>
        <div>
          <div>V18.2 Aprendizaje Comercial</div>

          <span className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
            Memory → Action → Learning
          </span>
        </div>

        <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Lo que ClienteYA está aprendiendo
        </h2>

        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          ClienteYA mide qué acciones comerciales funcionan mejor para
          mejorar las próximas recomendaciones.
        </p>
      </div>

      <div
        className={`rounded-3xl border px-5 py-4 text-right shadow-sm ${getSuccessTone(
          stats.successRate
        )}`}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
          Éxito
        </p>

        <p className="mt-1 text-3xl font-black">{stats.successRate}%</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Acciones
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {stats.totalActions}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
            Positivas
          </p>

          <p className="mt-2 text-2xl font-black text-emerald-900">
            {stats.successfulActions}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
            Pendientes
          </p>

          <p className="mt-2 text-2xl font-black text-amber-900">
            {stats.pendingActions}
          </p>
        </div>

        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
            Sin respuesta
          </p>

          <p className="mt-2 text-2xl font-black text-orange-900">
            {stats.noResponseActions}
          </p>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">
            Perdidas
          </p>

          <p className="mt-2 text-2xl font-black text-red-900">
            {stats.lostActions}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
            Mejor patrón
          </p>

          <h3 className="mt-3 text-xl font-black text-emerald-950">
            {getPatternLabel(bestPattern?.patternId)}
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">
            {bestPattern
              ? `${bestPattern.successRate}% de éxito basado en ${bestPattern.total} acción(es).`
              : "Todavía no hay suficientes acciones registradas."}
          </p>
        </div>

        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
            Patrón a mejorar
          </p>

          <h3 className="mt-3 text-xl font-black text-amber-950">
            {getPatternLabel(worstPattern?.patternId)}
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-amber-800">
            {worstPattern
              ? `${worstPattern.successRate}% de éxito basado en ${worstPattern.total} acción(es).`
              : "ClienteYA necesita más historial para aprender mejor."}
          </p>
        </div>
      </div>
    </section>
  );
}