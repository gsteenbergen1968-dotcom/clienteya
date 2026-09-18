import {
  buildSectorKpiVocabulary,
  type SectorKpiTone,
} from "./sector-kpi-engine";
import {
  normalizeBusinessType,
  type BusinessType,
} from "./sector-intelligence";

export type SectorKpiRelationship = {
  id: string;
  name?: string | null;
  status?: string | null;
  phone?: string | null;
  notes?: string | null;
  reminder?: string | null;
  next_contact_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  amount?: number | string | null;
  paid?: boolean | null;
  paid_at?: string | null;
};

export type SectorKpiMetricKey =
  | "relationships"
  | "urgent"
  | "today"
  | "opportunity";

export type SectorKpiMetric = {
  key: SectorKpiMetricKey;
  label: string;
  value: number;
  formattedValue: string;
  description: string;
  tone: SectorKpiTone;
};

export type SectorKpiIntelligenceResult = {
  businessType: BusinessType;
  sectorLabel: string;
  dashboardTitle: string;
  dashboardDescription: string;
  metrics: SectorKpiMetric[];
};

type SectorKpiNormalizedRelationship = {
  id: string;
  name: string | null;
  status: string | null;
  phone: string | null;
  notes: string | null;
  reminder: string | null;
  nextContactAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  amount: number;
  paid: boolean;
  paidAt: string | null;
};

function normalizeText(
  value: string | null | undefined,
) {
  return (value || "")
    .toLowerCase()
    .trim();
}

function todayISO() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function dateDiffInDays(
  dateValue: string | null | undefined,
  today: string,
) {
  if (!dateValue) {
    return null;
  }

  const target = new Date(
    `${dateValue.slice(0, 10)}T00:00:00`,
  );

  const current = new Date(
    `${today}T00:00:00`,
  );

  if (
    Number.isNaN(target.getTime()) ||
    Number.isNaN(current.getTime())
  ) {
    return null;
  }

  return Math.round(
    (
      target.getTime() -
      current.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function daysSince(
  dateValue: string | null | undefined,
  today: string,
) {
  const diff =
    dateDiffInDays(
      dateValue,
      today,
    );

  if (
    typeof diff !== "number"
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.abs(diff),
  );
}

function hasOpenValue(
  relationship: SectorKpiNormalizedRelationship,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  return (
    relationship.amount > 0 &&
    !relationship.paid &&
    !status.includes("pag")
  );
}

function isPaid(
  relationship: SectorKpiNormalizedRelationship,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  return Boolean(
    relationship.paid ||
      status.includes("pag") ||
      status.includes("convert"),
  );
}

function isClosed(
  relationship: SectorKpiNormalizedRelationship,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("cerr") ||
    status.includes("perdido") ||
    status.includes("cancel")
  );
}

function isInterested(
  relationship: SectorKpiNormalizedRelationship,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("interes") ||
    status.includes("propuesta") ||
    status.includes("cotiz") ||
    status.includes("visita") ||
    status.includes("consulta")
  );
}

function isContacted(
  relationship: SectorKpiNormalizedRelationship,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("contact") ||
    status.includes("seguimiento") ||
    status.includes("reun") ||
    status.includes("llamada")
  );
}

function isNoResponse(
  relationship: SectorKpiNormalizedRelationship,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  return (
    status.includes("sin") ||
    status.includes("ghost") ||
    status.includes("no responde") ||
    status.includes("inactivo")
  );
}

function isOverdue(
  relationship: SectorKpiNormalizedRelationship,
  today: string,
) {
  const diff =
    dateDiffInDays(
      relationship.nextContactAt,
      today,
    );

  return (
    typeof diff === "number" &&
    diff < 0
  );
}

function isToday(
  relationship: SectorKpiNormalizedRelationship,
  today: string,
) {
  return Boolean(
    relationship.nextContactAt
      ?.slice(0, 10) === today,
  );
}

