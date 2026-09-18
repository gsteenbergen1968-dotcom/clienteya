import {
  buildRelationshipMemoryProfile,
  type RelationshipMemorySource,
} from "./whatsapp-memory-adapter";

import { detectWhatsAppPatterns } from "./whatsapp-patterns";
import { buildWhatsAppActionTemplate } from "./whatsapp-action-templates";

import {
  type WhatsAppLearningEvent,
  type WhatsAppLearningOutcome,
} from "./whatsapp-learning-engine";

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function getLearningOutcome(
  relationship: RelationshipMemorySource
): WhatsAppLearningOutcome {
  const estado = normalize(relationship.estado);
  const notas = normalize(relationship.notas);
  const recordatorio = normalize(relationship.recordatorio);

  if (relationship.pagado || estado.includes("pag")) {
    return "success";
  }

  if (
    estado.includes("cerr") ||
    estado.includes("perdido") ||
    notas.includes("perdido") ||
    notas.includes("no quiere") ||
    notas.includes("no le interesa")
  ) {
    return "lost";
  }

  if (
    estado.includes("sin") ||
    notas.includes("sin respuesta") ||
    recordatorio.includes("sin respuesta")
  ) {
    return "no_response";
  }

  return "pending";
}

export function buildWhatsAppLearningEventsFromRelationships(
  relationships: RelationshipMemorySource[]
): WhatsAppLearningEvent[] {
  return relationships.flatMap((relationship) => {
    const memory = buildRelationshipMemoryProfile(relationship);
    const patterns = detectWhatsAppPatterns(memory.timeline);
    const outcome = getLearningOutcome(relationship);

    return patterns.map((pattern, index) => {
      const template = buildWhatsAppActionTemplate({
  relationshipName: relationship.nombre,
  pattern,
});

      return {
  id: `${relationship.id}-${pattern.id}-${index}`,
  relationshipId: relationship.id,
  patternId: pattern.id,
  actionId: template.id,
  outcome,
  createdAt:
    relationship.proximo_contacto ||
    relationship.created_at ||
    new Date().toISOString(),
};
    });
  });
}