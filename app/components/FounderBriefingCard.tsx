import {
  buildFounderBriefing,
  type FounderBriefingClient,
  type FounderBriefingItem,
  type FounderBriefingTone,
  type PipelineRiskItem,
  type RevenueForecastItem,
} from "../../lib/founder-briefing";

function formatGs(value: number) {
  return `Gs. ${value.toLocaleString("es-ES")}`;
}

function toneClasses(tone: FounderBriefingTone) {
  if (tone === "critical") {
    return {
      shell: "border-red-200 bg-gradient-to-br from-white via-red-50/30 to-white",
      text: "text-red-700",
      badge: "border-red-200 bg-red-100 text-red-700",
      dot: "bg-red-500",
      soft: "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (tone === "warning") {
    return {
      shell:
        "border-amber-200 bg-gradient-to-br from-white via-amber-50/30 to-white",
      text: "text-amber-700",
      badge: "border-amber-200 bg-amber-100 text-amber-800",
      dot: "bg-amber-500",
      soft: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    shell:
      "border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-white",
    text: "text-emerald-700",
    badge: "border-emerald-200 bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

function sectionTone(tone: FounderBriefingTone) {
  if (tone === "critical") {
    return {
      border: "border-red-200",
      bg: "bg-red-50/40",
      text: "text-red-700",
      dot: "bg-red-500",
    };
  }

  if (tone === "warning") {
    return {
      border: "border-amber-200",
      bg: "bg-amber-50/40",
      text: "text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    border: "border-emerald-200",
    bg: "bg-emerald-50/40",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  };
}

function getMetricTone(value: string): FounderBriefingTone {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("alta") ||
    normalized.includes("elevado") ||
    normalized.includes("crítico") ||
    normalized.includes("critico")
  ) {
    return "critical";
  }

  if (
    normalized.includes("media") ||
    normalized.includes("débil") ||
    normalized.includes("debil") ||
    normalized.includes("baja")
  ) {
    return "warning";
  }

  return "good";
}

function todayLabel() {
  return new Intl.DateTimeFormat("es-PY", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(new Date());
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: FounderBriefingTone;
}) {
  const classes = sectionTone(tone);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-xs font-black ${classes.text}`}>{value}</p>
    </div>
  );
}

function SignalList({
  title,
  items,
  tone,
}: {
  title: string;
  items: FounderBriefingItem[];
  tone: FounderBriefingTone;
}) {
  const classes = sectionTone(tone);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className={`text-[10px] font-black uppercase tracking-[0.14em] ${classes.text}`}>
        {title}
      </h3>

      <div className="mt-3 space-y-2.5">
        {items.slice(0, 2).map((item) => {
          const itemTone = sectionTone(item.tone);

          return (
            <div key={item.id} className="flex gap-2.5">
              <span
                className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${itemTone.dot}`}
              />
              <div>
                <p className="text-xs font-black text-slate-950">
                  {item.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function forecastLabel(category: RevenueForecastItem["category"]) {
  if (category === "hot") return "Alta intención";
  if (category === "likely") return "Probable";
  if (category === "delayed") return "Retrasado";
  return "En riesgo";
}

function riskLabel(type: PipelineRiskItem["riskType"]) {
  if (type === "ghosting") return "Pérdida de contacto";
  if (type === "stalled") return "Detenida";
  if (type === "hot") return "Caliente";
  return "Ingreso";
}

function ForecastRow({ item }: { item: RevenueForecastItem }) {
  const classes = sectionTone(item.tone);

  return (
    <div className={`rounded-2xl border ${classes.border} bg-white px-3 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${classes.border} ${classes.bg} ${classes.text}`}
            >
              {forecastLabel(item.category)}
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black text-slate-600">
              {item.probability}%
            </span>
          </div>

          <p className="mt-2 truncate text-xs font-black text-slate-950">
            {item.clientName}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
            {item.title}
          </p>
        </div>

        <div className="flex-none text-right">
          <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">
            Esperado
          </p>
          <p className="text-xs font-black text-slate-950">
            {formatGs(item.expectedValue)}
          </p>
        </div>
      </div>
    </div>
  );
}

function RiskRow({ item }: { item: PipelineRiskItem }) {
  const classes = sectionTone(item.tone);

  return (
    <div className={`rounded-2xl border ${classes.border} bg-white px-3 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${classes.border} ${classes.bg} ${classes.text}`}
          >
            {riskLabel(item.riskType)}
          </span>

          <p className="mt-2 truncate text-xs font-black text-slate-950">
            {item.clientName}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
            {item.title}
          </p>
        </div>

        {typeof item.value === "number" && (
          <div className="flex-none text-right">
            <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">
              Valor
            </p>
            <p className="text-xs font-black text-slate-950">
              {formatGs(item.value)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCompactState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-500">
      {text}
    </div>
  );
}

export default function FounderBriefingCard({
  clients,
}: {
  clients: FounderBriefingClient[];
}) {
  const briefing = buildFounderBriefing(clients);
  const classes = toneClasses(briefing.tone);

  return (
    <section
      className={`mb-0 overflow-hidden rounded-3xl border ${classes.shell} shadow-sm`}
    >
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-start">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${classes.badge}`}
              >
                Briefing Founder IA
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                Compact V2
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[9px] font-bold text-slate-500">
                {todayLabel()}
              </span>
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              Inteligencia ejecutiva en tiempo real
            </p>

            <h2 className="mt-1.5 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              {briefing.headline}
            </h2>

            <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-700 sm:text-sm sm:leading-6">
              {briefing.summary}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl border bg-white p-3 shadow-sm ${classes.soft}`}>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                Puntaje
              </p>
              <p className={`mt-1 text-3xl font-black ${classes.text}`}>
                {briefing.score}
                <span className="ml-1 text-xs text-slate-500">/100</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                Estado
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${classes.dot}`} />
                <span className={`text-xs font-black ${classes.text}`}>
                  {briefing.statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 border-b border-slate-200 bg-white/70 px-4 py-3 sm:px-5 md:grid-cols-4 xl:grid-cols-7">
        <MetricPill
          label="Presión"
          value={briefing.operationalPressure}
          tone={getMetricTone(briefing.operationalPressure)}
        />

        <MetricPill
          label="Momentum"
          value={briefing.commercialMomentum}
          tone={getMetricTone(briefing.commercialMomentum)}
        />

        <MetricPill
          label="Ejecución"
          value={briefing.executionRisk}
          tone={getMetricTone(briefing.executionRisk)}
        />

        <MetricPill
          label="Riesgo"
          value={`${briefing.riskScore}/100`}
          tone={
            briefing.riskScore >= 65
              ? "critical"
              : briefing.riskScore >= 30
                ? "warning"
                : "good"
          }
        />

        <MetricPill
          label="Sin respuesta"
          value={briefing.ghostingRiskCount}
          tone={
            briefing.ghostingRiskCount >= 3
              ? "critical"
              : briefing.ghostingRiskCount >= 1
                ? "warning"
                : "good"
          }
        />

        <MetricPill
          label="Detenidas"
          value={briefing.stalledCount}
          tone={
            briefing.stalledCount >= 3
              ? "critical"
              : briefing.stalledCount >= 1
                ? "warning"
                : "good"
          }
        />

        <MetricPill
          label="Ingreso riesgo"
          value={formatGs(briefing.revenueAtRisk)}
          tone={
            briefing.revenueAtRisk >= 250000
              ? "critical"
              : briefing.revenueAtRisk > 0
                ? "warning"
                : "good"
          }
        />
      </div>

      <div className="grid gap-2 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5 md:grid-cols-4">
        <MetricPill
          label="Ingreso proyectado"
          value={formatGs(briefing.projectedRevenue)}
          tone={briefing.projectedRevenue > 0 ? "good" : "warning"}
        />

        <MetricPill
          label="Ingreso probable"
          value={formatGs(briefing.likelyRevenue)}
          tone={briefing.likelyRevenue > 0 ? "good" : "warning"}
        />

        <MetricPill
          label="Conversión prom."
          value={`${briefing.averageConversionProbability}%`}
          tone={
            briefing.averageConversionProbability >= 60
              ? "good"
              : briefing.averageConversionProbability >= 35
                ? "warning"
                : "critical"
          }
        />

        <MetricPill
          label="Confianza forecast"
          value={briefing.forecastConfidence}
          tone={getMetricTone(briefing.forecastConfidence)}
        />
      </div>

      <div className="grid gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
            Insight del día
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-700">
            {briefing.insight}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-3 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">
            Foco del founder
          </p>
          <p className="mt-2 text-sm font-black text-slate-950">
            {briefing.founderFocus}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Ejecuta primero acciones que protegen conversión, seguimiento y
            control comercial.
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-200 bg-slate-50/50 px-4 py-4 sm:px-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Forecast comercial
              </p>
              <h3 className="mt-0.5 text-sm font-black text-slate-950">
                Proyección
              </h3>
            </div>

            <span className="text-[9px] font-black uppercase tracking-wide text-slate-400">
              Top 3
            </span>
          </div>

          <div className="space-y-2">
            {briefing.revenueForecast.length === 0 ? (
              <EmptyCompactState text="Sin oportunidades suficientes para proyectar." />
            ) : (
              briefing.revenueForecast
                .slice(0, 3)
                .map((item) => <ForecastRow key={item.id} item={item} />)
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Riesgo del pipeline
              </p>
              <h3 className="mt-0.5 text-sm font-black text-slate-950">
                Señales comerciales
              </h3>
            </div>

            <span className="text-[9px] font-black uppercase tracking-wide text-slate-400">
              Top 3
            </span>
          </div>

          <div className="space-y-2">
            {briefing.pipelineRisks.length === 0 ? (
              <EmptyCompactState text="No se detectan riesgos comerciales críticos." />
            ) : (
              briefing.pipelineRisks
                .slice(0, 3)
                .map((item) => <RiskRow key={item.id} item={item} />)
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 bg-white px-4 py-4 sm:px-5 lg:grid-cols-4">
        <SignalList
          title="Prioridades"
          items={briefing.priorities}
          tone="warning"
        />

        <SignalList
          title="Oportunidades"
          items={briefing.opportunities}
          tone="good"
        />

        <SignalList title="Riesgos" items={briefing.risks} tone="critical" />

        <SignalList
          title="Recomendaciones"
          items={briefing.recommendations}
          tone="warning"
        />
      </div>
    </section>
  );
}