function isInactive(
  relationship: SectorKpiNormalizedRelationship,
  today: string,
  thresholdDays = 21,
) {
  const updatedDays =
    daysSince(
      relationship.updatedAt ||
        relationship.createdAt,
      today,
    );

  const nextContactDiff =
    dateDiffInDays(
      relationship.nextContactAt,
      today,
    );

  if (
    isClosed(relationship) ||
    isPaid(relationship)
  ) {
    return false;
  }

  if (
    isNoResponse(relationship)
  ) {
    return true;
  }

  if (
    typeof nextContactDiff ===
      "number" &&
    nextContactDiff < 0
  ) {
    return true;
  }

  if (
    typeof updatedDays ===
      "number" &&
    updatedDays >= thresholdDays
  ) {
    return true;
  }

  return false;
}

function countBy(
  relationships:
    SectorKpiNormalizedRelationship[],
  predicate: (
    relationship:
      SectorKpiNormalizedRelationship,
  ) => boolean,
) {
  return relationships.filter(
    predicate,
  ).length;
}

function sumOpenValue(
  relationships:
    SectorKpiNormalizedRelationship[],
) {
  return relationships.reduce(
    (
      sum,
      relationship,
    ) => {
      if (
        !hasOpenValue(
          relationship,
        )
      ) {
        return sum;
      }

      return (
        sum +
        relationship.amount
      );
    },
    0,
  );
}

function formatGs(
  value: number,
) {
  return `Gs.\u00A0${Number(
    value || 0,
  ).toLocaleString("es-PY")}`;
}

function getDefinition(
  vocabulary:
    ReturnType<
      typeof buildSectorKpiVocabulary
    >,
  key: SectorKpiMetricKey,
) {
  const legacyVocabularyKey =
    key === "relationships"
      ? "clients"
      : key;

  return (
    vocabulary.kpis.find(
      (kpi) =>
        String(kpi.key) ===
        legacyVocabularyKey,
    ) || {
      key,
      label:
        key === "relationships"
          ? "Relaciones"
          : key,
      description:
        "Métrica comercial.",
      tone:
        "slate" as SectorKpiTone,
    }
  );
}

function buildMetric(
  input: {
    vocabulary:
      ReturnType<
        typeof buildSectorKpiVocabulary
      >;
    key:
      SectorKpiMetricKey;
    value:
      number;
    formattedValue?:
      string;
    toneOverride?:
      SectorKpiTone;
    descriptionOverride?:
      string;
  },
): SectorKpiMetric {
  const definition =
    getDefinition(
      input.vocabulary,
      input.key,
    );

  return {
    key:
      input.key,
    label:
      definition.label,
    value:
      input.value,
    formattedValue:
      input.formattedValue ||
      String(input.value),
    description:
      input.descriptionOverride ||
      definition.description,
    tone:
      input.toneOverride ||
      definition.tone,
  };
}

type MetricsInput = {
  relationships:
    SectorKpiNormalizedRelationship[];
  today:
    string;
  vocabulary:
    ReturnType<
      typeof buildSectorKpiVocabulary
    >;
};

function buildGenericMetrics(
  input: MetricsInput,
) {
  const activeRelationships =
    countBy(
      input.relationships,
      (relationship) =>
        !isClosed(
          relationship,
        ),
    );

  const urgent =
    countBy(
      input.relationships,
      (relationship) =>
        isOverdue(
          relationship,
          input.today,
        ),
    );

  const todayCount =
    countBy(
      input.relationships,
      (relationship) =>
        isToday(
          relationship,
          input.today,
        ),
    );

  const openValue =
    sumOpenValue(
      input.relationships,
    );

  return [
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "relationships",
      value:
        activeRelationships,
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "urgent",
      value:
        urgent,
      toneOverride:
        urgent > 0
          ? "red"
          : "emerald",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "today",
      value:
        todayCount,
      toneOverride:
        todayCount > 0
          ? "amber"
          : "slate",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "opportunity",
      value:
        openValue,
      formattedValue:
        formatGs(
          openValue,
        ),
      toneOverride:
        openValue > 0
          ? "emerald"
          : "slate",
    }),
  ];
}

