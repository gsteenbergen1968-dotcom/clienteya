export type CommercialActionTone =
  | "red"
  | "amber"
  | "emerald"
  | "violet"
  | "sky"
  | "slate";

export type CommercialActionPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type CommercialActionBucket =
  | "overdue"
  | "today"
  | "tomorrow"
  | "day_after_tomorrow"
  | "next_14_days"
  | "no_date"
  | "future";

export type CommercialActionType =
  | "contact_today"
  | "follow_up"
  | "recover"
  | "schedule"
  | "review";

export type CommercialActionWhatsAppKey =
  | "nuevo"
  | "hoy"
  | "pendiente"
  | "proximo"
  | "postventa";

export type CommercialRelationship = {
  id?: string | null;
  owner_id?: string | null;

  name?: string | null;
  phone?: string | null;
  status?: string | null;

  notes?: string | null;
  reminder?: string | null;
  memory?: string | null;

  next_contact_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  expected_amount?: number | string | null;
  paid_amount?: number | string | null;
  currency?: "PYG" | "USD" | null;
  paid_at?: string | null;
  invoice_number?: string | null;
  payment_description?: string | null;

  /*
   * Compatibility field for existing adapters.
   * New relationship integrations should prefer expected_amount / paid_amount.
   */
  amount?: number | string | null;

  paid?: boolean | null;
};

type NormalizedCommercialRelationship = {
  id: string;
  ownerId: string | null;

  name: string;
  phone: string;
  status: string;

  notes: string | null;
  memory: string | null;
  reminder: string | null;

  nextContactAt: string | null;
  createdAt: string;
  updatedAt: string | null;

  expectedAmount: number;
  paidAmount: number;
  amount: number;

  currency: "PYG" | "USD";
  paid: boolean;
  paidAt: string | null;
  invoiceNumber: string | null;
  paymentDescription: string | null;
};

export type CommercialAction = {
  id: string;
  relationshipId: string;

  ownerId: string | null;

  name: string;
  phone: string;
  status: string;

  notes: string | null;
  memory: string | null;
  reminder: string | null;

  nextContactAt: string | null;

  createdAt: string;
  updatedAt: string | null;

  expectedAmount: number;
  paidAmount: number;
  amount: number;

  currency: "PYG" | "USD";
  paid: boolean;
  paidAt: string | null;
  invoiceNumber: string | null;
  paymentDescription: string | null;

  commercialScore: number;
  memoryScore: number;
  urgencyScore: number;

  priority: CommercialActionPriority;
  bucket: CommercialActionBucket;
  tone: CommercialActionTone;
  actionType: CommercialActionType;
  whatsappKey: CommercialActionWhatsAppKey;

  actionLabel: string;
  actionPhrase: string;
  reason: string;
  headline: string;

  daysUntilContact: number | null;
  daysSinceCreated: number;
};

export type BuildCommercialActionsInput = {
  relationships: CommercialRelationship[];
  today?: string;
  limit?: number;
};

