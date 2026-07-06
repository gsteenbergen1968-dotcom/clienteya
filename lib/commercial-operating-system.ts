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

export type CommercialOperatingClient = {
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
  client: CommercialOperatingClient;

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

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function parseDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysBetween(from: Date, to: Date) {
  const fromDay = startOfDay(from);
  const toDay = startOfDay(to);

  return Math.round(
    (toDay.getTime() - fromDay.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function getDaysUntil(value?: string | null) {
  const date = parseDate(value);

  if (!date) return null;

  return daysBetween(new Date(), date);
}

function getDaysSince(value?: string | null) {
  const date = parseDate(value);

  if (!date) return null;

  return daysBetween(date, new Date());
}

function hasCommercialValue(client: CommercialOperatingClient) {
  return Number(client.monto ?? 0) > 0;
}

function isPaid(client: CommercialOperatingClient) {
  return Boolean(client.pagado);
}

function isClosedStatus(status?: string | null) {
  const normalized = normalizeText(status);

  return [
    "cerrado",
    "closed",
    "finalizado",
    "pagado",
    "cancelado",
    "lost",
    "perdido",
  ].includes(normalized);
}

function isActiveStatus(status?: string | null) {
  const normalized = normalizeText(status);

  return [
    "activo",
    "active",
    "prospecto",
    "lead",
    "pendiente",
    "seguimiento",
    "followup",
    "interesado",
  ].includes(normalized);
}

function calculateMemoryScore(client: CommercialOperatingClient) {
  let score = 0;

  const notas = normalizeText(client.notas);
  const memory = normalizeText(client.memory);
  const recordatorio = normalizeText(client.recordatorio);

  if (notas.length > 20) score += 25;
  if (notas.length > 80) score += 15;

  if (memory.length > 20) score += 30;
  if (memory.length > 80) score += 15;

  if (recordatorio.length > 10) score += 15;

  return clamp(score);
}

function calculateRelationshipScore(
  client: CommercialOperatingClient,
) {
  let score = 50;

  const status = normalizeText(client.estado);
  const daysSinceUpdated = getDaysSince(client.updated_at);
  const daysUntilNextContact = getDaysUntil(
    client.proximo_contacto,
  );

  if (isActiveStatus(status)) score += 20;
  if (isClosedStatus(status)) score -= 30;

  if (daysSinceUpdated !== null) {
    if (daysSinceUpdated <= 2) score += 15;
    if (daysSinceUpdated >= 7) score -= 10;
    if (daysSinceUpdated >= 14) score -= 20;
    if (daysSinceUpdated >= 30) score -= 30;
  }

  if (daysUntilNextContact !== null) {
    if (daysUntilNextContact < 0) score -= 25;
    if (daysUntilNextContact === 0) score += 15;
    if (daysUntilNextContact > 7) score -= 10;
  }

  return clamp(score);
}

function calculateCommercialScore(
  client: CommercialOperatingClient,
  memoryScore: number,
  relationshipScore: number,
) {
  let score = 40;

  score += memoryScore * 0.2;
  score += relationshipScore * 0.35;

  if (hasCommercialValue(client)) score += 20;
  if (isPaid(client)) score -= 20;

  if (isClosedStatus(client.estado)) score -= 35;

  return clamp(Math.round(score));
}

function getNextActionLabel(
  nextAction: CommercialOperatingNextAction,
) {
  switch (nextAction) {
    case "contact_today":
      return "Contactar hoy";
    case "prepare_followup":
      return "Preparar seguimiento";
    case "reactivate":
      return "Reactivar cliente";
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
  client: CommercialOperatingClient,
): CommercialOperatingResult {
  const daysUntilNextContact = getDaysUntil(
    client.proximo_contacto,
  );

  const daysSinceCreated = getDaysSince(client.created_at);
  const daysSinceUpdated = getDaysSince(client.updated_at);

  const memoryScore = calculateMemoryScore(client);
  const relationshipScore =
    calculateRelationshipScore(client);

  const commercialScore = calculateCommercialScore(
    client,
    memoryScore,
    relationshipScore,
  );

  const closed = isClosedStatus(client.estado) || isPaid(client);

  let urgency: CommercialOperatingUrgency = "none";
  let priority: CommercialOperatingPriority = "watch";
  let nextAction: CommercialOperatingNextAction = "monitor";
  let reason = "Sin acción urgente. Mantener en observación.";

  if (closed) {
    urgency = "none";
    priority = "closed";
    nextAction = "closed";
    reason = "Cliente cerrado o pagado. No requiere acción comercial.";
  } else if (daysUntilNextContact !== null) {
    if (daysUntilNextContact < 0) {
      urgency = "critical";
      priority = "today";
      nextAction = hasCommercialValue(client)
        ? "protect_revenue"
        : "reactivate";
      reason =
        "El seguimiento está vencido. Actuar hoy para no perder la relación.";
    } else if (daysUntilNextContact === 0) {
      urgency = "high";
      priority = "today";
      nextAction = "contact_today";
      reason =
        "El cliente tiene seguimiento programado para hoy.";
    } else if (daysUntilNextContact === 1) {
      urgency = "medium";
      priority = "tomorrow";
      nextAction = "prepare_followup";
      reason =
        "El seguimiento está previsto para mañana. Preparar el contacto.";
    } else if (daysUntilNextContact <= 7) {
      urgency = "low";
      priority = "upcoming";
      nextAction = "prepare_followup";
      reason =
        "El cliente tiene una acción próxima en calendario.";
    } else {
      urgency = "none";
      priority = "watch";
      nextAction = "monitor";
      reason =
        "El próximo contacto está planificado más adelante.";
    }
  } else if (daysSinceUpdated !== null && daysSinceUpdated >= 14) {
    urgency = "high";
    priority = "today";
    nextAction = "reactivate";
    reason =
      "No hay próximo contacto y la relación lleva demasiado tiempo sin movimiento.";
  } else if (commercialScore >= 75) {
    urgency = "medium";
    priority = "today";
    nextAction = "maintain_momentum";
    reason =
      "Cliente con alto potencial comercial. Conviene mantener el momentum.";
  } else {
    urgency = "low";
    priority = "watch";
    nextAction = "monitor";
    reason =
      "Cliente sin urgencia inmediata. Mantener en la cola inteligente.";
  }

  const shouldAppearToday =
    priority === "today" && !closed;

  const shouldAppearInCalendar =
    !closed &&
    daysUntilNextContact !== null &&
    daysUntilNextContact >= 0;

  const shouldAppearInAutomations = !closed;

  const shouldAppearInCockpit = true;

  return {
    client,

    urgency,
    priority,

    reason,
    nextAction,
    nextActionLabel: getNextActionLabel(nextAction),
    nextDate: client.proximo_contacto ?? null,

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
    priorityWeight[b.priority] - priorityWeight[a.priority];

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const urgencyDifference =
    urgencyWeight[b.urgency] - urgencyWeight[a.urgency];

  if (urgencyDifference !== 0) {
    return urgencyDifference;
  }

  return b.commercialScore - a.commercialScore;
}

export function buildCommercialOperatingSystem(
  clients: CommercialOperatingClient[],
) {
  return clients
    .map((client) => buildOperatingResult(client))
    .sort(sortOperatingResults);
}

export function getTodayCommercialActions(
  clients: CommercialOperatingClient[],
) {
  return buildCommercialOperatingSystem(clients).filter(
    (result) => result.shouldAppearToday,
  );
}

export function getCalendarCommercialActions(
  clients: CommercialOperatingClient[],
) {
  return buildCommercialOperatingSystem(clients).filter(
    (result) => result.shouldAppearInCalendar,
  );
}

export function getAutomationCommercialQueue(
  clients: CommercialOperatingClient[],
) {
  return buildCommercialOperatingSystem(clients).filter(
    (result) => result.shouldAppearInAutomations,
  );
}

export function getCockpitCommercialSignals(
  clients: CommercialOperatingClient[],
) {
  return buildCommercialOperatingSystem(clients).filter(
    (result) => result.shouldAppearInCockpit,
  );
}

export function getCommercialOperatingTodayISO() {
  return todayISO();
}