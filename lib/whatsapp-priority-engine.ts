import {
  buildRelationshipMemoryProfile,
  type RelationshipMemorySource,
} from "./whatsapp-memory-adapter";

import {
  detectWhatsAppPatterns,
  type WhatsAppPattern,
} from "./whatsapp-patterns";

import { buildFounderActionFromPatterns } from "./founder-action-v18";

export type WhatsAppPriorityLevel = "critical" | "high" | "medium" | "low";

export type WhatsAppPriorityItem = {
  relationshipId: string;
  nombre: string;
  telefono?: string | null;
  priority: WhatsAppPriorityLevel;
  score: number;
  title: string;
  description: string;
  actionLabel: string;
  reason: string;
  pattern?: WhatsAppPattern;
};

function normalizeName(value: string | null | undefined) {
  return value?.trim() || "Relación sin nombre";
}

function getPriorityFromPattern(
  pattern?: WhatsAppPattern
): WhatsAppPriorityLevel {
  if (!pattern) return "low";
  if (pattern.risk === "critical") return "critical";
  if (pattern.risk === "high") return "high";
  if (pattern.risk === "medium") return "medium";

  return "low";
}

function getPriorityScore(patterns: WhatsAppPattern[]) {
  if (patterns.some((pattern) => pattern.risk === "critical")) return 100;
  if (patterns.some((pattern) => pattern.risk === "high")) return 85;
  if (patterns.some((pattern) => pattern.risk === "medium")) return 65;
  if (patterns.some((pattern) => pattern.risk === "low")) return 45;

  return 20;
}

export function buildWhatsAppPriorityItem(
  relationship: RelationshipMemorySource
): WhatsAppPriorityItem {
  const memory = buildRelationshipMemoryProfile(relationship);
  const patterns = detectWhatsAppPatterns(memory.timeline);
  const action = buildFounderActionFromPatterns(patterns);

  const mainPattern = patterns[0];
  const priority = getPriorityFromPattern(mainPattern);
  const score = getPriorityScore(patterns);

  return {
    relationshipId: relationship.id,
    nombre: normalizeName(relationship.nombre),
    telefono: "",
    priority,
    score,
    title: action?.title || "Actualizar contexto",
    description:
      action?.description ||
      "Todavía no hay patrón fuerte. Conviene completar notas y próximo seguimiento.",
    actionLabel: action?.actionLabel || "Revisar relación",
    reason: action?.reason || "Sin patrón crítico",
    pattern: mainPattern,
  };
}

export function buildWhatsAppPriorityQueue(
  relationships: RelationshipMemorySource[]
): WhatsAppPriorityItem[] {
  return relationships
    .map((relationship) => buildWhatsAppPriorityItem(relationship))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function getWhatsAppPriorityLabel(priority: WhatsAppPriorityLevel) {
  if (priority === "critical") return "Crítica";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";

  return "Baja";
}