function buildConsultingMetrics(
  input: MetricsInput,
) {
  const prospects =
    countBy(
      input.relationships,
      (relationship) =>
        !isClosed(
          relationship,
        ),
    );

  const followups =
    countBy(
      input.relationships,
      (relationship) =>
        isOverdue(
          relationship,
          input.today,
        ),
    );

  const meetings =
    countBy(
      input.relationships,
      (relationship) =>
        isToday(
          relationship,
          input.today,
        ),
    );

  const opportunities =
    sumOpenValue(
      input.relationships.filter(
        (relationship) =>
          !isClosed(
            relationship,
          ),
      ),
    );

  return [
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "relationships",
      value:
        prospects,
      descriptionOverride:
        "Prospectos activos o relaciones comerciales todavía abiertas.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "urgent",
      value:
        followups,
      toneOverride:
        followups > 0
          ? "red"
          : "emerald",
      descriptionOverride:
        "Seguimientos vencidos que pueden enfriar una oportunidad profesional.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "today",
      value:
        meetings,
      toneOverride:
        meetings > 0
          ? "amber"
          : "slate",
      descriptionOverride:
        "Reuniones, llamadas o contactos que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "opportunity",
      value:
        opportunities,
      formattedValue:
        formatGs(
          opportunities,
        ),
      toneOverride:
        opportunities > 0
          ? "emerald"
          : "slate",
      descriptionOverride:
        "Valor potencial de proyectos, propuestas o servicios abiertos.",
    }),
  ];
}

function buildFitnessMetrics(
  input: MetricsInput,
) {
  const members =
    countBy(
      input.relationships,
      (relationship) =>
        !isClosed(
          relationship,
        ),
    );

  const inactive =
    countBy(
      input.relationships,
      (relationship) =>
        isInactive(
          relationship,
          input.today,
          21,
        ),
    );

  const renewals =
    countBy(
      input.relationships,
      (relationship) =>
        isToday(
          relationship,
          input.today,
        ),
    );

  const abandonmentRisk =
    countBy(
      input.relationships,
      (relationship) => {
        if (
          isClosed(
            relationship,
          ) ||
          isPaid(
            relationship,
          )
        ) {
          return false;
        }

        return (
          isInactive(
            relationship,
            input.today,
            21,
          ) ||
          isNoResponse(
            relationship,
          ) ||
          isOverdue(
            relationship,
            input.today,
          )
        );
      },
    );

  return [
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "relationships",
      value:
        members,
      descriptionOverride:
        "Miembros y prospectos activos dentro de la memoria comercial.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "urgent",
      value:
        inactive,
      toneOverride:
        inactive > 0
          ? "red"
          : "emerald",
      descriptionOverride:
        "Miembros o prospectos que muestran señales de inactividad.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "today",
      value:
        renewals,
      toneOverride:
        renewals > 0
          ? "amber"
          : "slate",
      descriptionOverride:
        "Renovaciones, seguimientos o sesiones que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "opportunity",
      value:
        abandonmentRisk,
      toneOverride:
        abandonmentRisk > 0
          ? "red"
          : "emerald",
      descriptionOverride:
        "Personas con riesgo de abandonar si no reciben seguimiento.",
    }),
  ];
}

function buildRealEstateMetrics(
  input: MetricsInput,
) {
  const interested =
    countBy(
      input.relationships,
      (relationship) => {
        if (
          isClosed(
            relationship,
          )
        ) {
          return false;
        }

        return (
          isInterested(
            relationship,
          ) ||
          isContacted(
            relationship,
          ) ||
          !isPaid(
            relationship,
          )
        );
      },
    );

  const visits =
    countBy(
      input.relationships,
      (relationship) =>
        isToday(
          relationship,
          input.today,
        ),
    );

  const properties =
    countBy(
      input.relationships,
      (relationship) => {
        if (
          isClosed(
            relationship,
          ) ||
          isPaid(
            relationship,
          )
        ) {
          return false;
        }

        return (
          isInterested(
            relationship,
          ) ||
          hasOpenValue(
            relationship,
          )
        );
      },
    );

  const closings =
    sumOpenValue(
      input.relationships.filter(
        (relationship) =>
          !isClosed(
            relationship,
          ) &&
          (
            isInterested(
              relationship,
            ) ||
            hasOpenValue(
              relationship,
            )
          ),
      ),
    );

  return [
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "relationships",
      value:
        interested,
      descriptionOverride:
        "Interesados activos en propiedades, visitas o consultas inmobiliarias.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "urgent",
      value:
        visits,
      toneOverride:
        visits > 0
          ? "red"
          : "slate",
      descriptionOverride:
        "Visitas o seguimientos inmobiliarios que necesitan atención inmediata.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "today",
      value:
        properties,
      toneOverride:
        properties > 0
          ? "amber"
          : "slate",
      descriptionOverride:
        "Propiedades, consultas o expedientes comerciales abiertos.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "opportunity",
      value:
        closings,
      formattedValue:
        formatGs(
          closings,
        ),
      toneOverride:
        closings > 0
          ? "emerald"
          : "slate",
      descriptionOverride:
        "Valor potencial de cierres u operaciones inmobiliarias abiertas.",
    }),
  ];
}

