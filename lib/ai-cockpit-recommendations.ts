import type { RelationshipForAICockpit } from "./ai-cockpit";

export type AICockpitRecommendationPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export type AICockpitRecommendationCategory =
  | "sales"
  | "retention"
  | "operations"
  | "revenue"
  | "followup";

export type AICockpitRecommendation = {
  id: string;
  title: string;
  description: string;
  priority: AICockpitRecommendationPriority;
  category: AICockpitRecommendationCategory;
};

type RelationshipSignals = {
  status: string;
  notes: string;
  nextContactAt: string | null;
  paid: boolean;
};

function normalize(
  value: unknown,
) {
  return String(
    value ?? "",
  )
    .toLowerCase()
    .trim();
}

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

function toRecord(
  relationship: RelationshipForAICockpit,
) {
  return relationship as unknown as Record<
    string,
    unknown
  >;
}

function getString(
  record: Record<string, unknown>,
  key: string,
) {
  const value =
    record[key];

  return typeof value === "string"
    ? value
    : null;
}

function getBoolean(
  record: Record<string, unknown>,
  key: string,
) {
  const value =
    record[key];

  return typeof value === "boolean"
    ? value
    : null;
}

function getRelationshipSignals(
  relationship: RelationshipForAICockpit,
): RelationshipSignals {
  const record =
    toRecord(
      relationship,
    );

  const status =
    normalize(
      getString(
        record,
        "status",
      ),
    );

  const notes =
    normalize(
      getString(
        record,
        "notes",
      ),
    );

  const nextContactAt =
    getString(
      record,
      "next_contact_at",
    );

  const explicitPaid =
    getBoolean(
      record,
      "paid",
    );

  const paid =
    explicitPaid === true ||
    status.includes("pag") ||
    status.includes("convert");

  return {
    status,
    notes,
    nextContactAt,
    paid,
  };
}

function isClosed(
  signals: RelationshipSignals,
) {
  return (
    !signals.paid &&
    signals.status.includes(
      "cerr",
    )
  );
}

function isInterested(
  signals: RelationshipSignals,
) {
  return (
    !signals.paid &&
    !isClosed(signals) &&
    signals.status.includes(
      "interes",
    )
  );
}

function isNoResponse(
  signals: RelationshipSignals,
) {
  return (
    !signals.paid &&
    !isClosed(signals) &&
    (
      signals.status.includes(
        "sin respuesta",
      ) ||
      signals.notes.includes(
        "no responde",
      )
    )
  );
}

