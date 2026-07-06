import {
  buildCommercialDashboardActions,
  type CommercialDashboardAction,
} from "./commercial-operating-adapter";

import {
  buildSectorDecisionCopy,
} from "./sector-intelligence";

import {
  buildWhatsAppSectorMessage,
} from "./whatsapp-sector-intelligence";

export type DashboardCommercialClient = {
  id: string;
  nombre: string | null;
  telefono?: string | null;
  estado?: string | null;
  notas?: string | null;
  memory?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DashboardCommercialBusinessSettings = {
  company_name?: string | null;
  business_name?: string | null;
  name?: string | null;
  business_type?: string | null;
  business_sector?: string | null;
  sector?: string | null;
  industry?: string | null;
  rubro?: string | null;
  category?: string | null;
  business_tone?: string | null;
  tone?: string | null;
  business_email?: string | null;
  business_phone?: string | null;
  whatsapp_number?: string | null;
  country_label?: string | null;
  city?: string | null;
  ai_prompt?: string | null;
};

export type DashboardPriorityTone =
  | "red"
  | "amber"
  | "emerald"
  | "sky"
  | "slate";

export type DashboardTodayPriority = {
  id: string;
  nombre: string;
  telefono: string;
  estado: string;
  monto: number;
  score: number;
  label: string;
  reason: string;
  sectorHeadline: string;
  sectorActionPhrase: string;
  sectorReason: string;
  sectorPrimaryVerb: string;
  actionLabel: string;
  actionHref: string;
  tone: DashboardPriorityTone;
  commercialScore: number;
  memoryScore: number;
  relationshipScore: number;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function formatGs(value: number | null | undefined) {
  return `Gs.\u00A0${Number(value || 0).toLocaleString("es-PY")}`;
}

function getWhatsappHref(
  telefono: string | null | undefined,
  message?: string | null,
) {
  const raw = String(telefono || "").replace(/\D/g, "");

  if (!raw) return "";

  let number = raw;

  if (number.startsWith("00")) number = number.slice(2);
  if (number.startsWith("0")) number = number.slice(1);
  if (!number.startsWith("595")) number = `595${number}`;

  const baseHref = `https://wa.me/${number}`;
  const cleanMessage = message?.trim();

  if (!cleanMessage) return baseHref;

  return `${baseHref}?text=${encodeURIComponent(cleanMessage)}`;
}

function getDashboardTone(
  action: CommercialDashboardAction,
): DashboardPriorityTone {
  if (action.urgency === "critical") return "red";
  if (action.urgency === "high") return "amber";
  if (action.urgency === "medium") return "sky";

  if (normalizeText(action.cliente.estado).includes("pag")) {
    return "emerald";
  }

  return "slate";
}

function getDecisionActionLabel(
  label: string,
  hasWhatsapp: boolean,
  whatsappActionLabel?: string | null,
) {
  const value = normalizeText(label);

  if (value.includes("preparar") || value.includes("monitorear")) {
    return "Ver cliente";
  }

  return hasWhatsapp ? whatsappActionLabel || "Enviar WhatsApp" : "Ver cliente";
}

function getDecisionActionHref(
  cliente: DashboardCommercialClient,
  label: string,
  hasWhatsapp: boolean,
  whatsappMessage?: string | null,
) {
  const value = normalizeText(label);

  if (!hasWhatsapp) return `/dashboard/clientes/${cliente.id}`;

  if (value.includes("preparar") || value.includes("monitorear")) {
    return `/dashboard/clientes/${cliente.id}`;
  }

  return getWhatsappHref(cliente.telefono, whatsappMessage);
}

function getClientStatusLabel(cliente: DashboardCommercialClient) {
  return cliente.estado || "Nuevo";
}

function getClientName(cliente: DashboardCommercialClient) {
  return cliente.nombre || "Cliente sin nombre";
}

function getDaysOverdue(action: CommercialDashboardAction) {
  const nextDate = action.nextDate;

  if (!nextDate) return null;

  const today = new Date();
  const target = new Date(`${nextDate.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(target.getTime())) return null;

  today.setHours(0, 0, 0, 0);

  const difference = Math.round(
    (today.getTime() - target.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return difference > 0 ? difference : null;
}

function toDashboardPriority({
  action,
  businessType,
  businessSettings,
  companyName,
}: {
  action: CommercialDashboardAction;
  businessType?: string | null;
  businessSettings?: DashboardCommercialBusinessSettings | null;
  companyName?: string | null;
}): DashboardTodayPriority {
  const cliente = action.cliente;
  const hasWhatsapp = Boolean(getWhatsappHref(cliente.telefono));
  const value = Number(cliente.monto || 0);
  const isPaid =
    Boolean(cliente.pagado) ||
    normalizeText(cliente.estado).includes("pag");

  const daysOverdue = getDaysOverdue(action);

  const sectorDecision = buildSectorDecisionCopy({
    businessType: businessType || "general",
    decisionLabel: action.nextActionLabel,
    reason: action.reason,
    estado: cliente.estado || "Nuevo",
    daysOverdue,
    hasWhatsapp,
    isPaid,
    hasValue: value > 0,
  });

  const whatsappSectorMessage = buildWhatsAppSectorMessage({
    cliente: {
      id: cliente.id,
      nombre: getClientName(cliente),
      telefono: cliente.telefono || "",
      estado: getClientStatusLabel(cliente),
      notas: cliente.notas || null,
      recordatorio: cliente.recordatorio || null,
      proximo_contacto: cliente.proximo_contacto || null,
      monto: cliente.monto ?? null,
      pagado: cliente.pagado ?? false,
    },
    business: {
      company_name: companyName || businessSettings?.company_name || null,
      business_type: businessType || businessSettings?.business_type || null,
      business_tone:
        businessSettings?.business_tone || businessSettings?.tone || null,
      ai_prompt: businessSettings?.ai_prompt || null,
      whatsapp_number: businessSettings?.whatsapp_number || null,
    },
    decisionLabel: action.nextActionLabel,
    reason: action.reason,
    daysOverdue,
  });

  return {
    id: cliente.id,
    nombre: getClientName(cliente),
    telefono: cliente.telefono || "",
    estado: getClientStatusLabel(cliente),
    monto: value,
    score: action.score,
    label: action.nextActionLabel,
    reason: action.reason,
    sectorHeadline: sectorDecision.headline,
    sectorActionPhrase: sectorDecision.actionPhrase,
    sectorReason: sectorDecision.humanReason,
    sectorPrimaryVerb: sectorDecision.primaryVerb,
    actionLabel: getDecisionActionLabel(
      action.nextActionLabel,
      hasWhatsapp,
      whatsappSectorMessage.actionLabel,
    ),
    actionHref: getDecisionActionHref(
      cliente,
      action.nextActionLabel,
      hasWhatsapp,
      whatsappSectorMessage.message,
    ),
    tone: getDashboardTone(action),
    commercialScore: action.commercialScore,
    memoryScore: action.memoryScore,
    relationshipScore: action.relationshipScore,
  };
}

export function buildDashboardCommercialPriorities({
  clientes,
  businessType,
  businessSettings,
  companyName,
  limit = 3,
}: {
  clientes: DashboardCommercialClient[];
  businessType?: string | null;
  businessSettings?: DashboardCommercialBusinessSettings | null;
  companyName?: string | null;
  limit?: number;
}): DashboardTodayPriority[] {
  return buildCommercialDashboardActions(clientes)
    .map((action) =>
      toDashboardPriority({
        action,
        businessType,
        businessSettings,
        companyName,
      }),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getDashboardCommercialRevenuePotential(
  priorities: DashboardTodayPriority[],
) {
  return priorities.reduce(
    (sum, priority) => sum + Number(priority.monto || 0),
    0,
  );
}

export function getDashboardCommercialActionSummary(
  priorities: DashboardTodayPriority[],
) {
  const critical = priorities.filter((item) => item.tone === "red").length;
  const high = priorities.filter((item) => item.tone === "amber").length;
  const medium = priorities.filter((item) => item.tone === "sky").length;

  if (priorities.length === 0) {
    return "Todo está bajo control.";
  }

  if (critical > 0) {
    return `${critical} acción(es) críticas para hoy.`;
  }

  if (high > 0) {
    return `${high} acción(es) de alta prioridad para hoy.`;
  }

  if (medium > 0) {
    return `${medium} acción(es) recomendadas para hoy.`;
  }

  return `${priorities.length} acción(es) comerciales para revisar.`;
}

export { formatGs as formatDashboardCommercialGs };