function buildRestaurantMetrics(
  input: MetricsInput,
) {
  const relationships =
    countBy(
      input.relationships,
      (relationship) =>
        !isClosed(
          relationship,
        ),
    );

  const reactivations =
    countBy(
      input.relationships,
      (relationship) =>
        isInactive(
          relationship,
          input.today,
          14,
        ),
    );

  const reservations =
    countBy(
      input.relationships,
      (relationship) =>
        isToday(
          relationship,
          input.today,
        ),
    );

  const revenue =
    sumOpenValue(
      input.relationships,
    );

  return [
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "relationships",
      value:
        relationships,
      descriptionOverride:
        "Relaciones registradas con vínculo comercial activo o recuperable.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "urgent",
      value:
        reactivations,
      toneOverride:
        reactivations > 0
          ? "red"
          : "emerald",
      descriptionOverride:
        "Relaciones ausentes que pueden volver con una invitación simple.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "today",
      value:
        reservations,
      toneOverride:
        reservations > 0
          ? "amber"
          : "slate",
      descriptionOverride:
        "Reservas, pedidos o seguimientos que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "opportunity",
      value:
        revenue,
      formattedValue:
        formatGs(
          revenue,
        ),
      toneOverride:
        revenue > 0
          ? "emerald"
          : "slate",
      descriptionOverride:
        "Valor potencial de pedidos, visitas o recompras abiertas.",
    }),
  ];
}

function buildRetailMetrics(
  input: MetricsInput,
) {
  const buyers =
    countBy(
      input.relationships,
      (relationship) =>
        !isClosed(
          relationship,
        ),
    );

  const repurchases =
    countBy(
      input.relationships,
      (relationship) =>
        isInactive(
          relationship,
          input.today,
          21,
        ),
    );

  const followups =
    countBy(
      input.relationships,
      (relationship) =>
        isToday(
          relationship,
          input.today,
        ),
    );

  const sales =
    sumOpenValue(
      input.relationships,
    );

  return [
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "relationships",
      value:
        buyers,
      descriptionOverride:
        "Relaciones registradas con potencial comercial.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "urgent",
      value:
        repurchases,
      toneOverride:
        repurchases > 0
          ? "red"
          : "emerald",
      descriptionOverride:
        "Relaciones que pueden volver a comprar con seguimiento oportuno.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "today",
      value:
        followups,
      toneOverride:
        followups > 0
          ? "amber"
          : "slate",
      descriptionOverride:
        "Pedidos, consultas o seguimientos que requieren acción hoy.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "opportunity",
      value:
        sales,
      formattedValue:
        formatGs(
          sales,
        ),
      toneOverride:
        sales > 0
          ? "emerald"
          : "slate",
      descriptionOverride:
        "Valor potencial de ventas o pedidos abiertos.",
    }),
  ];
}

