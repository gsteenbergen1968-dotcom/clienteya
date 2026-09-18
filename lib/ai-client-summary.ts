type Relationship = {
  name?: string | null;
  company?: string | null;
  status?: string | null;
  notes?: string | null;
  reminder?: string | null;
  next_contact_at?: string | null;
  paid?: boolean | null;
};

export type AIRelationshipSummary = {
  summary: string;
  commercialSignal: string;
  risk: string;
  nextBestStep: string;
  tone:
    | "emerald"
    | "amber"
    | "red"
    | "sky"
    | "slate";
};

function daysUntil(
  date: string | null | undefined,
) {
  if (!date) {
    return null;
  }

  const target =
    new Date(date);

  if (
    Number.isNaN(
      target.getTime(),
    )
  ) {
    return null;
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  target.setHours(
    0,
    0,
    0,
    0,
  );

  return Math.round(
    (
      target.getTime() -
      today.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function normalize(
  value: string | null | undefined,
) {
  return (value || "")
    .trim()
    .toLowerCase();
}

function isPaidRelationship(
  relationship: Relationship,
) {
  if (
    relationship.paid === true
  ) {
    return true;
  }

  const status =
    normalize(
      relationship.status,
    );

  return (
    status.includes("pag") ||
    status.includes("convert")
  );
}

function isClosedRelationship(
  relationship: Relationship,
) {
  if (
    isPaidRelationship(
      relationship,
    )
  ) {
    return false;
  }

  return normalize(
    relationship.status,
  ).includes(
    "cerr",
  );
}

export function buildAIRelationshipSummary(
  relationship: Relationship,
): AIRelationshipSummary {
  const status =
    normalize(
      relationship.status,
    );

  const notes =
    normalize(
      relationship.notes,
    );

  const reminder =
    normalize(
      relationship.reminder,
    );

  const combined =
    `${status} ${notes} ${reminder}`;

  const nextContactDelta =
    daysUntil(
      relationship.next_contact_at,
    );

  const paid =
    isPaidRelationship(
      relationship,
    );

  const closed =
    isClosedRelationship(
      relationship,
    );

  const interested =
    status.includes("interes") ||
    combined.includes("precio") ||
    combined.includes("info") ||
    combined.includes("quiero") ||
    combined.includes("interesa");

  const noResponse =
    status.includes(
      "sin respuesta",
    );

  const postponed =
    combined.includes("despues") ||
    combined.includes("después") ||
    combined.includes(
      "más adelante",
    ) ||
    combined.includes(
      "mas adelante",
    );

  const overdue =
    nextContactDelta !== null &&
    nextContactDelta < 0;

  const dueToday =
    nextContactDelta === 0;

  if (
    paid
  ) {
    return {
      summary:
        "Relación convertida y registrada como pagada.",

      commercialSignal:
        "La conversión ya está confirmada dentro de Relaciones.",

      risk:
        "Riesgo comercial bajo. La prioridad es mantener continuidad después de la conversión.",

      nextBestStep:
        "Mantener contacto y definir seguimiento post-venta cuando sea relevante.",

      tone:
        "emerald",
    };
  }

  if (
    closed
  ) {
    return {
      summary:
        "La relación está cerrada y ya no requiere presión comercial activa.",

      commercialSignal:
        "No existe una oportunidad activa mientras el estado permanezca cerrado.",

      risk:
        "Reabrir la relación sin una señal nueva puede generar actividad sin intención real.",

      nextBestStep:
        "Mantener la relación fuera del foco hasta que aparezca una nueva señal comercial.",

      tone:
        "slate",
    };
  }

  if (
    overdue
  ) {
    return {
      summary:
        "La relación tiene un seguimiento vencido y necesita atención.",

      commercialSignal:
        interested
          ? "Existe intención comercial registrada, pero el atraso puede reducir continuidad."
          : "La continuidad depende de recuperar el próximo contacto pendiente.",

      risk:
        "Mantener un seguimiento vencido aumenta la probabilidad de perder ritmo comercial.",

      nextBestStep:
        "Contactar hoy y definir una nueva fecha de próximo contacto.",

      tone:
        "red",
    };
  }

  if (
    dueToday
  ) {
    return {
      summary:
        "La relación requiere seguimiento hoy.",

      commercialSignal:
        interested
          ? "Existe interés comercial y el próximo paso ya está previsto para hoy."
          : "La continuidad depende de ejecutar el contacto programado.",

      risk:
        "No ejecutar el contacto puede convertir una acción planificada en atraso.",

      nextBestStep:
        "Realizar el seguimiento hoy y registrar el resultado.",

      tone:
        "amber",
    };
  }

  if (
    interested
  ) {
    return {
      summary:
        "La relación muestra interés comercial activo.",

      commercialSignal:
        "Existe intención visible dentro de Relaciones.",

      risk:
        nextContactDelta === null
          ? "La oportunidad no tiene un próximo contacto definido."
          : "Una demora innecesaria puede reducir la intención comercial.",

      nextBestStep:
        nextContactDelta === null
          ? "Definir un próximo contacto concreto."
          : "Mantener el seguimiento previsto y buscar una decisión clara.",

      tone:
        "amber",
    };
  }

  if (
    noResponse
  ) {
    return {
      summary:
        "La relación está marcada como sin respuesta.",

      commercialSignal:
        "No existe una señal nueva de intención hasta recuperar el contacto.",

      risk:
        "Mantener la relación abierta sin respuesta ni próximo paso puede consumir atención sin generar movimiento.",

      nextBestStep:
        nextContactDelta === null
          ? "Definir un último intento de contacto con fecha concreta."
          : "Ejecutar el próximo contacto previsto y reevaluar después.",

      tone:
        "sky",
    };
  }

  if (
    postponed
  ) {
    return {
      summary:
        "La memoria indica que la relación fue pospuesta.",

      commercialSignal:
        "La oportunidad puede seguir abierta, pero no existe una señal inmediata de decisión.",

      risk:
        "Sin una fecha concreta, la relación puede quedar indefinidamente fuera del foco.",

      nextBestStep:
        nextContactDelta === null
          ? "Definir cuándo volver a contactar."
          : "Mantener la fecha prevista y evitar contacto prematuro.",

      tone:
        "sky",
    };
  }

  if (
    nextContactDelta !== null &&
    nextContactDelta > 0
  ) {
    return {
      summary:
        "La relación tiene seguimiento planificado.",

      commercialSignal:
        "Existe continuidad comercial registrada mediante un próximo contacto.",

      risk:
        "No hay una señal crítica mientras el seguimiento se ejecute en la fecha prevista.",

      nextBestStep:
        "Mantener el próximo contacto y actualizar el contexto después de la interacción.",

      tone:
        "slate",
    };
  }

  return {
    summary:
      "La relación está abierta, pero todavía necesita un próximo paso más claro.",

    commercialSignal:
      "No existe una señal crítica ni una oportunidad explícita registrada.",

    risk:
      "Una relación abierta sin próximo contacto puede perder continuidad.",

    nextBestStep:
      "Actualizar el estado o definir un próximo contacto.",

    tone:
      "slate",
  };
}

export function getAIRelationshipSummaryClasses(
  tone: AIRelationshipSummary["tone"],
) {
  if (
    tone === "emerald"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (
    tone === "amber"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (
    tone === "red"
  ) {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (
    tone === "sky"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}