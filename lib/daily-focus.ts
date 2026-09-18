import { calculateOpportunityScore } from "./opportunity-scoring";
import type { RelationshipRecord } from "./relationship-repository";

export type DailyFocusItem = {
  id: string;
  relationshipId: string;
  relationshipName: string;
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  score: number;
  expectedValue: number;
  action: string;
};

export type DailyFocusSummary = {
  title: string;
  description: string;
  topItems: DailyFocusItem[];
  totalFocusValue: number;
  totalFocusValueFormatted: string;
};

function formatGuarani(value: number): string {
  return `Gs. ${Math.round(value).toLocaleString("es-PY")}`;
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

function getRelationshipValue(
  relationship: RelationshipRecord,
): number {
  void relationship;
  return 50000;
}

function getPriority(
  score: number,
): DailyFocusItem["priority"] {
  if (score >= 90) return "urgent";
  if (score >= 75) return "high";
  if (score >= 55) return "medium";

  return "low";
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

function getReminderTitle(
  relationship: RelationshipRecord,
): string {
  const daysUntilContact = getDaysUntilContact(
    relationship.next_contact_at,
  );

  if (daysUntilContact === null) {
    return "Programar próximo contacto";
  }

  if (daysUntilContact < 0) {
    return "Seguimiento atrasado";
  }

  if (daysUntilContact === 0) {
    return "Contactar hoy";
  }

  if (daysUntilContact === 1) {
    return "Preparar contacto";
  }

  return "Seguimiento próximo";
}

function getNextBestAction(
  relationship: RelationshipRecord,
): string {
  const daysUntilContact = getDaysUntilContact(
    relationship.next_contact_at,
  );

  if (daysUntilContact === null) {
    return "Programar el próximo contacto.";
  }

  if (daysUntilContact < 0) {
    return "Contactar hoy y actualizar el seguimiento.";
  }

  if (daysUntilContact === 0) {
    return "Enviar el mensaje preparado.";
  }

  return "Mantener el seguimiento programado.";
}

function buildFocusItem(
  relationship: RelationshipRecord,
): DailyFocusItem {
  const opportunity = calculateOpportunityScore(relationship);
  const reminderScore = getReminderScore(relationship);

  const expectedValue = Math.round(
    getRelationshipValue(relationship) *
      (opportunity.probability / 100),
  );

  const combinedScore = Math.min(
    100,
    Math.round(reminderScore * 0.6 + opportunity.score * 0.4),
  );

  return {
    id: `${relationship.id}-daily-focus`,
    relationshipId: relationship.id,
    relationshipName: getRelationshipName(relationship),
    title: `${getReminderTitle(relationship)} · ${opportunity.label}`,
    description: `${getPhaseLabel(
      relationship,
    )}: ${opportunity.description}`,
    priority: getPriority(combinedScore),
    score: combinedScore,
    expectedValue,
    action:
      opportunity.recommendation ||
      getNextBestAction(relationship),
  };
}

export function buildDailyFocus(
  relationships: RelationshipRecord[],
): DailyFocusSummary {
  const focusItems = relationships.map(buildFocusItem);

  const topItems = focusItems
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.expectedValue - a.expectedValue;
    })
    .slice(0, 3);

  const totalFocusValue = topItems.reduce(
    (sum, item) => sum + item.expectedValue,
    0,
  );

  const totalPipelineValue = relationships.reduce(
    (sum, relationship) =>
      sum + getRelationshipValue(relationship),
    0,
  );

  const urgentCount = topItems.filter(
    (item) => item.priority === "urgent",
  ).length;

  const title =
    urgentCount > 0
      ? "🔥 Focus urgente para hoy"
      : "🎯 Focus recomendado para hoy";

  const description =
    topItems.length === 0
      ? "No hay oportunidades urgentes por ahora."
      : `Prioriza ${topItems.length} relación(es). Valor potencial enfocado: ${formatGuarani(
          totalFocusValue,
        )}. Pipeline total: ${formatGuarani(
          totalPipelineValue,
        )}.`;

  return {
    title,
    description,
    topItems,
    totalFocusValue,
    totalFocusValueFormatted: formatGuarani(totalFocusValue),
  };
}