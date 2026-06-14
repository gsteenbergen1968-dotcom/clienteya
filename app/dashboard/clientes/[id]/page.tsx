import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ui } from "../../../../lib/ui";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";

import { AppHeader } from "../../../components/AppHeader";
import SectionCard from "../../../components/SectionCard";
import SidebarNav from "../../SidebarNav";
import MobileDashboardNav from "../../MobileDashboardNav";
import PageHeader from "../../components/PageHeader";

import RelationshipMemoryWidget from "./RelationshipMemoryWidget";
import { buildClienteMemoryProfile } from "../../../../lib/whatsapp-memory-adapter";
import { detectWhatsAppPatterns, type WhatsAppPattern } from "../../../../lib/whatsapp-patterns";
import { buildFounderActionFromPatterns } from "../../../../lib/founder-action-v18";
import {
  buildCommercialIntelligence,
  type CommercialIntelligenceResult,
} from "../../../../lib/commercial-intelligence";
import {
  buildFounderRevenueIntelligence,
  type FounderRevenueResult,
} from "../../../../lib/founder-revenue-intelligence";
import {
  buildFounderDecision,
  buildFounderSmartActionLabel,
  type FounderDecisionResult,
} from "../../../../lib/founder-decision-engine";
import { buildWhatsAppSectorMessage } from "../../../../lib/whatsapp-sector-intelligence";
import CustomerMemorySignalsPanel from "./CustomerMemorySignalsPanel";

export const dynamic = "force-dynamic";

