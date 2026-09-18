export type BusinessType =
  | "restaurant"
  | "consulting"
  | "real_estate"
  | "fitness"
  | "beauty"
  | "retail"
  | "automotive"
  | "medical"
  | "education"
  | "services"
  | "general";

export type SectorDecisionTone =
  | "red"
  | "amber"
  | "emerald"
  | "sky"
  | "slate";

export type SectorSignal =
  | "inactive"
  | "returning"
  | "hot"
  | "converted"
  | "at_risk"
  | "follow_up";

export type SectorVocabulary = {
  inactive: string;
  returning: string;
  hot: string;
  converted: string;
  atRisk: string;
  followUp: string;
};

export type SectorDecisionInput = {
  businessType?: string | null;
  decisionLabel: string;
  reason: string;
  estado?: string | null;
  daysOverdue?: number | null;
  hasWhatsapp?: boolean;
  isPaid?: boolean;
  hasValue?: boolean;
};

export type SectorDecisionResult = {
  businessType: BusinessType;
  signal: SectorSignal;
  headline: string;
  actionPhrase: string;
  humanReason: string;
  primaryVerb: string;
  tone: SectorDecisionTone;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

export function normalizeBusinessType(
  value: string | null | undefined
): BusinessType {
  const type = normalizeText(value);

  if (
    type.includes("restaurant") ||
    type.includes("restaurante") ||
    type.includes("food") ||
    type.includes("gastronomia") ||
    type.includes("gastronomía") ||
    type.includes("bar") ||
    type.includes("cafe") ||
    type.includes("café")
  ) {
    return "restaurant";
  }

  if (
    type.includes("consult") ||
    type.includes("asesor") ||
    type.includes("advisor") ||
    type.includes("servicio profesional")
  ) {
    return "consulting";
  }

  if (
    type.includes("real estate") ||
    type.includes("inmobili") ||
    type.includes("propiedad") ||
    type.includes("broker") ||
    type.includes("makelaar")
  ) {
    return "real_estate";
  }

  if (
    type.includes("fitness") ||
    type.includes("gym") ||
    type.includes("gimnasio") ||
    type.includes("entren")
  ) {
    return "fitness";
  }

  if (
    type.includes("beauty") ||
    type.includes("belleza") ||
    type.includes("salon") ||
    type.includes("salón") ||
    type.includes("peluquer") ||
    type.includes("spa") ||
    type.includes("barber")
  ) {
    return "beauty";
  }

  if (
    type.includes("retail") ||
    type.includes("tienda") ||
    type.includes("shop") ||
    type.includes("comercio")
  ) {
    return "retail";
  }

  if (
    type.includes("auto") ||
    type.includes("car") ||
    type.includes("vehicle") ||
    type.includes("vehiculo") ||
    type.includes("vehículo") ||
    type.includes("dealer")
  ) {
    return "automotive";
  }

  if (
    type.includes("medical") ||
    type.includes("medic") ||
    type.includes("médic") ||
    type.includes("clinica") ||
    type.includes("clínica") ||
    type.includes("salud") ||
    type.includes("doctor")
  ) {
    return "medical";
  }

  if (
    type.includes("education") ||
    type.includes("educacion") ||
    type.includes("educación") ||
    type.includes("curso") ||
    type.includes("academy") ||
    type.includes("academia")
  ) {
    return "education";
  }

  if (
    type.includes("service") ||
    type.includes("servicio") ||
    type.includes("maintenance") ||
    type.includes("mantenimiento")
  ) {
    return "services";
  }

  return "general";
}

export function getBusinessTypeLabel(type: BusinessType) {
  if (type === "restaurant") return "Restaurante";
  if (type === "consulting") return "Consultoría";
  if (type === "real_estate") return "Inmobiliaria";
  if (type === "fitness") return "Fitness";
  if (type === "beauty") return "Belleza";
  if (type === "retail") return "Retail";
  if (type === "automotive") return "Automotriz";
  if (type === "medical") return "Salud";
  if (type === "education") return "Educación";
  if (type === "services") return "Servicios";

  return "General";
}

export function getSectorVocabulary(
  businessType?: string | null
): SectorVocabulary {
  const type = normalizeBusinessType(businessType);

  if (type === "restaurant") {
    return {
      inactive: "Relación ausente",
      returning: "Relación recurrente",
      hot: "Reserva pendiente",
      converted: "Relación convertida",
      atRisk: "Relación perdiéndose",
      followUp: "Seguimiento de mesa",
    };
  }

  if (type === "real_estate") {
    return {
      inactive: "Seguimiento pendiente",
      returning: "Interesado activo",
      hot: "Visita pendiente",
      converted: "Relación avanzada",
      atRisk: "Interés enfriándose",
      followUp: "Seguimiento de propiedad",
    };
  }

  if (type === "fitness") {
    return {
      inactive: "Miembro inactivo",
      returning: "Miembro recurrente",
      hot: "Renovación pendiente",
      converted: "Miembro activo",
      atRisk: "Riesgo de cancelación",
      followUp: "Seguimiento de entrenamiento",
    };
  }

  if (type === "beauty") {
    return {
      inactive: "Relación sin cita",
      returning: "Relación recurrente",
      hot: "Reserva pendiente",
      converted: "Relación atendida",
      atRisk: "Relación por perder",
      followUp: "Seguimiento de cita",
    };
  }

  if (type === "retail") {
    return {
      inactive: "Relación sin retorno",
      returning: "Relación frecuente",
      hot: "Recompra probable",
      converted: "Relación compradora",
      atRisk: "Riesgo de abandono",
      followUp: "Seguimiento de compra",
    };
  }

  if (type === "automotive") {
    return {
      inactive: "Interés enfriándose",
      returning: "Relación recurrente",
      hot: "Cotización pendiente",
      converted: "Relación convertida",
      atRisk: "Venta en riesgo",
      followUp: "Seguimiento postventa",
    };
  }

  if (type === "medical") {
    return {
      inactive: "Seguimiento pendiente",
      returning: "Paciente recurrente",
      hot: "Consulta por confirmar",
      converted: "Paciente atendido",
      atRisk: "Continuidad en riesgo",
      followUp: "Seguimiento de paciente",
    };
  }

  if (type === "education") {
    return {
      inactive: "Alumno potencial pendiente",
      returning: "Alumno recurrente",
      hot: "Inscripción pendiente",
      converted: "Alumno convertido",
      atRisk: "Interés por perder",
      followUp: "Seguimiento académico",
    };
  }

  if (type === "consulting" || type === "services") {
    return {
      inactive: "Seguimiento pendiente",
      returning: "Relación recurrente",
      hot: "Siguiente paso comercial",
      converted: "Relación convertida",
      atRisk: "Oportunidad enfriándose",
      followUp: "Seguimiento profesional",
    };
  }

  return {
    inactive: "Seguimiento pendiente",
    returning: "Relación recurrente",
    hot: "Oportunidad abierta",
    converted: "Relación convertida",
    atRisk: "Riesgo de abandono",
    followUp: "Relación en seguimiento",
  };
}

function getToneFromDecision(
  decisionLabel: string,
  isPaid?: boolean
): SectorDecisionTone {
  const decision = normalizeText(decisionLabel);

  if (isPaid || decision.includes("mantener")) return "emerald";
  if (decision.includes("actuar") || decision.includes("reactivar")) return "red";
  if (decision.includes("cerrar") || decision.includes("proteger")) return "amber";
  if (decision.includes("preparar") || decision.includes("momentum")) return "sky";

  return "slate";
}

function getSignalFromDecision(
  decisionLabel: string,
  isPaid?: boolean
): SectorSignal {
  const decision = normalizeText(decisionLabel);

  if (isPaid || decision.includes("mantener")) return "converted";

  if (decision.includes("actuar") || decision.includes("reactivar")) {
    return "inactive";
  }

  if (decision.includes("cerrar")) return "hot";
  if (decision.includes("proteger")) return "at_risk";

  if (decision.includes("preparar") || decision.includes("momentum")) {
    return "returning";
  }

  return "follow_up";
}

function getFallbackReason(
  reason: string,
  daysOverdue?: number | null
) {
  if (typeof daysOverdue === "number" && daysOverdue > 0) {
    return `No has hablado con esta relación desde hace ${daysOverdue} día(s).`;
  }

  return reason || "La relación necesita una acción comercial clara.";
}

function buildSectorCopy(input: {
  businessType: BusinessType;
  decisionLabel: string;
  reason: string;
  daysOverdue?: number | null;
  isPaid?: boolean;
  hasValue?: boolean;
}) {
  const decision = normalizeText(input.decisionLabel);
  const isPaid = Boolean(input.isPaid);
  const hasValue = Boolean(input.hasValue);
  const vocabulary = getSectorVocabulary(input.businessType);

  const days =
    typeof input.daysOverdue === "number" && input.daysOverdue > 0
      ? input.daysOverdue
      : null;

  const overdueText = days ? `${days} día(s)` : "varios días";
  const genericReason = getFallbackReason(input.reason, input.daysOverdue);

  if (isPaid || decision.includes("mantener")) {
    return {
      headline: vocabulary.converted,
      actionPhrase: "Mantén la relación activa y abre la próxima oportunidad.",
      humanReason:
        "Esta relación ya generó valor. Buen momento para cuidarla, pedir feedback o provocar una nueva compra.",
      primaryVerb: "Mantener relación",
    };
  }

  if (decision.includes("actuar") || decision.includes("reactivar")) {
    if (input.businessType === "restaurant") {
      return {
        headline: vocabulary.inactive,
        actionPhrase: "Recupérala hoy.",
        humanReason: `La relación no ha vuelto en ${overdueText}. Un mensaje corto puede recuperar la visita.`,
        primaryVerb: "Recuperar relación",
      };
    }

    if (input.businessType === "fitness") {
      return {
        headline: vocabulary.inactive,
        actionPhrase: "Reactívalo hoy.",
        humanReason: `Hace ${overdueText} que no hay seguimiento. Un mensaje simple puede recuperar ritmo y constancia.`,
        primaryVerb: "Reactivar miembro",
      };
    }

    if (input.businessType === "real_estate") {
      return {
        headline: vocabulary.inactive,
        actionPhrase: "Retoma la conversación sobre la propiedad.",
        humanReason: `Hace ${overdueText} que no recibe seguimiento. El interés puede enfriarse si no hay contacto.`,
        primaryVerb: "Contactar relación",
      };
    }

    if (input.businessType === "retail") {
      return {
        headline: vocabulary.inactive,
        actionPhrase: "Recupérala con una propuesta simple.",
        humanReason: `Hace ${overdueText} que no hay seguimiento. Puede volver con una oferta o recomendación adecuada.`,
        primaryVerb: "Activar recompra",
      };
    }

    if (input.businessType === "beauty") {
      return {
        headline: vocabulary.inactive,
        actionPhrase: "Recuérdale volver.",
        humanReason: `Hace ${overdueText} que no hay seguimiento. Puede ser buen momento para una nueva cita.`,
        primaryVerb: "Recuperar cita",
      };
    }

    if (input.businessType === "medical") {
      return {
        headline: vocabulary.inactive,
        actionPhrase: "Contactar con cuidado.",
        humanReason: `Hace ${overdueText} que no hay seguimiento. Conviene retomar contacto de forma clara y respetuosa.`,
        primaryVerb: "Contactar paciente",
      };
    }

    if (input.businessType === "automotive") {
      return {
        headline: vocabulary.inactive,
        actionPhrase: "Reactiva la conversación.",
        humanReason: `Hace ${overdueText} que no hay seguimiento. Puede perder interés si no recibe contacto.`,
        primaryVerb: "Reactivar interés",
      };
    }

    if (input.businessType === "education") {
      return {
        headline: vocabulary.inactive,
        actionPhrase: "Retoma la conversación.",
        humanReason: `Hace ${overdueText} que no hay seguimiento. Puede perder interés si no recibe orientación.`,
        primaryVerb: "Reactivar alumno",
      };
    }

    return {
      headline: vocabulary.inactive,
      actionPhrase: "Retoma el contacto hoy.",
      humanReason: genericReason,
      primaryVerb: "Contactar hoy",
    };
  }

  if (decision.includes("cerrar") || decision.includes("proteger")) {
    if (input.businessType === "restaurant") {
      return {
        headline: vocabulary.hot,
        actionPhrase: "Convierte el interés en pedido.",
        humanReason: hasValue
          ? "Hay una oportunidad comercial abierta. Conviene confirmar pedido, reserva o próxima compra."
          : "La relación muestra interés. Conviene llevarla a una decisión simple.",
        primaryVerb: "Cerrar pedido",
      };
    }

    if (input.businessType === "fitness") {
      return {
        headline: vocabulary.hot,
        actionPhrase: "Convierte interés en plan.",
        humanReason:
          "El interés debe transformarse en inscripción, renovación o próxima sesión.",
        primaryVerb: "Cerrar plan",
      };
    }

    if (input.businessType === "real_estate") {
      return {
        headline: vocabulary.hot,
        actionPhrase: "Avanza con propiedad, visita o propuesta.",
        humanReason:
          "El interés necesita un siguiente paso concreto: visita, información o decisión.",
        primaryVerb: "Cerrar siguiente paso",
      };
    }

    if (input.businessType === "retail") {
      return {
        headline: vocabulary.hot,
        actionPhrase: "Convierte interés en venta.",
        humanReason:
          "La relación muestra intención. Conviene facilitar decisión, disponibilidad o precio.",
        primaryVerb: "Cerrar venta",
      };
    }

    if (input.businessType === "beauty") {
      return {
        headline: vocabulary.hot,
        actionPhrase: "Convierte interés en cita.",
        humanReason:
          "La relación muestra intención. Conviene proponer horario o confirmar reserva.",
        primaryVerb: "Cerrar reserva",
      };
    }

    if (input.businessType === "medical") {
      return {
        headline: vocabulary.hot,
        actionPhrase: "Confirma el próximo paso.",
        humanReason:
          "El paciente necesita una confirmación simple: consulta, control o información.",
        primaryVerb: "Confirmar consulta",
      };
    }

    if (input.businessType === "automotive") {
      return {
        headline: vocabulary.hot,
        actionPhrase: "Avanza con oferta o prueba.",
        humanReason:
          "El interés debe convertirse en prueba, cotización o decisión de compra.",
        primaryVerb: "Cerrar venta",
      };
    }

    if (input.businessType === "education") {
      return {
        headline: vocabulary.hot,
        actionPhrase: "Convierte interés en inscripción.",
        humanReason:
          "El alumno necesita una respuesta concreta: cupo, precio, horario o próxima clase.",
        primaryVerb: "Cerrar inscripción",
      };
    }

    return {
      headline: vocabulary.hot,
      actionPhrase: "Convierte interés en decisión.",
      humanReason:
        "La relación necesita una propuesta, llamada o confirmación concreta.",
      primaryVerb: "Cerrar siguiente paso",
    };
  }

  if (decision.includes("preparar") || decision.includes("momentum")) {
    return {
      headline: vocabulary.returning,
      actionPhrase: "Mantén el ritmo comercial.",
      humanReason:
        "Hay señales positivas. Conviene mantener contacto antes de que la oportunidad pierda fuerza.",
      primaryVerb: "Mantener ritmo",
    };
  }

  return {
    headline: vocabulary.followUp,
    actionPhrase: "Ordena el próximo paso.",
    humanReason: genericReason,
    primaryVerb: "Dar seguimiento",
  };
}

export function buildSectorDecisionCopy(
  input: SectorDecisionInput
): SectorDecisionResult {
  const businessType = normalizeBusinessType(input.businessType);
  const tone = getToneFromDecision(input.decisionLabel, input.isPaid);
  const signal = getSignalFromDecision(input.decisionLabel, input.isPaid);

  const copy = buildSectorCopy({
    businessType,
    decisionLabel: input.decisionLabel,
    reason: input.reason,
    daysOverdue: input.daysOverdue,
    isPaid: input.isPaid,
    hasValue: input.hasValue,
  });

  return {
    businessType,
    signal,
    headline: copy.headline,
    actionPhrase: copy.actionPhrase,
    humanReason: copy.humanReason,
    primaryVerb: copy.primaryVerb,
    tone,
  };
}