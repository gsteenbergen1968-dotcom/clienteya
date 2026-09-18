import type { RelationshipMemoryModel } from "@/lib/domain/relationship-memory-model";

export type RelationshipMemoryProfile = {
  engagementLevel: "high" | "medium" | "low";
  salesTemperature: "hot" | "warm" | "cold" | "closed";
  ghostingRisk: "high" | "medium" | "low";
  followupFatigue: "high" | "medium" | "low";
  recommendedTone: "direct" | "balanced" | "soft" | "post_sale";
  recommendedAction:
    | "close"
    | "follow_up"
    | "reactivate"
    | "schedule"
    | "maintain_relationship";
  label: string;
  summary: string;
  risk: string;
  nextBestStep: string;
  score: number;
};

type RelationshipContextType =
  | "prospect"
  | "client"
  | "supplier"
  | "partner"
  | "investor"
  | "network"
  | "ambassador"
  | "other"
  | "unknown";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(
  date: string | null,
  today: string,
) {
  if (!date) return null;

  const target = new Date(
    `${date.slice(0, 10)}T00:00:00`,
  );

  const current = new Date(
    `${today}T00:00:00`,
  );

  return Math.round(
    (target.getTime() - current.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function countSignals(
  text: string,
  signals: string[],
) {
  return signals.reduce(
    (count, signal) => {
      return text.includes(signal)
        ? count + 1
        : count;
    },
    0,
  );
}

function normalizeRelationshipType(
  value: string | null,
): RelationshipContextType {
  const normalized = (
    value || ""
  )
    .trim()
    .toLowerCase();

  if (
    normalized === "prospecto" ||
    normalized === "prospect"
  ) {
    return "prospect";
  }

  if (
    normalized === "cliente" ||
    normalized === "client"
  ) {
    return "client";
  }

  if (
    normalized === "proveedor" ||
    normalized === "supplier"
  ) {
    return "supplier";
  }

  if (
    normalized === "socio" ||
    normalized === "partner"
  ) {
    return "partner";
  }

  if (
    normalized === "inversor" ||
    normalized === "inversionista" ||
    normalized === "investor"
  ) {
    return "investor";
  }

  if (
    normalized === "contacto de red" ||
    normalized === "network"
  ) {
    return "network";
  }

  if (
    normalized === "embajador" ||
    normalized === "ambassador"
  ) {
    return "ambassador";
  }

  if (normalized === "otro") {
    return "other";
  }

  return "unknown";
}

function isNonSalesRelationship(
  relationshipType: RelationshipContextType,
) {
  return (
    relationshipType === "supplier" ||
    relationshipType === "partner" ||
    relationshipType === "investor" ||
    relationshipType === "network" ||
    relationshipType === "ambassador"
  );
}

export function buildRelationshipMemory(
  relationship: RelationshipMemoryModel,
): RelationshipMemoryProfile {
  const today = todayISO();

  const relationshipType =
    normalizeRelationshipType(
      relationship.relationshipType,
    );

  const nonSalesRelationship =
    isNonSalesRelationship(
      relationshipType,
    );

  const conversationContext =
    relationship.conversationContext.toLowerCase();

  const reminderContext =
    relationship.reminderContext.toLowerCase();

  const combined =
    `${conversationContext} ${reminderContext}`;

  const delta = daysBetween(
    relationship.nextFollowUpAt,
    today,
  );

  /*
   * Payment/conversion is commercial sales context.
   * Do not automatically interpret a supplier, partner,
   * investor, network contact or ambassador as converted.
   */
  const paid =
    !nonSalesRelationship &&
    relationship.paymentStatus === "paid";

  const closed =
    relationship.lifecycleStatus ===
    "closed";

  const interested =
    relationship.lifecycleStatus ===
    "interested";

  const contacted =
    relationship.lifecycleStatus ===
    "contacted";

  const inactive =
    relationship.lifecycleStatus ===
    "inactive";

  const overdue =
    delta !== null &&
    delta < 0;

  const todayFollowup =
    delta === 0;

  const soonFollowup =
    delta !== null &&
    delta > 0 &&
    delta <= 3;

  const positiveSignals =
    countSignals(
      combined,
      [
        "interes",
        "quiere",
        "decidir",
        "avanzar",
        "confirmar",
        "pagar",
        "cotizar",
        "presupuesto",
        "propuesta",
        "reunión",
        "reunion",
        "llamar",
        "listo",
      ],
    );

  const negativeSignals =
    countSignals(
      combined,
      [
        "sin respuesta",
        "no responde",
        "frío",
        "frio",
        "pendiente",
        "duda",
        "caro",
        "después",
        "despues",
        "no interesado",
        "esperar",
      ],
    );

  const followupSignals =
    countSignals(
      combined,
      [
        "seguimiento",
        "reintentar",
        "recordar",
        "volver",
        "contactar",
        "whatsapp",
      ],
    );

  let score = 45;

  if (paid) {
    score += 35;
  }

  if (interested) {
    score += nonSalesRelationship
      ? 12
      : 25;
  }

  if (contacted) {
    score += 12;
  }

  if (inactive) {
    score -= 5;
  }

  if (
    closed &&
    !paid
  ) {
    score -= 35;
  }

  if (
    relationship.engagementSignal ===
    "high"
  ) {
    score += 15;
  }

  if (
    relationship.engagementSignal ===
    "medium"
  ) {
    score += 7;
  }

  if (
    relationship.engagementSignal ===
    "low"
  ) {
    score -= 5;
  }

  if (overdue) {
    score += 12;
  }

  if (todayFollowup) {
    score += 18;
  }

  if (soonFollowup) {
    score += 8;
  }

  score +=
    positiveSignals *
    (nonSalesRelationship ? 2 : 5);

  score -=
    negativeSignals * 4;

  if (
    !nonSalesRelationship &&
    relationship.estimatedValue !==
      null &&
    relationship.estimatedValue > 0
  ) {
    score += 8;
  }

  score = Math.max(
    0,
    Math.min(
      100,
      score,
    ),
  );

  const ghostingRisk =
    inactive ||
    negativeSignals >= 2
      ? "high"
      : negativeSignals === 1 ||
          overdue
        ? "medium"
        : "low";

  const followupFatigue =
    followupSignals >= 3 ||
    (inactive && overdue)
      ? "high"
      : followupSignals >= 2 ||
          inactive
        ? "medium"
        : "low";

  const engagementLevel =
    paid ||
    interested ||
    relationship.engagementSignal ===
      "high" ||
    positiveSignals >= 2
      ? "high"
      : contacted ||
          relationship.engagementSignal ===
            "medium" ||
          positiveSignals === 1
        ? "medium"
        : "low";

  /*
   * salesTemperature is retained because other parts of
   * ClienteYA already depend on this existing model.
   * For non-sales relationships it represents relationship
   * activity internally, not a sales opportunity.
   */
  const salesTemperature =
    paid
      ? "closed"
      : nonSalesRelationship
        ? score >= 70
          ? "warm"
          : score >= 40
            ? "warm"
            : "cold"
        : score >= 75
          ? "hot"
          : score >= 50
            ? "warm"
            : "cold";

  const recommendedTone =
    paid
      ? "post_sale"
      : ghostingRisk === "high" ||
          followupFatigue === "high"
        ? "soft"
        : !nonSalesRelationship &&
            salesTemperature ===
              "hot"
          ? "direct"
          : "balanced";

  const recommendedAction =
    paid
      ? "maintain_relationship"
      : nonSalesRelationship
        ? ghostingRisk === "high"
          ? "reactivate"
          : overdue ||
              todayFollowup
            ? "follow_up"
            : "maintain_relationship"
        : salesTemperature === "hot"
          ? "close"
          : ghostingRisk === "high"
            ? "reactivate"
            : overdue ||
                todayFollowup
              ? "follow_up"
              : "schedule";

  let label =
    "Seguimiento normal";

  let summary =
    "Relación en seguimiento comercial estándar.";

  let risk =
    "Riesgo bajo. Mantener seguimiento ordenado.";

  let nextBestStep =
    "Mantener la relación actualizada y programar el próximo contacto.";

  /*
   * RELATIONSHIP-TYPE CONTEXT
   *
   * These branches run before the generic sales pipeline,
   * preventing non-sales relationships from becoming
   * 'Oportunidad activa'.
   */

  if (
    relationshipType ===
    "supplier"
  ) {
    label =
      "Relación con proveedor";

    summary =
      "Esta relación corresponde a un proveedor. La prioridad es mantener coordinación, continuidad y claridad operativa.";

    if (
      ghostingRisk === "high"
    ) {
      risk =
        "Existe riesgo de perder continuidad o respuesta del proveedor.";

      nextBestStep =
        "Retomar el contacto con una consulta concreta y fácil de responder.";
    } else if (
      overdue ||
      todayFollowup
    ) {
      risk =
        "Hay un seguimiento pendiente que puede afectar la coordinación.";

      nextBestStep =
        "Contactar al proveedor y confirmar el asunto pendiente o próximo paso.";
    } else {
      risk =
        "Riesgo bajo mientras exista comunicación y seguimiento claro.";

      nextBestStep =
        "Mantener el contacto y confirmar necesidades, condiciones o próximos acuerdos.";
    }
  } else if (
    relationshipType ===
    "partner"
  ) {
    label =
      "Relación con socio";

    summary =
      "Esta relación corresponde a un socio. La prioridad es mantener alineación, confianza y próximos acuerdos claros.";

    if (
      ghostingRisk === "high"
    ) {
      risk =
        "La falta de comunicación puede debilitar la coordinación entre las partes.";

      nextBestStep =
        "Reactivar la conversación con un mensaje breve y orientado a coordinación.";
    } else if (
      overdue ||
      todayFollowup
    ) {
      risk =
        "Existe un punto de seguimiento pendiente entre las partes.";

      nextBestStep =
        "Retomar el contacto y confirmar el próximo acuerdo o decisión conjunta.";
    } else {
      risk =
        "Riesgo bajo si se mantiene alineación y comunicación regular.";

      nextBestStep =
        "Mantener la relación activa y confirmar próximos objetivos compartidos.";
    }
  } else if (
    relationshipType ===
    "investor"
  ) {
    label =
      "Relación con inversor";

    summary =
      "Esta relación corresponde a un inversor. La prioridad es mantener confianza, claridad y contexto suficiente.";

    if (
      ghostingRisk === "high"
    ) {
      risk =
        "La relación puede perder impulso si no se mantiene una comunicación relevante.";

      nextBestStep =
        "Retomar el contacto con una actualización concreta y de valor.";
    } else if (
      overdue ||
      todayFollowup
    ) {
      risk =
        "Existe un seguimiento pendiente que conviene atender.";

      nextBestStep =
        "Compartir una actualización relevante y confirmar el siguiente punto de contacto.";
    } else {
      risk =
        "Riesgo bajo mientras la comunicación aporte información útil.";

      nextBestStep =
        "Mantener informado al inversor y preparar el próximo momento relevante de contacto.";
    }
  } else if (
    relationshipType ===
    "network"
  ) {
    label =
      "Contacto de red";

    summary =
      "Esta relación forma parte de la red profesional. El valor está en mantener un vínculo natural y útil.";

    if (
      ghostingRisk === "high"
    ) {
      risk =
        "El vínculo puede enfriarse si pasa demasiado tiempo sin contacto.";

      nextBestStep =
        "Reactivar con un mensaje personal y sin presión comercial.";
    } else {
      risk =
        "Riesgo bajo. Evitar convertir cada contacto en una acción comercial.";

      nextBestStep =
        "Mantener el vínculo con un contacto relevante y natural.";
    }
  } else if (
    relationshipType ===
    "ambassador"
  ) {
    label =
      "Relación con embajador";

    summary =
      "Esta relación corresponde a un embajador. La prioridad es mantener cercanía, reconocimiento y participación.";

    if (
      ghostingRisk === "high"
    ) {
      risk =
        "La relación puede perder involucramiento si disminuye el contacto.";

      nextBestStep =
        "Retomar el vínculo con un mensaje personal y reconocer su participación.";
    } else {
      risk =
        "Riesgo bajo si se mantiene una relación activa y de reconocimiento.";

      nextBestStep =
        "Mantener contacto y compartir una actualización o próximo punto relevante.";
    }
  } else if (paid) {
    label =
      "Relación convertida";

    summary =
      "El pago fue realizado. La prioridad es cuidar la relación.";

    risk =
      "Riesgo bajo, pero puede perderse continuidad si no hay postventa.";

    nextBestStep =
      "Enviar un mensaje de continuidad o agradecimiento postventa.";
  } else if (
    salesTemperature === "hot"
  ) {
    label =
      "Oportunidad activa";

    summary =
      "La relación muestra señales comerciales fuertes y buena probabilidad de avance.";

    risk =
      "Riesgo de perder la oportunidad si no se contacta pronto.";

    nextBestStep =
      "Enviar un mensaje directo con el siguiente paso claro.";
  } else if (
    ghostingRisk === "high"
  ) {
    label =
      "Riesgo de desconexión";

    summary =
      "La relación muestra poca respuesta o señales de distancia.";

    risk =
      "Riesgo alto de perder la conversación.";

    nextBestStep =
      "Enviar un mensaje breve, suave y fácil de responder.";
  } else if (
    followupFatigue === "high"
  ) {
    label =
      "Seguimiento sensible";

    summary =
      "La relación ya recibió varios seguimientos.";

    risk =
      "Riesgo de generar presión con demasiados contactos.";

    nextBestStep =
      "Usar un tono suave y dejar una salida fácil.";
  } else if (
    salesTemperature === "warm"
  ) {
    label =
      "Oportunidad en desarrollo";

    summary =
      "La relación muestra señales moderadas. Conviene mantener el ritmo.";

    risk =
      "Riesgo medio si el seguimiento pierde continuidad.";

    nextBestStep =
      "Enviar un mensaje equilibrado y programar el próximo contacto.";
  } else {
    label =
      "Relación por desarrollar";

    summary =
      "La relación muestra pocas señales comerciales por ahora.";

    risk =
      "Riesgo medio-bajo. Se necesita más contexto antes de insistir.";

    nextBestStep =
      "Actualizar el contexto o enviar un mensaje suave de reactivación.";
  }

  return {
    engagementLevel,
    salesTemperature,
    ghostingRisk,
    followupFatigue,
    recommendedTone,
    recommendedAction,
    label,
    summary,
    risk,
    nextBestStep,
    score,
  };
}

export function getRelationshipMemoryClasses(
  memory: RelationshipMemoryProfile,
) {
  if (
    memory.salesTemperature ===
    "closed"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (
    memory.salesTemperature ===
    "hot"
  ) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (
    memory.ghostingRisk ===
    "high"
  ) {
    return "border-orange-200 bg-orange-50 text-orange-800";
  }

  if (
    memory.salesTemperature ===
    "warm"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}