import {
  buildSectorDecisionCopy,
  normalizeBusinessType,
  type BusinessType,
} from "./sector-intelligence";

export type WhatsAppSectorTone =
  | "amigable"
  | "vendedor"
  | "profesional"
  | "directo"
  | "calido";

export type WhatsAppSectorClient = {
  id?: string | null;
  nombre?: string | null;
  telefono?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
};

export type WhatsAppSectorBusiness = {
  company_name?: string | null;
  business_type?: string | null;
  business_tone?: string | null;
  ai_prompt?: string | null;
  whatsapp_number?: string | null;
};

export type WhatsAppSectorInput = {
  cliente: WhatsAppSectorClient;
  business?: WhatsAppSectorBusiness | null;
  decisionLabel?: string | null;
  reason?: string | null;
  daysOverdue?: number | null;
};

export type WhatsAppSectorMessage = {
  businessType: BusinessType;
  tone: WhatsAppSectorTone;
  actionLabel: string;
  greeting: string;
  context: string;
  action: string;
  closing: string;
  message: string;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function getClienteName(cliente: WhatsAppSectorClient) {
  return cliente.nombre?.trim() || "cliente";
}

function getCompanyName(business?: WhatsAppSectorBusiness | null) {
  return business?.company_name?.trim() || "nosotros";
}

function normalizeTone(value: string | null | undefined): WhatsAppSectorTone {
  const tone = normalizeText(value);

  if (tone.includes("vendedor")) return "vendedor";
  if (tone.includes("profesional")) return "profesional";
  if (tone.includes("direct")) return "directo";
  if (tone.includes("calid") || tone.includes("cálid")) return "calido";

  return "amigable";
}

function buildGreeting(cliente: WhatsAppSectorClient, tone: WhatsAppSectorTone) {
  const name = getClienteName(cliente);

  if (tone === "profesional") return `Hola ${name}, buen día.`;
  if (tone === "directo") return `Hola ${name}.`;

  return `Hola ${name}, ¿cómo estás?`;
}

function buildClosing(tone: WhatsAppSectorTone) {
  if (tone === "vendedor") {
    return "Si quieres, te ayudo a avanzar hoy mismo.";
  }

  if (tone === "profesional") {
    return "Quedo atento a tu respuesta.";
  }

  if (tone === "directo") {
    return "¿Te parece si lo vemos hoy?";
  }

  if (tone === "calido") {
    return "Me encantaría ayudarte con esto.";
  }

  return "Avísame y lo coordinamos.";
}

function buildRestaurantMessage(input: {
  companyName: string;
  decisionLabel: string;
  isPaid: boolean;
  hasValue: boolean;
}) {
  const decision = normalizeText(input.decisionLabel);

  if (input.isPaid || decision.includes("mantener")) {
    return {
      actionLabel: "Invitar de nuevo",
      context: `Queríamos agradecerte por elegir ${input.companyName}.`,
      action:
        "Cuando quieras volver, nos encantará atenderte nuevamente.",
    };
  }

  if (decision.includes("actuar") || decision.includes("reactivar")) {
    return {
      actionLabel: "Recuperar visita",
      context: `Hace tiempo que no te vemos por ${input.companyName}.`,
      action:
        "¿Te gustaría visitarnos nuevamente esta semana?",
    };
  }

  if (decision.includes("cerrar") || input.hasValue) {
    return {
      actionLabel: "Cerrar pedido",
      context: "Quería dar seguimiento a lo que hablamos.",
      action:
        "¿Te gustaría que dejemos algo preparado o coordinamos tu pedido?",
    };
  }

  return {
    actionLabel: "Enviar invitación",
    context: `Te escribo de ${input.companyName}.`,
    action:
      "¿Te gustaría que coordinemos algo para esta semana?",
  };
}

function buildFitnessMessage(input: {
  companyName: string;
  decisionLabel: string;
  isPaid: boolean;
}) {
  const decision = normalizeText(input.decisionLabel);

  if (input.isPaid || decision.includes("mantener")) {
    return {
      actionLabel: "Mantener miembro",
      context: `Gracias por seguir entrenando con ${input.companyName}.`,
      action:
        "¿Quieres que revisemos juntos tu próximo objetivo?",
    };
  }

  if (decision.includes("actuar") || decision.includes("reactivar")) {
    return {
      actionLabel: "Reactivar miembro",
      context: "Noté que hace tiempo no entrenas.",
      action:
        "¿Te gustaría retomar esta semana con una sesión simple?",
    };
  }

  if (decision.includes("cerrar")) {
    return {
      actionLabel: "Cerrar plan",
      context: "Quería dar seguimiento a tu interés en entrenar.",
      action:
        "¿Te gustaría que te pase una opción de plan para empezar?",
    };
  }

  return {
    actionLabel: "Enviar seguimiento",
    context: `Te escribo de ${input.companyName}.`,
    action:
      "¿Te gustaría que coordinemos tu próximo entrenamiento?",
  };
}

function buildRealEstateMessage(input: {
  companyName: string;
  decisionLabel: string;
  isPaid: boolean;
  hasValue: boolean;
}) {
  const decision = normalizeText(input.decisionLabel);

  if (input.isPaid || decision.includes("mantener")) {
    return {
      actionLabel: "Mantener relación",
      context: "Quería saber cómo sigues después del último avance.",
      action:
        "Si necesitas ver nuevas opciones o ajustar la búsqueda, te puedo ayudar.",
    };
  }

  if (decision.includes("actuar") || decision.includes("reactivar")) {
    return {
      actionLabel: "Reactivar interés",
      context:
        "Quería saber si todavía sigues interesado en la propiedad que vimos.",
      action:
        "¿Te gustaría que coordinemos una visita o te envío opciones similares?",
    };
  }

  if (decision.includes("cerrar") || input.hasValue) {
    return {
      actionLabel: "Programar visita",
      context: "Hay una oportunidad abierta y quería ayudarte a avanzar.",
      action:
        "¿Te gustaría que coordinemos una visita o revisamos la propuesta?",
    };
  }

  return {
    actionLabel: "Seguimiento propiedad",
    context: `Te escribo de ${input.companyName}.`,
    action:
      "¿Sigues buscando propiedad o quieres que te envíe opciones nuevas?",
  };
}

function buildRetailMessage(input: {
  companyName: string;
  decisionLabel: string;
  isPaid: boolean;
  hasValue: boolean;
}) {
  const decision = normalizeText(input.decisionLabel);

  if (input.isPaid || decision.includes("mantener")) {
    return {
      actionLabel: "Activar recompra",
      context: `Gracias por tu compra en ${input.companyName}.`,
      action:
        "Si necesitas algo más o quieres ver novedades, te puedo ayudar.",
    };
  }

  if (decision.includes("actuar") || decision.includes("reactivar")) {
    return {
      actionLabel: "Recuperar cliente",
      context: "Hace tiempo que no tenemos noticias tuyas.",
      action:
        "¿Te gustaría que te muestre algunas opciones nuevas?",
    };
  }

  if (decision.includes("cerrar") || input.hasValue) {
    return {
      actionLabel: "Cerrar venta",
      context: "Quería dar seguimiento a lo que estabas viendo.",
      action:
        "¿Quieres que te confirme disponibilidad o precio?",
    };
  }

  return {
    actionLabel: "Enviar propuesta",
    context: `Te escribo de ${input.companyName}.`,
    action:
      "¿Te gustaría ver alguna recomendación para esta semana?",
  };
}

function buildGenericMessage(input: {
  companyName: string;
  decisionLabel: string;
  isPaid: boolean;
  hasValue: boolean;
}) {
  const decision = normalizeText(input.decisionLabel);

  if (input.isPaid || decision.includes("mantener")) {
    return {
      actionLabel: "Mantener relación",
      context: `Gracias por confiar en ${input.companyName}.`,
      action:
        "Quería saber si puedo ayudarte con algo más esta semana.",
    };
  }

  if (decision.includes("actuar") || decision.includes("reactivar")) {
    return {
      actionLabel: "Reactivar cliente",
      context: "Hace tiempo que no hablamos.",
      action:
        "¿Te gustaría que retomemos el tema esta semana?",
    };
  }

  if (decision.includes("cerrar") || input.hasValue) {
    return {
      actionLabel: "Cerrar siguiente paso",
      context: "Quería dar seguimiento a lo que hablamos.",
      action:
        "¿Te parece si definimos el próximo paso?",
    };
  }

  return {
    actionLabel: "Enviar seguimiento",
    context: `Te escribo de ${input.companyName}.`,
    action:
      "¿Te puedo ayudar con algo hoy?",
  };
}

export function buildWhatsAppSectorMessage(
  input: WhatsAppSectorInput
): WhatsAppSectorMessage {
  const businessType = normalizeBusinessType(input.business?.business_type);
  const tone = normalizeTone(input.business?.business_tone);
  const companyName = getCompanyName(input.business);
  const decisionLabel = input.decisionLabel || "Dar seguimiento";
  const reason = input.reason || "Cliente necesita seguimiento.";
  const isPaid = Boolean(input.cliente.pagado);
  const hasValue = Boolean(input.cliente.monto && input.cliente.monto > 0);

  const sectorDecision = buildSectorDecisionCopy({
    businessType,
    decisionLabel,
    reason,
    estado: input.cliente.estado,
    daysOverdue: input.daysOverdue || null,
    hasWhatsapp: Boolean(input.cliente.telefono),
    isPaid,
    hasValue,
  });

  let sectorMessage:
    | {
        actionLabel: string;
        context: string;
        action: string;
      }
    | undefined;

  if (businessType === "restaurant") {
    sectorMessage = buildRestaurantMessage({
      companyName,
      decisionLabel,
      isPaid,
      hasValue,
    });
  } else if (businessType === "fitness") {
    sectorMessage = buildFitnessMessage({
      companyName,
      decisionLabel,
      isPaid,
    });
  } else if (businessType === "real_estate") {
    sectorMessage = buildRealEstateMessage({
      companyName,
      decisionLabel,
      isPaid,
      hasValue,
    });
  } else if (businessType === "retail") {
    sectorMessage = buildRetailMessage({
      companyName,
      decisionLabel,
      isPaid,
      hasValue,
    });
  } else {
    sectorMessage = buildGenericMessage({
      companyName,
      decisionLabel,
      isPaid,
      hasValue,
    });
  }

  const greeting = buildGreeting(input.cliente, tone);
  const closing = buildClosing(tone);

  const message = [
    greeting,
    sectorMessage.context,
    sectorMessage.action,
    closing,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    businessType,
    tone,
    actionLabel: sectorMessage.actionLabel || sectorDecision.primaryVerb,
    greeting,
    context: sectorMessage.context,
    action: sectorMessage.action,
    closing,
    message,
  };
}