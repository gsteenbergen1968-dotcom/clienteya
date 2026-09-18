import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";

import {
  buildExecutiveCockpitReport,
  type ExecutiveCockpitCommercialAction,
  type ExecutiveCockpitRelationship,
} from "../../../lib/executive-cockpit-engine";

import {
  buildExecutiveMetrics,
  type ExecutiveMetrics,
} from "../../../lib/executive-metrics-engine";

import {
  canAccessAICockpit,
  type ProfileAccess,
} from "../../../lib/access-control";

import {
  buildCommercialActions,
  type CommercialAction,
  type CommercialRelationship,
} from "../../../lib/commercial-action-engine";

import type {
  RelationshipRecord,
} from "../../../lib/relationship-repository";

import { AppHeader } from "../../components/AppHeader";
import EmptyState from "../../components/EmptyState";
import UpgradeGate from "../../components/UpgradeGate";
import SidebarNav from "../SidebarNav";
import ExecutiveCockpitChaptersSkeleton from "./components/ExecutiveCockpitChaptersSkeleton";

export const dynamic = "force-dynamic";

type FounderTone =
  | "critical"
  | "warning"
  | "healthy"
  | "excellent";

function normalizeText(
  value: string | null | undefined,
): string {
  return (value || "")
    .trim()
    .toLowerCase();
}

function safeAmount(
  value: number | null | undefined,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    value,
  );
}

function getRelationshipName(
  relationship: RelationshipRecord,
): string {
  return (
    relationship.name?.trim() ||
    relationship.company?.trim() ||
    "Relación sin nombre"
  );
}

function isPaidRelationship(
  relationship: RelationshipRecord,
): boolean {
  if (
    Boolean(
      relationship.paid_at,
    )
  ) {
    return true;
  }

  const status = normalizeText(
    relationship.status,
  );

  return (
    status.includes("pag") ||
    status.includes("convert")
  );
}

function getExpectedAmount(
  relationship: RelationshipRecord,
): number {
  return safeAmount(
    relationship.expected_amount,
  );
}

function getPaidAmount(
  relationship: RelationshipRecord,
): number {
  const paidAmount =
    safeAmount(
      relationship.paid_amount,
    );

  if (
    paidAmount > 0
  ) {
    return paidAmount;
  }

  if (
    isPaidRelationship(
      relationship,
    )
  ) {
    return getExpectedAmount(
      relationship,
    );
  }

  return 0;
}

function getRelationshipAmount(
  relationship: RelationshipRecord,
): number {
  return isPaidRelationship(
    relationship,
  )
    ? getPaidAmount(
        relationship,
      )
    : getExpectedAmount(
        relationship,
      );
}

function getRelationshipCurrency(
  relationship: RelationshipRecord,
): "PYG" | "USD" {
  return relationship.currency === "USD"
    ? "USD"
    : "PYG";
}

function toCommercialRelationship(
  relationship: RelationshipRecord,
): CommercialRelationship {
  return {
    id:
      relationship.id,

    owner_id:
      relationship.owner_id,

    name:
      getRelationshipName(
        relationship,
      ),

    phone:
      relationship.phone,

    status:
      relationship.status,

    notes:
      relationship.notes,

    reminder:
      relationship.reminder,

    next_contact_at:
      relationship.next_contact_at,

    created_at:
      relationship.created_at,

    updated_at:
      relationship.updated_at,

    expected_amount:
      getExpectedAmount(
        relationship,
      ),

    paid_amount:
      getPaidAmount(
        relationship,
      ),

    currency:
      getRelationshipCurrency(
        relationship,
      ),

    paid_at:
      relationship.paid_at,

    invoice_number:
      relationship.invoice_number,

    payment_description:
      relationship.payment_description,

    amount:
      getRelationshipAmount(
        relationship,
      ),

    paid:
      isPaidRelationship(
        relationship,
      ),

    memory:
      null,
  };
}

function toExecutiveCockpitRelationship(
  relationship: RelationshipRecord,
): ExecutiveCockpitRelationship {
  return {
    id:
      relationship.id,

    owner_id:
      relationship.owner_id,

    name:
      getRelationshipName(
        relationship,
      ),

    company:
      relationship.company,

    phone:
      relationship.phone,

    email:
      relationship.email,

    status:
      relationship.status,

    notes:
      relationship.notes,

    reminder:
      relationship.reminder,

    next_contact_at:
      relationship.next_contact_at,

    created_at:
      relationship.created_at,

    updated_at:
      relationship.updated_at,

    last_contact_at:
      relationship.last_contact_at,

    expected_amount:
      getExpectedAmount(
        relationship,
      ),

    paid_amount:
      getPaidAmount(
        relationship,
      ),

    currency:
      getRelationshipCurrency(
        relationship,
      ),

    paid_at:
      relationship.paid_at,

    invoice_number:
      relationship.invoice_number,

    payment_description:
      relationship.payment_description,

    paid:
      isPaidRelationship(
        relationship,
      ),

    expectedValue:
      getExpectedAmount(
        relationship,
      ),

    expected_value:
      getExpectedAmount(
        relationship,
      ),
  };
}

