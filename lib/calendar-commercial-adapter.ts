import {
  buildCommercialCalendarActions,
  type CommercialCalendarAction,
} from "./commercial-operating-adapter";

export type CalendarCommercialClient = {
  id: string;
  user_id?: string | null;
  nombre: string | null;
  telefono?: string | null;
  estado?: string | null;
  notas?: string | null;
  memory?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

export type CalendarCommercialTone =
  | "red"
  | "amber"
  | "emerald"
  | "violet"
  | "sky"
  | "slate";

export type CalendarCommercialBucketKey =
  | "atrasados"
  | "hoy"
  | "manana"
  | "pasadoManana"
  | "proximos14"
  | "sinFecha";

export type CalendarCommercialItem = {
  cliente: CalendarCommercialClient;
  id: string;
  nombre: string;
  telefono: string;
  estado: string;
  notas: string | null;
  recordatorio: string | null;
  proximo_contacto: string | null;
  monto: number | null;
  pagado: boolean;
  fecha_pago: string | null;
  tone: CalendarCommercialTone;
  actionType: "contactado" | "listo" | "schedule";
  actionLabel: string;
  reason: string;
  nextActionLabel: string;
  score: number;
  urgency: CommercialCalendarAction["urgency"];
  commercialScore: number;
  memoryScore: number;
  relationshipScore: number;
  daysUntilNextContact: number | null;
};

export type CalendarCommercialOverview = {
  atrasados: CalendarCommercialItem[];
  hoy: CalendarCommercialItem[];
  manana: CalendarCommercialItem[];
  pasadoManana: CalendarCommercialItem[];
  proximos14: CalendarCommercialItem[];
  sinFecha: CalendarCommercialItem[];
  all: CalendarCommercialItem[];
  counts: {
    atrasados: number;
    hoy: number;
    manana: number;
    pasadoManana: number;
    proximos14: number;
    sinFecha: number;
    total: number;
  };
};

function normalizeDate(value?: string | null) {
  if (!value) return null;

  const clean = value.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return null;
  }

  return clean;
}

function normalizeCliente(
  cliente: CalendarCommercialClient,
): CalendarCommercialClient {
  return {
    id: String(cliente.id || ""),
    user_id: cliente.user_id ?? null,
    nombre: cliente.nombre || "Cliente sin nombre",
    telefono: cliente.telefono || "",
    estado: cliente.estado || "Sin estado",
    notas: cliente.notas ?? null,
    memory: cliente.memory ?? null,
    recordatorio: cliente.recordatorio ?? null,
    proximo_contacto: normalizeDate(cliente.proximo_contacto),
    created_at: cliente.created_at || new Date().toISOString(),
    updated_at: cliente.updated_at ?? null,
    monto: cliente.monto ?? null,
    pagado: cliente.pagado ?? false,
    fecha_pago: cliente.fecha_pago ?? null,
  };
}

function getCalendarTone(
  action: CommercialCalendarAction,
): CalendarCommercialTone {
  if (
    action.daysUntilNextContact !== null &&
    action.daysUntilNextContact < 0
  ) {
    return "red";
  }

  if (action.daysUntilNextContact === 0) {
    return "amber";
  }

  if (action.daysUntilNextContact === 1) {
    return "emerald";
  }

  if (action.daysUntilNextContact === 2) {
    return "violet";
  }

  return "sky";
}

function getActionType(
  action: CommercialCalendarAction,
): CalendarCommercialItem["actionType"] {
  if (
    action.daysUntilNextContact !== null &&
    action.daysUntilNextContact < 0
  ) {
    return "contactado";
  }

  if (action.daysUntilNextContact === 0) {
    return "listo";
  }

  return "schedule";
}

function getActionLabel(action: CommercialCalendarAction) {
  if (
    action.daysUntilNextContact !== null &&
    action.daysUntilNextContact < 0
  ) {
    return "✔ Contactado";
  }

  if (action.daysUntilNextContact === 0) {
    return "✔ Listo";
  }

  return "Agendar siguiente";
}

function toCalendarItem(
  action: CommercialCalendarAction,
): CalendarCommercialItem {
  const cliente = normalizeCliente(action.cliente);

  return {
    cliente,
    id: cliente.id,
    nombre: cliente.nombre || "Cliente sin nombre",
    telefono: cliente.telefono || "",
    estado: cliente.estado || "Sin estado",
    notas: cliente.notas ?? null,
    recordatorio: cliente.recordatorio ?? null,
    proximo_contacto: cliente.proximo_contacto ?? null,
    monto: cliente.monto ?? null,
    pagado: Boolean(cliente.pagado),
    fecha_pago: cliente.fecha_pago ?? null,
    tone: getCalendarTone(action),
    actionType: getActionType(action),
    actionLabel: getActionLabel(action),
    reason: action.reason,
    nextActionLabel: action.nextActionLabel,
    score: action.score,
    urgency: action.urgency,
    commercialScore: action.commercialScore,
    memoryScore: action.memoryScore,
    relationshipScore: action.relationshipScore,
    daysUntilNextContact: action.daysUntilNextContact,
  };
}

