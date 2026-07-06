import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import {
  buildFounderBriefing,
  getAICockpitPriorityLabel,
  getAICockpitTypeLabel,
  type AICockpitInsight,
  type ClienteForAICockpit,
  type FounderDecision,
} from "../../../lib/ai-cockpit";

import {
  buildAICockpitRecommendations,
  getAICockpitRecommendationCategoryLabel,
  getAICockpitRecommendationPriorityLabel,
  type AICockpitRecommendation,
} from "../../../lib/ai-cockpit-recommendations";

import {
  getLeadTemperature,
  getLeadTemperatureClasses,
  type LeadTemperatureResult,
} from "../../../lib/lead-temperature";

import {
  buildPredictiveInsight,
  type PredictiveInsight,
} from "../../../lib/predictive-intelligence";


import {
  buildRevenueForecast,
  getRevenueForecastHealth,
  type RevenueForecast,
  type RevenueForecastOpportunity,
} from "../../../lib/revenue-forecast";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import MobileDashboardNav from "../MobileDashboardNav";
import EmptyState from "../../components/EmptyState";
import SectionCard from "../../components/SectionCard";
import UpgradeGate from "../../components/UpgradeGate";

import {
  canAccessAICockpit,
  type ProfileAccess,
} from "../../../lib/access-control";

import {
  buildFounderActions,
  getFounderActionPriorityClasses,
  getFounderActionPriorityLabel,
  type FounderAction,
} from "../../../lib/founder-action-center";
import FounderMemoryBriefingPanel from "./FounderMemoryBriefingPanel";
import FounderKpiIntelligencePanel from "./FounderKpiIntelligencePanel";
import FounderStrategicSignalsPanel from "./FounderStrategicSignalsPanel";
import FounderCommercialMemoryCenterPanel from "./FounderCommercialMemoryCenterPanel";
import CockpitUnifiedSignalsPanel from "./CockpitUnifiedSignalsPanel";
import FounderOpportunityEnginePanel from "./FounderOpportunityEnginePanel";
import FounderRevenueLeversPanel from "./FounderRevenueLeversPanel";
import FounderRiskForecastPanel from "./FounderRiskForecastPanel";
import FounderGrowthEnginePanel from "./FounderGrowthEnginePanel";
import FounderAIExecutiveAdvisorPanel from "./FounderAIExecutiveAdvisorPanel";

import {
  buildCockpitIntelligenceDeduplication,
  type CockpitSignalSource,
  type CockpitUnifiedSignalCategory,
  type CockpitUnifiedSignalPriority,
} from "../../../lib/cockpit-intelligence-deduplication";

import { buildCommercialMemoryOSList } from "../../../lib/commercial-memory-os";
import {
  buildFounderCommercialMemoryCenter,
} from "../../../lib/founder-commercial-memory-center";

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
};

type FounderTone = "critical" | "warning" | "healthy" | "excellent";

type EnterpriseMetrics = {
  founderScore: number;
  founderTone: FounderTone;
  revenueMomentum: number;
  revenueLabel: string;
  operationalPressure: number;
  operationalLabel: string;
  executionQuality: number;
  executionLabel: string;
  pipelineVelocity: number;
  pipelineLabel: string;
  confirmedRevenue: number;
  openRevenue: number;
  totalPipeline: number;
  paidClients: number;
  unpaidClients: number;
  overdueFollowups: number;
  dueSoonFollowups: number;
  recentClients: number;
  stalledClients: number;
};

function formatGs(value: number) {
  return `Gs.\u00A0${value.toLocaleString("es-PY")}`;
}

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function daysBetween(dateValue: string | null | undefined) {
  if (!dateValue) return null;

  const today = new Date();
  const target = new Date(dateValue);

  if (Number.isNaN(target.getTime())) return null;

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPriorityClasses(priority: string) {
  if (priority === "urgent") return "border-red-200 bg-red-50/80 text-red-800";
  if (priority === "high")
    return "border-orange-200 bg-orange-50/80 text-orange-800";
  if (priority === "medium")
    return "border-blue-200 bg-blue-50/80 text-blue-800";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getPriorityDot(priority: string) {
  if (priority === "urgent") return "bg-red-500";
  if (priority === "high") return "bg-orange-500";
  if (priority === "medium") return "bg-blue-500";

  return "bg-slate-400";
}

function getTypeIcon(type: string) {
  if (type === "risk") return "⚠️";
  if (type === "opportunity") return "💰";
  if (type === "followup") return "📞";
  if (type === "payment") return "💳";
  if (type === "growth") return "📈";

  return "🧠";
}

function getUnifiedSignalCategory(
  type: AICockpitInsight["type"],
): CockpitUnifiedSignalCategory {
  if (type === "risk") return "risk";
  if (type === "opportunity") return "opportunity";
  if (type === "followup") return "followup";
  if (type === "payment") return "payment";
  if (type === "growth") return "opportunity";

  return "memory";
}

function getUnifiedSignalPriority(
  priority: AICockpitInsight["priority"],
): CockpitUnifiedSignalPriority {
  if (priority === "urgent") return "critical";
  if (priority === "high") return "high";
  if (priority === "medium") return "medium";

  return "low";
}

function getUnifiedSignalScore(priority: AICockpitInsight["priority"]) {
  if (priority === "urgent") return 94;
  if (priority === "high") return 78;
  if (priority === "medium") return 58;

  return 38;
}

function getFounderActionUnifiedPriority(
  priority: FounderAction["priority"],
): CockpitUnifiedSignalPriority {
  if (priority === "critical") return "critical";
  if (priority === "high") return "high";
  if (priority === "medium") return "medium";

  return "low";
}

function getRecommendationIcon(category: string) {
  if (category === "sales") return "🚀";
  if (category === "retention") return "🔁";
  if (category === "operations") return "⚙️";
  if (category === "revenue") return "💳";
  if (category === "followup") return "📞";

  return "🧠";
}

function normalizeCliente(cliente: Partial<Cliente>): Cliente {
  return {
    id: String(cliente.id || ""),
    user_id: cliente.user_id ?? null,
    nombre: cliente.nombre || "Cliente sin nombre",
    telefono: cliente.telefono || "",
    estado: cliente.estado || "Sin estado",
    notas: cliente.notas ?? null,
    recordatorio: cliente.recordatorio ?? null,
    proximo_contacto: cliente.proximo_contacto ?? null,
    created_at: cliente.created_at || new Date().toISOString(),
    monto: cliente.monto ?? null,
    pagado: cliente.pagado ?? false,
  };
}

function buildEnterpriseMetrics(clientes: Cliente[]): EnterpriseMetrics {
  const totalClients = clientes.length || 1;

  const paidClients = clientes.filter((cliente) => cliente.pagado).length;
  const unpaidClients = clientes.filter((cliente) => !cliente.pagado).length;

  const confirmedRevenue = clientes.reduce((total, cliente) => {
    if (!cliente.pagado) return total;
    return total + Number(cliente.monto || 0);
  }, 0);

  const openRevenue = clientes.reduce((total, cliente) => {
    if (cliente.pagado) return total;
    return total + Number(cliente.monto || 0);
  }, 0);

  const overdueFollowups = clientes.filter((cliente) => {
    const days = daysBetween(cliente.proximo_contacto);
    return typeof days === "number" && days < 0;
  }).length;

  const dueSoonFollowups = clientes.filter((cliente) => {
    const days = daysBetween(cliente.proximo_contacto);
    return typeof days === "number" && days >= 0 && days <= 2;
  }).length;

  const recentClients = clientes.filter((cliente) => {
    const days = daysBetween(cliente.created_at);
    return typeof days === "number" && days >= -14;
  }).length;

  const stalledClients = clientes.filter((cliente) => {
    const status = normalizeText(cliente.estado);
    const hasNextContact = Boolean(cliente.proximo_contacto);

    return (
      !hasNextContact ||
      status.includes("sin") ||
      status.includes("perdido") ||
      status.includes("frío") ||
      status.includes("frio")
    );
  }).length;

  const revenueMomentum = clamp(
    Math.round((paidClients / totalClients) * 100 + recentClients * 4),
    0,
    100
  );

  const operationalPressure = clamp(
    Math.round(
      overdueFollowups * 18 +
        dueSoonFollowups * 8 +
        stalledClients * 7 +
        unpaidClients * 3
    ),
    0,
    100
  );

  const executionQuality = clamp(
    Math.round(100 - operationalPressure * 0.65 + revenueMomentum * 0.2),
    0,
    100
  );

  const pipelineVelocity = clamp(
    Math.round(100 - stalledClients * 10 + recentClients * 8),
    0,
    100
  );

  const founderScore = clamp(
    Math.round(
      revenueMomentum * 0.32 +
        executionQuality * 0.28 +
        pipelineVelocity * 0.22 +
        (100 - operationalPressure) * 0.18
    ),
    0,
    100
  );

  const founderTone: FounderTone =
    founderScore >= 85
      ? "excellent"
      : founderScore >= 70
        ? "healthy"
        : founderScore >= 50
          ? "warning"
          : "critical";

  return {
    founderScore,
    founderTone,
    revenueMomentum,
    revenueLabel:
      revenueMomentum >= 75
        ? "Fuerte"
        : revenueMomentum >= 50
          ? "Estable"
          : "Débil",
    operationalPressure,
    operationalLabel:
      operationalPressure >= 70
        ? "Alta"
        : operationalPressure >= 40
          ? "Media"
          : "Controlada",
    executionQuality,
    executionLabel:
      executionQuality >= 75
        ? "Excelente"
        : executionQuality >= 55
          ? "Sólida"
          : "Requiere atención",
    pipelineVelocity,
    pipelineLabel:
      pipelineVelocity >= 75
        ? "Rápida"
        : pipelineVelocity >= 50
          ? "Moderada"
          : "Lenta",
    confirmedRevenue,
    openRevenue,
    totalPipeline: confirmedRevenue + openRevenue,
    paidClients,
    unpaidClients,
    overdueFollowups,
    dueSoonFollowups,
    recentClients,
    stalledClients,
  };
}

function getFounderToneClasses(tone: FounderTone) {
  if (tone === "excellent")
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (tone === "healthy") return "border-sky-300 bg-sky-50 text-sky-800";
  if (tone === "warning")
    return "border-amber-300 bg-amber-50 text-amber-800";

  return "border-red-300 bg-red-50 text-red-800";
}

function getFounderToneLabel(tone: FounderTone) {
  if (tone === "excellent") return "Excelente";
  if (tone === "healthy") return "Saludable";
  if (tone === "warning") return "Atención";

  return "Crítico";
}

function CockpitMetricCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string | number;
  description: string;
  tone: "red" | "amber" | "emerald" | "sky";
}) {
  const classes = {
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <div
      className={`rounded-[30px] border p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${classes[tone]}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">
        {label}
      </p>

      <p className="mt-4 whitespace-nowrap text-xl font-black leading-none tracking-tight sm:text-3xl">
        {value}
      </p>

      <p className="mt-4 text-sm font-semibold leading-relaxed opacity-80">
        {description}
      </p>
    </div>
  );
}

function EnterpriseSignalCard({
  label,
  value,
  description,
  score,
}: {
  label: string;
  value: string;
  description: string;
  score: number;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur transition hover:bg-white/[0.14]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
            {label}
          </p>

          <p className="mt-3 text-xl font-black text-slate-950">{value}</p>
        </div>

        <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-950">
          {score}/100
        </p>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-50">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${clamp(score, 0, 100)}%` }}
        />
      </div>

      <p className="mt-4 text-sm font-semibold leading-relaxed text-blue-700">
        {description}
      </p>
    </div>
  );
}