type Cliente = {
  id: string;
  user_id: string | null;
  nombre: string | null;
  telefono: string | null;
  estado: string | null;
  notas: string | null;
  recordatorio: string | null;
  proximo_contacto: string | null;
  created_at: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

type BusinessSettings = {
  user_id?: string | null;
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
  ai_prompt?: string | null;
  whatsapp_number?: string | null;
};

type InsightTone = "red" | "amber" | "emerald" | "sky" | "slate";

type LeadTemperature = {
  label: string;
  score: number;
  tone: InsightTone;
};

type AIInsight = {
  title: string;
  description: string;
  action: string;
  icon: string;
  tone: InsightTone;
};

type TimelineItem = {
  date: string;
  title: string;
  description: string;
  tone: InsightTone;
};

type RevenueProfile = {
  estimatedValue: number;
  probability: number;
  expectedRevenue: number;
  label: string;
  tone: InsightTone;
  reason: string;
};

type RelationshipProfile = {
  score: number;
  label: string;
  tone: InsightTone;
  summary: string;
};

type FounderActionProfile = {
  title: string;
  description: string;
  impact: number;
  probability: number;
  urgency: "Crítica" | "Alta" | "Media" | "Baja";
  tone: InsightTone;
  actionLabel: string;
  actionHref: string;
  route: {
    label: string;
    description: string;
    tone: InsightTone;
  }[];
};

type RelationshipMemorySignal = {
  label: string;
  value: string;
  tone: InsightTone;
};

type RelationshipMemoryProfile = {
  summary: string;
  pattern: string;
  preferredChannel: string;
  relationLevel: string;
  lastInteractionLabel: string;
  followupState: string;
  overdueCount: number;
  memoryStrength: number;
  tone: InsightTone;
  signals: RelationshipMemorySignal[];
};

type AIReasoningSignal = {
  label: string;
  value: string;
  tone: InsightTone;
};

type AIReasoningProfile = {
  confidence: number;
  conclusion: string;
  reasoning: string;
  tone: InsightTone;
  patternTitle?: string;
  patternReason?: string;
  patternAction?: string;
  signals: AIReasoningSignal[];
};

type CommercialIntelligenceProfile = CommercialIntelligenceResult;

type FounderRevenueProfile = FounderRevenueResult;

type FounderDecisionProfile = FounderDecisionResult;


function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatGs(value: number | null | undefined) {
  return `Gs.\u00A0${Number(value || 0).toLocaleString("es-PY")}`;
}

function daysBetween(dateValue: string | null | undefined) {
  if (!dateValue) return null;

  const today = new Date();
  const target = new Date(`${dateValue.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(target.getTime())) return null;

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function daysSince(dateValue: string | null | undefined) {
  const days = daysBetween(dateValue);

  if (typeof days !== "number") return null;

  return Math.max(0, Math.abs(days));
}

function getWhatsappHref(
  telefono: string | null | undefined,
  message?: string | null
) {
  const raw = String(telefono || "").replace(/\D/g, "");

  if (!raw) return "/dashboard/clientes";

  let number = raw;

  if (number.startsWith("00")) {
    number = number.slice(2);
  }

  if (number.startsWith("0")) {
    number = number.slice(1);
  }

  if (!number.startsWith("595")) {
    number = `595${number}`;
  }

  const baseHref = `https://wa.me/${number}`;
  const cleanMessage = message?.trim();

  if (!cleanMessage) return baseHref;

  return `${baseHref}?text=${encodeURIComponent(cleanMessage)}`;
}

function getPhoneHref(telefono: string | null | undefined) {
  const raw = String(telefono || "").replace(/\D/g, "");

  if (!raw) return "#";

  return `tel:+${raw.startsWith("595") ? raw : `595${raw.replace(/^0/, "")}`}`;
}

function getBusinessCompanyName(businessSettings: BusinessSettings | null) {
  return (
    businessSettings?.company_name?.trim() ||
    businessSettings?.business_name?.trim() ||
    businessSettings?.name?.trim() ||
    "ClienteYA"
  );
}

function getBusinessSectorValue(businessSettings: BusinessSettings | null) {
  return (
    businessSettings?.business_type ||
    businessSettings?.business_sector ||
    businessSettings?.sector ||
    businessSettings?.industry ||
    businessSettings?.rubro ||
    businessSettings?.category ||
    "general"
  );
}

function getBusinessToneValue(businessSettings: BusinessSettings | null) {
  return businessSettings?.business_tone || businessSettings?.tone || "amigable";
}

function getStatusClasses(estado: string | null | undefined) {
  const value = normalizeText(estado);

  if (value.includes("pag")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (value.includes("interes")) {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }

  if (value.includes("sin")) {
    return "border-orange-200 bg-orange-100 text-orange-700";
  }

  if (value.includes("contact")) {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (value.includes("cerr")) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getToneClasses(tone: InsightTone) {
  if (tone === "red") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "emerald") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "sky") return "border-sky-200 bg-sky-50 text-sky-800";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getProgressColor(tone: InsightTone) {
  if (tone === "red") return "bg-red-500";
  if (tone === "amber") return "bg-amber-500";
  if (tone === "emerald") return "bg-emerald-500";
  if (tone === "sky") return "bg-blue-500";

  return "bg-slate-400";
}

function getLeadTemperature(cliente: Cliente): LeadTemperature {
  const estado = normalizeText(cliente.estado);
  const days = daysBetween(cliente.proximo_contacto);
  const hasValue = Number(cliente.monto || 0) > 0;

  let score = 35;
  let label = "Cold lead";
  let tone: InsightTone = "sky";

  if (estado.includes("interes")) score += 25;
  if (estado.includes("contact")) score += 15;
  if (estado.includes("sin")) score -= 10;
  if (estado.includes("pag") || cliente.pagado) score = 100;
  if (estado.includes("cerr")) score = 0;
  if (hasValue) score += 10;

  if (typeof days === "number") {
    if (days < 0) score -= 12;
    if (days === 0) score += 15;
    if (days > 0 && days <= 7) score += 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score >= 80) {
    label = "Hot lead";
    tone = "red";
  } else if (score >= 60) {
    label = "Warm lead";
    tone = "amber";
  } else if (score >= 35) {
    label = "Cold lead";
    tone = "sky";
  } else {
    label = "Inactive";
    tone = "slate";
  }

  if (cliente.pagado || estado.includes("pag")) {
    label = "Cliente pagado";
    tone = "emerald";
  }

  return { label, score, tone };
}

function getBaseProbability(cliente: Cliente) {
  const estado = normalizeText(cliente.estado);

  if (cliente.pagado || estado.includes("pag")) return 100;
  if (estado.includes("cerr") || estado.includes("perdido")) return 0;
  if (estado.includes("interes")) return 70;
  if (estado.includes("propuesta")) return 65;
  if (estado.includes("contact")) return 50;
  if (estado.includes("nuevo")) return 30;
  if (estado.includes("sin")) return 18;

  return 35;
}

function buildRevenueProfile(cliente: Cliente): RevenueProfile {
  const estado = normalizeText(cliente.estado);
  const days = daysBetween(cliente.proximo_contacto);
  const estimatedValue = Math.max(0, Number(cliente.monto || 0));

  let probability = getBaseProbability(cliente);

  if (probability !== 0 && probability !== 100) {
    if (typeof days === "number") {
      if (days < 0) probability -= 15;
      if (days === 0) probability += 10;
      if (days > 0 && days <= 7) probability += 8;
      if (days > 30) probability -= 5;
    }

    if (estimatedValue <= 0) probability -= 6;
  }

  probability = Math.max(0, Math.min(100, Math.round(probability)));

  const expectedRevenue = Math.round(estimatedValue * (probability / 100));

  if (cliente.pagado || estado.includes("pag")) {
    return {
      estimatedValue,
      probability,
      expectedRevenue: estimatedValue,
      label: "Ingreso confirmado",
      tone: "emerald",
      reason: "Este cliente ya está convertido. Mantener relación activa.",
    };
  }

  if (probability >= 70) {
    return {
      estimatedValue,
      probability,
      expectedRevenue,
      label: "Alta probabilidad",
      tone: "amber",
      reason: "Buen momento para avanzar a cierre o propuesta concreta.",
    };
  }

  if (typeof days === "number" && days < 0) {
    return {
      estimatedValue,
      probability,
      expectedRevenue,
      label: "Valor en riesgo",
      tone: "red",
      reason: `Seguimiento vencido hace ${Math.abs(days)} día(s).`,
    };
  }

  return {
    estimatedValue,
    probability,
    expectedRevenue,
    label: "Pipeline activo",
    tone: probability >= 45 ? "sky" : "slate",
    reason: "Actualizar notas, monto y próximo contacto mejora la precisión.",
  };
}

function buildRelationshipProfile(cliente: Cliente): RelationshipProfile {
  const estado = normalizeText(cliente.estado);
  const days = daysBetween(cliente.proximo_contacto);
  const pipelineDays = daysSince(cliente.created_at) || 0;

  let score = 45;

  if (cliente.notas) score += 10;
  if (cliente.recordatorio) score += 10;
  if (cliente.proximo_contacto) score += 10;
  if (Number(cliente.monto || 0) > 0) score += 8;
  if (estado.includes("interes") || estado.includes("contact")) score += 10;
  if (cliente.pagado || estado.includes("pag")) score += 17;

  if (typeof days === "number" && days < 0) score -= 12;
  if (estado.includes("sin")) score -= 10;
  if (estado.includes("cerr")) score -= 20;

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score >= 80) {
    return {
      score,
      label: "Relación fuerte",
      tone: "emerald",
      summary: `${pipelineDays} día(s) en memoria. Contexto suficiente para acciones comerciales claras.`,
    };
  }

  if (score >= 60) {
    return {
      score,
      label: "Relación activa",
      tone: "sky",
      summary: `${pipelineDays} día(s) en pipeline. Mantener ritmo y seguimiento.`,
    };
  }

  if (score >= 40) {
    return {
      score,
      label: "Relación en construcción",
      tone: "amber",
      summary: "Falta más contexto para una memoria comercial fuerte.",
    };
  }

  return {
    score,
    label: "Relación débil",
    tone: "red",
    summary: "Conviene actualizar notas, próximo contacto y estado comercial.",
  };
}

function buildAIInsights(cliente: Cliente): AIInsight[] {
  const estado = normalizeText(cliente.estado);
  const days = daysBetween(cliente.proximo_contacto);
  const value = Number(cliente.monto || 0);
  const revenue = buildRevenueProfile(cliente);
  const insights: AIInsight[] = [];

  if (typeof days === "number" && days < 0) {
    insights.push({
      icon: "📅",
      title: "Seguimiento vencido",
      description: `Este cliente tenía seguimiento hace ${Math.abs(days)} día(s).`,
      action: "Enviar WhatsApp hoy y reactivar la conversación.",
      tone: "red",
    });
  }

  if (estado.includes("interes") || revenue.probability >= 70) {
    insights.push({
      icon: "🔥",
      title: "Alta probabilidad de cierre",
      description: "El estado comercial muestra intención o avance real.",
      action: "Avanzar con una propuesta clara o llamada corta.",
      tone: "amber",
    });
  }

  if (estado.includes("sin")) {
    insights.push({
      icon: "⚠️",
      title: "Riesgo de perder cliente",
      description: "El cliente está en una fase de baja respuesta.",
      action: "Usar un mensaje humano, corto y sin presión.",
      tone: "red",
    });
  }

  if (value > 0 && !cliente.pagado && !estado.includes("pag")) {
    insights.push({
      icon: "💰",
      title: "Ingreso pendiente",
      description: `Hay una oportunidad abierta de ${formatGs(value)}.`,
      action: "Priorizar seguimiento para proteger el ingreso.",
      tone: "emerald",
    });
  }

  if (cliente.pagado || estado.includes("pag")) {
    insights.push({
      icon: "✅",
      title: "Cliente convertido",
      description: "Este cliente ya generó ingreso confirmado.",
      action: "Mantener relación activa y buscar recompra o recomendación.",
      tone: "emerald",
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: "🧠",
      title: "Cliente en observación",
      description: "Todavía faltan señales para una predicción más fuerte.",
      action: "Actualizar notas, monto y próximo seguimiento.",
      tone: "sky",
    });
  }

  return insights.slice(0, 4);
}

function buildTimeline(cliente: Cliente): TimelineItem[] {
  const items: TimelineItem[] = [];

  if (cliente.created_at) {
    items.push({
      date: formatDate(cliente.created_at),
      title: "Cliente creado",
      description: "El contacto fue agregado a ClienteYA.",
      tone: "sky",
    });
  }

  if (cliente.notas) {
    items.push({
      date: "Notas",
      title: "Contexto comercial registrado",
      description: cliente.notas,
      tone: "slate",
    });
  }

  if (cliente.recordatorio) {
    items.push({
      date: "Recordatorio",
      title: "Próxima acción definida",
      description: cliente.recordatorio,
      tone: "amber",
    });
  }

  if (String(cliente.telefono || "").replace(/\D/g, "")) {
    items.push({
      date: "Canal",
      title: "WhatsApp disponible",
      description: "ClienteYA puede convertir esta relación en acción directa por WhatsApp.",
      tone: "emerald",
    });
  }

  if (cliente.proximo_contacto) {
    const days = daysBetween(cliente.proximo_contacto);

    items.push({
      date: formatDate(cliente.proximo_contacto),
      title:
        typeof days === "number" && days < 0
          ? "Seguimiento vencido"
          : "Seguimiento programado",
      description:
        typeof days === "number" && days < 0
          ? `Seguimiento atrasado hace ${Math.abs(days)} día(s).`
          : "Próximo contacto comercial programado.",
      tone: typeof days === "number" && days < 0 ? "red" : "emerald",
    });
  }

  if (cliente.fecha_pago || cliente.pagado) {
    items.push({
      date: formatDate(cliente.fecha_pago),
      title: "Pago registrado",
      description: `Ingreso confirmado: ${formatGs(cliente.monto)}.`,
      tone: "emerald",
    });
  }

  if (items.length === 0) {
    items.push({
      date: "Hoy",
      title: "Sin historial todavía",
      description: "La memoria comercial crecerá con cada acción.",
      tone: "slate",
    });
  }

  return items.slice(0, 6);
}


function getLastInteractionLabel(cliente: Cliente) {
  const followupDays = daysBetween(cliente.proximo_contacto);
  const createdDays = daysSince(cliente.created_at);

  if (typeof followupDays === "number" && followupDays < 0) {
    return `${Math.abs(followupDays)} día(s) desde el seguimiento vencido`;
  }

  if (typeof followupDays === "number" && followupDays === 0) {
    return "Interacción prevista para hoy";
  }

  if (typeof followupDays === "number" && followupDays > 0) {
    return `Próximo contacto en ${followupDays} día(s)`;
  }

  if (typeof createdDays === "number") {
    return `${createdDays} día(s) desde que entró al pipeline`;
  }

  return "Sin interacción registrada todavía";
}

function getMemoryPattern(cliente: Cliente, relationship: RelationshipProfile) {
  const estado = normalizeText(cliente.estado);
  const days = daysBetween(cliente.proximo_contacto);
  const hasNotes = Boolean(cliente.notas);
  const hasReminder = Boolean(cliente.recordatorio);

  if (cliente.pagado || estado.includes("pag")) {
    return "Cliente convertido. La memoria debe enfocarse en recompra, confianza y recomendación.";
  }

  if (typeof days === "number" && days < 0 && (estado.includes("interes") || relationship.score >= 55)) {
    return "Cliente con interés activo, pero seguimiento vencido. Riesgo creciente si no se contacta hoy.";
  }

  if (typeof days === "number" && days < 0) {
    return "Relación pausada por seguimiento vencido. Conviene reactivar con un mensaje corto.";
  }

  if (estado.includes("sin")) {
    return "Respuesta débil o ausente. Usar tono humano, bajo presión y confirmar si todavía hay interés.";
  }

  if (hasNotes && hasReminder) {
    return "Contexto comercial suficiente. Mantener ritmo y registrar cada respuesta para mejorar la memoria.";
  }

  if (hasNotes || hasReminder) {
    return "Memoria parcial. Falta completar notas, fecha o siguiente compromiso para mejorar precisión.";
  }

  return "Memoria inicial. ClienteYA necesita más contexto para detectar patrones confiables.";
}

function buildRelationshipMemoryProfile(
  cliente: Cliente,
  relationship: RelationshipProfile
): RelationshipMemoryProfile {
  const estado = normalizeText(cliente.estado);
  const days = daysBetween(cliente.proximo_contacto);
  const hasPhone = Boolean(String(cliente.telefono || "").replace(/\D/g, ""));
  const hasNotes = Boolean(cliente.notas);
  const hasReminder = Boolean(cliente.recordatorio);
  const hasNextContact = Boolean(cliente.proximo_contacto);
  const value = Number(cliente.monto || 0);
  const overdueCount = typeof days === "number" && days < 0 ? 1 : 0;

  let memoryStrength = 30;

  if (hasPhone) memoryStrength += 12;
  if (hasNotes) memoryStrength += 18;
  if (hasReminder) memoryStrength += 14;
  if (hasNextContact) memoryStrength += 14;
  if (value > 0) memoryStrength += 10;
  if (cliente.pagado || estado.includes("pag")) memoryStrength += 12;
  if (typeof days === "number" && days < 0) memoryStrength -= 6;

  memoryStrength = Math.max(0, Math.min(100, Math.round(memoryStrength)));

  const tone: InsightTone =
    memoryStrength >= 75
      ? "emerald"
      : memoryStrength >= 55
        ? "sky"
        : memoryStrength >= 38
          ? "amber"
          : "red";

  const relationLevel =
    relationship.score >= 80
      ? "Relación fuerte"
      : relationship.score >= 60
        ? "Relación activa"
        : relationship.score >= 40
          ? "Relación en construcción"
          : "Relación débil";

  const followupState =
    typeof days === "number" && days < 0
      ? `Seguimiento vencido hace ${Math.abs(days)} día(s)`
      : typeof days === "number" && days === 0
        ? "Seguimiento para hoy"
        : typeof days === "number" && days > 0
          ? `Seguimiento en ${days} día(s)`
          : "Sin próximo seguimiento";

  const preferredChannel = hasPhone ? "WhatsApp" : "Actualizar teléfono";

  const signals: RelationshipMemorySignal[] = [
    {
      label: "Canal preferido",
      value: preferredChannel,
      tone: hasPhone ? "emerald" : "amber",
    },
    {
      label: "Última interacción",
      value: getLastInteractionLabel(cliente),
      tone: overdueCount > 0 ? "red" : "sky",
    },
    {
      label: "Seguimientos vencidos",
      value: String(overdueCount),
      tone: overdueCount > 0 ? "red" : "emerald",
    },
    {
      label: "Nivel de relación",
      value: relationLevel,
      tone: relationship.tone,
    },
  ];

  const summary =
    cliente.pagado || estado.includes("pag")
      ? "Cliente convertido. Mantener relación activa y buscar recompra o recomendación."
      : overdueCount > 0
        ? "Cliente con seguimiento vencido. La memoria indica que conviene actuar hoy."
        : hasNotes || hasReminder
          ? "Cliente con contexto comercial útil. Mantener la memoria actualizada después de cada interacción."
          : "Cliente con memoria inicial. Completar notas y próximo seguimiento para mejorar inteligencia.";

  return {
    summary,
    pattern: getMemoryPattern(cliente, relationship),
    preferredChannel,
    relationLevel,
    lastInteractionLabel: getLastInteractionLabel(cliente),
    followupState,
    overdueCount,
    memoryStrength,
    tone,
    signals,
  };
}

function buildAIReasoningProfile(
  cliente: Cliente,
  revenue: RevenueProfile,
  relationship: RelationshipProfile,
  memory: RelationshipMemoryProfile,
  patterns: WhatsAppPattern[] = []
): AIReasoningProfile {
  const estado = normalizeText(cliente.estado);
  const days = daysBetween(cliente.proximo_contacto);
  const hasValue = Number(cliente.monto || 0) > 0;
  const hasNotes = Boolean(cliente.notas);
  const hasReminder = Boolean(cliente.recordatorio);
  const isPaid = Boolean(cliente.pagado || estado.includes("pag"));
  const mainPattern = patterns[0];

  let confidence = Math.round(
    relationship.score * 0.34 +
      memory.memoryStrength * 0.28 +
      revenue.probability * 0.24 +
      (hasNotes ? 7 : 0) +
      (hasReminder ? 5 : 0) +
      (hasValue ? 4 : 0)
  );

  confidence = Math.max(0, Math.min(100, confidence));

  let tone: InsightTone = "sky";
  let reasoning =
    "ClienteYA combina memoria, relación, forecast y seguimiento para explicar la acción recomendada.";
  let conclusion =
    "Hay contexto suficiente para avanzar con una acción comercial clara.";

  if (isPaid) {
    tone = "emerald";
    reasoning =
      "El ingreso ya fue confirmado y la memoria indica que esta relación puede generar confianza, recompra o recomendación.";
    conclusion =
      "La mejor decisión es cuidar la relación y mantener una conversación activa sin presión comercial.";
  } else if (memory.overdueCount > 0 || (typeof days === "number" && days < 0)) {
    tone = "red";
    reasoning =
      "La memoria detecta seguimiento vencido, relación todavía activa y una oportunidad que puede enfriarse si no se contacta pronto.";
    conclusion =
      "Existe riesgo creciente de perder esta oportunidad sin contacto durante esta semana.";
  } else if (revenue.probability >= 70) {
    tone = "amber";
    reasoning =
      "El forecast muestra alta probabilidad de cierre y la relación tiene señales suficientes para avanzar al siguiente paso.";
    conclusion =
      "El cliente está en buen momento para una propuesta, confirmación o llamada corta.";
  } else if (relationship.score < 45 || estado.includes("sin")) {
    tone = "amber";
    reasoning =
      "La relación necesita más contexto y la memoria todavía no es suficientemente fuerte para una acción agresiva.";
    conclusion =
      "Conviene reactivar con un mensaje humano y actualizar la memoria después de la respuesta.";
  }

  if (mainPattern) {
    reasoning = `La memoria V18 detectó el patrón "${mainPattern.title}". ClienteYA prioriza este comportamiento porque puede cambiar la mejor acción comercial.`;
    conclusion = `${mainPattern.description} Acción recomendada: ${mainPattern.action}.`;

    if (mainPattern.risk === "critical" || mainPattern.risk === "high") {
      tone = "red";
      confidence = Math.max(confidence, 82);
    } else if (mainPattern.risk === "medium") {
      tone = "amber";
      confidence = Math.max(confidence, 72);
    } else {
      tone = "emerald";
      confidence = Math.max(confidence, 68);
    }
  }

  const signals: AIReasoningSignal[] = [
    {
      label: "Canal preferido",
      value: memory.preferredChannel,
      tone: memory.preferredChannel === "WhatsApp" ? "emerald" : "amber",
    },
    {
      label: "Relación",
      value: `${relationship.score}/100 · ${relationship.label}`,
      tone: relationship.tone,
    },
    {
      label: "Forecast",
      value: `${formatGs(revenue.expectedRevenue)} · ${revenue.probability}%`,
      tone: revenue.expectedRevenue > 0 ? "emerald" : "slate",
    },
    {
      label: "Seguimiento",
      value: memory.followupState,
      tone: memory.overdueCount > 0 ? "red" : "sky",
    },
    {
      label: "Memoria",
      value: `${memory.memoryStrength}/100 · ${memory.relationLevel}`,
      tone: memory.tone,
    },
    {
      label: "Contexto",
      value: hasNotes
        ? "Notas comerciales disponibles"
        : "Faltan notas para mejorar precisión",
      tone: hasNotes ? "emerald" : "amber",
    },
    {
      label: "Patrón V18",
      value: mainPattern ? mainPattern.title : "Sin patrón crítico",
      tone: mainPattern
        ? mainPattern.risk === "critical" || mainPattern.risk === "high"
          ? "red"
          : mainPattern.risk === "medium"
            ? "amber"
            : "emerald"
        : "slate",
    },
  ];

  return {
    confidence,
    conclusion,
    reasoning,
    tone,
    patternTitle: mainPattern?.title,
    patternReason: mainPattern?.description,
    patternAction: mainPattern?.action,
    signals,
  };
}

function buildFounderActionProfile(
  cliente: Cliente,
  revenue: RevenueProfile,
  relationship: RelationshipProfile
): FounderActionProfile {
  const estado = normalizeText(cliente.estado);
  const days = daysBetween(cliente.proximo_contacto);
  const hasWhatsapp = Boolean(String(cliente.telefono || "").replace(/\D/g, ""));
  const whatsappHref = getWhatsappHref(cliente.telefono);

  if (cliente.pagado || estado.includes("pag")) {
    return {
      title: "Cuidar relación y buscar recompra",
      description:
        "Este cliente ya generó ingreso. La mejor acción ahora es mantener confianza, pedir feedback o abrir una oportunidad de recompra.",
      impact: revenue.expectedRevenue,
      probability: revenue.probability,
      urgency: "Media",
      tone: "emerald",
      actionLabel: hasWhatsapp ? "Enviar WhatsApp" : "Abrir cliente",
      actionHref: hasWhatsapp ? whatsappHref : `/dashboard/clientes/${cliente.id}`,
      route: [
        {
          label: "Paso 1",
          description: "Enviar mensaje corto de agradecimiento o seguimiento humano.",
          tone: "emerald",
        },
        {
          label: "Paso 2",
          description: "Preguntar si necesita algo más o si puede recomendar el servicio.",
          tone: "sky",
        },
        {
          label: "Paso 3",
          description: "Registrar la respuesta en notas para alimentar la memoria comercial.",
          tone: "slate",
        },
      ],
    };
  }

  if (typeof days === "number" && days < 0) {
    return {
      title: "Contactar hoy",
      description:
        "El seguimiento está vencido. La prioridad founder es reactivar la conversación antes de que la oportunidad se enfríe.",
      impact: revenue.expectedRevenue,
      probability: revenue.probability,
      urgency: "Crítica",
      tone: "red",
      actionLabel: hasWhatsapp ? "Enviar WhatsApp" : "Abrir cliente",
      actionHref: hasWhatsapp ? whatsappHref : `/dashboard/clientes/${cliente.id}`,
      route: [
        {
          label: "Paso 1",
          description: "Enviar WhatsApp hoy con mensaje corto, humano y directo.",
          tone: "red",
        },
        {
          label: "Paso 2",
          description: "Si responde, confirmar siguiente paso comercial en una sola pregunta.",
          tone: "amber",
        },
        {
          label: "Paso 3",
          description: "Actualizar notas y programar el próximo seguimiento.",
          tone: "sky",
        },
      ],
    };
  }

  if (revenue.probability >= 70) {
    return {
      title: "Cerrar siguiente paso",
      description:
        "La probabilidad comercial es alta. Conviene avanzar con propuesta, llamada o confirmación concreta.",
      impact: revenue.expectedRevenue,
      probability: revenue.probability,
      urgency: "Alta",
      tone: "amber",
      actionLabel: hasWhatsapp ? "Enviar WhatsApp" : "Abrir cliente",
      actionHref: hasWhatsapp ? whatsappHref : `/dashboard/clientes/${cliente.id}`,
      route: [
        {
          label: "Paso 1",
          description: "Enviar mensaje para confirmar interés y siguiente decisión.",
          tone: "amber",
        },
        {
          label: "Paso 2",
          description: "Ofrecer propuesta clara, precio o llamada corta.",
          tone: "emerald",
        },
        {
          label: "Paso 3",
          description: "Registrar compromiso y fecha exacta de seguimiento.",
          tone: "sky",
        },
      ],
    };
  }

  if (estado.includes("sin") || relationship.score < 45) {
    return {
      title: "Reactivar relación",
      description:
        "La relación necesita contexto nuevo. La acción correcta es un mensaje suave para recuperar respuesta sin presión.",
      impact: revenue.expectedRevenue,
      probability: revenue.probability,
      urgency: "Alta",
      tone: "amber",
      actionLabel: hasWhatsapp ? "Enviar WhatsApp" : "Abrir cliente",
      actionHref: hasWhatsapp ? whatsappHref : `/dashboard/clientes/${cliente.id}`,
      route: [
        {
          label: "Paso 1",
          description: "Enviar mensaje corto de reactivación con tono humano.",
          tone: "amber",
        },
        {
          label: "Paso 2",
          description: "Actualizar estado según respuesta: interesado, sin respuesta o cerrado.",
          tone: "sky",
        },
        {
          label: "Paso 3",
          description: "Si no responde, programar seguimiento ligero para mañana.",
          tone: "slate",
        },
      ],
    };
  }

  return {
    title: "Actualizar contexto y programar seguimiento",
    description:
      "La oportunidad necesita más información para que ClienteYA pueda recomendar una acción más precisa.",
    impact: revenue.expectedRevenue,
    probability: revenue.probability,
    urgency: "Media",
    tone: "sky",
    actionLabel: "Editar contexto",
    actionHref: `/dashboard/editar?id=${cliente.id}`,
    route: [
      {
        label: "Paso 1",
        description: "Actualizar notas con lo último que ocurrió en la relación.",
        tone: "sky",
      },
      {
        label: "Paso 2",
        description: "Definir próximo seguimiento con fecha concreta.",
        tone: "emerald",
      },
      {
        label: "Paso 3",
        description: "Volver al cockpit para revisar si la prioridad cambió.",
        tone: "slate",
      },
    ],
  };
}

function getMainRecommendation(cliente: Cliente) {
  const estado = normalizeText(cliente.estado);
  const days = daysBetween(cliente.proximo_contacto);
  const revenue = buildRevenueProfile(cliente);

  if (typeof days === "number" && days < 0) {
    return "Enviar seguimiento por WhatsApp hoy.";
  }

  if (revenue.probability >= 70 && !cliente.pagado) {
    return "Cerrar el siguiente paso comercial.";
  }

  if (estado.includes("sin")) {
    return "Reactivar con un mensaje corto y humano.";
  }

  if (cliente.pagado || estado.includes("pag")) {
    return "Mantener relación y buscar recompra.";
  }

  return "Actualizar contexto y programar próximo seguimiento.";
}


function FounderActionPanel({
  action,
}: {
  action: FounderActionProfile;
}) {
  return (
    <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="bg-gradient-to-br from-white via-blue-50/55 to-slate-50 p-5 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
                V17.6 Founder Action Center
              </span>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getToneClasses(
                  action.tone
                )}`}
              >
                Urgencia {action.urgency}
              </span>
            </div>

            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">
              Acción recomendada ahora
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              {action.title}
            </h2>

            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              {action.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <MetricTile
              label="Impacto esperado"
              value={formatGs(action.impact)}
              tone="emerald"
            />
            <MetricTile
              label="Probabilidad"
              value={`${action.probability}%`}
              tone={action.tone}
            />
            <MetricTile label="Urgencia" value={action.urgency} tone={action.tone} />
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.86fr_1.14fr]">
          <div className={`rounded-[28px] border p-5 ${getToneClasses(action.tone)}`}>
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">
              Decisión founder
            </p>

            <h3 className="mt-3 text-2xl font-black leading-tight">
              {action.title}
            </h3>

            <p className="mt-3 text-sm font-semibold leading-6">
              Ejecutar esta acción primero ayuda a proteger la relación, el
              forecast y el ritmo comercial.
            </p>

            <a
              href={action.actionHref}
              target={action.actionHref.startsWith("https://") ? "_blank" : undefined}
              rel={action.actionHref.startsWith("https://") ? "noreferrer" : undefined}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
            >
              {action.actionLabel} →
            </a>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Ruta recomendada
            </p>

            <div className="mt-4 grid gap-3">
              {action.route.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className={`rounded-[24px] border p-4 ${getToneClasses(item.tone)}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-black leading-6">
                        {item.description}
                      </p>
                    </div>

                    <span className="rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RelationshipMemorySummary({
  memory,
}: {
  memory: RelationshipMemoryProfile;
}) {
  return (
    <SectionCard
      badge="V17.7 Relationship Memory Engine"
      title="Memoria comercial del cliente"
      description="ClienteYA resume el contexto para que el founder no tenga que reconstruir la historia antes de actuar."
    >
      <div className={`rounded-[30px] border p-5 ${getToneClasses(memory.tone)}`}>
        <div className="grid gap-5 xl:grid-cols-[0.86fr_1.14fr] xl:items-stretch">
          <div className="rounded-[26px] border border-white/70 bg-white/75 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Memory Summary
            </p>

            <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950">
              {memory.summary}
            </h3>

            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {memory.pattern}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MetricTile
                label="Memory Score"
                value={`${memory.memoryStrength}/100`}
                tone={memory.tone}
              />
              <MetricTile
                label="Estado seguimiento"
                value={memory.followupState}
                tone={memory.overdueCount > 0 ? "red" : "emerald"}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {memory.signals.map((signal) => (
              <div
                key={signal.label}
                className={`rounded-[24px] border p-4 ${getToneClasses(signal.tone)}`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                  {signal.label}
                </p>

                <p className="mt-3 text-sm font-black leading-6">
                  {signal.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}


function AIReasoningPanel({
  reasoning,
}: {
  reasoning: AIReasoningProfile;
}) {
  return (
    <SectionCard
      badge="V17.8 Memory Driven AI"
      title="AI Reasoning"
      description="ClienteYA explica por qué recomienda la acción actual."
    >
      <div className={`rounded-[30px] border p-5 ${getToneClasses(reasoning.tone)}`}>
        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr] xl:items-stretch">
          <div className="rounded-[26px] border border-white/70 bg-white/80 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              AI Confidence
            </p>

            <div className="mt-3 flex items-end gap-2">
              <p className="text-5xl font-black leading-none text-slate-950">
                {reasoning.confidence}
              </p>

              <p className="pb-1 text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                /100
              </p>
            </div>

            <ScoreBar score={reasoning.confidence} tone={reasoning.tone} />

            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              {reasoning.reasoning}
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {reasoning.signals.map((signal) => (
                <div
                  key={signal.label}
                  className={`rounded-[22px] border p-4 ${getToneClasses(signal.tone)}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                    {signal.label}
                  </p>

                  <p className="mt-2 text-sm font-black leading-6">
                    {signal.value}
                  </p>
                </div>
              ))}
            </div>

            {reasoning.patternTitle ? (
              <div className={`rounded-[24px] border p-5 ${getToneClasses(reasoning.tone)}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                  Patrón detectado
                </p>

                <h3 className="mt-3 text-base font-black leading-6">
                  {reasoning.patternTitle}
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6">
                  {reasoning.patternReason}
                </p>

                <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-black leading-6 shadow-sm">
                  Acción: {reasoning.patternAction}
                </p>
              </div>
            ) : null}

            <div className={`rounded-[24px] border p-5 ${getToneClasses(reasoning.tone)}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                Conclusión
              </p>

              <p className="mt-3 text-sm font-black leading-7">
                {reasoning.conclusion}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function CommercialIntelligencePanel({
  intelligence,
}: {
  intelligence: CommercialIntelligenceProfile;
}) {
  const tone: InsightTone =
    intelligence.abandonmentRisk >= 60
      ? "red"
      : intelligence.abandonmentRisk >= 30
        ? "amber"
        : "emerald";

  return (
    <SectionCard
      badge="V18.3.2 Commercial Intelligence"
      title="Commercial Intelligence"
      description="Probabilidad de respuesta, cierre y abandono."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Probabilidad respuesta"
          value={`${intelligence.responseProbability}%`}
          tone="emerald"
        />

        <MetricTile
          label="Probabilidad cierre"
          value={`${intelligence.closeProbability}%`}
          tone="amber"
        />

        <MetricTile
          label="Riesgo abandono"
          value={`${intelligence.abandonmentRisk}%`}
          tone={tone}
        />

        <MetricTile
          label="Nivel riesgo"
          value={intelligence.riskLevel.toUpperCase()}
          tone={tone}
        />
      </div>

      <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
          Recomendación AI
        </p>

        <p className="mt-3 text-lg font-black text-slate-950">
          {intelligence.recommendation}
        </p>

        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {intelligence.reasoning}
        </p>
      </div>
    </SectionCard>
  );
}

function FounderRevenueIntelligencePanel({
  intelligence,
}: {
  intelligence: FounderRevenueProfile;
}) {
  const tone: InsightTone =
    intelligence.priorityLabel === "Crítica"
      ? "red"
      : intelligence.priorityLabel === "Alta"
        ? "amber"
        : intelligence.priorityLabel === "Media"
          ? "sky"
          : "slate";

  return (
    <SectionCard
      badge="V18.4 Founder Revenue Intelligence"
      title="Founder Revenue Intelligence"
      description="ClienteYA traduce probabilidad comercial a impacto de ingresos y prioridad founder."
    >
      <div className={`rounded-[30px] border p-5 ${getToneClasses(tone)}`}>
        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr] xl:items-stretch">
          <div className="rounded-[26px] border border-white/70 bg-white/80 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Impact Score
            </p>

            <div className="mt-3 flex items-end gap-2">
              <p className="text-5xl font-black leading-none text-slate-950">
                {intelligence.impactScore}
              </p>

              <p className="pb-1 text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                /100
              </p>
            </div>

            <ScoreBar score={intelligence.impactScore} tone={tone} />

            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              {intelligence.reasoning}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Expected Revenue"
              value={formatGs(intelligence.expectedRevenue)}
              tone="emerald"
            />

            <MetricTile
              label="Revenue at Risk"
              value={formatGs(intelligence.revenueAtRisk)}
              tone={intelligence.revenueAtRisk > 0 ? "red" : "emerald"}
            />

            <MetricTile
              label="Protected Revenue"
              value={formatGs(intelligence.protectedRevenue)}
              tone="sky"
            />

            <MetricTile
              label="Prioridad AI"
              value={intelligence.priorityLabel}
              tone={tone}
            />
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-blue-200 bg-white/80 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
            Recomendación founder
          </p>

          <p className="mt-3 text-lg font-black text-slate-950">
            {intelligence.recommendation}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function FounderDecisionPanel({
  decision,
}: {
  decision: FounderDecisionProfile;
}) {
  return (
    <section className="overflow-hidden rounded-[34px] border border-blue-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 p-5 text-white sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-100 shadow-sm">
                V19.5 Founder Decision
              </span>

              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getToneClasses(decision.tone)}`}>
                Urgencia {decision.urgency}
              </span>
            </div>

            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-200">
              Decisión única founder
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              {decision.label}
            </h2>

            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-blue-100">
              {decision.explanation}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 shadow-sm xl:min-w-[320px]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">
              Decision Score
            </p>

            <div className="mt-3 flex items-end gap-2">
              <p className="text-6xl font-black leading-none text-white">
                {decision.score}
              </p>

              <p className="pb-2 text-sm font-black uppercase tracking-[0.16em] text-blue-100">
                /100
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${Math.max(0, Math.min(100, decision.score))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UnifiedAIContextPanel({
  reasoning,
  commercial,
  revenue,
  relationship,
  temperature,
  decision,
}: {
  reasoning: AIReasoningProfile;
  commercial: CommercialIntelligenceProfile;
  revenue: FounderRevenueProfile;
  relationship: RelationshipProfile;
  temperature: LeadTemperature;
  decision: FounderDecisionProfile;
  actionHref: string;
}) {
  const riskTone: InsightTone =
    commercial.abandonmentRisk >= 60
      ? "red"
      : commercial.abandonmentRisk >= 30
        ? "amber"
        : "emerald";

  const revenueSignal =
    revenue.revenueAtRisk > 0
      ? "Hay ingreso en riesgo si no se actúa."
      : revenue.expectedRevenue > 0
        ? "Hay valor comercial para proteger."
        : "Primero hay que completar contexto comercial.";

  const contextLines: {
    label: string;
    value: string;
    tone: InsightTone;
  }[] = [
    {
      label: "Decisión",
      value: reasoning.conclusion,
      tone: decision.tone,
    },
    {
      label: "Señal comercial",
      value: `${commercial.recommendation} ${revenueSignal}`,
      tone: riskTone,
    },
    {
      label: "Relación",
      value: `${relationship.label}. Temperatura ${temperature.label}.`,
      tone: relationship.tone,
    },
  ];

  return (
    <SectionCard
      badge="V19.5.4 Context Compression"
      title="¿Por qué?"
      description="Sólo las señales necesarias para entender la decisión. Sin dashboard dentro de la tarjeta del cliente."
    >
      <div className="rounded-[30px] border border-blue-200 bg-blue-50 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
          Explicación simple
        </p>

        <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950">
          {decision.label}
        </h3>

        <div className="mt-5 grid gap-3">
          {contextLines.map((line) => (
            <div
              key={line.label}
              className={`rounded-[24px] border bg-white/75 p-4 shadow-sm ${getToneClasses(line.tone)}`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                {line.label}
              </p>

              <p className="mt-2 text-sm font-black leading-6">
                {line.value}
              </p>
            </div>
          ))}
        </div>

        <div className={`mt-5 rounded-[24px] border bg-white/80 p-4 ${getToneClasses(decision.tone)}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
            Confianza
          </p>
          <p className="mt-2 text-sm font-black leading-6">
            {decision.urgency} · {reasoning.confidence}/100
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function UnifiedRelationshipExperiencePanel({
  cliente,
  memory,
  insights,
  timeline,
  patterns,
}: {
  cliente: Cliente;
  memory: RelationshipMemoryProfile;
  insights: AIInsight[];
  timeline: TimelineItem[];
  patterns: WhatsAppPattern[];
}) {
  const mainPattern = patterns[0];
  const compactTimeline = timeline.slice(0, 3);
  const compactInsights = insights.slice(0, 3);

  return (
    <SectionCard
      badge="V19.5 Lo que sabemos"
      title="Lo que sabemos"
      description="La relación resumida en lenguaje humano: estado, señales, historia reciente y contexto clave."
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr_0.9fr]">
        <div className={`rounded-[30px] border p-5 ${getToneClasses(memory.tone)}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
            Relación
          </p>

          <h3 className="mt-3 text-2xl font-black leading-tight">
            {memory.summary}
          </h3>

          <p className="mt-4 text-sm font-semibold leading-7">
            {memory.pattern}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <MetricTile
              label="Canal preferido"
              value={memory.preferredChannel}
              tone={memory.preferredChannel === "WhatsApp" ? "emerald" : "amber"}
            />

            <MetricTile
              label="Seguimiento"
              value={memory.followupState}
              tone={memory.overdueCount > 0 ? "red" : "emerald"}
            />
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Señales importantes
          </p>

          <div className="mt-4 grid gap-3">
            {compactInsights.map((insight) => (
              <div
                key={insight.title}
                className={`rounded-[22px] border p-4 ${getToneClasses(insight.tone)}`}
              >
                <p className="text-sm font-black">
                  {insight.icon} {insight.title}
                </p>

                <p className="mt-2 text-sm font-semibold leading-6">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Historia reciente
          </p>

          <div className="mt-4 grid gap-3">
            {compactTimeline.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className={`rounded-[22px] border p-4 ${getToneClasses(item.tone)}`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                  {item.date}
                </p>

                <p className="mt-2 text-sm font-black leading-6">
                  {item.title}
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 opacity-80">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Contexto registrado
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Notas
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                {cliente.notas || "Sin notas todavía. Agrega qué pidió, qué prometió o qué objeción tuvo."}
              </p>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Compromiso
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                {cliente.recordatorio || "Sin recordatorio activo. Define el próximo compromiso para que ClienteYA no lo olvide."}
              </p>
            </div>
          </div>
        </div>

        {mainPattern ? (
          <div className={`rounded-[28px] border p-5 ${getToneClasses(mainPattern.risk === "critical" || mainPattern.risk === "high" ? "red" : mainPattern.risk === "medium" ? "amber" : "emerald")}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
              Patrón detectado
            </p>

            <h3 className="mt-3 text-lg font-black leading-6">
              {mainPattern.title}
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6">
              {mainPattern.description}
            </p>
          </div>
        ) : (
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Patrón detectado
            </p>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Todavía no hay un patrón crítico. ClienteYA seguirá aprendiendo con cada interacción.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}



function AIMessageSuggestionCard({
  message,
  whatsappHref,
  editHref,
  actionLabel,
}: {
  message: string;
  whatsappHref: string;
  editHref: string;
  actionLabel: string;
}) {
  const messageId = "ai-message-suggestion-text";
  const copyButtonId = "ai-message-suggestion-copy";

  return (
    <SectionCard
      badge="V20.6.4 WhatsApp AI"
      title="Mensaje sugerido por IA"
      description="ClienteYA prepara el mensaje antes de abrir WhatsApp. El founder mantiene el control final."
    >
      <div className="rounded-[30px] border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1fr_320px] xl:items-start">
          <div className="rounded-[26px] border border-white/80 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
              Texto preparado
            </p>

            <textarea
              id={messageId}
              readOnly
              value={message}
              className="mt-4 min-h-[210px] w-full resize-none rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-7 text-slate-800 outline-none"
            />

            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
              Puedes copiarlo, abrir WhatsApp directamente o editarlo en el asistente.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[26px] border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Acción AI
              </p>

              <p className="mt-3 text-xl font-black leading-tight text-slate-950">
                {actionLabel}
              </p>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                El mensaje está adaptado a la decisión, el estado del cliente y la inteligencia comercial actual.
              </p>
            </div>

            <button
              id={copyButtonId}
              type="button"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Copiar mensaje
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
            >
              WhatsApp →
            </a>

            <Link
              href={editHref}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Editar en asistente
            </Link>
          </div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var button = document.getElementById(${JSON.stringify(copyButtonId)});
              var textarea = document.getElementById(${JSON.stringify(messageId)});
              if (!button || !textarea) return;

              button.addEventListener('click', async function () {
                try {
                  var text = textarea.value || '';
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                  } else {
                    textarea.focus();
                    textarea.select();
                    document.execCommand('copy');
                  }

                  var original = button.textContent;
                  button.textContent = 'Copiado ✓';
                  window.setTimeout(function () {
                    button.textContent = original || 'Copiar mensaje';
                  }, 1600);
                } catch (error) {
                  textarea.focus();
                  textarea.select();
                }
              });
            })();
          `,
        }}
      />
    </SectionCard>
  );
}


function FounderActionBar({
  clienteId,
  whatsappHref,
  phoneHref,
  programarManana,
  smartActionLabel,
}: {
  clienteId: string;
  whatsappHref: string;
  phoneHref: string;
  programarManana: () => Promise<void>;
  smartActionLabel: string;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-blue-200 bg-white shadow-[0_14px_42px_rgba(37,99,235,0.10)]">
      <div className="bg-gradient-to-br from-white via-blue-50/60 to-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
              Founder Action Bar
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Ejecuta primero. El contexto queda debajo.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[640px]">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
            >
              {smartActionLabel} →
            </a>

            <a
              href={phoneHref}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Llamar
            </a>

            <form action={programarManana}>
              <button className="inline-flex w-full items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50">
                Programar
              </button>
            </form>

            <Link
              href={`/dashboard/editar?id=${clienteId}`}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Editar
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: InsightTone;
}) {
  return (
    <div className={`rounded-[24px] border p-4 ${getToneClasses(tone)}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function ScoreBar({ score, tone }: { score: number; tone: InsightTone }) {
  return (
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full ${getProgressColor(tone)}`}
        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
      />
    </div>
  );
}

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [clienteResult, businessSettingsResult] = await Promise.all([
    supabase
      .from("clientes")
      .select(
        "id,user_id,nombre,telefono,estado,notas,recordatorio,proximo_contacto,created_at,monto,pagado,fecha_pago"
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("business_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const { data: clienteData, error } = clienteResult;
  const businessSettings = (businessSettingsResult.data || null) as BusinessSettings | null;

  if (error) {
    console.error("CLIENTE DETAIL SELECT ERROR:", error);
  }

  const cliente = clienteData as Cliente | null;

  if (!cliente) {
    return (
      <div className="dashboard-shell">
        <AppHeader />

        <main className="dashboard-main">
          <div className="flex min-h-screen bg-slate-50/60">
            <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
              <SidebarNav />
            </aside>

            <div className="min-w-0 flex-1 px-4 pb-36 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
              <div className="mx-auto w-full max-w-[1100px]">
                <SectionCard
                  badge="ClienteYA"
                  title="Cliente no encontrado"
                  description="La ruta existe, pero este cliente no pertenece a tu cuenta o ya no existe."
                >
                  <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold leading-6 text-red-800">
                    No se encontró el cliente con ID:{" "}
                    <span className="font-black">{id}</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href="/dashboard/clientes" className={ui.buttons.primary}>
                      Volver a clientes
                    </Link>

                    <Link href="/dashboard/cockpit" className={ui.buttons.secondary}>
                      Volver al AI Cockpit
                    </Link>
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        </main>

        <MobileDashboardNav />
      </div>
    );
  }

  async function marcarContactado() {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    await supabase
      .from("clientes")
      .update({
        estado: "Contactado",
        recordatorio: "Cliente marcado como contactado desde detalle.",
      })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/cockpit");
    revalidatePath(`/dashboard/clientes/${id}`);

    redirect(`/dashboard/clientes/${id}`);
  }

  async function programarManana() {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    await supabase
      .from("clientes")
      .update({
        proximo_contacto: tomorrowISO(),
        recordatorio: "Seguimiento programado para mañana desde detalle.",
      })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/cockpit");
    revalidatePath(`/dashboard/clientes/${id}`);

    redirect(`/dashboard/clientes/${id}`);
  }

  async function marcarPagado() {
    "use server";

    const supabase = await createAuthServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    await supabase
      .from("clientes")
      .update({
        estado: "Pagó",
        pagado: true,
        fecha_pago: todayISO(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clientes");
    revalidatePath("/dashboard/cockpit");
    revalidatePath(`/dashboard/clientes/${id}`);

    redirect(`/dashboard/clientes/${id}`);
  }

  const nombre = cliente.nombre || "Cliente sin nombre";
  const estado = cliente.estado || "Sin estado";
  const days = daysBetween(cliente.proximo_contacto);
  const temperature = getLeadTemperature(cliente);
  const insights = buildAIInsights(cliente);
  const timeline = buildTimeline(cliente);
  const recommendation = getMainRecommendation(cliente);
  const revenue = buildRevenueProfile(cliente);
  const relationship = buildRelationshipProfile(cliente);
  const memory = buildRelationshipMemoryProfile(cliente, relationship);
  const whatsappMemory = buildClienteMemoryProfile(cliente);
  const detectedPatterns = detectWhatsAppPatterns(whatsappMemory.timeline);
  const v18FounderAction = buildFounderActionFromPatterns(detectedPatterns);
  const aiReasoning = buildAIReasoningProfile(
    cliente,
    revenue,
    relationship,
    memory,
    detectedPatterns
  );
  const commercialIntelligence = buildCommercialIntelligence({
    daysSinceLastContact: daysSince(cliente.proximo_contacto) || 0,
    followupCount: typeof days === "number" && days < 0 ? 1 : 0,
    memoryScore: memory.memoryStrength,
    relationshipScore: relationship.score,
    hasPromise: Boolean(cliente.recordatorio),
    hasRecentResponse: typeof days === "number" && days <= 7,
  });
  const founderRevenueIntelligence = buildFounderRevenueIntelligence({
    estimatedValue: revenue.estimatedValue,
    closeProbability: commercialIntelligence.closeProbability,
    abandonmentRisk: commercialIntelligence.abandonmentRisk,
    responseProbability: commercialIntelligence.responseProbability,
    relationshipScore: relationship.score,
    memoryScore: memory.memoryStrength,
    isPaid: Boolean(cliente.pagado || normalizeText(cliente.estado).includes("pag")),
  });
  const founderActionBase = buildFounderActionProfile(cliente, revenue, relationship);

  const founderAction = v18FounderAction
    ? {
        ...founderActionBase,
        title: v18FounderAction.title,
        description: v18FounderAction.description,
        urgency: v18FounderAction.urgency,
        actionLabel: v18FounderAction.actionLabel,
      }
    : founderActionBase;
  const phoneHref = getPhoneHref(cliente.telefono);
  const founderDecision = buildFounderDecision({
    responseProbability: commercialIntelligence.responseProbability,
    closeProbability: commercialIntelligence.closeProbability,
    revenueAtRisk: founderRevenueIntelligence.revenueAtRisk,
    expectedRevenue: founderRevenueIntelligence.expectedRevenue,
    relationshipScore: relationship.score,
    memoryScore: memory.memoryStrength,
    impactScore: founderRevenueIntelligence.impactScore,
    hasWhatsapp: Boolean(String(cliente.telefono || "").replace(/\D/g, "")),
    isPaid: Boolean(cliente.pagado || normalizeText(cliente.estado).includes("pag")),
  });

  const smartAction = buildFounderSmartActionLabel({
    decision: founderDecision,
    responseProbability: commercialIntelligence.responseProbability,
    closeProbability: commercialIntelligence.closeProbability,
    revenueAtRisk: founderRevenueIntelligence.revenueAtRisk,
    expectedRevenue: founderRevenueIntelligence.expectedRevenue,
    relationshipScore: relationship.score,
    memoryScore: memory.memoryStrength,
    impactScore: founderRevenueIntelligence.impactScore,
    hasWhatsapp: Boolean(String(cliente.telefono || "").replace(/\D/g, "")),
    isPaid: Boolean(cliente.pagado || normalizeText(cliente.estado).includes("pag")),
  });

  const aiWhatsAppMessage = buildWhatsAppSectorMessage({
    cliente,
    business: {
      company_name: getBusinessCompanyName(businessSettings),
      business_type: getBusinessSectorValue(businessSettings),
      business_tone: getBusinessToneValue(businessSettings),
      ai_prompt: businessSettings?.ai_prompt || null,
      whatsapp_number: businessSettings?.whatsapp_number || null,
    },
    decisionLabel: founderDecision.label,
    reason: founderDecision.explanation,
    daysOverdue: typeof days === "number" && days < 0 ? Math.abs(days) : null,
  });

  const whatsappMessageHref = getWhatsappHref(
    cliente.telefono,
    aiWhatsAppMessage.message
  );

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="min-w-0 flex-1 px-4 pb-40 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
            <div className="mx-auto w-full max-w-[1360px]">
              <PageHeader
                eyebrow="ClienteYA · V19.5 Founder Action First"
                title={nombre}
                description="Decisión primero. Acción directa. Contexto sólo cuando el founder lo necesita."
              />

              <div className="mt-5">
                <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                  <div className="bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 sm:p-7">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusClasses(
                            estado
                          )}`}
                        >
                          {estado}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getToneClasses(
                            temperature.tone
                          )}`}
                        >
                          Temperatura · {temperature.label} · {temperature.score}/100
                        </span>
                      </div>

                      <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                          {nombre}
                        </h1>

                        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                          {recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-5">
                <FounderDecisionPanel
                  decision={founderDecision}
                />
              </div>

              <div className="mt-4">
                <FounderActionBar
                  clienteId={cliente.id}
                  whatsappHref={whatsappMessageHref}
                  phoneHref={phoneHref}
                  programarManana={programarManana}
                  smartActionLabel={smartAction.label}
                />
              </div>

              <div className="mt-5">
                <AIMessageSuggestionCard
                  message={aiWhatsAppMessage.message}
                  whatsappHref={whatsappMessageHref}
                  editHref={`/dashboard/whatsapp?id=${cliente.id}`}
                  actionLabel={smartAction.label}
                />
              </div>

              <div className="mt-5">
                <UnifiedAIContextPanel
                  reasoning={aiReasoning}
                  commercial={commercialIntelligence}
                  revenue={founderRevenueIntelligence}
                  relationship={relationship}
                  temperature={temperature}
                  decision={founderDecision}
                  actionHref={whatsappMessageHref}
                />
              </div>

              <div className="mt-5">
  <UnifiedRelationshipExperiencePanel
    cliente={cliente}
    memory={memory}
    insights={insights}
    timeline={timeline}
    patterns={detectedPatterns}
  />
</div>

<div className="mt-5">
  <CustomerMemorySignalsPanel cliente={cliente} />
</div>



              <div className="hidden">
                <AIReasoningPanel reasoning={aiReasoning} />
                <CommercialIntelligencePanel intelligence={commercialIntelligence} />
                <FounderRevenueIntelligencePanel intelligence={founderRevenueIntelligence} />
                <FounderActionPanel action={founderAction} />
                <RelationshipMemorySummary memory={memory} />
                <RelationshipMemoryWidget memory={whatsappMemory} />
                <form action={marcarContactado}>
                  <button>Marcar contactado</button>
                </form>
                <form action={marcarPagado}>
                  <button>Marcar pagado</button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
          <a
            href={whatsappMessageHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-blue-700 px-3 py-3 text-center text-xs font-black text-white shadow-sm"
          >
            {smartAction.shortLabel}
          </a>

          <a
            href={phoneHref}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-black text-slate-700 shadow-sm"
          >
            Llamar
          </a>

          <Link
            href={`/dashboard/editar?id=${cliente.id}`}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-black text-slate-700 shadow-sm"
          >
            Editar
          </Link>

          <form action={programarManana}>
            <button className="w-full rounded-2xl bg-blue-700 px-3 py-3 text-center text-xs font-black text-white shadow-sm">
              Programar
            </button>
          </form>
        </div>
      </div>

      <MobileDashboardNav />
    </div>
  );
}
