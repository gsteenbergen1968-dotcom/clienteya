export type CommercialMemorySignalTone =
  | "emerald"
  | "sky"
  | "amber"
  | "red"
  | "slate";

export type CommercialMemorySignalPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type CommercialMemorySignalType =
  | "relationship"
  | "followup"
  | "payment"
  | "opportunity"
  | "risk"
  | "loyalty"
  | "reactivation";

export type CommercialMemoryRelationship = {
  id: string;
  nombre?: string | null;
  estado?: string | null;
  telefono?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

export type CommercialMemorySignal = {
  id: string;
  relationshipId: string;
  relationshipName: string;
  type: CommercialMemorySignalType;
  title: string;
  insight: string;
  evidence: string;
  recommendation: string;
  actionLabel: string;
  priority: CommercialMemorySignalPriority;
  tone: CommercialMemorySignalTone;
  score: number;
};

export type CommercialMemorySummary = {
  title: string;
  summary: string;
  strongestPattern: string;
  mainRisk: string;
  bestAction: string;
  totalSignals: number;
  criticalSignals: number;
  highSignals: number;
};

export type CommercialMemoryResult = {
  summary: CommercialMemorySummary;
  signals: CommercialMemorySignal[];
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function safeDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function daysBetween(date: Date | null, now = new Date()) {
  if (!date) return null;

  return Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / DAY_IN_MS)
  );
}