function FounderScorePanel({ metrics }: { metrics: EnterpriseMetrics }) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="flex items-start justify-between gap-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Founder Score
          </p>

          <p className="mt-4 text-5xl font-black leading-none text-slate-950">
            {metrics.founderScore}
            <span className="text-2xl text-blue-700">/100</span>
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${getFounderToneClasses(
            metrics.founderTone
          )}`}
        >
          {getFounderToneLabel(metrics.founderTone)}
        </span>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-300 via-amber-200 to-emerald-300"
          style={{ width: `${metrics.founderScore}%` }}
        />
      </div>

      <p className="mt-5 text-sm font-semibold leading-relaxed text-blue-700">
        Score ejecutivo basado en momentum de ingresos, presión operativa,
        velocidad del pipeline y calidad de ejecución comercial.
      </p>
    </div>
  );
}

function ExecutiveTrendStrip({ metrics }: { metrics: EnterpriseMetrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      <EnterpriseSignalCard
        label="Revenue momentum"
        value={metrics.revenueLabel}
        score={metrics.revenueMomentum}
        description={`${metrics.paidClients} clientes pagados · ${formatGs(
          metrics.confirmedRevenue
        )} confirmado.`}
      />

      <EnterpriseSignalCard
        label="Operational pressure"
        value={metrics.operationalLabel}
        score={metrics.operationalPressure}
        description={`${metrics.overdueFollowups} vencidos · ${metrics.dueSoonFollowups} próximos.`}
      />

      <EnterpriseSignalCard
        label="Execution quality"
        value={metrics.executionLabel}
        score={metrics.executionQuality}
        description="Lectura de control, seguimiento y disciplina comercial."
      />

      <EnterpriseSignalCard
        label="Flujo comercial velocity"
        value={metrics.pipelineLabel}
        score={metrics.pipelineVelocity}
        description={`${metrics.recentClients} clientes nuevos · ${metrics.stalledClients} señales lentas.`}
      />
    </div>
  );
}

function LeadTemperatureBadge({
  temperature,
}: {
  temperature?: LeadTemperatureResult | null;
}) {
  if (!temperature) return null;

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getLeadTemperatureClasses(
        temperature.temperature
      )}`}
    >
      🔥 {temperature.label} · {temperature.score}/100
    </span>
  );
}

function LeadTemperatureOverview({
  hot,
  warm,
  cold,
  inactive,
}: {
  hot: number;
  warm: number;
  cold: number;
  inactive: number;
}) {
  return (
    <SectionCard
      badge="Temperatura comercial"
      title="Ritmo comercial de clientes"
      description="Distribución comercial detectada automáticamente por ClienteYA."
    >
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-[26px] border border-red-200 bg-red-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-700">
            Alta intención
          </p>
          <p className="mt-4 text-4xl font-black text-red-700">{hot}</p>
        </div>

        <div className="rounded-[26px] border border-orange-200 bg-orange-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
            Interés activo
          </p>
          <p className="mt-4 text-4xl font-black text-orange-700">{warm}</p>
        </div>

        <div className="rounded-[26px] border border-blue-200 bg-blue-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
            Bajo movimiento
          </p>
          <p className="mt-4 text-4xl font-black text-blue-700">{cold}</p>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-slate-100 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
            Inactivos
          </p>
          <p className="mt-4 text-4xl font-black text-slate-700">{inactive}</p>
        </div>
      </div>
    </SectionCard>
  );
}