function clamp(
  value: number,
  min = 0,
  max = 100,
): number {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function todayISO(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function toISODate(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const normalized =
    value.slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(
    normalized,
  )
    ? normalized
    : null;
}

function normalizeText(
  value: string | null | undefined,
): string {
  return (value || "")
    .toLowerCase()
    .trim();
}

function normalizeAmount(
  value:
    | number
    | string
    | null
    | undefined,
): number {
  const amount =
    Number(value ?? 0);

  return Number.isFinite(amount)
    ? Math.max(0, amount)
    : 0;
}

function normalizeCurrency(
  value: string | null | undefined,
): "PYG" | "USD" {
  return value === "USD"
    ? "USD"
    : "PYG";
}

function isRelationshipPaid(
  relationship: CommercialRelationship,
): boolean {
  if (
    relationship.paid === true ||
    Boolean(
      relationship.paid_at,
    )
  ) {
    return true;
  }

  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("pag") ||
    status.includes("convert")
  );
}

function getExpectedAmount(
  relationship: CommercialRelationship,
): number {
  const expectedAmount =
    normalizeAmount(
      relationship.expected_amount,
    );

  if (
    expectedAmount > 0
  ) {
    return expectedAmount;
  }

  if (
    !isRelationshipPaid(
      relationship,
    )
  ) {
    return normalizeAmount(
      relationship.amount,
    );
  }

  return 0;
}

function getPaidAmount(
  relationship: CommercialRelationship,
): number {
  const paidAmount =
    normalizeAmount(
      relationship.paid_amount,
    );

  if (
    paidAmount > 0
  ) {
    return paidAmount;
  }

  if (
    isRelationshipPaid(
      relationship,
    )
  ) {
    const compatibilityAmount =
      normalizeAmount(
        relationship.amount,
      );

    if (
      compatibilityAmount > 0
    ) {
      return compatibilityAmount;
    }

    return normalizeAmount(
      relationship.expected_amount,
    );
  }

  return 0;
}

function getCommercialAmount(
  relationship: CommercialRelationship,
): number {
  return isRelationshipPaid(
    relationship,
  )
    ? getPaidAmount(
        relationship,
      )
    : getExpectedAmount(
        relationship,
      );
}

function diffInDays(
  fromISO: string,
  toISO: string,
): number {
  const from =
    new Date(
      `${fromISO}T00:00:00`,
    );

  const to =
    new Date(
      `${toISO}T00:00:00`,
    );

  return Math.round(
    (
      to.getTime() -
      from.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function getDaysSinceCreated(
  createdAt: string,
  today: string,
): number {
  const createdISO =
    toISODate(createdAt);

  if (!createdISO) {
    return 0;
  }

  return Math.max(
    0,
    diffInDays(
      createdISO,
      today,
    ),
  );
}

function getBucket(
  nextContactAt: string | null,
  today: string,
): CommercialActionBucket {
  if (!nextContactAt) {
    return "no_date";
  }

  const days =
    diffInDays(
      today,
      nextContactAt,
    );

  if (days < 0) {
    return "overdue";
  }

  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return "tomorrow";
  }

  if (days === 2) {
    return "day_after_tomorrow";
  }

  if (days <= 14) {
    return "next_14_days";
  }

  return "future";
}

function normalizeRelationship(
  relationship: CommercialRelationship,
): NormalizedCommercialRelationship {
  const paid =
    isRelationshipPaid(
      relationship,
    );

  const expectedAmount =
    getExpectedAmount(
      relationship,
    );

  const paidAmount =
    getPaidAmount(
      relationship,
    );

  return {
    id:
      String(
        relationship.id || "",
      ),

    ownerId:
      relationship.owner_id ||
      null,

    name:
      relationship.name?.trim() ||
      "Relación sin nombre",

    phone:
      relationship.phone || "",

    status:
      relationship.status ||
      "Sin estado",

    notes:
      relationship.notes?.trim() ||
      null,

    memory:
      relationship.memory?.trim() ||
      null,

    reminder:
      relationship.reminder?.trim() ||
      null,

    nextContactAt:
      toISODate(
        relationship.next_contact_at,
      ),

    createdAt:
      relationship.created_at ||
      new Date().toISOString(),

    updatedAt:
      relationship.updated_at ||
      null,

    expectedAmount,
    paidAmount,

    amount:
      getCommercialAmount(
        relationship,
      ),

    currency:
      normalizeCurrency(
        relationship.currency,
      ),

    paid,

    paidAt:
      relationship.paid_at ||
      null,

    invoiceNumber:
      relationship.invoice_number?.trim() ||
      null,

    paymentDescription:
      relationship.payment_description?.trim() ||
      null,
  };
}

function shouldCreateAction(
  relationship: NormalizedCommercialRelationship,
): boolean {
  if (!relationship.id) {
    return false;
  }

  if (
    relationship.paid &&
    !relationship.nextContactAt
  ) {
    return false;
  }

  return true;
}

function getMemoryScore(
  relationship: NormalizedCommercialRelationship,
): number {
  let score = 0;

  if (relationship.notes) {
    score += 25;
  }

  if (relationship.memory) {
    score += 35;
  }

  if (relationship.reminder) {
    score += 25;
  }

  if (relationship.nextContactAt) {
    score += 15;
  }

  return clamp(score);
}

function getStatusScore(
  status: string,
): number {
  const value =
    normalizeText(status);

  if (value.includes("interes")) {
    return 28;
  }

  if (value.includes("contact")) {
    return 20;
  }

  if (value.includes("nuevo")) {
    return 18;
  }

  if (value.includes("sin")) {
    return 15;
  }

  if (value.includes("pend")) {
    return 24;
  }

  if (value.includes("pag")) {
    return 10;
  }

  if (value.includes("cerr")) {
    return -25;
  }

  return 12;
}

function getDateUrgencyScore(
  bucket: CommercialActionBucket,
): number {
  if (bucket === "overdue") {
    return 38;
  }

  if (bucket === "today") {
    return 34;
  }

  if (bucket === "tomorrow") {
    return 24;
  }

  if (
    bucket ===
    "day_after_tomorrow"
  ) {
    return 18;
  }

  if (
    bucket ===
    "next_14_days"
  ) {
    return 10;
  }

  if (bucket === "no_date") {
    return 8;
  }

  return 0;
}

function getCommercialScore({
  relationship,
  bucket,
  memoryScore,
  today,
}: {
  relationship: NormalizedCommercialRelationship;
  bucket: CommercialActionBucket;
  memoryScore: number;
  today: string;
}): number {
  const daysSinceCreated =
    getDaysSinceCreated(
      relationship.createdAt,
      today,
    );

  let score = 20;

  score +=
    getStatusScore(
      relationship.status,
    );

  score +=
    getDateUrgencyScore(
      bucket,
    );

  score +=
    Math.round(
      memoryScore * 0.18,
    );

  if (daysSinceCreated >= 14) {
    score += 10;
  }

  if (daysSinceCreated >= 30) {
    score += 10;
  }

  if (relationship.paid) {
    score -= 20;
  }

  return clamp(score);
}

function getPriority(
  score: number,
): CommercialActionPriority {
  if (score >= 80) {
    return "critical";
  }

  if (score >= 65) {
    return "high";
  }

  if (score >= 45) {
    return "medium";
  }

  return "low";
}

function getTone(
  priority: CommercialActionPriority,
  bucket: CommercialActionBucket,
): CommercialActionTone {
  if (bucket === "overdue") {
    return "red";
  }

  if (
    priority === "critical"
  ) {
    return "red";
  }

  if (priority === "high") {
    return "amber";
  }

  if (bucket === "tomorrow") {
    return "emerald";
  }

  if (
    bucket ===
    "day_after_tomorrow"
  ) {
    return "violet";
  }

  if (
    bucket ===
    "next_14_days"
  ) {
    return "sky";
  }

  return "slate";
}

function getActionType(
  bucket: CommercialActionBucket,
  status: string,
): CommercialActionType {
  const value =
    normalizeText(status);

  if (
    value.includes("cerr") ||
    value.includes("pag")
  ) {
    return "review";
  }

  if (bucket === "overdue") {
    return "recover";
  }

  if (bucket === "today") {
    return "contact_today";
  }

  if (
    bucket === "tomorrow" ||
    bucket ===
      "day_after_tomorrow"
  ) {
    return "follow_up";
  }

  if (
    bucket ===
      "next_14_days" ||
    bucket === "no_date"
  ) {
    return "schedule";
  }

  return "review";
}

function getWhatsAppKey(
  bucket: CommercialActionBucket,
  status: string,
  paid: boolean,
): CommercialActionWhatsAppKey {
  const value =
    normalizeText(status);

  if (paid) {
    return "postventa";
  }

  if (value.includes("nuevo")) {
    return "nuevo";
  }

  if (bucket === "today") {
    return "hoy";
  }

  if (bucket === "overdue") {
    return "pendiente";
  }

  if (
    bucket === "tomorrow" ||
    bucket ===
      "day_after_tomorrow" ||
    bucket ===
      "next_14_days"
  ) {
    return "proximo";
  }

  return "pendiente";
}

function getActionLabel(
  actionType: CommercialActionType,
): string {
  if (
    actionType ===
    "contact_today"
  ) {
    return "Contactar hoy";
  }

  if (
    actionType ===
    "follow_up"
  ) {
    return "Hacer seguimiento";
  }

  if (
    actionType ===
    "recover"
  ) {
    return "Recuperar ahora";
  }

  if (
    actionType ===
    "schedule"
  ) {
    return "Agendar seguimiento";
  }

  return "Revisar relación";
}

function getHeadline(
  priority: CommercialActionPriority,
  bucket: CommercialActionBucket,
): string {
  if (bucket === "overdue") {
    return "Acción atrasada";
  }

  if (bucket === "today") {
    return "Prioridad de hoy";
  }

  if (
    priority === "critical"
  ) {
    return "Alta urgencia comercial";
  }

  if (priority === "high") {
    return "Seguimiento importante";
  }

  if (bucket === "tomorrow") {
    return "Preparar mañana";
  }

  if (
    bucket ===
    "day_after_tomorrow"
  ) {
    return "Planificado";
  }

  if (
    bucket ===
    "next_14_days"
  ) {
    return "Próxima oportunidad";
  }

  if (bucket === "no_date") {
    return "Sin fecha definida";
  }

  return "Seguimiento futuro";
}

function getActionPhrase(
  actionType: CommercialActionType,
  name: string,
): string {
  if (
    actionType ===
    "contact_today"
  ) {
    return `Contactar a ${name} hoy.`;
  }

  if (
    actionType ===
    "recover"
  ) {
    return `Recuperar a ${name} antes de que se enfríe.`;
  }

  if (
    actionType ===
    "follow_up"
  ) {
    return `Dar seguimiento a ${name}.`;
  }

  if (
    actionType ===
    "schedule"
  ) {
    return `Definir el próximo paso con ${name}.`;
  }

  return `Revisar la relación con ${name}.`;
}

function getReason({
  relationship,
  bucket,
  score,
  memoryScore,
}: {
  relationship: NormalizedCommercialRelationship;
  bucket: CommercialActionBucket;
  score: number;
  memoryScore: number;
}): string {
  if (
    relationship.paid &&
    relationship.paymentDescription
  ) {
    return relationship.paymentDescription;
  }

  if (relationship.reminder) {
    return relationship.reminder;
  }

  if (relationship.notes) {
    return relationship.notes;
  }

  if (bucket === "overdue") {
    return "Esta relación tiene una acción vencida y necesita atención comercial.";
  }

  if (bucket === "today") {
    return "Esta relación tiene una acción programada para hoy.";
  }

  if (bucket === "no_date") {
    return "Esta relación no tiene una próxima fecha clara. Conviene ordenar el seguimiento.";
  }

  if (score >= 80) {
    return "ClienteYA detecta una combinación alta de urgencia, contexto y oportunidad.";
  }

  if (memoryScore >= 70) {
    return "Hay suficiente memoria comercial para ejecutar un seguimiento preciso.";
  }

  return "ClienteYA mantiene esta relación visible para proteger la continuidad comercial.";
}

function toCommercialAction(
  relationship: NormalizedCommercialRelationship,
  today: string,
): CommercialAction {
  const bucket =
    getBucket(
      relationship.nextContactAt,
      today,
    );

  const memoryScore =
    getMemoryScore(
      relationship,
    );

  const commercialScore =
    getCommercialScore({
      relationship,
      bucket,
      memoryScore,
      today,
    });

  const priority =
    getPriority(
      commercialScore,
    );

  const tone =
    getTone(
      priority,
      bucket,
    );

  const actionType =
    getActionType(
      bucket,
      relationship.status,
    );

  const whatsappKey =
    getWhatsAppKey(
      bucket,
      relationship.status,
      relationship.paid,
    );

  const daysUntilContact =
    relationship.nextContactAt
      ? diffInDays(
          today,
          relationship.nextContactAt,
        )
      : null;

  const daysSinceCreated =
    getDaysSinceCreated(
      relationship.createdAt,
      today,
    );

  return {
    id:
      relationship.id,

    relationshipId:
      relationship.id,

    ownerId:
      relationship.ownerId,

    name:
      relationship.name,

    phone:
      relationship.phone,

    status:
      relationship.status,

    notes:
      relationship.notes,

    memory:
      relationship.memory,

    reminder:
      relationship.reminder,

    nextContactAt:
      relationship.nextContactAt,

    createdAt:
      relationship.createdAt,

    updatedAt:
      relationship.updatedAt,

    expectedAmount:
      relationship.expectedAmount,

    paidAmount:
      relationship.paidAmount,

    amount:
      relationship.amount,

    currency:
      relationship.currency,

    paid:
      relationship.paid,

    paidAt:
      relationship.paidAt,

    invoiceNumber:
      relationship.invoiceNumber,

    paymentDescription:
      relationship.paymentDescription,

    commercialScore,
    memoryScore,

    urgencyScore:
      getDateUrgencyScore(
        bucket,
      ),

    priority,
    bucket,
    tone,
    actionType,
    whatsappKey,

    actionLabel:
      getActionLabel(
        actionType,
      ),

    actionPhrase:
      getActionPhrase(
        actionType,
        relationship.name,
      ),

    reason:
      getReason({
        relationship,
        bucket,
        score:
          commercialScore,
        memoryScore,
      }),

    headline:
      getHeadline(
        priority,
        bucket,
      ),

    daysUntilContact,
    daysSinceCreated,
  };
}

export function buildCommercialActions({
  relationships,
  today = todayISO(),
  limit,
}: BuildCommercialActionsInput): CommercialAction[] {
  const actions =
    relationships
      .map(
        normalizeRelationship,
      )
      .filter(
        shouldCreateAction,
      )
      .map(
        (relationship) =>
          toCommercialAction(
            relationship,
            today,
          ),
      )
      .sort(
        (a, b) => {
          if (
            b.commercialScore !==
            a.commercialScore
          ) {
            return (
              b.commercialScore -
              a.commercialScore
            );
          }

          if (
            a.daysUntilContact ===
              null &&
            b.daysUntilContact !==
              null
          ) {
            return 1;
          }

          if (
            a.daysUntilContact !==
              null &&
            b.daysUntilContact ===
              null
          ) {
            return -1;
          }

          return (
            (
              a.daysUntilContact ||
              0
            ) -
            (
              b.daysUntilContact ||
              0
            )
          );
        },
      );

  if (
    typeof limit ===
    "number"
  ) {
    return actions.slice(
      0,
      Math.max(
        0,
        limit,
      ),
    );
  }

  return actions;
}

export function getTodayCommercialActions(
  actions: CommercialAction[],
): CommercialAction[] {
  return actions.filter(
    (action) =>
      action.bucket ===
      "today",
  );
}

export function getDashboardCommercialActions(
  actions: CommercialAction[],
  limit = 3,
): CommercialAction[] {
  return actions
    .filter(
      (action) =>
        action.bucket ===
          "today" ||
        action.bucket ===
          "overdue",
    )
    .slice(
      0,
      limit,
    );
}

export function getCalendarCommercialActions(
  actions: CommercialAction[],
) {
  return {
    overdue:
      actions.filter(
        (action) =>
          action.bucket ===
          "overdue",
      ),

    today:
      actions.filter(
        (action) =>
          action.bucket ===
          "today",
      ),

    tomorrow:
      actions.filter(
        (action) =>
          action.bucket ===
          "tomorrow",
      ),

    dayAfterTomorrow:
      actions.filter(
        (action) =>
          action.bucket ===
          "day_after_tomorrow",
      ),

    next14Days:
      actions.filter(
        (action) =>
          action.bucket ===
          "next_14_days",
      ),

    noDate:
      actions.filter(
        (action) =>
          action.bucket ===
          "no_date",
      ),

    future:
      actions.filter(
        (action) =>
          action.bucket ===
          "future",
      ),
  };
}

export function getCommercialActionBucketLabel(
  bucket: CommercialActionBucket,
): string {
  if (bucket === "overdue") {
    return "Atrasados";
  }

  if (bucket === "today") {
    return "Hoy";
  }

  if (bucket === "tomorrow") {
    return "Mañana";
  }

  if (
    bucket ===
    "day_after_tomorrow"
  ) {
    return "Pasado mañana";
  }

  if (
    bucket ===
    "next_14_days"
  ) {
    return "Próximos 14 días";
  }

  if (bucket === "no_date") {
    return "Sin fecha";
  }

  return "Futuro";
}