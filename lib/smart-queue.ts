import { buildAutomationReminders } from "./automation-engine";
import { calculateOpportunityScore } from "./opportunity-scoring";
import { detectClientPhase } from "./phase-detection";
import { buildTimelineInsight } from "./timeline-intelligence";

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
  created_at?: string | null;
  updated_at?: string | null;
};

export type SmartQueueItem = {
  id: string;
  clienteId: string;
  clienteNombre: string;
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

function getClientValue(cliente: Cliente) {
  return Number(cliente.monto || 50000);
}

function getPriority(score: number): SmartQueueItem["priority"] {
  if (score >= 90) return "urgent";
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "low";
}

export function buildSmartQueue(clientes: Cliente[]): SmartQueueItem[] {
  const reminders = buildAutomationReminders(clientes);

  const queue = reminders.map((reminder) => {
    const cliente = reminder.cliente as Cliente;

    const opportunity = calculateOpportunityScore(cliente);
    const phase = detectClientPhase(cliente);
    const timeline = buildTimelineInsight(cliente);

    const expectedValue = Math.round(
      getClientValue(cliente) * (opportunity.probability / 100)
    );

    let score = Math.round(
      reminder.score * 0.35 +
        opportunity.score * 0.35 +
        Math.min(100, expectedValue / 1000) * 0.15 +
        (timeline.momentum === "stalled"
          ? 15
          : timeline.momentum === "slow"
          ? 10
          : timeline.momentum === "strong"
          ? 8
          : 5)
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

    const reason = `${phase.label} · ${opportunity.label} · ${timeline.label}`;

    const action =
      opportunity.recommendation ||
      timeline.recommendation ||
      reminder.nextBestAction;

    return {
      id: `${cliente.id}-${reminder.actionType}`,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      rank: 0,
      score,
      expectedValue,
      priority,
      title,
      reason,
      action,
      phaseLabel: phase.label,
      opportunityLabel: opportunity.label,
      momentumLabel: timeline.label,
    };
  });

  return queue
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.expectedValue - a.expectedValue;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}