function getExecutiveActionPriority(
  action: CommercialAction,
): ExecutiveCockpitCommercialAction["priority"] {
  if (
    action.priority ===
    "critical"
  ) {
    return "urgent";
  }

  if (
    action.priority ===
    "high"
  ) {
    return "high";
  }

  if (
    action.priority ===
    "medium"
  ) {
    return "medium";
  }

  return "normal";
}

function getExecutiveActionCategory(
  action: CommercialAction,
): ExecutiveCockpitCommercialAction["category"] {
  if (
    action.bucket ===
    "overdue"
  ) {
    return "overdue";
  }

  if (
    action.bucket ===
    "today"
  ) {
    return "today";
  }

  if (
    action.bucket ===
      "tomorrow" ||
    action.bucket ===
      "day_after_tomorrow" ||
    action.bucket ===
      "next_14_days"
  ) {
    return "upcoming";
  }

  const status =
    normalizeText(
      action.status,
    );

  if (
    status.includes("riesgo") ||
    status.includes("sin respuesta") ||
    status.includes("perdido")
  ) {
    return "risk";
  }

  if (
    status.includes("interes") ||
    status.includes("lead") ||
    status.includes("oportun")
  ) {
    return "opportunity";
  }

  if (
    action.amount > 0 &&
    !action.paid
  ) {
    return "payment";
  }

  if (
    action.nextContactAt
  ) {
    return "followup";
  }

  return "relationship";
}

function toExecutiveCockpitAction(
  action: CommercialAction,
): ExecutiveCockpitCommercialAction {
  return {
    id:
      action.id,

    relationshipId:
      action.relationshipId,

    relationshipName:
      action.name,

    title:
      action.headline,

    description:
      action.reason,

    priority:
      getExecutiveActionPriority(
        action,
      ),

    category:
      getExecutiveActionCategory(
        action,
      ),

    expectedRevenue:
      action.paid
        ? 0
        : safeAmount(
            action.amount,
          ),

    dueDate:
      action.nextContactAt,
  };
}

function getFounderTone(
  score: number,
): FounderTone {
  if (
    score >= 85
  ) {
    return "excellent";
  }

  if (
    score >= 70
  ) {
    return "healthy";
  }

  if (
    score >= 50
  ) {
    return "warning";
  }

  return "critical";
}

