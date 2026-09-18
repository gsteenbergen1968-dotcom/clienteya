import { adaptRelationshipMemory } from "./relationship-memory-adapter";
import {
  buildRelationshipMemory,
  type RelationshipMemoryProfile,
} from "./relationship-memory";
import type { RelationshipRecord } from "./relationship-repository";

export type DailyFocusItem = {
  relationship: RelationshipRecord;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium";
  action:
    | "contact_now"
    | "close_sale"
    | "reactivate"
    | "schedule_followup"
    | "relationship";
  score: number;
};

export type DailyFocusEngine = {
  summary: string;
  operationalAdvice: string;
  topPriorities: DailyFocusItem[];
  hotLeads: DailyFocusItem[];
  ghostingRisks: DailyFocusItem[];
  revenueOpportunities: DailyFocusItem[];
  noTouchRisks: DailyFocusItem[];
  stats: {
    critical: number;
    high: number;
    medium: number;
    hotLeads: number;
    ghostingRisks: number;
    revenuePipeline: number;
  };
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(
  date: string | null | undefined,
  today: string,
): number | null {
  if (!date) return null;

  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);

  if (Number.isNaN(target.getTime()) || Number.isNaN(current.getTime())) {
    return null;
  }

  return Math.round(
    (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function normalizeText(
  value: string | null | undefined,
): string {
  return (value || "").trim().toLowerCase();
}

function getRelationshipName(relationship: RelationshipRecord): string {
  return (
    relationship.name?.trim() ||
    relationship.company?.trim() ||
    "Relación sin nombre"
  );
}

function getRelationshipAmount(
  relationship: RelationshipRecord,
): number {
  void relationship;
  return 0;
}

function getRelationshipPaid(
  relationship: RelationshipRecord,
): boolean {
  const status = normalizeText(relationship.status);

  return (
    status.includes("pag") ||
    status.includes("convert")
  );
}

function getRelationshipPaymentDate(
  relationship: RelationshipRecord,
): string | null {
  void relationship;
  return null;
}

function buildRelationshipMemoryProfile(
  relationship: RelationshipRecord,
): RelationshipMemoryProfile {
  const model = adaptRelationshipMemory({
    id: relationship.id,
    name: getRelationshipName(relationship),
    phone: relationship.phone,
    status: relationship.status,
    notes: relationship.notes,
    reminder: relationship.reminder,
    next_follow_up_at: relationship.next_contact_at,
    estimated_value: getRelationshipAmount(relationship),
    pagado: getRelationshipPaid(relationship),
    payment_date: getRelationshipPaymentDate(relationship),
    created_at: relationship.created_at,
  });

  return buildRelationshipMemory(model);
}

function buildPriority(
  score: number,
): DailyFocusItem["priority"] {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";

  return "medium";
}

function buildAction(
  memory: RelationshipMemoryProfile,
): DailyFocusItem["action"] {
  if (memory.recommendedAction === "close") {
    return "close_sale";
  }

  if (memory.recommendedAction === "reactivate") {
    return "reactivate";
  }

  if (memory.recommendedAction === "maintain_relationship") {
    return "relationship";
  }

  if (memory.recommendedAction === "schedule") {
    return "schedule_followup";
  }

  return "contact_now";
}

function buildDescription(
  relationship: RelationshipRecord,
  memory: RelationshipMemoryProfile,
): string {
  const amount = getRelationshipAmount(relationship);

  const valueText =
    amount > 0
      ? ` Potencial: ${amount.toLocaleString("es-PY")} PYG.`
      : "";

  return `${memory.summary} ${memory.nextBestStep}${valueText}`;
}

function buildTitle(
  relationship: RelationshipRecord,
  memory: RelationshipMemoryProfile,
): string {
  const name = getRelationshipName(relationship);

  if (memory.salesTemperature === "hot") {
    return `🔥 ${name} puede cerrar hoy`;
  }

  if (memory.ghostingRisk === "high") {
    return `⚠️ ${name} está desapareciendo`;
  }

  if (memory.salesTemperature === "closed") {
    return `💚 Mantener relación con ${name}`;
  }

  if (memory.followupFatigue === "high") {
    return `🧠 ${name} necesita menos presión`;
  }

  return `📌 Seguimiento para ${name}`;
}

function buildFocusItem(
  relationship: RelationshipRecord,
): DailyFocusItem {
  const memory = buildRelationshipMemoryProfile(relationship);

  return {
    relationship,
    title: buildTitle(relationship, memory),
    description: buildDescription(relationship, memory),
    priority: buildPriority(memory.score),
    action: buildAction(memory),
    score: memory.score,
  };
}

export function buildDailyFocus(
  relationships: RelationshipRecord[],
): DailyFocusEngine {
  const today = todayISO();

  const focusItems = relationships.map(buildFocusItem);
  const sorted = [...focusItems].sort((a, b) => b.score - a.score);

  const hotLeads = sorted.filter((item) => {
    const memory = buildRelationshipMemoryProfile(item.relationship);

    return memory.salesTemperature === "hot";
  });

  const ghostingRisks = sorted.filter((item) => {
    const memory = buildRelationshipMemoryProfile(item.relationship);

    return memory.ghostingRisk === "high";
  });

  const revenueOpportunities = sorted.filter(
    (item) => getRelationshipAmount(item.relationship) > 0,
  );

  const noTouchRisks = sorted.filter((item) => {
    const memory = buildRelationshipMemoryProfile(item.relationship);
    const delta = daysBetween(
      item.relationship.next_contact_at,
      today,
    );

    return (
      memory.salesTemperature === "hot" &&
      delta !== null &&
      delta < 0
    );
  });

  const critical = sorted.filter(
    (item) => item.priority === "critical",
  );

  const high = sorted.filter(
    (item) => item.priority === "high",
  );

  const medium = sorted.filter(
    (item) => item.priority === "medium",
  );

  let summary =
    "La operación está estable. Mantener ritmo de seguimiento.";

  let operationalAdvice =
    "Prioriza relaciones con mayor intención comercial antes de hacer nuevos contactos.";

  if (critical.length >= 3) {
    summary =
      "Hay múltiples oportunidades críticas que necesitan atención inmediata.";

    operationalAdvice =
      "Enfócate primero en cerrar oportunidades calientes y recuperar relaciones en riesgo.";
  } else if (ghostingRisks.length >= 3) {
    summary =
      "Hay señales fuertes de ghosting en varias relaciones.";

    operationalAdvice =
      "Reduce presión comercial y utiliza mensajes más suaves y simples.";
  } else if (hotLeads.length >= 3) {
    summary =
      "Hay varias oportunidades calientes listas para avanzar.";

    operationalAdvice =
      "Este es un buen momento para pedir decisiones claras y cerrar ventas.";
  }

  return {
    summary,
    operationalAdvice,
    topPriorities: sorted.slice(0, 5),
    hotLeads: hotLeads.slice(0, 5),
    ghostingRisks: ghostingRisks.slice(0, 5),
    revenueOpportunities: revenueOpportunities.slice(0, 5),
    noTouchRisks: noTouchRisks.slice(0, 5),
    stats: {
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      hotLeads: hotLeads.length,
      ghostingRisks: ghostingRisks.length,
      revenuePipeline: revenueOpportunities.reduce(
        (total, item) =>
          total + getRelationshipAmount(item.relationship),
        0,
      ),
    },
  };
}