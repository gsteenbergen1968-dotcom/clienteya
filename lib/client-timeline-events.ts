export type RelationshipTimelineEventType =
  | "created"
  | "status"
  | "followup"
  | "payment"
  | "note"
  | "risk"
  | "opportunity";

export type RelationshipTimelineEventTone =
  | "slate"
  | "blue"
  | "amber"
  | "emerald"
  | "red"
  | "violet";

export type RelationshipTimelineEvent = {
  id: string;
  relationshipId: string;
  title: string;
  description: string;
  type: RelationshipTimelineEventType;
  tone: RelationshipTimelineEventTone;
  date?: string | null;
};

export type RelationshipForTimeline = {
  id: string;
  nombre?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

function normalize(
  value: string | null | undefined,
) {
  return (value || "")
    .toLowerCase()
    .trim();
}

function formatGs(
  value: number,
) {
  return `Gs.\u00A0${value.toLocaleString(
    "es-PY",
  )}`;
}

function formatDate(
  value: string | null | undefined,
) {
  if (!value) {
    return "sin fecha";
  }

  const [
    year,
    month,
    day,
  ] = value
    .slice(0, 10)
    .split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function isRiskSignal(
  relationship: RelationshipForTimeline,
) {
  const estado =
    normalize(
      relationship.estado,
    );

  const notas =
    normalize(
      relationship.notas,
    );

  return (
    estado.includes(
      "riesgo",
    ) ||
    estado.includes(
      "inactivo",
    ) ||
    estado.includes(
      "sin respuesta",
    ) ||
    notas.includes(
      "no responde",
    ) ||
    notas.includes(
      "problema",
    ) ||
    notas.includes(
      "cancelar",
    )
  );
}

function isOpportunitySignal(
  relationship: RelationshipForTimeline,
) {
  const estado =
    normalize(
      relationship.estado,
    );

  const notas =
    normalize(
      relationship.notas,
    );

  return (
    estado.includes(
      "interes",
    ) ||
    estado.includes(
      "lead",
    ) ||
    estado.includes(
      "nuevo",
    ) ||
    notas.includes(
      "interesado",
    ) ||
    notas.includes(
      "precio",
    ) ||
    notas.includes(
      "presupuesto",
    ) ||
    notas.includes(
      "cotización",
    ) ||
    notas.includes(
      "cotizacion",
    )
  );
}

export function buildRelationshipTimelineEvents(
  relationship: RelationshipForTimeline,
): RelationshipTimelineEvent[] {
  const events:
    RelationshipTimelineEvent[] = [];

  const name =
    relationship.nombre ||
    "Relación sin nombre";

  if (
    relationship.created_at
  ) {
    events.push({
      id:
        `created-${relationship.id}`,

      relationshipId:
        relationship.id,

      title:
        "Relación creada",

      description:
        `${name} fue agregada al sistema el ${formatDate(
          relationship.created_at,
        )}.`,

      type:
        "created",

      tone:
        "slate",

      date:
        relationship.created_at,
    });
  }

  if (
    relationship.estado
  ) {
    events.push({
      id:
        `status-${relationship.id}`,

      relationshipId:
        relationship.id,

      title:
        "Estado comercial actual",

      description:
        `Estado actual: ${relationship.estado}.`,

      type:
        "status",

      tone:
        relationship.pagado
          ? "emerald"
          : "blue",

      date:
        relationship.updated_at ||
        relationship.created_at,
    });
  }

  if (
    relationship.notas
  ) {
    events.push({
      id:
        `note-${relationship.id}`,

      relationshipId:
        relationship.id,

      title:
        "Contexto comercial registrado",

      description:
        relationship.notas,

      type:
        "note",

      tone:
        "violet",

      date:
        relationship.updated_at ||
        relationship.created_at,
    });
  }

  if (
    relationship.proximo_contacto ||
    relationship.recordatorio
  ) {
    const date =
      relationship.proximo_contacto ||
      relationship.recordatorio;

    events.push({
      id:
        `followup-${relationship.id}`,

      relationshipId:
        relationship.id,

      title:
        "Seguimiento planificado",

      description:
        `Próximo contacto programado para ${formatDate(
          date,
        )}.`,

      type:
        "followup",

      tone:
        "amber",

      date,
    });
  }

  if (
    relationship.pagado ||
    relationship.fecha_pago
  ) {
    events.push({
      id:
        `payment-${relationship.id}`,

      relationshipId:
        relationship.id,

      title:
        "Pago detectado",

      description:
        `Pago registrado${
          relationship.monto
            ? ` por ${formatGs(
                Number(
                  relationship.monto,
                ),
              )}`
            : ""
        }.`,

      type:
        "payment",

      tone:
        "emerald",

      date:
        relationship.fecha_pago ||
        relationship.updated_at ||
        relationship.created_at,
    });
  }

  if (
    isRiskSignal(
      relationship,
    )
  ) {
    events.push({
      id:
        `risk-${relationship.id}`,

      relationshipId:
        relationship.id,

      title:
        "Señal de riesgo detectada",

      description:
        "ClienteYA detectó señales de baja respuesta, inactividad o posible pérdida.",

      type:
        "risk",

      tone:
        "red",

      date:
        relationship.updated_at ||
        relationship.created_at,
    });
  }

  if (
    isOpportunitySignal(
      relationship,
    )
  ) {
    events.push({
      id:
        `opportunity-${relationship.id}`,

      relationshipId:
        relationship.id,

      title:
        "Oportunidad comercial detectada",

      description:
        "ClienteYA detectó señales de interés, presupuesto o avance comercial.",

      type:
        "opportunity",

      tone:
        "emerald",

      date:
        relationship.updated_at ||
        relationship.created_at,
    });
  }

  return events.sort(
    (
      a,
      b,
    ) => {
      const aTime =
        a.date
          ? new Date(
              a.date,
            ).getTime()
          : 0;

      const bTime =
        b.date
          ? new Date(
              b.date,
            ).getTime()
          : 0;

      return (
        bTime -
        aTime
      );
    },
  );
}

export function buildRelationshipTimelineSummary(
  relationship: RelationshipForTimeline,
) {
  const timeline =
    buildRelationshipTimelineEvents(
      relationship,
    );

  const hasRisk =
    timeline.some(
      (
        event,
      ) =>
        event.type ===
        "risk",
    );

  const hasOpportunity =
    timeline.some(
      (
        event,
      ) =>
        event.type ===
        "opportunity",
    );

  const hasPayment =
    timeline.some(
      (
        event,
      ) =>
        event.type ===
        "payment",
    );

  let headline =
    "Relación comercial en seguimiento";

  let recommendation =
    "Mantener seguimiento comercial claro y consistente.";

  if (
    hasRisk
  ) {
    headline =
      "Relación con riesgo comercial";

    recommendation =
      "Priorizar contacto humano y resolver posibles bloqueos de la relación.";
  } else if (
    hasOpportunity
  ) {
    headline =
      "Relación con oportunidad activa";

    recommendation =
      "Avanzar la conversación con una propuesta concreta o próximo paso.";
  } else if (
    hasPayment
  ) {
    headline =
      "Relación convertida";

    recommendation =
      "Mantener la relación activa para recompra, referidos o continuidad.";
  }

  return {
    headline,
    recommendation,
    eventCount:
      timeline.length,
    timeline,
  };
}

export function getRelationshipTimelineToneClasses(
  tone: RelationshipTimelineEventTone,
) {
  if (
    tone === "blue"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (
    tone === "amber"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (
    tone === "emerald"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (
    tone === "red"
  ) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (
    tone === "violet"
  ) {
    return "border-violet-200 bg-violet-50 text-violet-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}