function getFounderToneClasses(
  tone: FounderTone,
) {
  if (
    tone ===
    "excellent"
  ) {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (
    tone ===
    "healthy"
  ) {
    return "border-sky-300 bg-sky-50 text-sky-800";
  }

  if (
    tone ===
    "warning"
  ) {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  return "border-red-300 bg-red-50 text-red-800";
}

function getFounderToneLabel(
  tone: FounderTone,
) {
  if (
    tone ===
    "excellent"
  ) {
    return "Excelente";
  }

  if (
    tone ===
    "healthy"
  ) {
    return "Saludable";
  }

  if (
    tone ===
    "warning"
  ) {
    return "Atención";
  }

  return "Crítico";
}

function buildStrategicSummary(
  metrics: ExecutiveMetrics,
) {
  if (
    metrics.overdueRelationships >
    0
  ) {
    return `${metrics.overdueRelationships} relación${
      metrics.overdueRelationships === 1
        ? ""
        : "es"
    } requieren seguimiento vencido. La prioridad es recuperar continuidad antes de ampliar presión comercial.`;
  }

  if (
    metrics.risks >
    0
  ) {
    return `ClienteYA detecta ${metrics.risks} señal${
      metrics.risks === 1
        ? ""
        : "es"
    } de riesgo dentro de la cartera. Conviene proteger primero las relaciones sensibles.`;
  }

  if (
    metrics.opportunities >
    0
  ) {
    return `Hay ${metrics.opportunities} oportunidad${
      metrics.opportunities === 1
        ? ""
        : "es"
    } activa${
      metrics.opportunities === 1
        ? ""
        : "s"
    }. El foco ejecutivo puede estar en convertir valor sin perder disciplina de seguimiento.`;
  }

  if (
    metrics.totalRelationships >
    0
  ) {
    return "La operación comercial está estable. Mantén ritmo, memoria y próximos pasos claros para que ClienteYA siga construyendo inteligencia útil.";
  }

  return "ClienteYA todavía necesita relaciones para construir una lectura ejecutiva confiable.";
}

function FounderScorePanel({
  metrics,
}: {
  metrics: ExecutiveMetrics;
}) {
  const founderTone =
    getFounderTone(
      metrics.founderScore,
    );

  return (
    <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Puntuación ejecutiva
          </p>

          <p className="mt-4 text-5xl font-black leading-none text-slate-950">
            {metrics.founderScore}
            <span className="text-2xl text-blue-700">
              /100
            </span>
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${getFounderToneClasses(
            founderTone,
          )}`}
        >
          {getFounderToneLabel(
            founderTone,
          )}
        </span>
      </div>

      <p className="mt-5 text-sm font-semibold leading-relaxed text-blue-700">
        Puntuación ejecutiva basada en ingresos, presión operativa, velocidad del
        pipeline y calidad de ejecución comercial.
      </p>
    </div>
  );
}

export default async function AICockpitPage() {
  const authSupabase =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: profile,
  } =
    await authSupabase
      .from("profiles")
      .select("*")
      .eq(
        "id",
        user.id,
      )
      .single();

  const access =
    canAccessAICockpit(
      profile as ProfileAccess,
    );

  if (
    !access.allowed
  ) {
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
                  title="Centro estratégico Pro"
                  description="El Cockpit requiere un plan Pro o Enterprise para desbloquear inteligencia ejecutiva, señales comerciales y recomendaciones avanzadas."
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const {
    data:
      relationshipsData,
    error:
      relationshipsError,
  } =
    await authSupabase
      .from("relationships")
      .select("*")
      .eq(
        "owner_id",
        user.id,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );

  if (
    relationshipsError
  ) {
    throw new Error(
      relationshipsError.message,
    );
  }

  const relationships =
    (
      relationshipsData ||
      []
    ) as RelationshipRecord[];

  const commercialRelationships =
    relationships.map(
      toCommercialRelationship,
    );

  const executiveCockpitRelationships =
    relationships.map(
      toExecutiveCockpitRelationship,
    );

  const commercialActions =
    buildCommercialActions({
      relationships:
        commercialRelationships,
    });

  const executiveCockpitActions =
    commercialActions.map(
      toExecutiveCockpitAction,
    );

  const enterpriseMetrics =
    buildExecutiveMetrics({
      relationships:
        executiveCockpitRelationships,
      actions:
        executiveCockpitActions,
    });

  const executiveCockpitReport =
    buildExecutiveCockpitReport({
      relationships:
        executiveCockpitRelationships,
      actions:
        executiveCockpitActions,
    });

  const executiveHealthMetrics = {
    founderScore:
      enterpriseMetrics.founderScore,

    revenueMomentum:
      enterpriseMetrics.revenueMomentum,

    operationalPressure:
      enterpriseMetrics.operationalPressure,

    executionQuality:
      enterpriseMetrics.executionQuality,

    pipelineVelocity:
      enterpriseMetrics.pipelineVelocity,

    confirmedRevenue:
      enterpriseMetrics.confirmedRevenue,

    openRevenue:
      enterpriseMetrics.openRevenue,

    confirmedRevenueUsd:
      enterpriseMetrics.confirmedRevenueUsd,

    openRevenueUsd:
      enterpriseMetrics.openRevenueUsd,

    overdueFollowups:
      enterpriseMetrics.overdueRelationships,

    dueSoonFollowups:
      enterpriseMetrics.dueSoonRelationships,

    paidRelationships:
      enterpriseMetrics.paidRelationships,

    unpaidRelationships:
      enterpriseMetrics.unpaidRelationships,
  };

  const strategicSummary =
    buildStrategicSummary(
      enterpriseMetrics,
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
                      Centro estratégico
                    </span>

                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                      Sistema de decisión ClienteYA
                    </span>
                  </div>

                  <div className="grid gap-10 xl:grid-cols-[1.25fr_0.75fr] xl:items-stretch">
                    <div className="flex flex-col justify-between">
                      <div>
                        <h1 className="max-w-5xl text-3xl font-black tracking-tight sm:text-4xl xl:text-5xl">
                          Centro de inteligencia ejecutiva
                        </h1>

                        <p className="mt-5 max-w-4xl text-base leading-relaxed text-blue-700 sm:text-lg">
                          Seis capítulos. Seis preguntas estratégicas. Solo la
                          información necesaria para tomar mejores decisiones.
                        </p>
                      </div>

                      <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                          Lectura estratégica
                        </p>

                        <p className="mt-3 text-base font-bold leading-relaxed text-slate-950">
                          {strategicSummary}
                        </p>
                      </div>
                    </div>

                    <FounderScorePanel
                      metrics={
                        enterpriseMetrics
                      }
                    />
                  </div>
                </div>
              </div>

              {relationships.length ===
              0 ? (
                <EmptyState
                  icon="🧠"
                  title="El Cockpit todavía no tiene datos"
                  description="Agrega tus primeras relaciones para que ClienteYA pueda construir una lectura ejecutiva con riesgos, oportunidades, seguimientos y señales comerciales."
                  actionHref="/dashboard/new"
                  actionLabel="+ Crear relación"
                />
              ) : (
                <ExecutiveCockpitChaptersSkeleton
                  report={
                    executiveCockpitReport
                  }
                  healthMetrics={
                    executiveHealthMetrics
                  }
                  relationships={
                    commercialRelationships
                  }
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}