import { buildAutomationReminders } from "./automation-engine";
import { calculateOpportunityScore } from "./opportunity-scoring";
import { buildRevenueAnalytics, formatGuarani } from "./revenue-analytics";
import { detectClientPhase } from "./phase-detection";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

export type DailyFocusItem = {
  id: string;
  clienteId: string;
  clienteNombre: string;
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

function getClientValue(cliente: Cliente) {
  return Number(cliente.monto || 50000);
}

function getPriority(score: number): DailyFocusItem["priority"] {
  if (score >= 90) return "urgent";
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "low";
}

export function buildDailyFocus(clientes: Cliente[]): DailyFocusSummary {
  const reminders = buildAutomationReminders(clientes);
  const revenue = buildRevenueAnalytics(clientes);

  const focusItems = reminders.map((reminder) => {
    const cliente = reminder.cliente as Cliente;
    const opportunity = calculateOpportunityScore(cliente);
    const phase = detectClientPhase(cliente);

    const expectedValue = Math.round(
      getClientValue(cliente) * (opportunity.probability / 100)
    );

    const combinedScore = Math.min(
      100,
      Math.round(reminder.score * 0.6 + opportunity.score * 0.4)
    );

    return {
      id: `${cliente.id}-${reminder.actionType}`,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      title: `${reminder.title} · ${opportunity.label}`,
      description: `${phase.label}: ${opportunity.description}`,
      priority: getPriority(combinedScore),
      score: combinedScore,
      expectedValue,
      action: opportunity.recommendation || reminder.nextBestAction,
    };
  });

  const topItems = focusItems
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.expectedValue - a.expectedValue;
    })
    .slice(0, 3);

  const totalFocusValue = topItems.reduce(
    (sum, item) => sum + item.expectedValue,
    0
  );

  const urgentCount = topItems.filter((item) => item.priority === "urgent")
    .length;

  const title =
    urgentCount > 0
      ? "🔥 Focus urgente para hoy"
      : "🎯 Focus recomendado para hoy";

  const description =
    topItems.length === 0
      ? "No hay oportunidades urgentes por ahora."
      : `Prioriza ${topItems.length} cliente(s). Valor potencial enfocado: ${formatGuarani(
          totalFocusValue
        )}. Pipeline total: ${formatGuarani(revenue.totalPipelineValue)}.`;

  return {
    title,
    description,
    topItems,
    totalFocusValue,
    totalFocusValueFormatted: formatGuarani(totalFocusValue),
  };
}