function buildBeautyMetrics(
  input: MetricsInput,
) {
  const relationships =
    countBy(
      input.relationships,
      (relationship) =>
        !isClosed(
          relationship,
        ),
    );

  const withoutAppointment =
    countBy(
      input.relationships,
      (relationship) =>
        isInactive(
          relationship,
          input.today,
          21,
        ),
    );

  const reservations =
    countBy(
      input.relationships,
      (relationship) =>
        isToday(
          relationship,
          input.today,
        ),
    );

  const repurchaseValue =
    sumOpenValue(
      input.relationships,
    );

  return [
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "relationships",
      value:
        relationships,
      descriptionOverride:
        "Relaciones activas o recuperables para nuevas citas o servicios.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "urgent",
      value:
        withoutAppointment,
      toneOverride:
        withoutAppointment > 0
          ? "red"
          : "emerald",
      descriptionOverride:
        "Relaciones sin cita reciente que pueden volver con una invitación.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "today",
      value:
        reservations,
      toneOverride:
        reservations > 0
          ? "amber"
          : "slate",
      descriptionOverride:
        "Reservas, citas o seguimientos que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "opportunity",
      value:
        repurchaseValue,
      formattedValue:
        formatGs(
          repurchaseValue,
        ),
      toneOverride:
        repurchaseValue > 0
          ? "emerald"
          : "slate",
      descriptionOverride:
        "Valor potencial de nuevas citas, productos o servicios abiertos.",
    }),
  ];
}

function buildAutomotiveMetrics(
  input: MetricsInput,
) {
  const interested =
    countBy(
      input.relationships,
      (relationship) =>
        !isClosed(
          relationship,
        ),
    );

  const quotes =
    countBy(
      input.relationships,
      (relationship) =>
        isOverdue(
          relationship,
          input.today,
        ),
    );

  const tests =
    countBy(
      input.relationships,
      (relationship) =>
        isToday(
          relationship,
          input.today,
        ),
    );

  const sales =
    sumOpenValue(
      input.relationships,
    );

  return [
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "relationships",
      value:
        interested,
      descriptionOverride:
        "Relaciones con interés en vehículo, servicio o cotización.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "urgent",
      value:
        quotes,
      toneOverride:
        quotes > 0
          ? "red"
          : "emerald",
      descriptionOverride:
        "Cotizaciones o conversaciones que requieren seguimiento urgente.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "today",
      value:
        tests,
      toneOverride:
        tests > 0
          ? "amber"
          : "slate",
      descriptionOverride:
        "Pruebas, llamadas o seguimientos que requieren acción hoy.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "opportunity",
      value:
        sales,
      formattedValue:
        formatGs(
          sales,
        ),
      toneOverride:
        sales > 0
          ? "emerald"
          : "slate",
      descriptionOverride:
        "Valor potencial de ventas o servicios abiertos.",
    }),
  ];
}

function buildMedicalMetrics(
  input: MetricsInput,
) {
  const patients =
    countBy(
      input.relationships,
      (relationship) =>
        !isClosed(
          relationship,
        ),
    );

  const pending =
    countBy(
      input.relationships,
      (relationship) =>
        isOverdue(
          relationship,
          input.today,
        ),
    );

  const consultations =
    countBy(
      input.relationships,
      (relationship) =>
        isToday(
          relationship,
          input.today,
        ),
    );

  const continuity =
    countBy(
      input.relationships,
      (relationship) => {
        if (
          isClosed(
            relationship,
          )
        ) {
          return false;
        }

        return (
          isPaid(
            relationship,
          ) ||
          Boolean(
            relationship.nextContactAt,
          )
        );
      },
    );

  return [
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "relationships",
      value:
        patients,
      descriptionOverride:
        "Pacientes o contactos registrados con seguimiento activo.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "urgent",
      value:
        pending,
      toneOverride:
        pending > 0
          ? "red"
          : "emerald",
      descriptionOverride:
        "Pacientes que necesitan seguimiento pendiente o confirmación.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "today",
      value:
        consultations,
      toneOverride:
        consultations > 0
          ? "amber"
          : "slate",
      descriptionOverride:
        "Consultas, controles o contactos que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "opportunity",
      value:
        continuity,
      toneOverride:
        continuity > 0
          ? "emerald"
          : "slate",
      descriptionOverride:
        "Relaciones con continuidad clínica o seguimiento activo.",
    }),
  ];
}