function daysUntil(date: Date | null, now = new Date()) {
  if (!date) return null;

  return Math.ceil((date.getTime() - now.getTime()) / DAY_IN_MS);
}

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getRelationshipName(
  relationship: CommercialMemoryRelationship
) {
  return relationship.nombre?.trim() || "Relación sin nombre";
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function hasPromiseSignal(
  relationship: CommercialMemoryRelationship
) {
  const text = normalizeText(
    `${relationship.notas ?? ""} ${
      relationship.recordatorio ?? ""
    } ${relationship.estado ?? ""}`
  );

  return includesAny(text, [
    "promet",
    "dijo que",
    "confirm",
    "interes",
    "interés",
    "quiere",
    "pidio",
    "pidió",
    "presupuesto",
    "cotizacion",
    "cotización",
    "visita",
    "reunion",
    "reunión",
  ]);
}

function hasRiskSignal(
  relationship: CommercialMemoryRelationship
) {
  const text = normalizeText(
    `${relationship.notas ?? ""} ${
      relationship.recordatorio ?? ""
    } ${relationship.estado ?? ""}`
  );

  return includesAny(text, [
    "no responde",
    "sin respuesta",
    "esperar",
    "despues",
    "después",
    "caro",
    "duda",
    "problema",
    "molesto",
    "cancel",
    "frio",
    "frío",
    "perdido",
  ]);
}

function hasLoyaltySignal(
  relationship: CommercialMemoryRelationship
) {
  const text = normalizeText(
    `${relationship.notas ?? ""} ${
      relationship.recordatorio ?? ""
    } ${relationship.estado ?? ""}`
  );

  return includesAny(text, [
    "recurrente",
    "mensual",
    "cada mes",
    "siempre",
    "frecuente",
    "fiel",
    "vip",
    "alto valor",
    "recompra",
  ]);
}

function getStatusSignal(
  relationship: CommercialMemoryRelationship
) {
  const status = normalizeText(relationship.estado);

  if (
    includesAny(status, [
      "cerrado",
      "ganado",
      "vendido",
      "pagado",
      "convertido",
    ])
  ) {
    return "won";
  }

  if (
    includesAny(status, [
      "perdido",
      "cancelado",
      "frio",
      "frío",
      "no responde",
    ])
  ) {
    return "lost";
  }

  if (
    includesAny(status, [
      "nuevo",
      "lead",
      "prospecto",
      "interesado",
      "pendiente",
      "seguimiento",
    ])
  ) {
    return "open";
  }

  return "unknown";
}

function buildSignalId(
  relationship: CommercialMemoryRelationship,
  type: CommercialMemorySignalType
) {
  return `${relationship.id}-${type}`;
}

function buildRelationshipSignal(
  relationship: CommercialMemoryRelationship,
  now = new Date()
): CommercialMemorySignal {
  const relationshipName = getRelationshipName(relationship);
  const createdDays = daysBetween(
    safeDate(relationship.created_at),
    now
  );
  const updatedDays = daysBetween(
    safeDate(relationship.updated_at),
    now
  );
  const hasNotes = normalizeText(relationship.notas).length > 12;
  const loyalty = hasLoyaltySignal(relationship);
  const promise = hasPromiseSignal(relationship);

  let score = 45;

  if (createdDays !== null && createdDays >= 30) score += 10;
  if (updatedDays !== null && updatedDays <= 14) score += 15;
  if (hasNotes) score += 10;
  if (loyalty) score += 20;
  if (promise) score += 10;

  score = clamp(score);

  return {
    id: buildSignalId(relationship, "relationship"),
    relationshipId: relationship.id,
    relationshipName,
    type: "relationship",
    title:
      score >= 75
        ? "Relación comercial fuerte"
        : score >= 55
          ? "Relación con potencial"
          : "Relación todavía débil",
    insight:
      score >= 75
        ? "ClienteYA detecta una relación con señales positivas de continuidad, confianza o valor comercial."
        : score >= 55
          ? "ClienteYA detecta una relación que puede crecer si se mantiene seguimiento constante."
          : "ClienteYA todavía no detecta suficiente memoria comercial para considerar esta relación fuerte.",
    evidence:
      updatedDays !== null
        ? `Última actualización hace ${updatedDays} día${
            updatedDays === 1 ? "" : "s"
          }.`
        : "No hay una actualización reciente clara en el historial.",
    recommendation:
      score >= 75
        ? "Cuidar la relación antes de vender más. Una relación fuerte necesita continuidad, no presión."
        : score >= 55
          ? "Mantener contacto simple y registrar mejor cada conversación."
          : "Crear contexto: agregar nota, próximo contacto y una acción clara.",
    actionLabel:
      score >= 75
        ? "Cuidar relación"
        : score >= 55
          ? "Dar seguimiento"
          : "Completar memoria",
    priority: score >= 55 ? "medium" : "low",
    tone:
      score >= 75
        ? "emerald"
        : score >= 55
          ? "sky"
          : "slate",
    score,
  };
}

function buildFollowupSignal(
  relationship: CommercialMemoryRelationship,
  now = new Date()
): CommercialMemorySignal {
  const relationshipName = getRelationshipName(relationship);
  const nextContact = safeDate(relationship.proximo_contacto);
  const until = daysUntil(nextContact, now);
  const updatedDays = daysBetween(
    safeDate(relationship.updated_at),
    now
  );
  const risk = hasRiskSignal(relationship);
  const promise = hasPromiseSignal(relationship);

  let score = 50;

  if (until !== null && until < 0) score += 30;
  if (until === 0) score += 20;
  if (updatedDays !== null && updatedDays > 14) score += 15;
  if (risk) score += 10;
  if (promise) score += 10;

  score = clamp(score);

  const overdue = until !== null && until < 0;
  const today = until === 0;

  return {
    id: buildSignalId(relationship, "followup"),
    relationshipId: relationship.id,
    relationshipName,
    type: "followup",
    title: overdue
      ? "Seguimiento atrasado"
      : today
        ? "Seguimiento para hoy"
        : "Seguimiento bajo control",
    insight: overdue
      ? "ClienteYA detecta que esta relación ya pasó su fecha de contacto y puede enfriarse."
      : today
        ? "ClienteYA detecta que hoy es el momento correcto para actuar."
        : "ClienteYA no detecta atraso fuerte en el próximo contacto.",
    evidence:
      until !== null
        ? overdue
          ? `El próximo contacto venció hace ${Math.abs(until)} día${
              Math.abs(until) === 1 ? "" : "s"
            }.`
          : today
            ? "El próximo contacto está programado para hoy."
            : `Faltan ${until} día${
                until === 1 ? "" : "s"
              } para el próximo contacto.`
        : "No hay próximo contacto definido.",
    recommendation: overdue
      ? "Enviar un mensaje corto de recuperación. No vender primero; recuperar conversación."
      : today
        ? "Enviar ahora un mensaje claro con una próxima acción concreta."
        : "Mantener la fecha de seguimiento y no saturar la relación.",
    actionLabel: overdue
      ? "Recuperar contacto"
      : today
        ? "Contactar hoy"
        : "Mantener seguimiento",
    priority: overdue ? "high" : today ? "high" : "low",
    tone: overdue ? "red" : today ? "amber" : "emerald",
    score,
  };
}

function buildPaymentSignal(
  relationship: CommercialMemoryRelationship,
  now = new Date()
): CommercialMemorySignal {
  const relationshipName = getRelationshipName(relationship);
  const paid = Boolean(relationship.pagado);
  const amount = Number(relationship.monto ?? 0);
  const paymentDays = daysBetween(
    safeDate(relationship.fecha_pago),
    now
  );

  let score = 45;

  if (amount > 0) score += 15;
  if (paid) score += 25;
  if (!paid && amount > 0) score += 30;
  if (paymentDays !== null && paymentDays <= 30) score += 10;

  score = clamp(score);

  return {
    id: buildSignalId(relationship, "payment"),
    relationshipId: relationship.id,
    relationshipName,
    type: "payment",
    title: paid
      ? "Comportamiento de pago positivo"
      : amount > 0
        ? "Pago pendiente con valor registrado"
        : "Sin señal fuerte de pago",
    insight: paid
      ? "ClienteYA detecta una señal positiva: esta relación tiene pago registrado."
      : amount > 0
        ? "ClienteYA detecta valor comercial pendiente de control o cobro."
        : "ClienteYA todavía no tiene suficiente información financiera de esta relación.",
    evidence:
      amount > 0
        ? `Monto registrado: ${new Intl.NumberFormat("es-PY", {
            style: "currency",
            currency: "PYG",
            maximumFractionDigits: 0,
          }).format(amount)}.`
        : "No hay monto comercial registrado.",
    recommendation: paid
      ? "Usar esta relación como referencia de relación sana y buscar recompra o continuidad."
      : amount > 0
        ? "Asegurar seguimiento de cobro antes de abrir nuevas promesas comerciales."
        : "Registrar monto o estado de pago para mejorar la memoria comercial.",
    actionLabel: paid
      ? "Buscar recompra"
      : amount > 0
        ? "Revisar cobro"
        : "Registrar valor",
    priority:
      !paid && amount > 0
        ? "high"
        : paid
          ? "medium"
          : "low",
    tone:
      paid
        ? "emerald"
        : amount > 0
          ? "amber"
          : "slate",
    score,
  };
}

function buildOpportunitySignal(
  relationship: CommercialMemoryRelationship
): CommercialMemorySignal {
  const relationshipName = getRelationshipName(relationship);
  const promise = hasPromiseSignal(relationship);
  const loyalty = hasLoyaltySignal(relationship);
  const status = getStatusSignal(relationship);
  const amount = Number(relationship.monto ?? 0);

  let score = 40;

  if (promise) score += 25;
  if (loyalty) score += 20;
  if (status === "open") score += 10;
  if (amount > 0) score += 10;
  if (status === "won") score += 15;

  score = clamp(score);

  return {
    id: buildSignalId(relationship, "opportunity"),
    relationshipId: relationship.id,
    relationshipName,
    type: "opportunity",
    title:
      score >= 75
        ? "Oportunidad comercial clara"
        : score >= 55
          ? "Oportunidad posible"
          : "Oportunidad aún no confirmada",
    insight:
      score >= 75
        ? "ClienteYA detecta señales suficientes para tratar esta relación como oportunidad prioritaria."
        : score >= 55
          ? "ClienteYA detecta interés o contexto, pero todavía necesita una próxima acción clara."
          : "ClienteYA todavía no ve señales fuertes de compra, recompra o avance.",
    evidence: promise
      ? "Hay señales de interés, promesa, presupuesto o conversación comercial."
      : loyalty
        ? "Hay señales de recurrencia o relación de valor."
        : "No hay suficiente evidencia comercial en notas o estado.",
    recommendation:
      score >= 75
        ? "Avanzar con propuesta concreta o cierre suave."
        : score >= 55
          ? "Hacer una pregunta simple para confirmar interés."
          : "No forzar venta. Primero crear contexto y entender necesidad.",
    actionLabel:
      score >= 75
        ? "Avanzar oportunidad"
        : score >= 55
          ? "Confirmar interés"
          : "Crear contexto",
    priority:
      score >= 75
        ? "high"
        : score >= 55
          ? "medium"
          : "low",
    tone:
      score >= 75
        ? "emerald"
        : score >= 55
          ? "sky"
          : "slate",
    score,
  };
}

function buildRiskSignal(
  relationship: CommercialMemoryRelationship,
  now = new Date()
): CommercialMemorySignal {
  const relationshipName = getRelationshipName(relationship);
  const risk = hasRiskSignal(relationship);
  const updatedDays = daysBetween(
    safeDate(relationship.updated_at),
    now
  );
  const nextContact = safeDate(relationship.proximo_contacto);
  const until = daysUntil(nextContact, now);
  const status = getStatusSignal(relationship);

  let score = 35;

  if (risk) score += 25;
  if (updatedDays !== null && updatedDays > 21) score += 20;
  if (until !== null && until < 0) score += 20;
  if (status === "lost") score += 25;

  score = clamp(score);

  return {
    id: buildSignalId(relationship, "risk"),
    relationshipId: relationship.id,
    relationshipName,
    type: "risk",
    title:
      score >= 75
        ? "Riesgo alto de pérdida comercial"
        : score >= 55
          ? "Riesgo comercial moderado"
          : "Riesgo bajo",
    insight:
      score >= 75
        ? "ClienteYA detecta señales de enfriamiento, atraso o posible pérdida de relación."
        : score >= 55
          ? "ClienteYA detecta algunas señales que conviene revisar antes de que la relación se enfríe."
          : "ClienteYA no detecta señales fuertes de pérdida en este momento.",
    evidence:
      updatedDays !== null
        ? `Última actualización hace ${updatedDays} día${
            updatedDays === 1 ? "" : "s"
          }.`
        : "No hay historial suficiente para medir riesgo.",
    recommendation:
      score >= 75
        ? "Recuperar contacto con un mensaje humano y corto. Evitar presión comercial."
        : score >= 55
          ? "Revisar contexto y hacer seguimiento preventivo."
          : "Mantener seguimiento normal.",
    actionLabel:
      score >= 75
        ? "Recuperar relación"
        : score >= 55
          ? "Prevenir pérdida"
          : "Mantener control",
    priority:
      score >= 75
        ? "critical"
        : score >= 55
          ? "high"
          : "low",
    tone:
      score >= 75
        ? "red"
        : score >= 55
          ? "amber"
          : "emerald",
    score,
  };
}

function buildBestSignalForRelationship(
  relationship: CommercialMemoryRelationship,
  now = new Date()
): CommercialMemorySignal {
  const signals = [
    buildRiskSignal(relationship, now),
    buildFollowupSignal(relationship, now),
    buildOpportunitySignal(relationship),
    buildPaymentSignal(relationship, now),
    buildRelationshipSignal(relationship, now),
  ];

  return signals.sort((a, b) => {
    const priorityWeight: Record<
      CommercialMemorySignalPriority,
      number
    > = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return (
      priorityWeight[b.priority] -
        priorityWeight[a.priority] ||
      b.score - a.score
    );
  })[0];
}

function buildSummary(
  signals: CommercialMemorySignal[]
): CommercialMemorySummary {
  const criticalSignals = signals.filter(
    (signal) => signal.priority === "critical"
  ).length;

  const highSignals = signals.filter(
    (signal) => signal.priority === "high"
  ).length;

  const riskSignals = signals.filter(
    (signal) => signal.type === "risk"
  );

  const opportunitySignals = signals.filter(
    (signal) => signal.type === "opportunity"
  );

  const followupSignals = signals.filter(
    (signal) => signal.type === "followup"
  );

  const strongestPattern =
    opportunitySignals.length > riskSignals.length
      ? "ClienteYA detecta más señales de oportunidad que de pérdida."
      : riskSignals.length > opportunitySignals.length
        ? "ClienteYA detecta más señales de riesgo que de oportunidad."
        : "ClienteYA detecta una base equilibrada entre oportunidad y riesgo.";

  const mainRisk =
    criticalSignals > 0
      ? "Hay relaciones críticas que pueden perderse si no se actúa pronto."
      : highSignals > 0
        ? "Hay señales importantes que requieren seguimiento antes de enfriarse."
        : "No hay una concentración fuerte de riesgo comercial.";

  const bestAction =
    followupSignals.length > 0
      ? "Empezar por los seguimientos con mayor prioridad."
      : opportunitySignals.length > 0
        ? "Avanzar primero las oportunidades con mejor señal comercial."
        : "Completar memoria comercial para que ClienteYA pueda detectar mejores patrones.";

  return {
    title: "Memoria comercial",
    summary:
      signals.length > 0
        ? "ClienteYA analiza patrones de relación, seguimiento, pago, riesgo y oportunidad para convertir datos en memoria útil."
        : "ClienteYA todavía necesita más relaciones o actividad para construir memoria comercial.",
    strongestPattern,
    mainRisk,
    bestAction,
    totalSignals: signals.length,
    criticalSignals,
    highSignals,
  };
}

export function buildCommercialMemorySignals(
  relationships: CommercialMemoryRelationship[]
): CommercialMemoryResult {
  const now = new Date();

  const signals = relationships
    .filter((relationship) => relationship.id)
    .map((relationship) =>
      buildBestSignalForRelationship(relationship, now)
    )
    .sort((a, b) => {
      const priorityWeight: Record<
        CommercialMemorySignalPriority,
        number
      > = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };

      return (
        priorityWeight[b.priority] -
          priorityWeight[a.priority] ||
        b.score - a.score ||
        a.relationshipName.localeCompare(b.relationshipName)
      );
    });

  return {
    summary: buildSummary(signals),
    signals,
  };
}

