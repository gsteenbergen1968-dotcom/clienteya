import { calculateOpportunityScore } from "./opportunity-scoring";
import type { RelationshipRecord } from "./relationship-repository";

export type SmartQueueItem = {
  id: string;
  relationshipId: string;
  relationshipName: string;
  rank: number;
  score: number;
  expectedValue: number;
  priority: "urgent" | "high" | "medium" | "low";
  title: string;
  reason: string;
  action: string;
  phaseLabel: string;
  opportunityLabel: string;
  momentumLabel: string;
};

function getRelationshipName(
  relationship: RelationshipRecord,
): string {
  return (
    relationship.name?.trim() ||
    relationship.company?.trim() ||
    "Relación sin nombre"
  );
}

function getRelationshipValue(
  relationship: RelationshipRecord,
): number {
  void relationship;

  return 50000;
}

function getPriority(
  score: number,
): SmartQueueItem["priority"] {
  if (score >= 90) return "urgent";
  if (score >= 75) return "high";
  if (score >= 55) return "medium";

  return "low";
}

function getDaysUntilContact(
  value: string | null,
): number | null {
  if (!value) return null;

  const today = new Date();
  const target = new Date(value);

  if (Number.isNaN(target.getTime())) return null;

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round(
    (target.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function getReminderScore(
  relationship: RelationshipRecord,
): number {
  const daysUntilContact = getDaysUntilContact(
    relationship.next_contact_at,
  );

  if (daysUntilContact === null) return 60;
  if (daysUntilContact < 0) return 95;
  if (daysUntilContact === 0) return 90;
  if (daysUntilContact === 1) return 80;
  if (daysUntilContact <= 3) return 70;

  return 50;
}

function getReminderActionType(
  relationship: RelationshipRecord,
): string {
  const daysUntilContact = getDaysUntilContact(
    relationship.next_contact_at,
  );

  if (daysUntilContact === null) return "schedule";
  if (daysUntilContact < 0) return "overdue";
  if (daysUntilContact === 0) return "today";
  if (daysUntilContact === 1) return "tomorrow";

  return "followup";
}

function getPhaseLabel(
  relationship: RelationshipRecord,
): string {
  const status = relationship.status?.trim().toLowerCase() ?? "";

  if (status.includes("pag")) return "Relación pagada";
  if (status.includes("interes")) return "Oportunidad";
  if (status.includes("contact")) return "Contactada";
  if (status.includes("sin")) return "Sin respuesta";
  if (status.includes("cerr")) return "Cerrada";

  return "Nueva relación";
}

function getMomentum(
  relationship: RelationshipRecord,
): {
  value: "stalled" | "slow" | "strong" | "steady";
  label: string;
  recommendation: string;
} {
  const daysUntilContact = getDaysUntilContact(
    relationship.next_contact_at,
  );

  if (daysUntilContact !== null && daysUntilContact < 0) {
    return {
      value: "stalled",
      label: "Seguimiento vencido",
      recommendation: "Contactar hoy y actualizar el seguimiento.",
    };
  }

  if (daysUntilContact === null) {
    return {
      value: "slow",
      label: "Sin próximo contacto",
      recommendation: "Programar el siguiente contacto.",
    };
  }

  if (daysUntilContact <= 1) {
    return {
      value: "strong",
      label: "Acción próxima",
      recommendation: "Preparar y ejecutar el contacto.",
    };
  }

  return {
    value: "steady",
    label: "Ritmo estable",
    recommendation: "Mantener el seguimiento programado.",
  };
}

function buildQueueItem(
  relationship: RelationshipRecord,
): SmartQueueItem {
  const opportunity = calculateOpportunityScore(relationship);
  const momentum = getMomentum(relationship);
  const reminderScore = getReminderScore(relationship);

  const expectedValue = Math.round(
    getRelationshipValue(relationship) *
      (opportunity.probability / 100),
  );

  let score = Math.round(
    reminderScore * 0.35 +
      opportunity.score * 0.35 +
      Math.min(100, expectedValue / 1000) * 0.15 +
      (momentum.value === "stalled"
        ? 15
        : momentum.value === "slow"
          ? 10
          : momentum.value === "strong"
            ? 8
            : 5),
  );

  score = Math.max(0, Math.min(100, score));

  const priority = getPriority(score);

  const title =
    priority === "urgent"
      ? "Atender primero"
      : priority === "high"
        ? "Alta oportunidad"
        : priority === "medium"
          ? "Seguimiento recomendado"
          : "Mantener en cola";

  const phaseLabel = getPhaseLabel(relationship);

  return {
    id: `${relationship.id}-${getReminderActionType(relationship)}`,
    relationshipId: relationship.id,
    relationshipName: getRelationshipName(relationship),
    rank: 0,
    score,
    expectedValue,
    priority,
    title,
    reason: `${phaseLabel} · ${opportunity.label} · ${momentum.label}`,
    action:
      opportunity.recommendation ||
      momentum.recommendation,
    phaseLabel,
    opportunityLabel: opportunity.label,
    momentumLabel: momentum.label,
  };
}

export function buildSmartQueue(
  relationships: RelationshipRecord[],
): SmartQueueItem[] {
  return relationships
    .map(buildQueueItem)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.expectedValue - a.expectedValue;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}