function FounderIntelligenceVisuals({
  metrics,
}: {
  metrics: EnterpriseMetrics;
}) {
  const rows = [
    {
      label: "Ingresos confirmados",
      value: formatGs(metrics.confirmedRevenue),
      score: metrics.revenueMomentum,
    },
    {
      label: "Flujo comercial abierto",
      value: formatGs(metrics.openRevenue),
      score: metrics.pipelineVelocity,
    },
    {
      label: "Presión operativa operativa",
      value: metrics.operationalLabel,
      score: metrics.operationalPressure,
    },
    {
      label: "Calidad de ejecución",
      value: metrics.executionLabel,
      score: metrics.executionQuality,
    },
  ];

  return (
    <SectionCard
      badge="Founder intelligence"
      title="Visuales ejecutivos premium"
      description="Lectura rápida para decidir dónde enfocar energía comercial y operativa."
    >
      <div className="grid gap-7 2xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 text-slate-950 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Control ejecutivo
          </p>

          <p className="mt-5 text-4xl font-black sm:text-5xl">
            {formatGs(metrics.totalPipeline)}
          </p>

          <p className="mt-3 text-sm font-semibold leading-relaxed text-blue-700">
            Valor total detectado entre ingresos confirmados y pipeline abierto.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                Pagados
              </p>
              <p className="mt-3 text-3xl font-black">{metrics.paidClients}</p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                Pendientes
              </p>
              <p className="mt-3 text-3xl font-black">
                {metrics.unpaidClients}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-[26px] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    {row.label}
                  </p>
                  <p className="mt-2 text-base font-black text-slate-900">
                    {row.value}
                  </p>
                </div>

                <p className="text-sm font-black text-slate-700">
                  {row.score}/100
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${clamp(row.score, 0, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function InsightCard({
  insight,
  temperature,
}: {
  insight: AICockpitInsight;
  temperature?: LeadTemperatureResult | null;
}) {
  return (
    <div
      className={`rounded-[26px] border p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${getPriorityClasses(
        insight.priority
      )}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
              <span
                className={`h-2 w-2 rounded-full ${getPriorityDot(
                  insight.priority
                )}`}
              />
              {getAICockpitPriorityLabel(insight.priority)}
            </span>

            <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
              {getTypeIcon(insight.type)} {getAICockpitTypeLabel(insight.type)}
            </span>

            <LeadTemperatureBadge temperature={temperature} />
          </div>

          <p className="text-base font-black text-slate-900">
            {insight.title}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {insight.description}
          </p>

          {temperature ? (
            <p className="mt-3 text-xs font-semibold text-slate-600">
              {temperature.reason}
            </p>
          ) : null}
        </div>

        <a
          href={insight.clienteId ? `/dashboard/clientes/${insight.clienteId}` : insight.actionHref}
          className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800">
                    {insight.actionLabel}
        </a>
      </div>
    </div>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: AICockpitRecommendation;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">
          <span
            className={`h-2 w-2 rounded-full ${getPriorityDot(
              recommendation.priority
            )}`}
          />
          {getAICockpitRecommendationPriorityLabel(recommendation.priority)}
        </span>

        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">
          {getRecommendationIcon(recommendation.category)}{" "}
          {getAICockpitRecommendationCategoryLabel(recommendation.category)}
        </span>
      </div>

      <p className="text-base font-black text-slate-900">
        {recommendation.title}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {recommendation.description}
      </p>
    </div>
  );
}


function FounderActionCenter({
  actions,
  forecast,
}: {
  actions: FounderAction[];
  forecast: RevenueForecast;
}) {
  if (actions.length === 0) {
    return null;
  }

  const primaryAction = actions[0];
  const secondaryActions = actions.slice(1, 5);
  const totalImpact = actions.reduce((total, action) => total + action.impact, 0);
  const criticalCount = actions.filter(
    (action) => action.priority === "critical"
  ).length;

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-slate-900 bg-slate-950 text-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-300" />

      <div className="relative grid gap-0 xl:grid-cols-[0.84fr_1.16fr]">
        <div className="border-b border-white/10 p-5 sm:p-7 xl:border-b-0 xl:border-r xl:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.14)]" />
              V17.6 Founder Action Center
            </span>

            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">
              AI → Acción
            </span>
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-200">
            Acción recomendada hoy
          </p>

          <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl">
            Haz esto primero.
          </h2>

          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-slate-300 sm:text-base">
            ClienteYA convierte señales, forecast y riesgo comercial en una ruta
            clara para proteger ingresos y mover clientes hoy.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-300">
                Impacto total
              </p>
              <p className="mt-1 text-base font-black text-white">
                {formatGs(totalImpact)}
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-300">
                Críticas
              </p>
              <p className="mt-1 text-base font-black text-white">
                {criticalCount}
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-300">
                Forecast 30d
              </p>
              <p className="mt-1 text-base font-black text-white">
                {formatGs(forecast.forecast30Days)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[30px] border border-white/10 bg-white/95 p-5 text-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getFounderActionPriorityClasses(
                  primaryAction.priority
                )}`}
              >
                {getFounderActionPriorityLabel(primaryAction.priority)}
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                Acción #1
              </span>
            </div>

            <h3 className="text-2xl font-black leading-tight text-slate-950">
              {primaryAction.title}
            </h3>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              {primaryAction.description}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Impacto esperado
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {formatGs(primaryAction.impact)}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-700">
                  Decisión founder
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  Actuar ahora
                </p>
              </div>
            </div>

            <a
              href={primaryAction.actionHref}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-950"
            >
              {primaryAction.actionLabel} →
            </a>
          </div>
        </div>

        <div className="relative bg-white p-4 text-slate-950 sm:p-6 xl:p-7">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Ruta de acción
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                Prioridades con impacto comercial directo.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              {actions.length} acciones
            </span>
          </div>

          <div className="grid gap-3">
            {secondaryActions.length === 0 ? (
              <EmptySignal tone="slate">
                No hay más acciones críticas. Ejecuta la acción principal y vuelve
                a revisar el cockpit.
              </EmptySignal>
            ) : (
              secondaryActions.map((action, index) => (
                <div
                  key={action.id}
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-[0_12px_34px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                          Paso {index + 2}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getFounderActionPriorityClasses(
                            action.priority
                          )}`}
                        >
                          {getFounderActionPriorityLabel(action.priority)}
                        </span>
                      </div>

                      <h3 className="text-lg font-black leading-tight text-slate-950">
                        {action.title}
                      </h3>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        {action.description}
                      </p>

                      <div className="mt-3 rounded-2xl border border-white bg-white px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Impacto
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatGs(action.impact)}
                        </p>
                      </div>
                    </div>

                    <a
                      href={action.actionHref}
                      className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-black text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-950"
                    >
                      {action.actionLabel} →
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}



function AIExecutiveRail({
  decisions,
  founderScore,
}: {
  decisions: FounderDecision[];
  founderScore: number;
}) {
  const topDecisions = decisions.slice(0, 5);

  if (topDecisions.length === 0) {
    return null;
  }

  const mainDecision = topDecisions[0];
  const sideDecisions = topDecisions.slice(1);

  function getImpactClasses(impact: FounderDecision["impact"]) {
    if (impact === "critical") {
      return {
        card: "border-red-100 bg-gradient-to-br from-white via-red-50/55 to-white",
        badge: "border-red-200 bg-red-50 text-red-700",
        dot: "bg-red-500",
        text: "text-red-700",
        ring: "bg-red-500/10 text-red-700",
      };
    }

    if (impact === "high") {
      return {
        card: "border-amber-100 bg-gradient-to-br from-white via-amber-50/60 to-white",
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
        text: "text-amber-700",
        ring: "bg-amber-500/10 text-amber-700",
      };
    }

    if (impact === "medium") {
      return {
        card: "border-sky-100 bg-gradient-to-br from-white via-sky-50/55 to-white",
        badge: "border-sky-200 bg-sky-50 text-sky-700",
        dot: "bg-sky-500",
        text: "text-sky-700",
        ring: "bg-sky-500/10 text-sky-700",
      };
    }

    return {
      card: "border-slate-200 bg-gradient-to-br from-white via-slate-50/75 to-white",
      badge: "border-slate-200 bg-slate-50 text-slate-600",
      dot: "bg-slate-400",
      text: "text-slate-600",
      ring: "bg-slate-500/10 text-slate-600",
    };
  }

  const mainImpactClasses = getImpactClasses(mainDecision.impact);

  return (
    <section className="relative overflow-hidden rounded-[38px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-100/55 blur-3xl" />
        <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-cyan-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-slate-100/80 blur-3xl" />
      </div>

      <div className="relative border-b border-slate-200/70 bg-gradient-to-br from-white via-slate-50/85 to-blue-50/55 px-5 py-6 sm:px-6 xl:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-[0_8px_22px_rgba(37,99,235,0.08)]">
                <span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.10)]" />
                V16.5.4 Navigation Rail
              </span>

              <span className="inline-flex rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm">
                Founder Command Center
              </span>

              <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Premium LATAM SaaS
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Línea ejecutiva de decisión
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Una capa ejecutiva limpia para convertir señales comerciales,
              riesgo operativo y momentum de pipeline en una decisión clara
              para el founder.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <div className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                Founder Score
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {founderScore}/100
              </p>
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(37,99,235,0.06)] backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-700">
                AI Decision Score
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {mainDecision.score}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                Señales activas
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {topDecisions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative grid gap-0 xl:grid-cols-[1.04fr_1.46fr]">
        <div className="border-b border-slate-200/70 bg-white/88 p-5 sm:p-6 xl:border-b-0 xl:border-r xl:p-7">
          <div className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_18px_52px_rgba(15,23,42,0.07)] sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-100/60 blur-3xl" />

            <div className="relative mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                  Acción principal ahora
                </p>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                  La decisión que más ayuda a proteger foco, conversión y
                  control operativo.
                </p>
              </div>

              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${mainImpactClasses.ring}`}>
                Decisión #1
              </span>
            </div>

            <h3 className="relative text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
              {mainDecision.title}
            </h3>

            <p className="relative mt-4 text-sm font-semibold leading-6 text-slate-600">
              {mainDecision.description}
            </p>

            <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Impacto ejecutivo
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {mainDecision.label}
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Prioridad AI
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {mainDecision.score}/100
                </p>
              </div>
            </div>

            {mainDecision.actionHref ? (
              <a
                href={mainDecision.actionHref}
                className="relative mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-blue-950 bg-gradient-to-r from-slate-950 to-blue-950 px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.24)]"
              >
                {mainDecision.actionLabel || "Abrir decisión"}
              </a>
            ) : null}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50/95 via-white to-blue-50/40 p-4 sm:p-5 xl:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Siguientes señales
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                Radar ejecutivo para mantener control sin ruido visual.
              </p>
            </div>

            <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 shadow-sm sm:inline-flex">
              {sideDecisions.length} activas
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {sideDecisions.map((decision, index) => {
              const classes = getImpactClasses(decision.impact);

              return (
                <div
                  key={decision.id}
                  className={`group relative overflow-hidden rounded-[28px] border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.09)] ${classes.card}`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-200 via-blue-200 to-slate-100" />

                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${classes.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${classes.dot}`} />
                      {decision.label}
                    </span>

                    <span className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 shadow-sm">
                      {decision.score}
                    </span>
                  </div>

                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${classes.text}`}>
                    Señal 0{index + 2}
                  </p>

                  <h3 className="mt-2 text-sm font-black leading-snug text-slate-950">
                    {decision.title}
                  </h3>

                  <p className="mt-2 line-clamp-4 text-xs font-semibold leading-5 text-slate-600">
                    {decision.description}
                  </p>

                  {decision.actionHref ? (
                    <a
                      href={decision.actionHref}
                      className="mt-4 inline-flex text-xs font-black text-blue-700 transition group-hover:text-blue-950"
                    >
                      {decision.actionLabel || "Revisar"} →
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


function DailyNavigationPanel({
  decisions,
  metrics,
  focus,
  followups,
  opportunities,
  risks,
  payments,
  clientes,
  leadTemperatureMap,
}: {
  decisions: FounderDecision[];
  metrics: EnterpriseMetrics;
  focus: string;
  followups: AICockpitInsight[];
  opportunities: AICockpitInsight[];
  risks: AICockpitInsight[];
  payments: AICockpitInsight[];
  clientes: Cliente[];
  leadTemperatureMap: Map<string, LeadTemperatureResult>;
}) {
  type DailyRouteItem = {
    id: string;
    title: string;
    description: string;
    label: string;
    reason: string;
    actionLabel: string;
    actionHref?: string;
    impact: FounderDecision["impact"];
    score: number;
    valueLabel: string;
    intelligenceLabel: string;
    founderImpact: number;
    revenueImpact: number;
    riskReduction: number;
    connectionSummary: string;
  };

  function getPriorityBase(priority: AICockpitInsight["priority"]) {
    if (priority === "urgent") return 74;
    if (priority === "high") return 64;
    if (priority === "medium") return 52;
    return 42;
  }

  function getInsightImpact(priority: AICockpitInsight["priority"]): FounderDecision["impact"] {
    if (priority === "urgent") return "critical";
    if (priority === "high") return "high";
    if (priority === "medium") return "medium";
    return "low";
  }

  function getInsightReason(type: AICockpitInsight["type"]) {
    if (type === "followup") return "Seguimiento pendiente";
    if (type === "opportunity") return "Oportunidad activa";
    if (type === "risk") return "Riesgo comercial";
    if (type === "payment") return "Ingreso por asegurar";
    if (type === "growth") return "Potencial de crecimiento";
    return "Señal ejecutiva";
  }

  function getTemperatureBoost(temperature?: LeadTemperatureResult | null) {
    if (!temperature) return 0;
    if (temperature.temperature === "hot") return 12;
    if (temperature.temperature === "warm") return 8;
    if (temperature.temperature === "cold") return 3;
    return 0;
  }

  function getRevenueBoost(value: number) {
    if (value >= 3000000) return 10;
    if (value >= 1500000) return 7;
    if (value > 0) return 4;
    return 0;
  }

  function getOverdueBoost(cliente?: Cliente | null) {
    if (!cliente) return 0;

    const days = daysBetween(cliente.proximo_contacto);

    if (typeof days !== "number" || days >= 0) return 0;
    if (days <= -10) return 12;
    if (days <= -5) return 9;
    if (days <= -2) return 6;

    return 3;
  }

  function getTypeBoost(type: AICockpitInsight["type"]) {
    if (type === "followup") return 8;
    if (type === "opportunity") return 7;
    if (type === "risk") return 6;
    if (type === "payment") return 5;
    if (type === "growth") return 4;
    return 2;
  }

  function getFounderImpact({
    score,
    overdueBoost,
    temperatureBoost,
    revenueBoost,
    type,
  }: {
    score: number;
    overdueBoost: number;
    temperatureBoost: number;
    revenueBoost: number;
    type: AICockpitInsight["type"];
  }) {
    const typeImpact =
      type === "followup"
        ? 2
        : type === "opportunity"
          ? 2
          : type === "risk"
            ? 3
            : type === "payment"
              ? 2
              : 1;

    return clamp(
      Math.round(score / 24) +
        Math.round(overdueBoost / 4) +
        Math.round(temperatureBoost / 5) +
        Math.round(revenueBoost / 4) +
        typeImpact,
      1,
      12
    );
  }

  function getRiskReduction({
    overdueBoost,
    type,
    priority,
  }: {
    overdueBoost: number;
    type: AICockpitInsight["type"];
    priority: AICockpitInsight["priority"];
  }) {
    const priorityImpact =
      priority === "urgent" ? 10 : priority === "high" ? 7 : priority === "medium" ? 4 : 2;
    const typeImpact = type === "risk" ? 8 : type === "followup" ? 6 : type === "payment" ? 4 : 2;

    return clamp(priorityImpact + typeImpact + Math.round(overdueBoost / 2), 3, 28);
  }

  function buildConnectionSummary({
    founderImpact,
    revenueImpact,
    riskReduction,
  }: {
    founderImpact: number;
    revenueImpact: number;
    riskReduction: number;
  }) {
    return `+${founderImpact} Founder · ${
      revenueImpact > 0 ? formatGs(revenueImpact) : "sin valor directo"
    } · -${riskReduction}% riesgo`;
  }

  function getClienteValue(cliente?: Cliente | null) {
    return Number(cliente?.monto || 0);
  }

  function buildIntelligenceLabel({
    cliente,
    temperature,
    type,
    value,
  }: {
    cliente?: Cliente | null;
    temperature?: LeadTemperatureResult | null;
    type: AICockpitInsight["type"];
    value: number;
  }) {
    const parts: string[] = [];
    const days = daysBetween(cliente?.proximo_contacto);

    if (typeof days === "number" && days < 0) {
      parts.push(`${Math.abs(days)} días vencido`);
    }

    if (temperature) {
      parts.push(`${temperature.label} ${temperature.score}/100`);
    }

    if (value > 0) {
      parts.push(formatGs(value));
    }

    if (type === "risk") parts.push("riesgo activo");
    if (type === "opportunity") parts.push("oportunidad activa");
    if (type === "payment") parts.push("revenue pendiente");

    return parts.length > 0 ? parts.slice(0, 3).join(" · ") : "Señal conectada";
  }

  const insightSource = [
    ...followups,
    ...opportunities,
    ...risks,
    ...payments,
  ];

  const insightRouteItems: DailyRouteItem[] = insightSource.map((insight, index) => {
    const cliente = insight.clienteId
      ? clientes.find((item) => item.id === insight.clienteId)
      : null;
    const temperature = insight.clienteId
      ? leadTemperatureMap.get(insight.clienteId)
      : null;
    const clienteValue = getClienteValue(cliente);
    const fallbackValue =
      insight.type === "opportunity" || insight.type === "payment"
        ? metrics.openRevenue || metrics.totalPipeline
        : 0;
    const value = clienteValue > 0 ? clienteValue : fallbackValue;
    const temperatureBoost = getTemperatureBoost(temperature);
    const overdueBoost = getOverdueBoost(cliente);
    const typeBoost = getTypeBoost(insight.type);
    const revenueBoost = getRevenueBoost(value);
    const recencyPenalty = Math.min(index, 8);
    const score = clamp(
      getPriorityBase(insight.priority) +
        typeBoost +
        temperatureBoost +
        overdueBoost +
        revenueBoost -
        recencyPenalty,
      0,
      100
    );

    const reasonDetails = [getInsightReason(insight.type)];

    if (overdueBoost > 0) reasonDetails.push("vencido");
    if (temperatureBoost >= 8) reasonDetails.push("alta intención");
    if (revenueBoost >= 7) reasonDetails.push("alto valor");

    const founderImpact = getFounderImpact({
      score,
      overdueBoost,
      temperatureBoost,
      revenueBoost,
      type: insight.type,
    });
    const riskReduction = getRiskReduction({
      overdueBoost,
      type: insight.type,
      priority: insight.priority,
    });
    const revenueImpact = value > 0 ? value : 0;

    return {
      id: `insight-${insight.id}`,
      title: cliente?.nombre || insight.title,
      description: insight.description,
      label: getAICockpitTypeLabel(insight.type),
      reason: reasonDetails.slice(0, 3).join(" + "),
      actionLabel: insight.actionLabel || "Abrir cliente",
      actionHref: cliente?.id ? `/dashboard/clientes/${cliente.id}` : "/dashboard/clientes",
      impact: getInsightImpact(insight.priority),
      score,
      valueLabel: value > 0 ? formatGs(value) : "Protege seguimiento",
      intelligenceLabel: buildIntelligenceLabel({
        cliente,
        temperature,
        type: insight.type,
        value,
      }),
      founderImpact,
      revenueImpact,
      riskReduction,
      connectionSummary: buildConnectionSummary({
        founderImpact,
        revenueImpact,
        riskReduction,
      }),
    };
  });

  const decisionRouteItems: DailyRouteItem[] = decisions.map((decision, index) => {
    const value = metrics.openRevenue > 0 || metrics.totalPipeline > 0
      ? metrics.openRevenue || metrics.totalPipeline
      : 0;

    const score = clamp(decision.score - index, 0, 100);
    const founderImpact = clamp(Math.round(score / 22), 1, 8);
    const revenueImpact = value;
    const riskReduction = clamp(Math.round(score / 8), 4, 18);

    return {
      id: `decision-${decision.id}`,
      title: decision.title,
      description: decision.description,
      label: decision.label,
      reason: "Decisión recomendada",
      actionLabel: decision.actionLabel || "Abrir decisión",
      actionHref: "/dashboard/clientes",
      impact: decision.impact,
      score,
      valueLabel: value > 0 ? formatGs(value) : "Impacto operativo",
      intelligenceLabel: "Founder decision · señales consolidadas",
      founderImpact,
      revenueImpact,
      riskReduction,
      connectionSummary: buildConnectionSummary({
        founderImpact,
        revenueImpact,
        riskReduction,
      }),
    };
  });

  const routeItems = [...insightRouteItems, ...decisionRouteItems]
    .filter((item, index, all) => all.findIndex((match) => match.title === item.title) === index)
    .sort((first, second) => second.score - first.score)
    .slice(0, 3);

  if (routeItems.length === 0) {
    return null;
  }

  const estimatedMinutes = routeItems.length * 10 + Math.min(metrics.overdueFollowups * 3, 18);
  const potentialImpact = routeItems.reduce((total, item) => {
    const numericValue = Number(
      item.valueLabel.replace(/[^0-9]/g, "") || 0
    );

    return total + numericValue;
  }, 0);
  const displayPotentialImpact = potentialImpact > 0 ? potentialImpact : metrics.openRevenue || metrics.totalPipeline;
  const primaryRouteItem = routeItems[0];
  const totalFounderImpact = routeItems.reduce((total, item) => total + item.founderImpact, 0);
  const totalRiskReduction = clamp(
    Math.round(
      routeItems.reduce((total, item) => total + item.riskReduction, 0) / routeItems.length
    ),
    0,
    35
  );

  function getRouteTone(impact: FounderDecision["impact"]) {
    if (impact === "critical") {
      return {
        card: "border-red-200 bg-red-50/85",
        badge: "border-red-200 bg-white text-red-700",
        dot: "bg-red-500",
        text: "text-red-700",
        rail: "bg-red-500",
      };
    }

    if (impact === "high") {
      return {
        card: "border-amber-200 bg-amber-50/85",
        badge: "border-amber-200 bg-white text-amber-700",
        dot: "bg-amber-500",
        text: "text-amber-700",
        rail: "bg-amber-500",
      };
    }

    if (impact === "medium") {
      return {
        card: "border-sky-200 bg-sky-50/85",
        badge: "border-sky-200 bg-white text-sky-700",
        dot: "bg-sky-500",
        text: "text-sky-700",
        rail: "bg-sky-500",
      };
    }

    return {
      card: "border-slate-200 bg-slate-50",
      badge: "border-slate-200 bg-white text-slate-600",
      dot: "bg-slate-400",
      text: "text-slate-600",
      rail: "bg-slate-400",
    };
  }

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-blue-200 bg-white shadow-[0_28px_90px_rgba(37,99,235,0.12)] ring-1 ring-blue-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.13),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400" />

      <div className="relative grid gap-0 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-blue-100 bg-gradient-to-br from-white via-blue-50/80 to-slate-50 p-5 sm:p-7 xl:border-b-0 xl:border-r xl:p-9">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" />
              V17.4.1 Predictive Intelligence
            </span>

            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              Predicciones conectadas
            </span>
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">
            Predictive Intelligence Layer
          </p>

          <h2 className="mt-3 max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl">
            Empieza aquí.
          </h2>

          <p className="mt-4 max-w-xl text-base font-bold leading-7 text-slate-700">
            ClienteYA muestra la ruta del día y el impacto esperado: qué hacer,
            qué valor protege y cuánto reduce el riesgo comercial.
          </p>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.055)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Impacto total hoy
              </p>

              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                {routeItems.length} acciones
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-3 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  Founder
                </p>
                <p className="mt-1 text-base font-black text-slate-950">
                  +{totalFounderImpact}
                </p>
              </div>

              <div className="rounded-[20px] border border-blue-200 bg-blue-50 px-3 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-700">
                  Potencial
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {formatGs(displayPotentialImpact)}
                </p>
              </div>

              <div className="rounded-[20px] border border-red-200 bg-red-50 px-3 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-700">
                  Riesgo
                </p>
                <p className="mt-1 text-base font-black text-slate-950">
                  -{totalRiskReduction}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[30px] border border-blue-200 bg-white p-5 shadow-[0_16px_46px_rgba(37,99,235,0.09)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                  Siguiente mejor acción
                </p>

                <p className="mt-3 text-2xl font-black leading-tight text-slate-950">
                  {primaryRouteItem.title}
                </p>
              </div>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                AI {primaryRouteItem.score}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Por qué ahora
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {primaryRouteItem.reason}
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Señales conectadas
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {primaryRouteItem.intelligenceLabel}
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-3 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  Founder Score
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  +{primaryRouteItem.founderImpact}
                </p>
              </div>

              <div className="rounded-[20px] border border-blue-200 bg-blue-50 px-3 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-700">
                  Revenue
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {primaryRouteItem.revenueImpact > 0 ? formatGs(primaryRouteItem.revenueImpact) : "Sin valor directo"}
                </p>
              </div>

              <div className="rounded-[20px] border border-red-200 bg-red-50 px-3 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-700">
                  Riesgo
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  -{primaryRouteItem.riskReduction}%
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {focus}
            </p>

            {primaryRouteItem.actionHref ? (
              <a
                href={primaryRouteItem.actionHref}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-blue-950 bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_16px_38px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-950"
              >
                {primaryRouteItem.actionLabel} →
              </a>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Impacto potencial
              </p>
              <p className="mt-2 text-base font-black text-slate-950 sm:text-lg">
                {formatGs(displayPotentialImpact)}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Tiempo estimado
              </p>
              <p className="mt-2 text-base font-black text-slate-950 sm:text-lg">
                {estimatedMinutes} min
              </p>
            </div>

            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 px-4 py-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Founder impact
              </p>
              <p className="mt-2 text-base font-black text-slate-950 sm:text-lg">
                +{totalFounderImpact}
              </p>
            </div>

            <div className="rounded-[24px] border border-red-200 bg-red-50/80 px-4 py-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-700">
                Riesgo reducido
              </p>
              <p className="mt-2 text-base font-black text-slate-950 sm:text-lg">
                -{totalRiskReduction}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 p-4 sm:p-6 xl:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Ruta recomendada
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                Impacto por acción: score, revenue y riesgo en una lectura rápida.
              </p>
            </div>

            <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 sm:inline-flex">
              Hoy
            </span>
          </div>

          <div className="relative space-y-3">
            <div className="absolute bottom-7 left-5 top-7 hidden w-px bg-slate-200 sm:block" />

            {routeItems.map((item, index) => {
              const tone = getRouteTone(item.impact);

              return (
                <div
                  key={item.id}
                  className={`relative rounded-[30px] border p-4 shadow-[0_12px_34px_rgba(15,23,42,0.055)] sm:ml-10 sm:p-5 ${tone.card}`}
                >
                  <div
                    className={`absolute -left-[3.75rem] top-5 hidden h-10 w-10 items-center justify-center rounded-full border-4 border-white text-sm font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)] sm:flex ${tone.rail}`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${tone.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                          Paso {index + 1}
                        </span>

                        <span className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm">
                          {item.label}
                        </span>

                        {index === 0 ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 shadow-sm">
                            Mayor impacto hoy
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-lg font-black leading-tight text-slate-950 sm:text-xl">
                        {item.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                        {item.description}
                      </p>

                      <div className="mt-4 grid gap-2 xl:grid-cols-[1fr_1fr_1.35fr]">
                        <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                            Motivo
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-950">
                            {item.reason}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                            Inteligencia
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-950">
                            {item.intelligenceLabel}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-2xl border border-emerald-200 bg-white/90 px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                              Founder
                            </p>
                            <p className="mt-1 text-xs font-black text-slate-950">
                              +{item.founderImpact}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-blue-200 bg-white/90 px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-700">
                              Revenue
                            </p>
                            <p className="mt-1 text-xs font-black text-slate-950">
                              {item.revenueImpact > 0 ? formatGs(item.revenueImpact) : "—"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-red-200 bg-white/90 px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-700">
                              Riesgo
                            </p>
                            <p className="mt-1 text-xs font-black text-slate-950">
                              -{item.riskReduction}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:block sm:text-right">
                      <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${tone.text}`}>
                        AI score
                      </p>

                      <p className="text-xl font-black text-slate-950">
                        {item.score}
                      </p>

                      {item.actionHref ? (
                        <a
                          href={item.actionHref}
                          className="mt-0 inline-flex rounded-full border border-white/80 bg-white px-3 py-1.5 text-xs font-black text-blue-700 shadow-sm transition hover:text-blue-950 sm:mt-3"
                        >
                          Abrir →
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


function UnifiedClientIntelligence({
  clientes,
  followups,
  opportunities,
  risks,
  payments,
  leadTemperatureMap,
}: {
  clientes: Cliente[];
  followups: AICockpitInsight[];
  opportunities: AICockpitInsight[];
  risks: AICockpitInsight[];
  payments: AICockpitInsight[];
  leadTemperatureMap: Map<string, LeadTemperatureResult>;
}) {
  type UnifiedClientSignal = {
    id: string;
    name: string;
    status: string;
    score: number;
    temperature?: LeadTemperatureResult | null;
    value: number;
    daysUntilContact: number | null;
    pipelineDays: number;
    lastContactLabel: string;
    relationshipState: string;
    aiConfidence: string;
    relationshipTrend: string;
    memorySummary: string;
    predictive: PredictiveInsight;
    reason: string;
    advisory: string;
    actionHref: string;
    actionLabel: string;
    signalSummary: string;
    tone: "red" | "amber" | "emerald" | "blue" | "slate";
  };

  const allSignals = [...followups, ...opportunities, ...risks, ...payments];

  function getClienteSignals(clienteId: string, type?: AICockpitInsight["type"]) {
    return allSignals.filter((signal) => {
      if (signal.clienteId !== clienteId) return false;
      if (!type) return true;
      return signal.type === type;
    });
  }

  function getTemperatureScore(temperature?: LeadTemperatureResult | null) {
    if (!temperature) return 0;
    if (temperature.temperature === "hot") return 24;
    if (temperature.temperature === "warm") return 16;
    if (temperature.temperature === "cold") return 7;
    return 2;
  }

  function getOverdueScore(days: number | null) {
    if (typeof days !== "number") return 0;
    if (days <= -10) return 24;
    if (days <= -5) return 18;
    if (days <= -2) return 12;
    if (days < 0) return 7;
    if (days <= 2) return 4;
    return 0;
  }

  function getRevenueScore(value: number) {
    if (value >= 3000000) return 18;
    if (value >= 1500000) return 13;
    if (value > 0) return 8;
    return 0;
  }

  function getClientTone(score: number): UnifiedClientSignal["tone"] {
    if (score >= 86) return "red";
    if (score >= 74) return "amber";
    if (score >= 62) return "emerald";
    if (score >= 50) return "blue";
    return "slate";
  }

  function getToneClasses(tone: UnifiedClientSignal["tone"]) {
    if (tone === "red") {
      return {
        card: "border-red-200 bg-red-50/85",
        badge: "border-red-200 bg-white text-red-700",
        dot: "bg-red-500",
        score: "text-red-700",
      };
    }

    if (tone === "amber") {
      return {
        card: "border-amber-200 bg-amber-50/85",
        badge: "border-amber-200 bg-white text-amber-700",
        dot: "bg-amber-500",
        score: "text-amber-700",
      };
    }

    if (tone === "emerald") {
      return {
        card: "border-emerald-200 bg-emerald-50/80",
        badge: "border-emerald-200 bg-white text-emerald-700",
        dot: "bg-emerald-500",
        score: "text-emerald-700",
      };
    }

    if (tone === "blue") {
      return {
        card: "border-blue-200 bg-blue-50/80",
        badge: "border-blue-200 bg-white text-blue-700",
        dot: "bg-blue-500",
        score: "text-blue-700",
      };
    }

    return {
      card: "border-slate-200 bg-slate-50",
      badge: "border-slate-200 bg-white text-slate-600",
      dot: "bg-slate-400",
      score: "text-slate-700",
    };
  }

  function buildReason(parts: string[]) {
    const visible = parts.filter(Boolean).slice(0, 3);
    return visible.length > 0 ? visible.join(" + ") : "Cliente activo en la cartera";
  }

  function buildAdvisory({
    overdueDays,
    opportunityCount,
    riskCount,
    paymentCount,
    temperature,
  }: {
    overdueDays: number | null;
    opportunityCount: number;
    riskCount: number;
    paymentCount: number;
    temperature?: LeadTemperatureResult | null;
  }) {
    if (typeof overdueDays === "number" && overdueDays < 0 && opportunityCount > 0) {
      return "Contactar hoy: seguimiento vencido con oportunidad comercial activa.";
    }

    if (riskCount > 0) {
      return "Revisar primero: hay señales de riesgo que pueden afectar conversión o retención.";
    }

    if (paymentCount > 0) {
      return "Asegurar ingreso: revisar pago pendiente y cerrar el ciclo comercial.";
    }

    if (temperature?.temperature === "hot" || temperature?.temperature === "warm") {
      return "Aprovechar intención comercial mientras el cliente sigue activo.";
    }

    return "Mantener en radar para evitar pérdida de oportunidad o enfriamiento.";
  }

  function getPipelineDays(createdAt: string | null | undefined) {
    const days = daysBetween(createdAt);

    if (typeof days !== "number") return 0;

    return Math.max(Math.abs(days), 0);
  }

  function getLastContactLabel(daysUntilContact: number | null, pipelineDays: number) {
    if (typeof daysUntilContact === "number" && daysUntilContact < 0) {
      return `Hace ${Math.abs(daysUntilContact)} días`;
    }

    if (typeof daysUntilContact === "number" && daysUntilContact === 0) {
      return "Hoy";
    }

    if (typeof daysUntilContact === "number" && daysUntilContact > 0) {
      return `Próximo en ${daysUntilContact} días`;
    }

    if (pipelineDays > 0) {
      return `Hace ${pipelineDays} días`;
    }

    return "Sin registro reciente";
  }

  function getRelationshipState({
    score,
    daysUntilContact,
    riskCount,
    opportunityCount,
  }: {
    score: number;
    daysUntilContact: number | null;
    riskCount: number;
    opportunityCount: number;
  }) {
    if (riskCount > 0 || (typeof daysUntilContact === "number" && daysUntilContact < -7)) {
      return "Relación en riesgo";
    }

    if (score >= 82 && opportunityCount > 0) {
      return "Relación con alta intención";
    }

    if (score >= 68) {
      return "Relación activa";
    }

    return "Relación en observación";
  }

  function getAIConfidence(score: number) {
    if (score >= 86) return "Alta";
    if (score >= 70) return "Media";
    return "Inicial";
  }

  function getRelationshipTrend({
    score,
    daysUntilContact,
    opportunityCount,
    riskCount,
    paymentCount,
  }: {
    score: number;
    daysUntilContact: number | null;
    opportunityCount: number;
    riskCount: number;
    paymentCount: number;
  }) {
    if (riskCount > 0 || (typeof daysUntilContact === "number" && daysUntilContact < -7)) {
      return "↘ Requiere atención";
    }

    if (score >= 82 || opportunityCount > 0 || paymentCount > 0) {
      return "↗ Positiva";
    }

    return "→ Estable";
  }

  function buildMemorySummary({
    pipelineDays,
    daysUntilContact,
    opportunityCount,
    riskCount,
    paymentCount,
  }: {
    pipelineDays: number;
    daysUntilContact: number | null;
    opportunityCount: number;
    riskCount: number;
    paymentCount: number;
  }) {
    const parts = [`${pipelineDays} días en pipeline`];

    if (typeof daysUntilContact === "number" && daysUntilContact < 0) {
      parts.push(`${Math.abs(daysUntilContact)} días sin resolver seguimiento`);
    } else if (typeof daysUntilContact === "number" && daysUntilContact >= 0) {
      parts.push(`próximo contacto en ${daysUntilContact} días`);
    } else {
      parts.push("sin próximo contacto");
    }

    if (opportunityCount > 0) parts.push("oportunidad activa");
    if (riskCount > 0) parts.push("riesgo activo");
    if (paymentCount > 0) parts.push("revenue pendiente");

    return parts.slice(0, 4).join(" · ");
  }

  const unifiedClients: UnifiedClientSignal[] = clientes
    .map((cliente) => {
      const temperature = leadTemperatureMap.get(cliente.id);
      const clientFollowups = getClienteSignals(cliente.id, "followup");
      const clientOpportunities = getClienteSignals(cliente.id, "opportunity");
      const clientRisks = getClienteSignals(cliente.id, "risk");
      const clientPayments = getClienteSignals(cliente.id, "payment");
      const clientSignals = getClienteSignals(cliente.id);
      const daysUntilContact = daysBetween(cliente.proximo_contacto);
      const pipelineDays = getPipelineDays(cliente.created_at);
      const value = Number(cliente.monto || 0);
      const hasPendingPayment = !cliente.pagado && value > 0;

      const temperatureScore = getTemperatureScore(temperature);
      const overdueScore = getOverdueScore(daysUntilContact);
      const revenueScore = getRevenueScore(value);
      const signalScore =
        clientFollowups.length * 12 +
        clientOpportunities.length * 15 +
        clientRisks.length * 16 +
        clientPayments.length * 10;
      const paymentScore = hasPendingPayment ? 7 : 0;

      const score = clamp(
        Math.round(34 + temperatureScore + overdueScore + revenueScore + signalScore + paymentScore),
        0,
        100
      );

      const reasonParts = [
        temperature ? `${temperature.label} ${temperature.score}/100` : "",
        typeof daysUntilContact === "number" && daysUntilContact < 0
          ? `${Math.abs(daysUntilContact)} días vencido`
          : "",
        clientOpportunities.length > 0 ? "oportunidad activa" : "",
        clientRisks.length > 0 ? "riesgo activo" : "",
        clientPayments.length > 0 || hasPendingPayment ? "revenue pendiente" : "",
        value > 0 ? formatGs(value) : "",
      ];

      const firstAction = clientSignals.find((signal) => signal.actionHref);
      const tone = getClientTone(score);

      const paymentCount = clientPayments.length + (hasPendingPayment ? 1 : 0);

      return {
        id: cliente.id,
        name: cliente.nombre,
        status: cliente.estado,
        score,
        temperature,
        value,
        daysUntilContact,
        pipelineDays,
        lastContactLabel: getLastContactLabel(daysUntilContact, pipelineDays),
        relationshipState: getRelationshipState({
          score,
          daysUntilContact,
          riskCount: clientRisks.length,
          opportunityCount: clientOpportunities.length,
        }),
        aiConfidence: getAIConfidence(score),
        relationshipTrend: getRelationshipTrend({
          score,
          daysUntilContact,
          opportunityCount: clientOpportunities.length,
          riskCount: clientRisks.length,
          paymentCount,
        }),
        memorySummary: buildMemorySummary({
          pipelineDays,
          daysUntilContact,
          opportunityCount: clientOpportunities.length,
          riskCount: clientRisks.length,
          paymentCount,
        }),
        predictive: buildPredictiveInsight({
          score,
          temperature: temperature?.temperature,
          temperatureScore: temperature?.score,
          value,
          isPaid: cliente.pagado,
          daysUntilContact,
          pipelineDays,
          followupCount: clientFollowups.length,
          opportunityCount: clientOpportunities.length,
          riskCount: clientRisks.length,
          paymentCount,
        }),
        reason: buildReason(reasonParts),
        advisory: buildAdvisory({
          overdueDays: daysUntilContact,
          opportunityCount: clientOpportunities.length,
          riskCount: clientRisks.length,
          paymentCount,
          temperature,
        }),
        actionHref: `/dashboard/clientes/${cliente.id}`,
        actionLabel: firstAction?.actionLabel || "Abrir cliente",
        signalSummary: `${clientFollowups.length} seg. · ${clientOpportunities.length} opp. · ${clientRisks.length} riesgo · ${paymentCount} revenue`,
        tone,
      };
    })
    .filter((cliente) => cliente.score >= 45 || cliente.value > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 3);

  if (unifiedClients.length === 0) {
    return null;
  }

  const topClient = unifiedClients[0];
  const totalDetectedValue = unifiedClients.reduce((total, cliente) => total + cliente.value, 0);
  const averageScore = Math.round(
    unifiedClients.reduce((total, cliente) => total + cliente.score, 0) / unifiedClients.length
  );

  return (
    <section className="relative overflow-hidden rounded-[38px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.075)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_28%)]" />

      <div className="relative border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/45 p-5 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" />
                V17.4.1 Predictive Intelligence
              </span>

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Predicción relacional IA
              </span>
            </div>

            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">
              Top clientes IA
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Clientes que merecen atención ahora.
            </h2>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              ClienteYA fusiona señales comerciales con memoria y predicción: cierre,
              respuesta, abandono y tendencia por cliente.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 xl:min-w-[520px]">
            <div className="rounded-[22px] border border-blue-100 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">
                Score medio
              </p>
              <p className="mt-1 text-xl font-black text-slate-950">{averageScore}</p>
            </div>

            <div className="rounded-[22px] border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Valor detectado
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {formatGs(totalDetectedValue)}
              </p>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Top clientes
              </p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {unifiedClients.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative grid gap-0 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-slate-200 bg-white/90 p-5 sm:p-6 xl:border-b-0 xl:border-r xl:p-7">
          <div className="rounded-[30px] border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-[0_16px_44px_rgba(37,99,235,0.08)]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
              Cliente prioritario ahora
            </p>

            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black leading-tight text-slate-950">
                  {topClient.name}
                </h3>
                <p className="mt-2 text-sm font-bold text-slate-600">
                  {topClient.status}
                </p>
              </div>

              <span className="rounded-full border border-blue-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 shadow-sm">
                Score {topClient.score}
              </span>
            </div>

            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white/85 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Señales fusionadas
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {topClient.reason}
              </p>
            </div>

            <div className="mt-3 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Consejo founder
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-950">
                {topClient.advisory}
              </p>
            </div>

            <div className="mt-3 rounded-[22px] border border-blue-200 bg-white/90 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">
                Relación IA
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Último contacto
                  </p>
                  <p className="mt-1 text-xs font-black text-slate-950">
                    {topClient.lastContactLabel}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Pipeline
                  </p>
                  <p className="mt-1 text-xs font-black text-slate-950">
                    {topClient.pipelineDays} días
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Confianza IA
                  </p>
                  <p className="mt-1 text-xs font-black text-slate-950">
                    {topClient.aiConfidence}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Tendencia
                  </p>
                  <p className="mt-1 text-xs font-black text-slate-950">
                    {topClient.relationshipTrend}
                  </p>
                </div>
              </div>

              <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-700">
                {topClient.relationshipState} · {topClient.memorySummary}
              </p>
            </div>

            <div className="mt-3 rounded-[22px] border border-indigo-200 bg-indigo-50/80 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-indigo-700">
                Predicción IA
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Cierre
                  </p>
                  <p className="mt-1 text-xs font-black text-slate-950">
                    {topClient.predictive.closeProbability}%
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Respuesta
                  </p>
                  <p className="mt-1 text-xs font-black text-slate-950">
                    {topClient.predictive.responseProbability}%
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Abandono
                  </p>
                  <p className="mt-1 text-xs font-black text-slate-950">
                    {topClient.predictive.churnRisk}% · {topClient.predictive.churnLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Éxito
                  </p>
                  <p className="mt-1 text-xs font-black text-slate-950">
                    {topClient.predictive.successProbability}%
                  </p>
                </div>
              </div>

              <p className="mt-3 rounded-2xl border border-white/80 bg-white/85 px-3 py-2 text-xs font-bold leading-5 text-slate-700">
                {topClient.predictive.trendLabel} · {topClient.predictive.summary}
              </p>
            </div>

            <a
              href={topClient.actionHref}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-blue-950 bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_16px_38px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-950"
            >
              {topClient.actionLabel} →
            </a>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50/90 via-white to-blue-50/30 p-4 sm:p-6 xl:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Ranking unificado
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                Personas priorizadas por todas las señales conectadas.
              </p>
            </div>

            <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 sm:inline-flex">
              Hoy
            </span>
          </div>

          <div className="grid gap-3">
            {unifiedClients.map((cliente, index) => {
              const tone = getToneClasses(cliente.tone);

              return (
                <div
                  key={cliente.id}
                  className={`rounded-[28px] border p-4 shadow-[0_12px_34px_rgba(15,23,42,0.05)] ${tone.card}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${tone.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                          #{index + 1} Cliente IA
                        </span>

                        {cliente.temperature ? (
                          <LeadTemperatureBadge temperature={cliente.temperature} />
                        ) : null}
                      </div>

                      <h3 className="text-lg font-black leading-tight text-slate-950">
                        {cliente.name}
                      </h3>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        {cliente.advisory}
                      </p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                            Señales
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-950">
                            {cliente.signalSummary}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                            Valor
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-950">
                            {cliente.value > 0 ? formatGs(cliente.value) : "Sin valor directo"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                            Relación IA
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-950">
                            {cliente.relationshipState}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                            Memoria
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-950">
                            {cliente.lastContactLabel} · {cliente.relationshipTrend}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 rounded-2xl border border-white/80 bg-white/75 px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Contexto
                        </p>
                        <p className="mt-1 text-xs font-black text-slate-950">
                          {cliente.memorySummary}
                        </p>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-4">
                        <div className="rounded-2xl border border-indigo-100 bg-white/80 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-indigo-700">
                            Cierre
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-950">
                            {cliente.predictive.closeProbability}%
                          </p>
                        </div>

                        <div className="rounded-2xl border border-indigo-100 bg-white/80 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-indigo-700">
                            Respuesta
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-950">
                            {cliente.predictive.responseProbability}%
                          </p>
                        </div>

                        <div className="rounded-2xl border border-red-100 bg-white/80 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-700">
                            Abandono
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-950">
                            {cliente.predictive.churnRisk}%
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                            Tendencia
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-950">
                            {cliente.predictive.trendLabel}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:block sm:text-right">
                      <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${tone.score}`}>
                        AI score
                      </p>
                      <p className="text-2xl font-black text-slate-950">
                        {cliente.score}
                      </p>
                      <a
                        href={cliente.actionHref}
                        className="mt-0 inline-flex rounded-full border border-white/80 bg-white px-3 py-1.5 text-xs font-black text-blue-700 shadow-sm transition hover:text-blue-950 sm:mt-3"
                      >
                        Abrir →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function getRevenueActionLabel(item: RevenueForecastOpportunity) {
  if (item.riskLevel === "high") {
    return "Contactar hoy";
  }

  if (item.probability >= 70) {
    return "Cerrar siguiente paso";
  }

  if (item.probability >= 50) {
    return "Enviar propuesta";
  }

  return "Revisar contexto";
}

function RevenueForecastDetailCard({
  item,
  index,
  mode = "opportunity",
}: {
  item: RevenueForecastOpportunity;
  index: number;
  mode?: "opportunity" | "risk";
}) {
  const isRisk = mode === "risk" || item.riskLevel === "high";

  const shellClasses = isRisk
    ? "border-red-200 bg-red-50/85"
    : "border-emerald-200 bg-emerald-50/85";

  const badgeClasses = isRisk
    ? "border-red-200 bg-white text-red-700"
    : "border-emerald-200 bg-white text-emerald-700";

  const accentText = isRisk ? "text-red-700" : "text-emerald-700";
  const actionLabel = getRevenueActionLabel(item);

  return (
    <div className={`rounded-[28px] border p-4 shadow-sm ${shellClasses}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${badgeClasses}`}
            >
              #{index + 1} · {item.probability}% prob.
            </span>

            <span className="rounded-full border border-white/80 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm">
              {item.timing === "30d"
                ? "30 días"
                : item.timing === "90d"
                  ? "90 días"
                  : "Later"}
            </span>
          </div>

          <h3 className="text-base font-black leading-tight text-slate-950">
            {item.nombre}
          </h3>

          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            {item.reason}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl border border-white/80 bg-white px-4 py-3 text-left shadow-sm sm:text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
            Forecast
          </p>

          <p className={`mt-1 text-sm font-black ${accentText}`}>
            {formatGs(item.expectedRevenue)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
            Valor potencial
          </p>

          <p className="mt-1 text-xs font-black text-slate-950">
            {formatGs(item.monto)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
            Probabilidad
          </p>

          <p className="mt-1 text-xs font-black text-slate-950">
            {item.probability}%
          </p>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
            Riesgo
          </p>

          <p className="mt-1 text-xs font-black text-slate-950">
            {item.riskLevel === "high"
              ? "Alto"
              : item.riskLevel === "medium"
                ? "Medio"
                : "Bajo"}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/80 bg-white/80 px-3 py-3">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
          Acción recomendada
        </p>

        <p className="mt-1 text-xs font-black leading-5 text-slate-950">
          {actionLabel}
        </p>
      </div>

      <a
        href={`/dashboard/clientes/${item.id}`}
        className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-white/80 bg-white px-4 py-2.5 text-xs font-black text-blue-700 shadow-sm transition hover:text-blue-950 sm:w-auto"
      >
        Abrir cliente →
      </a>
    </div>
  );
}


function RevenueIntelligenceSection({
  forecast,
  healthLabel,
}: {
  forecast: RevenueForecast;
  healthLabel: string;
}) {
  const topOpportunities = forecast.topOpportunities.slice(0, 3);
  const atRiskOpportunities = forecast.atRiskOpportunities.slice(0, 3);

  return (
    <section className="relative overflow-hidden rounded-[38px] border border-emerald-200 bg-white shadow-[0_24px_80px_rgba(16,185,129,0.10)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-slate-900" />

      <div className="relative border-b border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-blue-50/50 p-5 sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                V17.5.3 Revenue Intelligence
              </span>

              <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
                Founder Forecast Engine
              </span>
            </div>

            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
              Revenue Forecast
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Ingresos esperados y riesgo comercial.
            </h2>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              ClienteYA convierte estados, montos y próximos seguimientos en una
              lectura ejecutiva de pipeline, forecast y riesgo de ingresos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:min-w-[520px]">
            <div className="rounded-[22px] border border-emerald-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Estado forecast
              </p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {healthLabel}
              </p>
            </div>

            <div className="rounded-[22px] border border-blue-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">
                Conversión esperada
              </p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {forecast.expectedConversion}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative grid gap-0 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-emerald-100 bg-white/90 p-5 sm:p-6 xl:border-b-0 xl:border-r xl:p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <CockpitMetricCard
              label="Pipeline"
              value={formatGs(forecast.pipelineValue)}
              description={`${forecast.openOpportunities} oportunidad(es) abiertas detectadas.`}
              tone="sky"
            />

            <CockpitMetricCard
              label="Forecast 30d"
              value={formatGs(forecast.forecast30Days)}
              description="Ingreso esperado por oportunidades próximas."
              tone="emerald"
            />

            <CockpitMetricCard
              label="Forecast 90d"
              value={formatGs(forecast.forecast90Days)}
              description="Proyección acumulada de corto y medio plazo."
              tone="amber"
            />

            <CockpitMetricCard
              label="En riesgo"
              value={formatGs(forecast.revenueAtRisk)}
              description="Valor que necesita seguimiento o recuperación."
              tone="red"
            />
          </div>

          <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Lectura ejecutiva
            </p>

            <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
              {forecast.summary}
            </p>

            <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black leading-6 text-blue-800">
              💡 {forecast.recommendation}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50/90 via-white to-emerald-50/35 p-4 sm:p-6 xl:p-7">
          <div className="grid gap-5 xl:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                    Top opportunities
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    Mayor valor esperado para priorizar cierre.
                  </p>
                </div>

                <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 sm:inline-flex">
                  Forecast
                </span>
              </div>

              <div className="space-y-3">
                {topOpportunities.length === 0 ? (
                  <EmptySignal tone="slate">
                    No hay oportunidades abiertas suficientes para priorizar.
                  </EmptySignal>
                ) : (
                  topOpportunities.map((item, index) => (
                    <RevenueForecastDetailCard
                      key={item.id}
                      item={item}
                      index={index}
                      mode="opportunity"
                    />
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700">
                    Revenue at risk
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    Ingresos que pueden perderse sin acción.
                  </p>
                </div>

                <span className="hidden rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-700 sm:inline-flex">
                  Riesgo
                </span>
              </div>

              <div className="space-y-3">
                {atRiskOpportunities.length === 0 ? (
                  <EmptySignal>
                    ✅ No hay ingresos críticos en riesgo detectados ahora.
                  </EmptySignal>
                ) : (
                  atRiskOpportunities.map((item, index) => (
                    <RevenueForecastDetailCard
                      key={item.id}
                      item={item}
                      index={index}
                      mode="risk"
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function EmptySignal({
  children,
  tone = "emerald",
}: {
  children: ReactNode;
  tone?: "emerald" | "slate";
}) {
  if (tone === "slate") {
    return (
      <p className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700">
        {children}
      </p>
    );
  }

  return (
    <p className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
      {children}
    </p>
  );
}

export default async function AICockpitPage() {
  const authSupabase = await createAuthServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await authSupabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const access = canAccessAICockpit(profile as ProfileAccess);

  if (!access.allowed) {
    return (
      <div className="dashboard-shell">
        <AppHeader />

        <main className="dashboard-main">
          <div className="flex min-h-screen bg-slate-50/60">
            <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
              <SidebarNav />
            </aside>

            <div className="flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-10">
              <div className="mx-auto w-full max-w-[1800px]">
                <UpgradeGate
                  title="Centro ejecutivo AI Pro"
                  description="El AI Cockpit requiere un plan Pro o Enterprise para desbloquear inteligencia ejecutiva, señales comerciales y recomendaciones avanzadas."
                />
              </div>
            </div>
          </div>
        </main>

        <MobileDashboardNav />
      </div>
    );
  }

  const { data: clientesData } = await authSupabase
  .from("clientes")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

  const clientes: Cliente[] = (clientesData || []).map((cliente) =>
    normalizeCliente(cliente as Partial<Cliente>)
  );

  const cockpitClientes: ClienteForAICockpit[] = clientes.map((cliente) => ({
    id: cliente.id,
    nombre: cliente.nombre,
    estado: cliente.estado,
    telefono: cliente.telefono,
    notas: cliente.notas,
    recordatorio: cliente.recordatorio,
    proximo_contacto: cliente.proximo_contacto,
    pagado: cliente.pagado,
    monto: cliente.monto,
    created_at: cliente.created_at,
  }));

  const leadTemperatures = clientes.map((cliente) => ({
    id: cliente.id,
    data: getLeadTemperature(cliente),
  }));

  const hotLeads = leadTemperatures.filter(
    (lead) => lead.data.temperature === "hot"
  ).length;

  const warmLeads = leadTemperatures.filter(
    (lead) => lead.data.temperature === "warm"
  ).length;

  const coldLeads = leadTemperatures.filter(
    (lead) => lead.data.temperature === "cold"
  ).length;

  const inactiveLeads = leadTemperatures.filter(
    (lead) => lead.data.temperature === "inactive"
  ).length;

  const leadTemperatureMap = new Map(
    leadTemperatures.map((lead) => [lead.id, lead.data])
  );

  const briefing = buildFounderBriefing(cockpitClientes);
  const recommendations = buildAICockpitRecommendations(cockpitClientes);
  const enterpriseMetrics = buildEnterpriseMetrics(clientes);
  const revenueForecast = buildRevenueForecast(clientes);
  const revenueHealth = getRevenueForecastHealth(revenueForecast);
  const founderActions = buildFounderActions(clientes, revenueForecast);
  const commercialMemoryResults = buildCommercialMemoryOSList(clientes);
  const founderCommercialMemoryCenter =
    buildFounderCommercialMemoryCenter(commercialMemoryResults);

  const risks = briefing.insights.filter((item) => item.type === "risk");
  const opportunities = briefing.insights.filter(
    (item) => item.type === "opportunity"
  );
  const followups = briefing.insights.filter((item) => item.type === "followup");
  const payments = briefing.insights.filter((item) => item.type === "payment");

  const cockpitUnifiedSignalSources = [
    ...briefing.insights.map((insight) => {
      const cliente = insight.clienteId
        ? clientes.find((item) => item.id === insight.clienteId)
        : null;

      return {
        id: `insight-${insight.id}`,
        clientId: insight.clienteId ?? null,
        clientName: cliente?.nombre ?? insight.title,
        title: insight.title,
        description: insight.description,
        category: getUnifiedSignalCategory(insight.type),
        priority: getUnifiedSignalPriority(insight.priority),
        score: getUnifiedSignalScore(insight.priority),
        amount:
          insight.type === "opportunity" ||
          insight.type === "payment" ||
          insight.type === "growth"
            ? Number(cliente?.monto || 0)
            : 0,
        actionLabel: insight.actionLabel || "Abrir cliente",
        actionHref: insight.clienteId
          ? `/dashboard/clientes/${insight.clienteId}`
          : insight.actionHref || "/dashboard/clientes",
      };
    }),

    ...founderActions.map((action) => ({
      id: `founder-action-${action.id}`,
      clientId: action.actionHref?.includes("/dashboard/clientes/")
        ? action.actionHref.split("/dashboard/clientes/")[1] || null
        : null,
      clientName: action.title,
      title: action.title,
      description: action.description,
      category:
        action.priority === "critical" || action.priority === "high"
          ? "risk"
          : "followup",
      priority: getFounderActionUnifiedPriority(action.priority),
      score:
        action.priority === "critical"
          ? 95
          : action.priority === "high"
            ? 80
            : action.priority === "medium"
              ? 60
              : 40,
      amount: Number(action.impact || 0),
      actionLabel: action.actionLabel || "Abrir acción",
      actionHref: action.actionHref || "/dashboard/clientes",
    })),

    ...revenueForecast.topOpportunities.slice(0, 5).map((item) => ({
      id: `revenue-opportunity-${item.id}`,
      clientId: item.id,
      clientName: item.nombre,
      title: `${item.nombre}: oportunidad comercial`,
      description: item.reason,
      category: "revenue",
      priority:
        item.riskLevel === "high"
          ? "high"
          : item.probability >= 70
            ? "high"
            : "medium",
      score: item.probability,
      amount: Number(item.expectedRevenue || item.monto || 0),
      actionLabel: "Abrir cliente",
      actionHref: `/dashboard/clientes/${item.id}`,
    })),
 ] as CockpitSignalSource[];

  const cockpitUnifiedSignals = buildCockpitIntelligenceDeduplication(
    cockpitUnifiedSignalSources,
  );

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="min-w-0 flex-1 px-4 pb-36 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8 2xl:px-12">
            <div className="mx-auto w-full max-w-[1800px]">
              <div className="mb-6 overflow-hidden rounded-[36px] border border-slate-100 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                <div className="bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 text-slate-950 sm:p-8 xl:p-10">
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-950">
                      🧠 AI Cockpit
                    </span>

                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                      ClienteYA Founder OS
                    </span>

                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                      Enterprise Intelligence
                    </span>
                  </div>

                  <div className="grid gap-10 xl:grid-cols-[1.25fr_0.75fr] xl:items-stretch">
                    <div className="flex flex-col justify-between">
                      <div>
                        <h1 className="max-w-5xl text-3xl font-black tracking-tight sm:text-4xl xl:text-5xl xl:text-6xl">
                          Centro de inteligencia ejecutiva
                        </h1>

                        <p className="mt-5 max-w-4xl text-base leading-relaxed text-blue-700 sm:text-lg">
                          Vista premium para detectar riesgos, oportunidades,
                          presión operativa, momentum de ingresos y señales
                          comerciales antes de que se conviertan en problemas.
                        </p>
                      </div>

                      <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                          Lectura estratégica
                        </p>

                        <p className="mt-3 text-base font-bold leading-relaxed text-slate-950">
                          {briefing.summary}
                        </p>
                      </div>
                    </div>

                    <FounderScorePanel metrics={enterpriseMetrics} />
                  </div>

                  {clientes.length > 0 ? (
                    <div className="mt-6">
                      <ExecutiveTrendStrip metrics={enterpriseMetrics} />
                    </div>
                  ) : null}
                </div>
              </div>

              {clientes.length === 0 && (
                <EmptyState
                  icon="🧠"
                  title="El AI Cockpit todavía no tiene datos"
                  description="Agrega tus primeros clientes para que ClienteYA pueda construir una lectura ejecutiva con riesgos, oportunidades, seguimientos y señales comerciales."
                  actionHref="/dashboard/nuevo"
                  actionLabel="+ Crear cliente"
                />
              )}

              {clientes.length > 0 && (
                <div className="space-y-6">
                  <FounderAIExecutiveAdvisorPanel
                    clients={clientes}
                  />

                  <CockpitUnifiedSignalsPanel result={cockpitUnifiedSignals} />

                  <FounderStrategicSignalsPanel
                    responseRate={Math.min(
                      100,
                      Math.round(
                        (enterpriseMetrics.recentClients /
                          Math.max(clientes.length, 1)) *
                          100,
                      ),
                    )}
                    conversionRate={Math.min(
                      100,
                      Math.round(
                        (enterpriseMetrics.paidClients /
                          Math.max(clientes.length, 1)) *
                          100,
                      ),
                    )}
                    followupRate={Math.min(
                      100,
                      Math.round(
                        ((clientes.length -
                          enterpriseMetrics.overdueFollowups) /
                          Math.max(clientes.length, 1)) *
                          100,
                      ),
                    )}
                    activeClients={enterpriseMetrics.recentClients}
                    opportunities={
                      enterpriseMetrics.dueSoonFollowups +
                      enterpriseMetrics.overdueFollowups
                    }
                    revenue={enterpriseMetrics.confirmedRevenue}
                  />

                  <FounderKpiIntelligencePanel
                    input={{
                      sector: "general",
                      totalClients: clientes.length,
                      activeClients: enterpriseMetrics.recentClients,
                      clientsToContactToday: enterpriseMetrics.dueSoonFollowups,
                      overdueClients: enterpriseMetrics.overdueFollowups,
                      paidClients: enterpriseMetrics.paidClients,
                      unpaidClients: enterpriseMetrics.unpaidClients,
                      totalRevenue: enterpriseMetrics.confirmedRevenue,
                    }}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                    <CockpitMetricCard
                      label="Riesgos"
                      value={briefing.riskCount}
                      description="Clientes con posible pérdida, baja respuesta o fricción comercial."
                      tone="red"
                    />

                    <CockpitMetricCard
                      label="Seguimientos"
                      value={briefing.followupCount}
                      description="Acciones vencidas, próximas o prioritarias detectadas."
                      tone="amber"
                    />

                    <CockpitMetricCard
                      label="Oportunidades"
                      value={briefing.opportunityCount}
                      description="Clientes con señales de avance o potencial comercial."
                      tone="emerald"
                    />

                    <CockpitMetricCard
                      label="Ingresos"
                      value={formatGs(briefing.totalRevenue)}
                      description="Ingresos confirmados detectados en la cartera."
                      tone="sky"
                    />
                  </div>

                  <FounderOpportunityEnginePanel
                    clients={clientes}
                  />

                  <FounderRiskForecastPanel
                    clients={clientes}
                  />

                  <RevenueIntelligenceSection
                    forecast={revenueForecast}
                    healthLabel={revenueHealth.label}
                  />

                  <FounderRevenueLeversPanel
                    clients={clientes}
                  />

                  <FounderGrowthEnginePanel
                    clients={clientes}
                  />

                  <FounderCommercialMemoryCenterPanel
                    center={founderCommercialMemoryCenter}
                  />

                  <FounderMemoryBriefingPanel clients={clientes} />

                  <FounderIntelligenceVisuals metrics={enterpriseMetrics} />

                  <LeadTemperatureOverview
                    hot={hotLeads}
                    warm={warmLeads}
                    cold={coldLeads}
                    inactive={inactiveLeads}
                  />

                  <SectionCard
                    badge="Resumen ejecutivo"
                    title={briefing.title}
                    description={briefing.summary}
                  >
                    <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
                      <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          Lectura principal
                        </p>

                        <p className="mt-3 text-base font-bold leading-relaxed text-slate-900">
                          {briefing.summary}
                        </p>
                      </div>

                      <div className="rounded-[26px] border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                          Lectura ejecutiva
                        </p>

                        <p className="mt-3 text-sm font-bold leading-relaxed text-blue-900">
                          Revenue momentum {enterpriseMetrics.revenueLabel} ·
                          presión operativa{" "}
                          {enterpriseMetrics.operationalLabel.toLowerCase()} ·
                          pipeline{" "}
                          {enterpriseMetrics.pipelineLabel.toLowerCase()}.
                        </p>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    badge="Recomendaciones inteligentes"
                    title="Acciones ejecutivas sugeridas"
                    description="ClienteYA convierte las señales de tu cartera en próximos pasos claros."
                  >
                    <div className="grid gap-4 xl:grid-cols-2">
                      {recommendations.length === 0 && (
                        <EmptySignal tone="slate">
                          Todavía no hay recomendaciones ejecutivas suficientes.
                          Agrega más clientes o actualiza estados para mejorar el
                          análisis.
                        </EmptySignal>
                      )}

                      {recommendations.map((recommendation) => (
                        <RecommendationCard
                          key={recommendation.id}
                          recommendation={recommendation}
                        />
                      ))}
                    </div>
                  </SectionCard>


                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <MobileDashboardNav />
    </div>
  );
}

function LiveCommandWall({
  metrics,
  risks,
  followups,
  opportunities,
  payments,
}: {
  metrics: EnterpriseMetrics;
  risks: AICockpitInsight[];
  followups: AICockpitInsight[];
  opportunities: AICockpitInsight[];
  payments: AICockpitInsight[];
}) {
  const events = [
    ...risks.slice(0, 2).map((item) => ({
      title: item.title,
      label: "RIESGO",
      tone: "red" as const,
    })),
    ...followups.slice(0, 2).map((item) => ({
      title: item.title,
      label: "SEGUIMIENTO",
      tone: "amber" as const,
    })),
    ...opportunities.slice(0, 2).map((item) => ({
      title: item.title,
      label: "OPORTUNIDAD",
      tone: "emerald" as const,
    })),
    ...payments.slice(0, 1).map((item) => ({
      title: item.title,
      label: "REVENUE",
      tone: "blue" as const,
    })),
  ].slice(0, 6);

  const urgentActions = risks.length + followups.length;
  const opportunityActions = opportunities.length + payments.length;
  const navigationStatus =
    urgentActions > 0
      ? "Acción requerida"
      : opportunityActions > 0
        ? "Oportunidades activas"
        : "Operación controlada";

  return (
    <div className="mb-6 overflow-hidden rounded-[34px] border border-slate-200 bg-white text-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.07)] ring-1 ring-blue-100/70">
      <div className="relative p-5 sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%)]" />

        <div className="relative">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.95)]" />
                  AI activo · V17.4.1
                </span>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                  Navigation layer
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
                Centro ejecutivo LATAM
              </h2>

              <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-blue-700">
                ClienteYA conecta clientes, seguimiento, riesgo y oportunidad en
                una lectura clara para saber qué merece atención ahora.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[620px]">
              <LiveWallMetric label="Score" value={`${metrics.founderScore}`} />
              <LiveWallMetric label="Presión" value={`${metrics.operationalPressure}`} />
              <LiveWallMetric label="Riesgos" value={`${risks.length}`} />
              <LiveWallMetric label="Ruta AI" value={`${events.length}`} />
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-white/92 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)] backdrop-blur">
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr] xl:items-stretch">
              <div className="flex flex-col justify-between rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                    Siguiente mejor acción
                  </p>

                  <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                    {navigationStatus}
                  </h3>

                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-600">
                    La capa AI conecta señales de clientes, agenda comercial,
                    pagos y seguimiento para reducir el riesgo de olvidar una
                    oportunidad importante.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] border border-red-100 bg-red-50/70 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-700">
                      No perder
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {urgentActions} acciones
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                      Aprovechar
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {opportunityActions} señales
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-blue-100 bg-blue-50/70 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">
                      Monitoreo
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      Activo
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <LiveWallStatus label="Ingresos" value={metrics.revenueLabel} />
                <LiveWallStatus label="Operación" value={metrics.operationalLabel} />
                <LiveWallStatus label="Pipeline" value={metrics.pipelineLabel} />
                <LiveWallStatus label="Ejecución" value={metrics.executionLabel} />
              </div>
            </div>
          </div>

          {events.length > 0 ? (
            <div className="mt-5 rounded-[28px] border border-slate-200 bg-white/86 p-5 backdrop-blur">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                    Ruta inteligente
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    Las señales más importantes conectadas en una sola cola de acción.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                  {events.length} prioridades
                </span>
              </div>

              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {events.map((event, index) => (
                  <LiveEventCard
                    key={`${event.title}-${index}`}
                    index={index + 1}
                    label={event.label}
                    title={event.title}
                    tone={event.tone}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LiveWallMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}


function LiveWallStatus({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
          {label}
        </p>

        <p className="text-sm font-black text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function LiveEventCard({
  index,
  label,
  title,
  tone,
}: {
  index: number;
  label: string;
  title: string;
  tone: "red" | "amber" | "emerald" | "blue";
}) {
  const classes = {
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className={`rounded-[24px] border p-4 ${classes[tone]}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
          #{index} · {label}
        </span>

        <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
      </div>

      <p className="line-clamp-2 text-sm font-black leading-snug text-slate-950">
        {title}
      </p>
    </div>
  );
}

