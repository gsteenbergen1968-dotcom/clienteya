export type WhatsAppLearningOutcome =
  | "success"
  | "no_response"
  | "lost"
  | "pending";

export type WhatsAppLearningEvent = {
  id: string;
  clienteId: string;
  patternId: string;
  actionId: string;
  outcome: WhatsAppLearningOutcome;
  createdAt: string;
};

export type WhatsAppLearningStats = {
  totalActions: number;
  successfulActions: number;
  pendingActions: number;
  lostActions: number;
  noResponseActions: number;
  successRate: number;
};

function calculateRate(success: number, total: number) {
  if (total === 0) return 0;

  return Math.round((success / total) * 100);
}

export function buildWhatsAppLearningStats(
  events: WhatsAppLearningEvent[],
): WhatsAppLearningStats {
  const successfulActions = events.filter(
    (event) => event.outcome === "success",
  ).length;

  const pendingActions = events.filter(
    (event) => event.outcome === "pending",
  ).length;

  const lostActions = events.filter(
    (event) => event.outcome === "lost",
  ).length;

  const noResponseActions = events.filter(
    (event) => event.outcome === "no_response",
  ).length;

  return {
    totalActions: events.length,
    successfulActions,
    pendingActions,
    lostActions,
    noResponseActions,
    successRate: calculateRate(
      successfulActions,
      events.length,
    ),
  };
}

export function getWhatsAppOutcomeLabel(
  outcome: WhatsAppLearningOutcome,
) {
  if (outcome === "success") {
    return "Respuesta positiva";
  }

  if (outcome === "no_response") {
    return "Sin respuesta";
  }

  if (outcome === "lost") {
    return "Oportunidad perdida";
  }

  return "Pendiente";
}

export function getWhatsAppOutcomeScore(
  outcome: WhatsAppLearningOutcome,
) {
  if (outcome === "success") return 100;
  if (outcome === "pending") return 50;
  if (outcome === "no_response") return 25;

  return 0;
}

export function getBestPerformingPattern(
  events: WhatsAppLearningEvent[],
) {
  const grouped = new Map<
    string,
    {
      total: number;
      success: number;
    }
  >();

  events.forEach((event) => {
    const current = grouped.get(event.patternId) || {
      total: 0,
      success: 0,
    };

    current.total += 1;

    if (event.outcome === "success") {
      current.success += 1;
    }

    grouped.set(event.patternId, current);
  });

  const results = [...grouped.entries()]
    .map(([patternId, value]) => ({
      patternId,
      successRate: calculateRate(
        value.success,
        value.total,
      ),
      total: value.total,
    }))
    .sort((a, b) => b.successRate - a.successRate);

  return results[0] || null;
}

export function getWorstPerformingPattern(
  events: WhatsAppLearningEvent[],
) {
  const grouped = new Map<
    string,
    {
      total: number;
      success: number;
    }
  >();

  events.forEach((event) => {
    const current = grouped.get(event.patternId) || {
      total: 0,
      success: 0,
    };

    current.total += 1;

    if (event.outcome === "success") {
      current.success += 1;
    }

    grouped.set(event.patternId, current);
  });

  const results = [...grouped.entries()]
    .map(([patternId, value]) => ({
      patternId,
      successRate: calculateRate(
        value.success,
        value.total,
      ),
      total: value.total,
    }))
    .sort((a, b) => a.successRate - b.successRate);

  return results[0] || null;
}