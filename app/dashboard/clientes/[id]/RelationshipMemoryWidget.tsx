import {
  getWhatsAppMemoryEventLabel,
  getWhatsAppMemoryRiskLabel,
  type WhatsAppMemoryProfile,
} from "../../../../lib/whatsapp-memory";

import { detectWhatsAppPatterns } from "../../../../lib/whatsapp-patterns";

type RelationshipMemoryWidgetProps = {
  memory: WhatsAppMemoryProfile;
};

function getScoreLabel(score: number) {
  if (score >= 80) return "Relación fuerte";
  if (score >= 60) return "Relación estable";
  if (score >= 40) return "Relación con atención";
  return "Relación en riesgo";
}

function getScoreClasses(score: number) {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 60) return "border-sky-200 bg-sky-50 text-sky-800";
  if (score >= 40) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
}

function getRiskClasses(risk: string) {
  if (risk === "critical") return "border-red-200 bg-red-50 text-red-900";
  if (risk === "high") return "border-red-100 bg-red-50 text-red-800";
  if (risk === "medium") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function getRiskLabel(risk: string) {
  if (risk === "critical") return "Crítico";
  if (risk === "high") return "Alto";
  if (risk === "medium") return "Medio";
  return "Bajo";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export default function RelationshipMemoryWidget({
  memory,
}: RelationshipMemoryWidgetProps) {
  const patterns = detectWhatsAppPatterns(memory.timeline);
  const mainPattern = patterns[0];
  const mainInsight = memory.insights[0];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            V18 Memoria WhatsApp
          </p>

          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
            Memoria Comercial
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            ClienteYA convierte cada interacción en contexto y cada contexto en
            acción.
          </p>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-right ${getScoreClasses(
            memory.relationshipScore,
          )}`}
        >
          <p className="text-xs font-bold uppercase tracking-wide opacity-70">
            Puntuación
          </p>
          <p className="text-2xl font-black">{memory.relationshipScore}/100</p>
          <p className="text-xs font-bold">
            {getScoreLabel(memory.relationshipScore)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Interacciones
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {memory.totalInteractions}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Promesas
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {memory.promisesMade}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Seguimientos
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {memory.ignoredFollowups}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Silencio
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {memory.silenceDays}d
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            Patrones Detectados
          </h3>

          <p className="text-xs font-semibold text-slate-400">
            Nada se olvida
          </p>
        </div>

        {patterns.length > 0 ? (
          <div className="grid gap-3">
            {patterns.slice(0, 3).map((pattern) => (
              <div
                key={pattern.id}
                className={`rounded-2xl border p-4 ${getRiskClasses(
                  pattern.risk,
                )}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">
                      Riesgo {getRiskLabel(pattern.risk)}
                    </p>

                    <h3 className="mt-2 text-base font-black">
                      {pattern.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6">
                      {pattern.description}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black shadow-sm">
                    {pattern.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-500">
              Todavía no hay patrones suficientes para una alerta comercial.
            </p>
          </div>
        )}
      </div>

      {mainPattern ? (
        <div className={`mt-5 rounded-3xl border p-5 ${getRiskClasses(mainPattern.risk)}`}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            Análisis AI · Riesgo {getRiskLabel(mainPattern.risk)}
          </p>

          <h3 className="mt-2 text-lg font-black">{mainPattern.title}</h3>

          <p className="mt-2 text-sm leading-6">{mainPattern.description}</p>

          <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black shadow-sm">
            Acción: {mainPattern.action}
          </div>
        </div>
      ) : mainInsight ? (
        <div className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">
            Análisis AI · {getWhatsAppMemoryRiskLabel(mainInsight.riskLevel)}
          </p>

          <h3 className="mt-2 text-lg font-black text-red-950">
            {mainInsight.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-red-800">
            {mainInsight.description}
          </p>

          <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-red-800 shadow-sm">
            {mainInsight.actionLabel}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
            Análisis AI
          </p>

          <h3 className="mt-2 text-lg font-black text-emerald-950">
            Sin riesgo crítico detectado
          </h3>

          <p className="mt-2 text-sm leading-6 text-emerald-800">
            La relación no muestra señales fuertes de pérdida en este momento.
          </p>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            Línea de Relación
          </h3>

          <p className="text-xs font-semibold text-slate-400">
            Nada se olvida
          </p>
        </div>

        {memory.timeline.length > 0 ? (
          <div className="space-y-3">
            {memory.timeline.slice(0, 6).map((event) => (
              <div
                key={event.id}
                className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mt-1 h-3 w-3 rounded-full bg-slate-900" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-slate-950">
                      {getWhatsAppMemoryEventLabel(event.type)}
                    </p>

                    <p className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">
                      {formatDate(event.date)}
                    </p>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {event.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              Todavía no hay memoria suficiente para este cliente.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}