export function buildAICockpitRecommendations(
  relationships: RelationshipForAICockpit[],
): AICockpitRecommendation[] {
  const recommendations:
    AICockpitRecommendation[] = [];

  const safeRelationships =
    Array.isArray(
      relationships,
    )
      ? relationships
      : [];

  const signals =
    safeRelationships.map(
      getRelationshipSignals,
    );

  const overdueRelationships =
    signals.filter(
      (
        relationship,
      ) => {
        if (
          relationship.paid ||
          isClosed(
            relationship,
          )
        ) {
          return false;
        }

        const days =
          daysUntil(
            relationship.nextContactAt,
          );

        return (
          typeof days === "number" &&
          days < 0
        );
      },
    );

  const dueTodayRelationships =
    signals.filter(
      (
        relationship,
      ) => {
        if (
          relationship.paid ||
          isClosed(
            relationship,
          )
        ) {
          return false;
        }

        return (
          daysUntil(
            relationship.nextContactAt,
          ) === 0
        );
      },
    );

  const dueSoonRelationships =
    signals.filter(
      (
        relationship,
      ) => {
        if (
          relationship.paid ||
          isClosed(
            relationship,
          )
        ) {
          return false;
        }

        const days =
          daysUntil(
            relationship.nextContactAt,
          );

        return (
          typeof days === "number" &&
          days > 0 &&
          days <= 3
        );
      },
    );

  const interestedRelationships =
    signals.filter(
      isInterested,
    );

  const noResponseRelationships =
    signals.filter(
      isNoResponse,
    );

  const paidRelationships =
    signals.filter(
      (
        relationship,
      ) =>
        relationship.paid,
    );

  if (
    overdueRelationships.length >
    0
  ) {
    recommendations.push({
      id:
        "overdue-followups",

      title:
        "Resolver seguimientos atrasados",

      description:
        `${overdueRelationships.length} relación(es) superaron su fecha de seguimiento y requieren atención hoy.`,

      priority:
        overdueRelationships.length >= 3
          ? "urgent"
          : "high",

      category:
        "followup",
    });
  }

  if (
    dueTodayRelationships.length >
    0
  ) {
    recommendations.push({
      id:
        "today-followups",

      title:
        "Completar seguimientos de hoy",

      description:
        `${dueTodayRelationships.length} relación(es) tienen contacto programado para hoy.`,

      priority:
        overdueRelationships.length > 0
          ? "high"
          : "medium",

      category:
        "followup",
    });
  }

  if (
    interestedRelationships.length >
    0
  ) {
    recommendations.push({
      id:
        "active-opportunities",

      title:
        "Convertir oportunidades activas",

      description:
        `${interestedRelationships.length} relación(es) están marcadas como interesadas y necesitan un próximo paso claro.`,

      priority:
        interestedRelationships.length >= 3
          ? "high"
          : "medium",

      category:
        "sales",
    });
  }

  if (
    noResponseRelationships.length >
    0
  ) {
    recommendations.push({
      id:
        "recover-no-response",

      title:
        "Recuperar relaciones sin respuesta",

      description:
        `${noResponseRelationships.length} relación(es) necesitan un nuevo intento de contacto o una decisión de cierre.`,

      priority:
        noResponseRelationships.length >= 3
          ? "high"
          : "medium",

      category:
        "retention",
    });
  }

  if (
    dueSoonRelationships.length >
    0
  ) {
    recommendations.push({
      id:
        "prepare-upcoming-followups",

      title:
        "Preparar próximos contactos",

      description:
        `${dueSoonRelationships.length} relación(es) requieren seguimiento durante los próximos 3 días.`,

      priority:
        "medium",

      category:
        "followup",
    });
  }

  if (
    paidRelationships.length >
    0 &&
    overdueRelationships.length === 0 &&
    noResponseRelationships.length === 0
  ) {
    recommendations.push({
      id:
        "protect-converted-relationships",

      title:
        "Mantener relaciones convertidas",

      description:
        `${paidRelationships.length} relación(es) están marcadas como pagadas. Mantén continuidad post-venta cuando sea relevante.`,

      priority:
        "low",

      category:
        "retention",
    });
  }

  if (
    safeRelationships.length >= 10 &&
    overdueRelationships.length === 0
  ) {
    recommendations.push({
      id:
        "operations-scale",

      title:
        "Mantener disciplina operativa",

      description:
        "La base de relaciones está creciendo. Protege próximos contactos y evita acumular seguimientos vencidos.",

      priority:
        "low",

      category:
        "operations",
    });
  }

  if (
    recommendations.length === 0
  ) {
    recommendations.push({
      id:
        "healthy",

      title:
        "Operación comercial bajo control",

      description:
        "No se detectaron seguimientos vencidos, relaciones sin respuesta ni oportunidades que requieran intervención inmediata.",

      priority:
        "low",

      category:
        "operations",
    });
  }

  return recommendations.slice(
    0,
    5,
  );
}

export function getAICockpitRecommendationPriorityLabel(
  priority: AICockpitRecommendationPriority,
) {
  if (
    priority === "urgent"
  ) {
    return "Urgente";
  }

  if (
    priority === "high"
  ) {
    return "Alta";
  }

  if (
    priority === "medium"
  ) {
    return "Media";
  }

  return "Baja";
}

export function getAICockpitRecommendationCategoryLabel(
  category: AICockpitRecommendationCategory,
) {
  if (
    category === "sales"
  ) {
    return "Ventas";
  }

  if (
    category === "retention"
  ) {
    return "Retención";
  }

  if (
    category === "operations"
  ) {
    return "Operaciones";
  }

  if (
    category === "revenue"
  ) {
    return "Ingresos";
  }

  return "Seguimiento";
}