function sortCalendarItems(
  a: CalendarCommercialItem,
  b: CalendarCommercialItem,
) {
  const dayA = a.daysUntilNextContact ?? 999;
  const dayB = b.daysUntilNextContact ?? 999;

  if (dayA !== dayB) {
    return dayA - dayB;
  }

  return b.score - a.score;
}

function sortUpcomingItems(
  a: CalendarCommercialItem,
  b: CalendarCommercialItem,
) {
  const scoreDifference = b.score - a.score;

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  return sortCalendarItems(a, b);
}

export function buildCalendarCommercialOverview(
  clients: CalendarCommercialClient[],
): CalendarCommercialOverview {
  const normalizedClients = clients
    .map(normalizeCliente)
    .filter((cliente) => cliente.id);

  const allCalendarItems = buildCommercialCalendarActions(
    normalizedClients,
  )
    .map(toCalendarItem)
    .sort(sortCalendarItems);

  const calendarClientIds = new Set(
    allCalendarItems.map((item) => item.id),
  );

  const sinFecha = normalizedClients
    .filter(
      (cliente) =>
        !cliente.proximo_contacto &&
        !calendarClientIds.has(cliente.id) &&
        !cliente.pagado,
    )
    .map((cliente) => ({
      cliente,
      id: cliente.id,
      nombre: cliente.nombre || "Cliente sin nombre",
      telefono: cliente.telefono || "",
      estado: cliente.estado || "Sin estado",
      notas: cliente.notas ?? null,
      recordatorio: cliente.recordatorio ?? null,
      proximo_contacto: null,
      monto: cliente.monto ?? null,
      pagado: Boolean(cliente.pagado),
      fecha_pago: cliente.fecha_pago ?? null,
      tone: "slate" as CalendarCommercialTone,
      actionType: "schedule" as const,
      actionLabel: "Agendar seguimiento",
      reason: "Cliente sin próximo contacto planificado.",
      nextActionLabel: "Planificar seguimiento",
      score: 0,
      urgency: "none" as const,
      commercialScore: 0,
      memoryScore: 0,
      relationshipScore: 0,
      daysUntilNextContact: null,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const atrasados = allCalendarItems.filter(
    (item) =>
      item.daysUntilNextContact !== null &&
      item.daysUntilNextContact < 0,
  );

  const hoy = allCalendarItems.filter(
    (item) => item.daysUntilNextContact === 0,
  );

  const manana = allCalendarItems.filter(
    (item) => item.daysUntilNextContact === 1,
  );

  const pasadoManana = allCalendarItems.filter(
    (item) => item.daysUntilNextContact === 2,
  );

  const proximos14 = allCalendarItems
    .filter(
      (item) =>
        item.daysUntilNextContact !== null &&
        item.daysUntilNextContact >= 3 &&
        item.daysUntilNextContact <= 14,
    )
    .sort(sortUpcomingItems);

  const all = [
    ...atrasados,
    ...hoy,
    ...manana,
    ...pasadoManana,
    ...proximos14,
    ...sinFecha,
  ];

  return {
    atrasados,
    hoy,
    manana,
    pasadoManana,
    proximos14,
    sinFecha,
    all,
    counts: {
      atrasados: atrasados.length,
      hoy: hoy.length,
      manana: manana.length,
      pasadoManana: pasadoManana.length,
      proximos14: proximos14.length,
      sinFecha: sinFecha.length,
      total: all.length,
    },
  };
}

export function getCalendarCommercialWhatsAppKey(
  item: CalendarCommercialItem,
): "nuevo" | "hoy" | "pendiente" | "proximo" | "postventa" {
  if (item.pagado) return "postventa";

  if (
    item.daysUntilNextContact !== null &&
    item.daysUntilNextContact < 0
  ) {
    return "pendiente";
  }

  if (item.daysUntilNextContact === 0) {
    return "hoy";
  }

  if (
    item.daysUntilNextContact !== null &&
    item.daysUntilNextContact > 0
  ) {
    return "proximo";
  }

  return "nuevo";
}

export function getCalendarCommercialEmptyText(
  bucket: CalendarCommercialBucketKey,
) {
  if (bucket === "atrasados") {
    return {
      title: "Nada urgente",
      text: "No tienes seguimientos atrasados.",
    };
  }

  if (bucket === "hoy") {
    return {
      title: "Todo despejado",
      text: "No tienes seguimientos para hoy.",
    };
  }

  if (bucket === "manana") {
    return {
      title: "Mañana está libre",
      text: "No tienes seguimientos programados para mañana.",
    };
  }

  if (bucket === "pasadoManana") {
    return {
      title: "Sin presión inmediata",
      text: "No tienes seguimientos para pasado mañana.",
    };
  }

  if (bucket === "proximos14") {
    return {
      title: "Sin próximos contactos",
      text: "No tienes seguimientos programados para los próximos 14 días.",
    };
  }

  return {
    title: "Todos tienen fecha",
    text: "No hay clientes sin próximo contacto.",
  };
}