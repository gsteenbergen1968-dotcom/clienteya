import type {
  CommercialMemoryOSResult,
  CommercialMemoryPriority,
  CommercialMemoryTone,
} from "./commercial-memory-os";

export type FounderCommercialMemoryActionType =
  | "promise"
  | "money"
  | "opportunity"
  | "relationship";

export type FounderCommercialMemoryAction = {
  id: string;
  relationshipId: string;
  relationshipName: string;
  title: string;
  description: string;
  action: string;
  reason: string;
  type: FounderCommercialMemoryActionType;
  priority: CommercialMemoryPriority;
  tone: CommercialMemoryTone;
  impactScore: number;
  protectedAmount: number;
};

export type FounderCommercialMemoryCenter = {
  memoryRiskScore: number;
  priority: CommercialMemoryPriority;
  tone: CommercialMemoryTone;

  promisesAtRisk: number;
  moneyAtRisk: number;
  activeOpportunities: number;
  coolingRelationships: number;

  protectedRevenuePotential: number;

  topActions: FounderCommercialMemoryAction[];

  executiveSummary: string;
  executiveRecommendation: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function getPriority(score: number): CommercialMemoryPriority {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";

  return "low";
}

function getTone(
  priority: CommercialMemoryPriority
): CommercialMemoryTone {
  if (priority === "critical") return "red";
  if (priority === "high") return "amber";
  if (priority === "medium") return "sky";

  return "emerald";
}

function getActionTypeLabel(
  type: FounderCommercialMemoryActionType
) {
  if (type === "promise") return "Promesa";
  if (type === "money") return "Dinero";
  if (type === "opportunity") return "Oportunidad";

  return "Relación";
}

function calculateActionImpact(input: {
  priority: CommercialMemoryPriority;
  protectedAmount: number;
  type: FounderCommercialMemoryActionType;
}) {
  let score = 20;

  if (input.priority === "critical") score += 45;
  if (input.priority === "high") score += 32;
  if (input.priority === "medium") score += 18;
  if (input.priority === "low") score += 8;

  if (input.type === "money") score += 12;
  if (input.type === "promise") score += 10;
  if (input.type === "opportunity") score += 8;
  if (input.type === "relationship") score += 4;

  if (input.protectedAmount > 0) {
    score += Math.min(
      15,
      Math.round(input.protectedAmount / 1000000)
    );
  }

  return clamp(score);
}

function getHighestPriority(
  priorities: CommercialMemoryPriority[]
): CommercialMemoryPriority {
  if (priorities.includes("critical")) return "critical";
  if (priorities.includes("high")) return "high";
  if (priorities.includes("medium")) return "medium";

  return "low";
}

function buildActionsFromRelationship(
  result: CommercialMemoryOSResult
): FounderCommercialMemoryAction[] {
  const actions: FounderCommercialMemoryAction[] = [];

  for (const signal of result.moneySignals) {
    const protectedAmount = signal.amount || 0;

    actions.push({
      id: `${result.relationshipId}-money-${signal.id}`,
      relationshipId: result.relationshipId,
      relationshipName: result.relationshipName,
      title: signal.title,
      description: signal.description,
      action:
        "Revisar el pago y contactar la relación hoy.",
      reason:
        "El dinero pendiente impacta directamente el ingreso del negocio.",
      type: "money",
      priority: signal.priority,
      tone: signal.tone,
      impactScore: calculateActionImpact({
        priority: signal.priority,
        protectedAmount,
        type: "money",
      }),
      protectedAmount,
    });
  }

  for (const signal of result.promises) {
    actions.push({
      id: `${result.relationshipId}-promise-${signal.id}`,
      relationshipId: result.relationshipId,
      relationshipName: result.relationshipName,
      title: signal.title,
      description: signal.description,
      action:
        "Cumplir o cerrar el seguimiento pendiente.",
      reason:
        "Una promesa olvidada daña confianza y reduce probabilidad comercial.",
      type: "promise",
      priority: signal.priority,
      tone: signal.tone,
      impactScore: calculateActionImpact({
        priority: signal.priority,
        protectedAmount: 0,
        type: "promise",
      }),
      protectedAmount: 0,
    });
  }

  for (const signal of result.opportunities) {
    actions.push({
      id: `${result.relationshipId}-opportunity-${signal.id}`,
      relationshipId: result.relationshipId,
      relationshipName: result.relationshipName,
      title: signal.title,
      description: signal.description,
      action:
        "Enviar mensaje claro y avanzar al próximo paso comercial.",
      reason:
        "La oportunidad todavía tiene temperatura y puede convertirse en ingreso.",
      type: "opportunity",
      priority: signal.priority,
      tone: signal.tone,
      impactScore: calculateActionImpact({
        priority: signal.priority,
        protectedAmount: 0,
        type: "opportunity",
      }),
      protectedAmount: 0,
    });
  }

  for (const signal of result.relationshipSignals) {
    actions.push({
      id: `${result.relationshipId}-relationship-${signal.id}`,
      relationshipId: result.relationshipId,
      relationshipName: result.relationshipName,
      title: signal.title,
      description: signal.description,
      action:
        "Reactivar la relación con un mensaje humano y corto.",
      reason:
        "Una relación fría responde menos y exige más esfuerzo comercial después.",
      type: "relationship",
      priority: signal.priority,
      tone: signal.tone,
      impactScore: calculateActionImpact({
        priority: signal.priority,
        protectedAmount: 0,
        type: "relationship",
      }),
      protectedAmount: 0,
    });
  }

  return actions;
}

function buildExecutiveSummary(input: {
  promisesAtRisk: number;
  moneyAtRisk: number;
  activeOpportunities: number;
  coolingRelationships: number;
}) {
  const signals: string[] = [];

  if (input.promisesAtRisk > 0) {
    signals.push(
      `${input.promisesAtRisk} promesa(s) o seguimiento(s) requieren atención`
    );
  }

  if (input.moneyAtRisk > 0) {
    signals.push(
      `Gs. ${input.moneyAtRisk.toLocaleString(
        "es-PY"
      )} están pendientes o en riesgo`
    );
  }

  if (input.activeOpportunities > 0) {
    signals.push(
      `${input.activeOpportunities} oportunidad(es) comerciales siguen activas`
    );
  }

  if (input.coolingRelationships > 0) {
    signals.push(
      `${input.coolingRelationships} relación(es) se están enfriando`
    );
  }

  if (signals.length === 0) {
    return "No hay señales comerciales críticas. Mantener ritmo y registrar próximos pasos.";
  }

  return `ClienteYA detectó ${signals.join(", ")}.`;
}

function buildExecutiveRecommendation(input: {
  priority: CommercialMemoryPriority;
  topActions: FounderCommercialMemoryAction[];
  protectedRevenuePotential: number;
}) {
  if (input.topActions.length === 0) {
    return "Mantener el sistema actualizado: registrar notas, próximos contactos y compromisos.";
  }

  const firstAction = input.topActions[0];

  if (input.priority === "critical") {
    return `Actuar primero sobre ${firstAction.relationshipName}. Esta acción puede proteger la relación, el ingreso o una promesa pendiente.`;
  }

  if (input.priority === "high") {
    return `Ejecutar las primeras ${Math.min(
      3,
      input.topActions.length
    )} acciones hoy para proteger el mayor impacto comercial.`;
  }

  if (input.protectedRevenuePotential > 0) {
    return `Revisar oportunidades y pagos pendientes. Hay Gs. ${input.protectedRevenuePotential.toLocaleString(
      "es-PY"
    )} de ingreso potencial para proteger.`;
  }

  return "Mantener memoria comercial activa y definir próximos pasos claros para las relaciones abiertas.";
}

export function buildFounderCommercialMemoryCenter(
  results: CommercialMemoryOSResult[]
): FounderCommercialMemoryCenter {
  const allActions = results.flatMap((result) =>
    buildActionsFromRelationship(result)
  );

  const promisesAtRisk = results.reduce(
    (total, result) =>
      total +
      result.promises.filter(
        (signal) =>
          signal.priority === "critical" ||
          signal.priority === "high"
      ).length,
    0
  );

  const moneyAtRisk = results.reduce(
    (total, result) =>
      total +
      result.moneySignals
        .filter(
          (signal) =>
            signal.priority === "critical" ||
            signal.priority === "high"
        )
        .reduce(
          (sum, signal) =>
            sum + Number(signal.amount || 0),
          0
        ),
    0
  );

  const activeOpportunities = results.reduce(
    (total, result) =>
      total +
      result.opportunities.filter(
        (signal) =>
          signal.priority === "critical" ||
          signal.priority === "high"
      ).length,
    0
  );

  const coolingRelationships = results.reduce(
    (total, result) =>
      total +
      result.relationshipSignals.filter(
        (signal) =>
          signal.priority === "critical" ||
          signal.priority === "high" ||
          signal.priority === "medium"
      ).length,
    0
  );

  const protectedRevenuePotential =
    allActions.reduce(
      (total, action) =>
        total + action.protectedAmount,
      0
    );

  const topActions = allActions
    .sort(
      (a, b) =>
        b.impactScore - a.impactScore
    )
    .slice(0, 5);

  const averageRelationshipRisk =
    results.length > 0
      ? Math.round(
          results.reduce(
            (total, result) =>
              total + result.priorityScore,
            0
          ) / results.length
        )
      : 0;

  const structuralRisk =
    promisesAtRisk * 8 +
    activeOpportunities * 6 +
    coolingRelationships * 5 +
    Math.min(
      30,
      Math.round(moneyAtRisk / 1000000)
    );

  const memoryRiskScore = clamp(
    Math.round(
      averageRelationshipRisk * 0.55 +
        structuralRisk * 0.45
    )
  );

  const priority = getHighestPriority([
    getPriority(memoryRiskScore),
    ...topActions.map(
      (action) => action.priority
    ),
  ]);

  const tone = getTone(priority);

  const executiveSummary =
    buildExecutiveSummary({
      promisesAtRisk,
      moneyAtRisk,
      activeOpportunities,
      coolingRelationships,
    });

  const executiveRecommendation =
    buildExecutiveRecommendation({
      priority,
      topActions,
      protectedRevenuePotential,
    });

  return {
    memoryRiskScore,
    priority,
    tone,

    promisesAtRisk,
    moneyAtRisk,
    activeOpportunities,
    coolingRelationships,

    protectedRevenuePotential,

    topActions,

    executiveSummary,
    executiveRecommendation,
  };
}

export function getFounderCommercialMemoryPriorityLabel(
  priority: CommercialMemoryPriority
) {
  if (priority === "critical") return "Crítica";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";

  return "Baja";
}

export function getFounderCommercialMemoryToneClasses(
  tone: CommercialMemoryTone
) {
  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "sky") {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}

export function getFounderCommercialMemoryActionTypeLabel(
  type: FounderCommercialMemoryActionType
) {
  return getActionTypeLabel(type);
}