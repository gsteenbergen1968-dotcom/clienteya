export type CommercialOperatingUrgency =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "none";

export type CommercialOperatingPriority =
  | "today"
  | "tomorrow"
  | "upcoming"
  | "watch"
  | "closed";

export type CommercialOperatingNextAction =
  | "contact_today"
  | "prepare_followup"
  | "reactivate"
  | "protect_revenue"
  | "maintain_momentum"
  | "monitor"
  | "closed";

export type CommercialOperatingRelationship = {
  id: string;
  nombre: string | null;
  telefono?: string | null;
  estado?: string | null;
  notas?: string | null;
  memory?: string | null;
  proximo_contacto?: string | null;
  recordatorio?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CommercialOperatingResult = {
  relationship: CommercialOperatingRelationship;
  urgency: CommercialOperatingUrgency;
  priority: CommercialOperatingPriority;
  reason: string;
  nextAction: CommercialOperatingNextAction;
  nextActionLabel: string;
  nextDate: string | null;
  memoryScore: number;
  relationshipScore: number;
  commercialScore: number;
  daysUntilNextContact: number | null;
  daysSinceCreated: number | null;
  daysSinceUpdated: number | null;
  shouldAppearToday: boolean;
  shouldAppearInCalendar: boolean;
  shouldAppearInAutomations: boolean;
  shouldAppearInCockpit: boolean;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeText(
  value?: string | null,
) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function clamp(
  value: number,
  min = 0,
  max = 100,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function parseDate(
  value?: string | null,
) {
  if (!value) {
    return null;
  }

  const date = new Date(
    value,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

function startOfDay(
  date: Date,
) {
  const copy = new Date(
    date,
  );

  copy.setHours(
    0,
    0,
    0,
    0,
  );

  return copy;
}

function daysBetween(
  from: Date,
  to: Date,
) {
  const fromDay =
    startOfDay(
      from,
    );

  const toDay =
    startOfDay(
      to,
    );

  return Math.round(
    (
      toDay.getTime() -
      fromDay.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function getDaysUntil(
  value?: string | null,
) {
  const date =
    parseDate(
      value,
    );

  if (!date) {
    return null;
  }

  return daysBetween(
    new Date(),
    date,
  );
}

function getDaysSince(
  value?: string | null,
) {
  const date =
    parseDate(
      value,
    );

  if (!date) {
    return null;
  }

  return daysBetween(
    date,
    new Date(),
  );
}

function hasCommercialValue(
  relationship: CommercialOperatingRelationship,
) {
  return Number(
    relationship.monto ?? 0,
  ) > 0;
}

function isPaid(
  relationship: CommercialOperatingRelationship,
) {
  return Boolean(
    relationship.pagado,
  );
}

function isClosedStatus(
  status?: string | null,
) {
  const normalized =
    normalizeText(
      status,
    );

  return [
    "cerrado",
    "closed",
    "finalizado",
    "pagado",
    "cancelado",
    "lost",
    "perdido",
  ].includes(
    normalized,
  );
}

function isActiveStatus(
  status?: string | null,
) {
  const normalized =
    normalizeText(
      status,
    );

  return [
    "activo",
    "active",
    "prospecto",
    "lead",
    "pendiente",
    "seguimiento",
    "followup",
    "interesado",
  ].includes(
    normalized,
  );
}

function calculateMemoryScore(
  relationship: CommercialOperatingRelationship,
) {
  let score = 0;

  const notas =
    normalizeText(
      relationship.notas,
    );

  const memory =
    normalizeText(
      relationship.memory,
    );

  const recordatorio =
    normalizeText(
      relationship.recordatorio,
    );

  if (
    notas.length > 20
  ) {
    score += 25;
  }

  if (
    notas.length > 80
  ) {
    score += 15;
  }

  if (
    memory.length > 20
  ) {
    score += 30;
  }

  if (
    memory.length > 80
  ) {
    score += 15;
  }

  if (
    recordatorio.length > 10
  ) {
    score += 15;
  }

  return clamp(
    score,
  );
}

function calculateRelationshipScore(
  relationship: CommercialOperatingRelationship,
) {
  let score = 50;

  const status =
    normalizeText(
      relationship.estado,
    );

  const daysSinceUpdated =
    getDaysSince(
      relationship.updated_at,
    );

  const daysUntilNextContact =
    getDaysUntil(
      relationship.proximo_contacto,
    );

  if (
    isActiveStatus(
      status,
    )
  ) {
    score += 20;
  }

  if (
    isClosedStatus(
      status,
    )
  ) {
    score -= 30;
  }

  if (
    daysSinceUpdated !== null
  ) {
    if (
      daysSinceUpdated <= 2
    ) {
      score += 15;
    }

    if (
      daysSinceUpdated >= 7
    ) {
      score -= 10;
    }

    if (
      daysSinceUpdated >= 14
    ) {
      score -= 20;
    }

    if (
      daysSinceUpdated >= 30
    ) {
      score -= 30;
    }
  }

  if (
    daysUntilNextContact !== null
  ) {
    if (
      daysUntilNextContact < 0
    ) {
      score -= 25;
    }

    if (
      daysUntilNextContact === 0
    ) {
      score += 15;
    }

    if (
      daysUntilNextContact > 7
    ) {
      score -= 10;
    }
  }

  return clamp(
    score,
  );
}

function calculateCommercialScore(
  relationship: CommercialOperatingRelationship,
  memoryScore: number,
  relationshipScore: number,
) {
  let score = 40;

  score +=
    memoryScore *
    0.2;

  score +=
    relationshipScore *
    0.35;

  if (
    hasCommercialValue(
      relationship,
    )
  ) {
    score += 20;
  }

  if (
    isPaid(
      relationship,
    )
  ) {
    score -= 20;
  }

  if (
    isClosedStatus(
      relationship.estado,
    )
  ) {
    score -= 35;
  }

  return clamp(
    Math.round(
      score,
    ),
  );
}

function getNextActionLabel(
  nextAction: CommercialOperatingNextAction,
) {
  switch (
    nextAction
  ) {
    case "contact_today":
      return "Contactar hoy";

    case "prepare_followup":
      return "Preparar seguimiento";

    case "reactivate":
      return "Reactivar relación";

    case "protect_revenue":
      return "Proteger ingreso";

    case "maintain_momentum":
      return "Mantener momentum";

    case "monitor":
      return "Monitorear";

    case "closed":
      return "Cerrado";

    default:
      return "Revisar";
  }
}

function buildOperatingResult(
  relationship: CommercialOperatingRelationship,
): CommercialOperatingResult {
  const daysUntilNextContact =
    getDaysUntil(
      relationship.proximo_contacto,
    );

  const daysSinceCreated =
    getDaysSince(
      relationship.created_at,
    );

  const daysSinceUpdated =
    getDaysSince(
      relationship.updated_at,
    );

  const memoryScore =
    calculateMemoryScore(
      relationship,
    );

  const relationshipScore =
    calculateRelationshipScore(
      relationship,
    );

  const commercialScore =
    calculateCommercialScore(
      relationship,
      memoryScore,
      relationshipScore,
    );

  const closed =
    isClosedStatus(
      relationship.estado,
    ) ||
    isPaid(
      relationship,
    );

  let urgency:
    CommercialOperatingUrgency =
      "none";

  let priority:
    CommercialOperatingPriority =
      "watch";

  let nextAction:
    CommercialOperatingNextAction =
      "monitor";

  let reason =
    "Sin acción urgente. Mantener en observación.";

  if (
    closed
  ) {
    urgency =
      "none";

    priority =
      "closed";

    nextAction =
      "closed";

    reason =
      "Relación cerrada o pagada. No requiere acción comercial.";
  } else if (
    daysUntilNextContact !== null
  ) {
    if (
      daysUntilNextContact < 0
    ) {
      urgency =
        "critical";

      priority =
        "today";

      nextAction =
        hasCommercialValue(
          relationship,
        )
          ? "protect_revenue"
          : "reactivate";

      reason =
        "El seguimiento está vencido. Actuar hoy para no perder la relación.";
    } else if (
      daysUntilNextContact === 0
    ) {
      urgency =
        "high";

      priority =
        "today";

      nextAction =
        "contact_today";

      reason =
        "La relación tiene seguimiento programado para hoy.";
    } else if (
      daysUntilNextContact === 1
    ) {
      urgency =
        "medium";

      priority =
        "tomorrow";

      nextAction =
        "prepare_followup";

      reason =
        "El seguimiento está previsto para mañana. Preparar el contacto.";
    } else if (
      daysUntilNextContact <= 7
    ) {
      urgency =
        "low";

      priority =
        "upcoming";

      nextAction =
        "prepare_followup";

      reason =
        "La relación tiene una acción próxima en calendario.";
    } else {
      urgency =
        "none";

      priority =
        "watch";

      nextAction =
        "monitor";

      reason =
        "El próximo contacto está planificado más adelante.";
    }
  } else if (
    daysSinceUpdated !== null &&
    daysSinceUpdated >= 14
  ) {
    urgency =
      "high";

    priority =
      "today";

    nextAction =
      "reactivate";

    reason =
      "No hay próximo contacto y la relación lleva demasiado tiempo sin movimiento.";
  } else if (
    commercialScore >= 75
  ) {
    urgency =
      "medium";

    priority =
      "today";

    nextAction =
      "maintain_momentum";

    reason =
      "Relación con alto potencial comercial. Conviene mantener el momentum.";
  }

  const shouldAppearToday =
    priority === "today" &&
    !closed;

  const shouldAppearInCalendar =
    !closed &&
    daysUntilNextContact !== null;

  const shouldAppearInAutomations =
    !closed;

  const shouldAppearInCockpit =
    true;

  return {
    relationship,
    urgency,
    priority,
    reason,
    nextAction,
    nextActionLabel:
      getNextActionLabel(
        nextAction,
      ),
    nextDate:
      relationship.proximo_contacto ??
      null,
    memoryScore,
    relationshipScore,
    commercialScore,
    daysUntilNextContact,
    daysSinceCreated,
    daysSinceUpdated,
    shouldAppearToday,
    shouldAppearInCalendar,
    shouldAppearInAutomations,
    shouldAppearInCockpit,
  };
}

function sortOperatingResults(
  a: CommercialOperatingResult,
  b: CommercialOperatingResult,
) {
  const priorityWeight: Record<
    CommercialOperatingPriority,
    number
  > = {
    today: 5,
    tomorrow: 4,
    upcoming: 3,
    watch: 2,
    closed: 1,
  };

  const urgencyWeight: Record<
    CommercialOperatingUrgency,
    number
  > = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    none: 1,
  };

  const priorityDifference =
    priorityWeight[
      b.priority
    ] -
    priorityWeight[
      a.priority
    ];

  if (
    priorityDifference !== 0
  ) {
    return priorityDifference;
  }

  const urgencyDifference =
    urgencyWeight[
      b.urgency
    ] -
    urgencyWeight[
      a.urgency
    ];

  if (
    urgencyDifference !== 0
  ) {
    return urgencyDifference;
  }

  return (
    b.commercialScore -
    a.commercialScore
  );
}

export function buildCommercialOperatingSystem(
  relationships: CommercialOperatingRelationship[],
) {
  return relationships
    .map(
      (
        relationship,
      ) =>
        buildOperatingResult(
          relationship,
        ),
    )
    .sort(
      sortOperatingResults,
    );
}

export function getTodayCommercialActions(
  relationships: CommercialOperatingRelationship[],
) {
  return buildCommercialOperatingSystem(
    relationships,
  ).filter(
    (
      result,
    ) =>
      result.shouldAppearToday,
  );
}

export function getCalendarCommercialActions(
  relationships: CommercialOperatingRelationship[],
) {
  return buildCommercialOperatingSystem(
    relationships,
  ).filter(
    (
      result,
    ) =>
      result.shouldAppearInCalendar,
  );
}

export function getAutomationCommercialQueue(
  relationships: CommercialOperatingRelationship[],
) {
  return buildCommercialOperatingSystem(
    relationships,
  ).filter(
    (
      result,
    ) =>
      result.shouldAppearInAutomations,
  );
}

export function getCockpitCommercialSignals(
  relationships: CommercialOperatingRelationship[],
) {
  return buildCommercialOperatingSystem(
    relationships,
  ).filter(
    (
      result,
    ) =>
      result.shouldAppearInCockpit,
  );
}

export function getCommercialOperatingTodayISO() {
  return todayISO();
}