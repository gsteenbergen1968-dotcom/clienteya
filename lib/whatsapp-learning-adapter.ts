import { buildClienteMemoryProfile, type ClienteMemorySource } from "./whatsapp-memory-adapter";
import { detectWhatsAppPatterns } from "./whatsapp-patterns";
import { buildWhatsAppActionTemplate } from "./whatsapp-action-templates";

import {
  type WhatsAppLearningEvent,
  type WhatsAppLearningOutcome,
} from "./whatsapp-learning-engine";

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function getLearningOutcome(cliente: ClienteMemorySource): WhatsAppLearningOutcome {
  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);
  const recordatorio = normalize(cliente.recordatorio);

  if (cliente.pagado || estado.includes("pag")) {
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

export function buildWhatsAppLearningEventsFromClientes(
  clientes: ClienteMemorySource[],
): WhatsAppLearningEvent[] {
  return clientes.flatMap((cliente) => {
    const memory = buildClienteMemoryProfile(cliente);
    const patterns = detectWhatsAppPatterns(memory.timeline);
    const outcome = getLearningOutcome(cliente);

    return patterns.map((pattern, index) => {
      const template = buildWhatsAppActionTemplate({
        clienteNombre: cliente.nombre,
        pattern,
      });

      return {
        id: `${cliente.id}-${pattern.id}-${index}`,
        clienteId: cliente.id,
        patternId: pattern.id,
        actionId: template.id,
        outcome,
        createdAt:
          cliente.proximo_contacto ||
          cliente.created_at ||
          new Date().toISOString(),
      };
    });
  });
}