function buildEducationMetrics(
  input: MetricsInput,
) {
  const students =
    countBy(
      input.relationships,
      (relationship) =>
        !isClosed(
          relationship,
        ),
    );

  const registrations =
    countBy(
      input.relationships,
      (relationship) =>
        isInterested(
          relationship,
        ) ||
        isOverdue(
          relationship,
          input.today,
        ),
    );

  const followups =
    countBy(
      input.relationships,
      (relationship) =>
        isToday(
          relationship,
          input.today,
        ),
    );

  const opportunities =
    sumOpenValue(
      input.relationships,
    );

  return [
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "relationships",
      value:
        students,
      descriptionOverride:
        "Alumnos, prospectos o interesados registrados.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "urgent",
      value:
        registrations,
      toneOverride:
        registrations > 0
          ? "red"
          : "emerald",
      descriptionOverride:
        "Interesados que pueden avanzar a inscripción con seguimiento.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "today",
      value:
        followups,
      toneOverride:
        followups > 0
          ? "amber"
          : "slate",
      descriptionOverride:
        "Contactos académicos que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary:
        input.vocabulary,
      key:
        "opportunity",
      value:
        opportunities,
      formattedValue:
        formatGs(
          opportunities,
        ),
      toneOverride:
        opportunities > 0
          ? "emerald"
          : "slate",
      descriptionOverride:
        "Valor potencial de inscripciones, cursos o continuidad.",
    }),
  ];
}

function normalizeRelationship(
  relationship:
    SectorKpiRelationship,
): SectorKpiNormalizedRelationship {
  const status =
    normalizeText(
      relationship.status,
    );

  const amount = Number(
    relationship.amount ?? 0,
  );

  return {
    id:
      relationship.id,
    name:
      relationship.name ||
      null,
    status:
      relationship.status ||
      null,
    phone:
      relationship.phone ||
      null,
    notes:
      relationship.notes ||
      null,
    reminder:
      relationship.reminder ||
      null,
    nextContactAt:
      relationship.next_contact_at ||
      null,
    createdAt:
      relationship.created_at ||
      null,
    updatedAt:
      relationship.updated_at ||
      null,
    amount:
      Number.isFinite(amount)
        ? amount
        : 0,
    paid:
      relationship.paid === true ||
      status.includes("pag") ||
      status.includes("convert"),
    paidAt:
      relationship.paid_at ||
      null,
  };
}

export function buildSectorKpiIntelligence(
  input: {
    relationships:
      SectorKpiRelationship[];
    businessType?:
      string | null;
    today?:
      string;
  },
): SectorKpiIntelligenceResult {
  const today =
    input.today ||
    todayISO();

  const businessType =
    normalizeBusinessType(
      input.businessType,
    );

  const vocabulary =
    buildSectorKpiVocabulary(
      businessType,
    );

  const baseInput: MetricsInput = {
    relationships:
      (
        input.relationships ||
        []
      ).map(
        normalizeRelationship,
      ),
    today,
    vocabulary,
  };

  let metrics:
    SectorKpiMetric[];

  if (
    businessType ===
    "restaurant"
  ) {
    metrics =
      buildRestaurantMetrics(
        baseInput,
      );
  } else if (
    businessType ===
    "fitness"
  ) {
    metrics =
      buildFitnessMetrics(
        baseInput,
      );
  } else if (
    businessType ===
    "real_estate"
  ) {
    metrics =
      buildRealEstateMetrics(
        baseInput,
      );
  } else if (
    businessType ===
    "retail"
  ) {
    metrics =
      buildRetailMetrics(
        baseInput,
      );
  } else if (
    businessType ===
    "beauty"
  ) {
    metrics =
      buildBeautyMetrics(
        baseInput,
      );
  } else if (
    businessType ===
    "automotive"
  ) {
    metrics =
      buildAutomotiveMetrics(
        baseInput,
      );
  } else if (
    businessType ===
    "medical"
  ) {
    metrics =
      buildMedicalMetrics(
        baseInput,
      );
  } else if (
    businessType ===
    "education"
  ) {
    metrics =
      buildEducationMetrics(
        baseInput,
      );
  } else if (
    businessType ===
      "consulting" ||
    businessType ===
      "services"
  ) {
    metrics =
      buildConsultingMetrics(
        baseInput,
      );
  } else {
    metrics =
      buildGenericMetrics(
        baseInput,
      );
  }

  return {
    businessType,
    sectorLabel:
      vocabulary.sectorLabel,
    dashboardTitle:
      vocabulary.dashboardTitle,
    dashboardDescription:
      vocabulary.dashboardDescription,
    metrics,
  };
}