export function getCommercialMemorySignalPriorityLabel(
  priority: CommercialMemorySignalPriority
) {
  const map: Record<
    CommercialMemorySignalPriority,
    string
  > = {
    critical: "Crítico",
    high: "Alta",
    medium: "Media",
    low: "Baja",
  };

  return map[priority];
}

export function getCommercialMemorySignalTypeLabel(
  type: CommercialMemorySignalType
) {
  const map: Record<CommercialMemorySignalType, string> = {
    relationship: "Relación",
    followup: "Seguimiento",
    payment: "Pago",
    opportunity: "Oportunidad",
    risk: "Riesgo",
    loyalty: "Lealtad",
    reactivation: "Reactivación",
  };

  return map[type];
}

export function getCommercialMemorySignalToneClasses(
  tone: CommercialMemorySignalTone
) {
  const map: Record<
    CommercialMemorySignalTone,
    string
  > = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-950",
    sky:
      "border-sky-200 bg-sky-50 text-sky-950",
    amber:
      "border-amber-200 bg-amber-50 text-amber-950",
    red:
      "border-red-200 bg-red-50 text-red-950",
    slate:
      "border-slate-200 bg-slate-50 text-slate-950",
  };

  return map[tone];
}

export function getCommercialMemorySignalBadgeClasses(
  tone: CommercialMemorySignalTone
) {
  const map: Record<
    CommercialMemorySignalTone,
    string
  > = {
    emerald:
      "border-emerald-200 bg-emerald-100 text-emerald-800",
    sky:
      "border-sky-200 bg-sky-100 text-sky-800",
    amber:
      "border-amber-200 bg-amber-100 text-amber-800",
    red:
      "border-red-200 bg-red-100 text-red-800",
    slate:
      "border-slate-200 bg-slate-100 text-slate-700",
  };

  return map[tone];
}