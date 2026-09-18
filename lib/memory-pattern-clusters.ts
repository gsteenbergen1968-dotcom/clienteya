import {
  type CommercialMemoryRelationship,
  type CommercialMemorySignal,
  buildCommercialMemorySignals,
} from "./commercial-memory-signals";

export type MemoryPatternClusterType =
  | "hot_relationships"
  | "loyal_relationships"
  | "sleeping_relationships"
  | "risk_relationships"
  | "vip_relationships"
  | "payment_attention"
  | "new_opportunities"
  | "needs_memory";

export type MemoryPatternClusterPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type MemoryPatternClusterTone =
  | "emerald"
  | "sky"
  | "amber"
  | "red"
  | "slate"
  | "violet";

export type MemoryPatternClusterRelationship = {
  id: string;
  name: string;
  reason: string;
  score: number;
  actionLabel: string;
};

export type MemoryPatternCluster = {
  id: string;
  type: MemoryPatternClusterType;
  title: string;
  subtitle: string;
  insight: string;
  founderMeaning: string;
  recommendation: string;
  actionLabel: string;
  count: number;
  score: number;
  priority: MemoryPatternClusterPriority;
  tone: MemoryPatternClusterTone;
  relationships: MemoryPatternClusterRelationship[];
};

export type MemoryPatternClusterSummary = {
  title: string;
  summary: string;
  strongestCluster: string;
  mainRisk: string;
  bestAction: string;
  totalClusters: number;
  totalRelationshipsInClusters: number;
  criticalClusters: number;
  highClusters: number;
};

export type MemoryPatternClusterResult = {
  summary: MemoryPatternClusterSummary;
  clusters: MemoryPatternCluster[];
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
    Math.floor((now.getTime() - date.getTime()) / DAY_IN_MS),
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
  relationship: CommercialMemoryRelationship,
) {
  return relationship.nombre?.trim() || "Relación sin nombre";
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}

function getPriorityWeight(
  priority: MemoryPatternClusterPriority,
) {
  const map: Record<MemoryPatternClusterPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return map[priority];
}

function getStatus(
  relationship: CommercialMemoryRelationship,
) {
  return normalizeText(relationship.estado);
}

function getMemoryText(
  relationship: CommercialMemoryRelationship,
) {
  return normalizeText(
    `${relationship.estado ?? ""} ${relationship.notas ?? ""} ${
      relationship.recordatorio ?? ""
    }`,
  );
}

