export type CommercialMemoryPriority = "critical" | "high" | "medium" | "low";

export type CommercialMemoryTone =
  | "red"
  | "amber"
  | "emerald"
  | "sky"
  | "slate";

export type CommercialMemoryClient = {
  id: string;
  nombre?: string | null;
  telefono?: string | null;
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

export type CommercialPromiseSignal = {
  id: string;
  title: string;
  description: string;
  priority: CommercialMemoryPriority;
  tone: CommercialMemoryTone;
};

export type CommercialOpportunitySignal = {
  id: string;
  title: string;
  description: string;
  priority: CommercialMemoryPriority;
  tone: CommercialMemoryTone;
};

export type CommercialMoneySignal = {
  id: string;
  title: string;
  description: string;
  amount: number;
  priority: CommercialMemoryPriority;
  tone: CommercialMemoryTone;
};

export type CommercialRelationshipSignal = {
  id: string;
  title: string;
  description: string;
  priority: CommercialMemoryPriority;
  tone: CommercialMemoryTone;
};

export type CommercialMemoryOSResult = {
  clientId: string;
  clientName: string;

  priorityScore: number;
  memoryHealth: number;

  priority: CommercialMemoryPriority;
  tone: CommercialMemoryTone;

  headline: string;
  summary: string;

  promises: CommercialPromiseSignal[];
  opportunities: CommercialOpportunitySignal[];
  moneySignals: CommercialMoneySignal[];
  relationshipSignals: CommercialRelationshipSignal[];

  nextBestAction: string;
  actionReason: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function daysBetween(date?: string | null) {
  if (!date) return null;

  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round((today.getTime() - target.getTime()) / 86400000);
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function getPriority(score: number): CommercialMemoryPriority {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function getTone(priority: CommercialMemoryPriority): CommercialMemoryTone {
  if (priority === "critical") return "red";
  if (priority === "high") return "amber";
  if (priority === "medium") return "sky";
  return "emerald";
}

function getClientName(client: CommercialMemoryClient) {
  return client.nombre?.trim() || "Cliente sin nombre";
}

function buildPromiseSignals(
  client: CommercialMemoryClient,
): CommercialPromiseSignal[] {
  const text = normalizeText(
    `${client.notas || ""} ${client.recordatorio || ""}`,
  );

  const signals: CommercialPromiseSignal[] = [];

  const promiseWords = [
    "prometi",
    "prometido",
    "enviar",
    "envio",
    "mandar",
    "llamar",
    "contactar",
    "confirmar",
    "cotizacion",
    "presupuesto",
    "propuesta",
    "seguimiento",
  ];

  if (hasAny(text, promiseWords)) {
    signals.push({
      id: `${client.id}-promise-main`,
      title: "Promesa comercial detectada",
      description:
        "Hay una posible promesa, seguimiento o compromiso pendiente con este cliente.",
      priority: "high",
      tone: "amber",
    });
  }

  const daysUntilContact = daysBetween(client.proximo_contacto);

  if (daysUntilContact !== null && daysUntilContact > 0) {
    signals.push({
      id: `${client.id}-promise-overdue`,
      title: "Seguimiento vencido",
      description: `El próximo contacto estaba planificado hace ${daysUntilContact} día${
        daysUntilContact === 1 ? "" : "s"
      }.`,
      priority: daysUntilContact >= 5 ? "critical" : "high",
      tone: daysUntilContact >= 5 ? "red" : "amber",
    });
  }

  if (daysUntilContact !== null && daysUntilContact === 0) {
    signals.push({
      id: `${client.id}-promise-today`,
      title: "Seguimiento para hoy",
      description:
        "Este cliente tiene un contacto planificado para hoy. Conviene actuar antes de que pierda temperatura.",
      priority: "high",
      tone: "amber",
    });
  }

  return signals;
}

function buildOpportunitySignals(
  client: CommercialMemoryClient,
): CommercialOpportunitySignal[] {
  const text = normalizeText(
    `${client.estado || ""} ${client.notas || ""} ${client.recordatorio || ""}`,
  );

  const signals: CommercialOpportunitySignal[] = [];

  const opportunityWords = [
    "interesado",
    "interes",
    "precio",
    "cotizacion",
    "presupuesto",
    "propuesta",
    "comprar",
    "reservar",
    "disponible",
    "consulta",
  ];

  if (hasAny(text, opportunityWords)) {
    signals.push({
      id: `${client.id}-opportunity-interest`,
      title: "Oportunidad comercial activa",
      description:
        "El cliente muestra señales de interés, consulta o intención comercial.",
      priority: "high",
      tone: "emerald",
    });
  }

  if ((client.monto || 0) > 0 && !client.pagado) {
    signals.push({
      id: `${client.id}-opportunity-value`,
      title: "Valor comercial pendiente",
      description:
        "Existe un monto asociado a este cliente que todavía puede convertirse en ingreso confirmado.",
      priority: "high",
      tone: "amber",
    });
  }

  return signals;
}

function buildMoneySignals(client: CommercialMemoryClient): CommercialMoneySignal[] {
  const amount = Number(client.monto || 0);

  if (amount <= 0) return [];

  if (client.pagado) {
    return [
      {
        id: `${client.id}-money-paid`,
        title: "Ingreso confirmado",
        description:
          "Este cliente ya tiene un monto registrado como pagado. Mantener relación y buscar recompra.",
        amount,
        priority: "low",
        tone: "emerald",
      },
    ];
  }

  return [
    {
      id: `${client.id}-money-pending`,
      title: "Dinero pendiente",
      description:
        "Hay un monto registrado que todavía no aparece como pagado. Conviene revisar o hacer seguimiento.",
      amount,
      priority: "critical",
      tone: "red",
    },
  ];
}

function buildRelationshipSignals(
  client: CommercialMemoryClient,
): CommercialRelationshipSignal[] {
  const signals: CommercialRelationshipSignal[] = [];
  const daysSinceUpdate = daysBetween(client.updated_at || client.created_at);

  if (daysSinceUpdate !== null && daysSinceUpdate >= 14) {
    signals.push({
      id: `${client.id}-relationship-silent`,
      title: "Relación enfriándose",
      description: `Hace ${daysSinceUpdate} días que no se registra movimiento relevante con este cliente.`,
      priority: daysSinceUpdate >= 30 ? "high" : "medium",
      tone: daysSinceUpdate >= 30 ? "amber" : "sky",
    });
  }

  if (!client.telefono) {
    signals.push({
      id: `${client.id}-relationship-no-phone`,
      title: "Contacto incompleto",
      description:
        "Este cliente no tiene teléfono registrado. Eso limita la acción directa por WhatsApp.",
      priority: "medium",
      tone: "sky",
    });
  }

  return signals;
}

function calculatePriorityScore(input: {
  promises: CommercialPromiseSignal[];
  opportunities: CommercialOpportunitySignal[];
  moneySignals: CommercialMoneySignal[];
  relationshipSignals: CommercialRelationshipSignal[];
}) {
  let score = 0;

  const allSignals = [
    ...input.promises,
    ...input.opportunities,
    ...input.moneySignals,
    ...input.relationshipSignals,
  ];

  for (const signal of allSignals) {
    if (signal.priority === "critical") score += 35;
    if (signal.priority === "high") score += 22;
    if (signal.priority === "medium") score += 12;
    if (signal.priority === "low") score += 5;
  }

  return clamp(score);
}

function calculateMemoryHealth(input: {
  client: CommercialMemoryClient;
  promises: CommercialPromiseSignal[];
  relationshipSignals: CommercialRelationshipSignal[];
}) {
  let score = 80;

  if (!input.client.telefono) score -= 20;
  if (!input.client.notas) score -= 15;
  if (!input.client.recordatorio) score -= 10;
  if (!input.client.proximo_contacto) score -= 10;

  score -= input.promises.filter((signal) => signal.priority === "critical")
    .length * 15;

  score -= input.relationshipSignals.filter(
    (signal) => signal.priority === "high",
  ).length * 12;

  return clamp(score);
}

function buildNextBestAction(input: {
  client: CommercialMemoryClient;
  promises: CommercialPromiseSignal[];
  opportunities: CommercialOpportunitySignal[];
  moneySignals: CommercialMoneySignal[];
  relationshipSignals: CommercialRelationshipSignal[];
}) {
  const hasPendingMoney = input.moneySignals.some(
    (signal) => signal.priority === "critical",
  );

  if (hasPendingMoney) {
    return {
      nextBestAction: "Revisar el pago pendiente y contactar al cliente hoy.",
      actionReason:
        "Hay dinero registrado que todavía no aparece como pagado. Esto impacta directamente el ingreso.",
    };
  }

  const hasOverduePromise = input.promises.some(
    (signal) => signal.priority === "critical" || signal.priority === "high",
  );

  if (hasOverduePromise) {
    return {
      nextBestAction: "Cumplir o cerrar el seguimiento pendiente hoy.",
      actionReason:
        "Existe una promesa o seguimiento pendiente. Actuar rápido protege la confianza comercial.",
    };
  }

  const hasOpportunity = input.opportunities.some(
    (signal) => signal.priority === "high",
  );

  if (hasOpportunity) {
    return {
      nextBestAction: "Enviar un mensaje comercial claro y avanzar al próximo paso.",
      actionReason:
        "El cliente muestra señales de interés. La oportunidad todavía tiene temperatura.",
    };
  }

  const hasColdRelationship = input.relationshipSignals.some(
    (signal) => signal.priority === "high" || signal.priority === "medium",
  );

  if (hasColdRelationship) {
    return {
      nextBestAction: "Reactivar la relación con un mensaje simple por WhatsApp.",
      actionReason:
        "La relación lleva tiempo sin movimiento. Un contacto breve puede recuperar momentum.",
    };
  }

  return {
    nextBestAction: "Mantener relación y registrar el próximo paso.",
    actionReason:
      "No hay riesgo crítico, pero conviene mantener memoria comercial activa.",
  };
}

function buildHeadline(input: {
  priority: CommercialMemoryPriority;
  promises: CommercialPromiseSignal[];
  opportunities: CommercialOpportunitySignal[];
  moneySignals: CommercialMoneySignal[];
}) {
  if (input.moneySignals.some((signal) => signal.priority === "critical")) {
    return "Dinero pendiente requiere acción";
  }

  if (input.promises.some((signal) => signal.priority === "critical")) {
    return "Promesa vencida requiere seguimiento";
  }

  if (input.promises.some((signal) => signal.priority === "high")) {
    return "Seguimiento comercial pendiente";
  }

  if (input.opportunities.length > 0) {
    return "Oportunidad comercial activa";
  }

  if (input.priority === "low") {
    return "Relación estable";
  }

  return "Memoria comercial activa";
}

function buildSummary(input: {
  promises: CommercialPromiseSignal[];
  opportunities: CommercialOpportunitySignal[];
  moneySignals: CommercialMoneySignal[];
  relationshipSignals: CommercialRelationshipSignal[];
}) {
  const totalSignals =
    input.promises.length +
    input.opportunities.length +
    input.moneySignals.length +
    input.relationshipSignals.length;

  if (totalSignals === 0) {
    return "No hay señales comerciales urgentes, pero conviene mantener el próximo paso registrado.";
  }

  return `ClienteYA detectó ${totalSignals} señal${
    totalSignals === 1 ? "" : "es"
  } comercial${
    totalSignals === 1 ? "" : "es"
  }: promesas, oportunidades, dinero o relación.`;
}

export function buildCommercialMemoryOS(
  client: CommercialMemoryClient,
): CommercialMemoryOSResult {
  const promises = buildPromiseSignals(client);
  const opportunities = buildOpportunitySignals(client);
  const moneySignals = buildMoneySignals(client);
  const relationshipSignals = buildRelationshipSignals(client);

  const priorityScore = calculatePriorityScore({
    promises,
    opportunities,
    moneySignals,
    relationshipSignals,
  });

  const memoryHealth = calculateMemoryHealth({
    client,
    promises,
    relationshipSignals,
  });

  const priority = getPriority(priorityScore);
  const tone = getTone(priority);

  const { nextBestAction, actionReason } = buildNextBestAction({
    client,
    promises,
    opportunities,
    moneySignals,
    relationshipSignals,
  });

  const headline = buildHeadline({
    priority,
    promises,
    opportunities,
    moneySignals,
  });

  const summary = buildSummary({
    promises,
    opportunities,
    moneySignals,
    relationshipSignals,
  });

  return {
    clientId: client.id,
    clientName: getClientName(client),

    priorityScore,
    memoryHealth,

    priority,
    tone,

    headline,
    summary,

    promises,
    opportunities,
    moneySignals,
    relationshipSignals,

    nextBestAction,
    actionReason,
  };
}

export function buildCommercialMemoryOSList(
  clients: CommercialMemoryClient[],
): CommercialMemoryOSResult[] {
  return clients
    .map((client) => buildCommercialMemoryOS(client))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getCommercialMemoryPriorityLabel(
  priority: CommercialMemoryPriority,
) {
  if (priority === "critical") return "Crítica";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";
  return "Baja";
}

export function getCommercialMemoryToneClasses(tone: CommercialMemoryTone) {
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