function hasPromiseSignal(
  relationship: CommercialMemoryRelationship,
) {
  const text = getMemoryText(relationship);

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

function hasRiskText(
  relationship: CommercialMemoryRelationship,
) {
  const text = getMemoryText(relationship);

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

function hasLoyaltyText(
  relationship: CommercialMemoryRelationship,
) {
  const text = getMemoryText(relationship);

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

function hasOpenStatus(
  relationship: CommercialMemoryRelationship,
) {
  const status = getStatus(relationship);

  return includesAny(status, [
    "nuevo",
    "lead",
    "prospecto",
    "interesado",
    "pendiente",
    "seguimiento",
    "abierto",
  ]);
}

function hasWonStatus(
  relationship: CommercialMemoryRelationship,
) {
  const status = getStatus(relationship);

  return includesAny(status, [
    "cerrado",
    "ganado",
    "vendido",
    "pagado",
    "relación",
  ]);
}

function hasLostStatus(
  relationship: CommercialMemoryRelationship,
) {
  const status = getStatus(relationship);

  return includesAny(status, [
    "perdido",
    "cancelado",
    "frio",
    "frío",
    "no responde",
  ]);
}

function hasUsefulMemory(
  relationship: CommercialMemoryRelationship,
) {
  return (
    normalizeText(relationship.notas).length >= 16 ||
    normalizeText(relationship.recordatorio).length >= 12 ||
    Boolean(relationship.proximo_contacto)
  );
}

function getSignalForRelationship(
  relationship: CommercialMemoryRelationship,
  signals: CommercialMemorySignal[],
) {
  return (
    signals.find(
      (signal) =>
        signal.relationshipId === relationship.id,
    ) ?? null
  );
}

function buildClusterRelationship(
  relationship: CommercialMemoryRelationship,
  reason: string,
  score: number,
  actionLabel: string,
): MemoryPatternClusterRelationship {
  return {
    id: relationship.id,
    name: getRelationshipName(relationship),
    reason,
    score: clamp(Math.round(score)),
    actionLabel,
  };
}

function averageScore(
  relationships: MemoryPatternClusterRelationship[],
) {
  if (relationships.length === 0) return 0;

  return clamp(
    Math.round(
      relationships.reduce(
        (total, relationship) =>
          total + relationship.score,
        0,
      ) / relationships.length,
    ),
  );
}

function sortClusterRelationships(
  relationships: MemoryPatternClusterRelationship[],
) {
  return [...relationships].sort(
    (a, b) =>
      b.score - a.score ||
      a.name.localeCompare(b.name),
  );
}

function buildHotRelationshipsCluster(
  relationships: CommercialMemoryRelationship[],
  signals: CommercialMemorySignal[],
  now = new Date(),
): MemoryPatternCluster | null {
  const clusterRelationships = relationships
    .map((relationship) => {
      const signal = getSignalForRelationship(
        relationship,
        signals,
      );

      const updatedDays = daysBetween(
        safeDate(relationship.updated_at),
        now,
      );

      const until = daysUntil(
        safeDate(relationship.proximo_contacto),
        now,
      );

      const amount = Number(
        relationship.monto ?? 0,
      );

      const promise =
        hasPromiseSignal(relationship);

      const open =
        hasOpenStatus(relationship);

      let score = 35;

      if (promise) score += 25;
      if (open) score += 15;

      if (
        updatedDays !== null &&
        updatedDays <= 7
      ) {
        score += 20;
      }

      if (
        until !== null &&
        until >= 0 &&
        until <= 3
      ) {
        score += 15;
      }

      if (amount > 0) score += 10;

      if (signal?.type === "opportunity") {
        score += 20;
      }

      if (
        signal?.type === "followup" &&
        signal.priority !== "low"
      ) {
        score += 15;
      }

      score = clamp(score);

      if (score < 60) return null;

      return buildClusterRelationship(
        relationship,
        promise
          ? "Muestra interés, promesa o conversación comercial activa."
          : updatedDays !== null && updatedDays <= 7
            ? "Tiene actividad reciente y puede avanzar pronto."
            : "Tiene señales suficientes para una acción comercial cercana.",
        score,
        score >= 80
          ? "Avanzar ahora"
          : "Confirmar interés",
      );
    })
    .filter(Boolean) as MemoryPatternClusterRelationship[];

  if (clusterRelationships.length === 0) {
    return null;
  }

  const sortedRelationships =
    sortClusterRelationships(clusterRelationships);

  const score =
    averageScore(sortedRelationships);

  return {
    id: "hot-relationships",
    type: "hot_relationships",
    title: "Relaciones calientes",
    subtitle: `${sortedRelationships.length} relación${
      sortedRelationships.length === 1 ? "" : "es"
    } con señales de avance`,
    insight:
      "ClienteYA detecta relaciones con señales recientes de interés, conversación o próxima acción comercial.",
    founderMeaning:
      "Estas relaciones pueden generar movimiento si el seguimiento se hace en el momento correcto.",
    recommendation:
      "Priorizar mensajes concretos, simples y con una próxima acción clara.",
    actionLabel: "Avanzar oportunidades",
    count: sortedRelationships.length,
    score,
    priority: score >= 80 ? "high" : "medium",
    tone: "sky",
    relationships: sortedRelationships,
  };
}

function buildLoyalRelationshipsCluster(
  relationships: CommercialMemoryRelationship[],
  signals: CommercialMemorySignal[],
  now = new Date(),
): MemoryPatternCluster | null {
  const clusterRelationships = relationships
    .map((relationship) => {
      const signal = getSignalForRelationship(
        relationship,
        signals,
      );

      const paid = Boolean(
        relationship.pagado,
      );

      const amount = Number(
        relationship.monto ?? 0,
      );

      const updatedDays = daysBetween(
        safeDate(relationship.updated_at),
        now,
      );

      const loyalty =
        hasLoyaltyText(relationship);

      const won =
        hasWonStatus(relationship);

      let score = 35;

      if (paid) score += 25;
      if (amount > 0) score += 10;
      if (loyalty) score += 25;
      if (won) score += 15;

      if (
        updatedDays !== null &&
        updatedDays <= 30
      ) {
        score += 10;
      }

      if (signal?.type === "relationship") {
        score += 15;
      }

      if (
        signal?.type === "payment" &&
        signal.tone === "emerald"
      ) {
        score += 15;
      }

      score = clamp(score);

      if (score < 60) return null;

      return buildClusterRelationship(
        relationship,
        loyalty
          ? "Tiene señales de recurrencia, confianza o relación estable."
          : paid
            ? "Tiene pago registrado y relación comercial positiva."
            : "Muestra señales de continuidad comercial.",
        score,
        score >= 80
          ? "Cuidar relación"
          : "Mantener contacto",
      );
    })
    .filter(Boolean) as MemoryPatternClusterRelationship[];

  if (clusterRelationships.length === 0) {
    return null;
  }

  const sortedRelationships =
    sortClusterRelationships(clusterRelationships);

  const score =
    averageScore(sortedRelationships);

  return {
    id: "loyal-relationships",
    type: "loyal_relationships",
    title: "Relaciones leales",
    subtitle: `${sortedRelationships.length} relación${
      sortedRelationships.length === 1 ? "" : "es"
    } con valor relacional`,
    insight:
      "ClienteYA detecta relaciones con señales de continuidad, pago, recompra o confianza.",
    founderMeaning:
      "Estas relaciones son estabilidad futura. No deben ser tratadas como contactos normales.",
    recommendation:
      "Cuidar la relación, agradecer, mantener presencia y buscar recompra sin presión.",
    actionLabel: "Proteger relaciones",
    count: sortedRelationships.length,
    score,
    priority: score >= 80 ? "high" : "medium",
    tone: "emerald",
    relationships: sortedRelationships,
  };
}

function buildSleepingRelationshipsCluster(
  relationships: CommercialMemoryRelationship[],
  signals: CommercialMemorySignal[],
  now = new Date(),
): MemoryPatternCluster | null {
  const clusterRelationships = relationships
    .map((relationship) => {
      const signal = getSignalForRelationship(
        relationship,
        signals,
      );

      const updatedDays = daysBetween(
        safeDate(relationship.updated_at),
        now,
      );

      const createdDays = daysBetween(
        safeDate(relationship.created_at),
        now,
      );

      const lost =
        hasLostStatus(relationship);

      const risk =
        hasRiskText(relationship);

      const paid = Boolean(
        relationship.pagado,
      );

      const amount = Number(
        relationship.monto ?? 0,
      );

      let score = 25;

      if (
        updatedDays !== null &&
        updatedDays >= 30
      ) {
        score += 25;
      }

      if (
        updatedDays !== null &&
        updatedDays >= 60
      ) {
        score += 20;
      }

      if (
        createdDays !== null &&
        createdDays >= 45
      ) {
        score += 10;
      }

      if (paid || amount > 0) {
        score += 15;
      }

      if (signal?.type === "relationship") {
        score += 10;
      }

      if (risk) score -= 15;
      if (lost) score -= 30;

      score = clamp(score);

      if (score < 55) return null;

      return buildClusterRelationship(
        relationship,
        updatedDays !== null
          ? `Sin actualización fuerte hace ${updatedDays} día${
              updatedDays === 1 ? "" : "s"
            }.`
          : "Tiene poca actividad reciente registrada.",
        score,
        score >= 75
          ? "Reactivar relación"
          : "Enviar saludo",
      );
    })
    .filter(Boolean) as MemoryPatternClusterRelationship[];

  if (clusterRelationships.length === 0) {
    return null;
  }

  const sortedRelationships =
    sortClusterRelationships(clusterRelationships);

  const score =
    averageScore(sortedRelationships);

  return {
    id: "sleeping-relationships",
    type: "sleeping_relationships",
    title: "Relaciones dormidas",
    subtitle: `${sortedRelationships.length} relación${
      sortedRelationships.length === 1 ? "" : "es"
    } con potencial de reactivación`,
    insight:
      "ClienteYA detecta relaciones que no parecen perdidas, pero llevan demasiado tiempo sin movimiento claro.",
    founderMeaning:
      "Aquí puede haber dinero dormido. No son urgencias, pero sí oportunidades olvidadas.",
    recommendation:
      "Reactivar con mensajes humanos, suaves y sin presión comercial directa.",
    actionLabel: "Reactivar relaciones",
    count: sortedRelationships.length,
    score,
    priority: score >= 80 ? "medium" : "low",
    tone: "slate",
    relationships: sortedRelationships,
  };
}

function buildRiskRelationshipsCluster(
  relationships: CommercialMemoryRelationship[],
  signals: CommercialMemorySignal[],
  now = new Date(),
): MemoryPatternCluster | null {
  const clusterRelationships = relationships
    .map((relationship) => {
      const signal = getSignalForRelationship(
        relationship,
        signals,
      );

      const updatedDays = daysBetween(
        safeDate(relationship.updated_at),
        now,
      );

      const until = daysUntil(
        safeDate(relationship.proximo_contacto),
        now,
      );

      const risk =
        hasRiskText(relationship);

      const lost =
        hasLostStatus(relationship);

      let score = 30;

      if (risk) score += 25;
      if (lost) score += 25;

      if (
        updatedDays !== null &&
        updatedDays > 21
      ) {
        score += 20;
      }

      if (
        until !== null &&
        until < 0
      ) {
        score += 20;
      }

      if (signal?.type === "risk") {
        score += 25;
      }

      if (signal?.priority === "critical") {
        score += 15;
      }

      score = clamp(score);

      if (score < 60) return null;

      return buildClusterRelationship(
        relationship,
        lost
          ? "Tiene estado o notas con señal de pérdida o enfriamiento."
          : until !== null && until < 0
            ? `Tiene seguimiento vencido hace ${Math.abs(
                until,
              )} día${
                Math.abs(until) === 1 ? "" : "s"
              }.`
            : "Muestra señales de riesgo comercial.",
        score,
        score >= 80
          ? "Recuperar urgente"
          : "Prevenir pérdida",
      );
    })
    .filter(Boolean) as MemoryPatternClusterRelationship[];

  if (clusterRelationships.length === 0) {
    return null;
  }

  const sortedRelationships =
    sortClusterRelationships(clusterRelationships);

  const score =
    averageScore(sortedRelationships);

  return {
    id: "risk-relationships",
    type: "risk_relationships",
    title: "Relaciones en riesgo",
    subtitle: `${sortedRelationships.length} relación${
      sortedRelationships.length === 1 ? "" : "es"
    } pueden enfriarse o perderse`,
    insight:
      "ClienteYA detecta señales de atraso, silencio, duda o posible pérdida comercial.",
    founderMeaning:
      "Estas relaciones necesitan atención antes de que la oportunidad desaparezca.",
    recommendation:
      "Recuperar conversación con mensajes cortos, humanos y sin presión de venta.",
    actionLabel: "Recuperar relaciones",
    count: sortedRelationships.length,
    score,
    priority: score >= 80 ? "critical" : "high",
    tone: "red",
    relationships: sortedRelationships,
  };
}

function buildVipRelationshipsCluster(
  relationships: CommercialMemoryRelationship[],
  signals: CommercialMemorySignal[],
  now = new Date(),
): MemoryPatternCluster | null {
  const paidAmounts = relationships
    .map((relationship) =>
      Number(relationship.monto ?? 0),
    )
    .filter((amount) => amount > 0)
    .sort((a, b) => a - b);

  const medianAmount =
    paidAmounts.length > 0
      ? paidAmounts[
          Math.floor(paidAmounts.length / 2)
        ]
      : 0;

  const vipThreshold =
    Math.max(
      medianAmount * 1.5,
      500000,
    );

  const clusterRelationships = relationships
    .map((relationship) => {
      const signal = getSignalForRelationship(
        relationship,
        signals,
      );

      const amount = Number(
        relationship.monto ?? 0,
      );

      const paid = Boolean(
        relationship.pagado,
      );

      const loyalty =
        hasLoyaltyText(relationship);

      const updatedDays = daysBetween(
        safeDate(relationship.updated_at),
        now,
      );

      let score = 35;

      if (amount >= vipThreshold) {
        score += 30;
      }

      if (paid) score += 20;
      if (loyalty) score += 20;

      if (
        updatedDays !== null &&
        updatedDays <= 30
      ) {
        score += 10;
      }

      if (signal?.type === "relationship") {
        score += 10;
      }

      if (signal?.tone === "emerald") {
        score += 10;
      }

      score = clamp(score);

      if (score < 70) return null;

      return buildClusterRelationship(
        relationship,
        amount > 0
          ? `Valor registrado: ${formatCurrency(
              amount,
            )}.`
          : "Tiene señales de alto valor relacional.",
        score,
        score >= 85
          ? "Prioridad VIP"
          : "Cuidar valor",
      );
    })
    .filter(Boolean) as MemoryPatternClusterRelationship[];

  if (clusterRelationships.length === 0) {
    return null;
  }

  const sortedRelationships =
    sortClusterRelationships(clusterRelationships);

  const score =
    averageScore(sortedRelationships);

  return {
    id: "vip-relationships",
    type: "vip_relationships",
    title: "Relaciones VIP",
    subtitle: `${sortedRelationships.length} relación${
      sortedRelationships.length === 1 ? "" : "es"
    } de alto valor`,
    insight:
      "ClienteYA detecta relaciones con valor económico, pago, recurrencia o importancia comercial especial.",
    founderMeaning:
      "Estas relaciones merecen prioridad máxima porque pueden sostener crecimiento y reputación.",
    recommendation:
      "Dar seguimiento personalizado. No automatizar demasiado las relaciones VIP.",
    actionLabel: "Cuidar VIP",
    count: sortedRelationships.length,
    score,
    priority: "high",
    tone: "violet",
    relationships: sortedRelationships,
  };
}

function buildPaymentAttentionCluster(
  relationships: CommercialMemoryRelationship[],
  signals: CommercialMemorySignal[],
): MemoryPatternCluster | null {
  const clusterRelationships = relationships
    .map((relationship) => {
      const signal = getSignalForRelationship(
        relationship,
        signals,
      );

      const amount = Number(
        relationship.monto ?? 0,
      );

      const paid = Boolean(
        relationship.pagado,
      );

      let score = 30;

      if (
        amount > 0 &&
        !paid
      ) {
        score += 45;
      }

      if (
        signal?.type === "payment" &&
        signal.priority === "high"
      ) {
        score += 20;
      }

      if (
        amount >= 1000000 &&
        !paid
      ) {
        score += 15;
      }

      score = clamp(score);

      if (score < 60) return null;

      return buildClusterRelationship(
        relationship,
        `Tiene ${formatCurrency(
          amount,
        )} registrado sin pago confirmado.`,
        score,
        amount >= 1000000
          ? "Cobro prioritario"
          : "Revisar pago",
      );
    })
    .filter(Boolean) as MemoryPatternClusterRelationship[];

  if (clusterRelationships.length === 0) {
    return null;
  }

  const sortedRelationships =
    sortClusterRelationships(clusterRelationships);

  const score =
    averageScore(sortedRelationships);

  return {
    id: "payment-attention",
    type: "payment_attention",
    title: "Cobros pendientes",
    subtitle: `${sortedRelationships.length} relación${
      sortedRelationships.length === 1 ? "" : "es"
    } con valor por revisar`,
    insight:
      "ClienteYA detecta relaciones con monto registrado pero sin pago confirmado.",
    founderMeaning:
      "Puede haber flujo de caja pendiente que merece atención antes de seguir abriendo nuevas oportunidades.",
    recommendation:
      "Revisar cobros con tono profesional y confirmar estado antes de insistir comercialmente.",
    actionLabel: "Revisar cobros",
    count: sortedRelationships.length,
    score,
    priority: score >= 80 ? "high" : "medium",
    tone: "amber",
    relationships: sortedRelationships,
  };
}

function buildNewOpportunitiesCluster(
  relationships: CommercialMemoryRelationship[],
  signals: CommercialMemorySignal[],
  now = new Date(),
): MemoryPatternCluster | null {
  const clusterRelationships = relationships
    .map((relationship) => {
      const signal = getSignalForRelationship(
        relationship,
        signals,
      );

      const createdDays = daysBetween(
        safeDate(relationship.created_at),
        now,
      );

      const updatedDays = daysBetween(
        safeDate(relationship.updated_at),
        now,
      );

      const open =
        hasOpenStatus(relationship);

      const promise =
        hasPromiseSignal(relationship);

      let score = 35;

      if (
        createdDays !== null &&
        createdDays <= 14
      ) {
        score += 20;
      }

      if (
        updatedDays !== null &&
        updatedDays <= 7
      ) {
        score += 15;
      }

      if (open) score += 15;
      if (promise) score += 20;

      if (signal?.type === "opportunity") {
        score += 20;
      }

      score = clamp(score);

      if (score < 60) return null;

      return buildClusterRelationship(
        relationship,
        createdDays !== null &&
          createdDays <= 14
          ? `Nueva en la base hace ${createdDays} día${
              createdDays === 1 ? "" : "s"
            }.`
          : "Muestra señal inicial de oportunidad.",
        score,
        score >= 80
          ? "Convertir pronto"
          : "Guiar avance",
      );
    })
    .filter(Boolean) as MemoryPatternClusterRelationship[];

  if (clusterRelationships.length === 0) {
    return null;
  }

  const sortedRelationships =
    sortClusterRelationships(clusterRelationships);

  const score =
    averageScore(sortedRelationships);

  return {
    id: "new-opportunities",
    type: "new_opportunities",
    title: "Nuevas oportunidades",
    subtitle: `${sortedRelationships.length} relación${
      sortedRelationships.length === 1 ? "" : "es"
    } con potencial inicial`,
    insight:
      "ClienteYA detecta relaciones nuevas o recientes con señales comerciales que todavía necesitan dirección.",
    founderMeaning:
      "Estas oportunidades están frescas. El timing puede ser más importante que la insistencia.",
    recommendation:
      "Guiar la conversación con una pregunta clara o una propuesta simple.",
    actionLabel: "Guiar oportunidades",
    count: sortedRelationships.length,
    score,
    priority: score >= 80 ? "high" : "medium",
    tone: "sky",
    relationships: sortedRelationships,
  };
}

function buildNeedsMemoryCluster(
  relationships: CommercialMemoryRelationship[],
): MemoryPatternCluster | null {
  const clusterRelationships = relationships
    .map((relationship) => {
      let score = 40;

      if (
        !normalizeText(
          relationship.notas,
        )
      ) {
        score += 20;
      }

      if (
        !normalizeText(
          relationship.recordatorio,
        )
      ) {
        score += 15;
      }

      if (
        !relationship.proximo_contacto
      ) {
        score += 15;
      }

      if (!relationship.estado) {
        score += 10;
      }

      score = clamp(score);

      if (
        score < 60 ||
        hasUsefulMemory(relationship)
      ) {
        return null;
      }

      return buildClusterRelationship(
        relationship,
        "Faltan notas, recordatorio o próximo contacto para leer mejor la relación.",
        score,
        "Completar memoria",
      );
    })
    .filter(Boolean) as MemoryPatternClusterRelationship[];

  if (clusterRelationships.length === 0) {
    return null;
  }

  const sortedRelationships =
    sortClusterRelationships(clusterRelationships);

  const score =
    averageScore(sortedRelationships);

  return {
    id: "needs-memory",
    type: "needs_memory",
    title: "Memoria incompleta",
    subtitle: `${sortedRelationships.length} relación${
      sortedRelationships.length === 1 ? "" : "es"
    } necesitan más contexto`,
    insight:
      "ClienteYA detecta relaciones con poca información para construir una memoria comercial confiable.",
    founderMeaning:
      "Sin memoria, la AI puede ver datos, pero no entender bien la relación.",
    recommendation:
      "Completar notas simples: qué quiere, qué pasó y cuál es el próximo paso.",
    actionLabel: "Completar contexto",
    count: sortedRelationships.length,
    score,
    priority: "low",
    tone: "slate",
    relationships: sortedRelationships,
  };
}

function buildSummary(
  clusters: MemoryPatternCluster[],
): MemoryPatternClusterSummary {
  const totalRelationshipsInClusters =
    clusters.reduce(
      (total, cluster) =>
        total + cluster.count,
      0,
    );

  const criticalClusters =
    clusters.filter(
      (cluster) =>
        cluster.priority === "critical",
    ).length;

  const highClusters =
    clusters.filter(
      (cluster) =>
        cluster.priority === "high",
    ).length;

  const strongest = [...clusters].sort(
    (a, b) =>
      getPriorityWeight(b.priority) -
        getPriorityWeight(a.priority) ||
      b.score - a.score ||
      b.count - a.count,
  )[0];

  const riskCluster =
    clusters.find(
      (cluster) =>
        cluster.type ===
        "risk_relationships",
    );

  const vipCluster =
    clusters.find(
      (cluster) =>
        cluster.type ===
        "vip_relationships",
    );

  const hotCluster =
    clusters.find(
      (cluster) =>
        cluster.type ===
        "hot_relationships",
    );

  const paymentCluster =
    clusters.find(
      (cluster) =>
        cluster.type ===
        "payment_attention",
    );

  const memoryCluster =
    clusters.find(
      (cluster) =>
        cluster.type ===
        "needs_memory",
    );

  const mainRisk = riskCluster
    ? `${riskCluster.count} relación${
        riskCluster.count === 1 ? "" : "es"
      } pueden perderse si no se recuperan a tiempo.`
    : paymentCluster
      ? `${paymentCluster.count} cobro${
          paymentCluster.count === 1 ? "" : "s"
        } necesitan revisión.`
      : memoryCluster
        ? "La mayor debilidad actual es falta de memoria comercial en algunas relaciones."
        : "No hay un patrón fuerte de riesgo en este momento.";

  const bestAction = riskCluster
    ? "Recuperar primero las relaciones en riesgo."
    : hotCluster
      ? "Avanzar primero las relaciones calientes."
      : vipCluster
        ? "Cuidar primero las relaciones VIP."
        : paymentCluster
          ? "Revisar cobros pendientes."
          : memoryCluster
            ? "Completar memoria comercial."
            : "Mantener seguimiento y seguir registrando señales.";

  return {
    title: "Patrones de memoria comercial",
    summary:
      clusters.length > 0
        ? "ClienteYA agrupa relaciones por patrones de riesgo, oportunidad, pago y memoria para mostrar dónde actuar primero."
        : "ClienteYA todavía necesita más datos para agrupar relaciones en patrones comerciales útiles.",
    strongestCluster: strongest
      ? `${strongest.title}: ${strongest.count} relación${
          strongest.count === 1 ? "" : "es"
        }.`
      : "Todavía no hay un patrón dominante.",
    mainRisk,
    bestAction,
    totalClusters: clusters.length,
    totalRelationshipsInClusters,
    criticalClusters,
    highClusters,
  };
}

export function buildMemoryPatternClusters(
  relationships: CommercialMemoryRelationship[],
): MemoryPatternClusterResult {
  const now = new Date();

  const commercialMemory =
    buildCommercialMemorySignals(
      relationships,
    );

  const signals =
    commercialMemory.signals;

  const clusters = [
    buildRiskRelationshipsCluster(
      relationships,
      signals,
      now,
    ),
    buildHotRelationshipsCluster(
      relationships,
      signals,
      now,
    ),
    buildVipRelationshipsCluster(
      relationships,
      signals,
      now,
    ),
    buildLoyalRelationshipsCluster(
      relationships,
      signals,
      now,
    ),
    buildPaymentAttentionCluster(
      relationships,
      signals,
    ),
    buildNewOpportunitiesCluster(
      relationships,
      signals,
      now,
    ),
    buildSleepingRelationshipsCluster(
      relationships,
      signals,
      now,
    ),
    buildNeedsMemoryCluster(
      relationships,
    ),
  ]
    .filter(Boolean)
    .map(
      (cluster) =>
        cluster as MemoryPatternCluster,
    )
    .sort((a, b) => {
      return (
        getPriorityWeight(b.priority) -
          getPriorityWeight(a.priority) ||
        b.score - a.score ||
        b.count - a.count ||
        a.title.localeCompare(b.title)
      );
    });

  return {
    summary: buildSummary(clusters),
    clusters,
  };
}

export function getMemoryPatternClusterTypeLabel(
  type: MemoryPatternClusterType,
) {
  const map: Record<
    MemoryPatternClusterType,
    string
  > = {
    hot_relationships: "Relaciones calientes",
    loyal_relationships: "Relaciones leales",
    sleeping_relationships: "Relaciones dormidas",
    risk_relationships: "Relaciones en riesgo",
    vip_relationships: "Relaciones VIP",
    payment_attention: "Cobros pendientes",
    new_opportunities: "Nuevas oportunidades",
    needs_memory: "Memoria incompleta",
  };

  return map[type];
}

export function getMemoryPatternClusterPriorityLabel(
  priority: MemoryPatternClusterPriority,
) {
  const map: Record<
    MemoryPatternClusterPriority,
    string
  > = {
    critical: "Crítico",
    high: "Alta",
    medium: "Media",
    low: "Baja",
  };

  return map[priority];
}

export function getMemoryPatternClusterToneClasses(
  tone: MemoryPatternClusterTone,
) {
  const map: Record<
    MemoryPatternClusterTone,
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
    violet:
      "border-violet-200 bg-violet-50 text-violet-950",
  };

  return map[tone];
}

export function getMemoryPatternClusterBadgeClasses(
  tone: MemoryPatternClusterTone,
) {
  const map: Record<
    MemoryPatternClusterTone,
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
    violet:
      "border-violet-200 bg-violet-100 text-violet-800",
  };

  return map[tone];
}

export function getMemoryPatternClusterIcon(
  type: MemoryPatternClusterType,
) {
  const map: Record<
    MemoryPatternClusterType,
    string
  > = {
    hot_relationships: "🔥",
    loyal_relationships: "🤝",
    sleeping_relationships: "😴",
    risk_relationships: "⚠️",
    vip_relationships: "💎",
    payment_attention: "💰",
    new_opportunities: "🌱",
    needs_memory: "🧠",
  };

  return map[type];
}