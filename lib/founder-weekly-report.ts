import type { FounderBriefingRelationship } from "./founder-briefing";

export type WeeklyReportTone = "good" | "warning" | "critical";

export type WeeklyReportItem = {
  id: string;
  title: string;
  description: string;
  tone: WeeklyReportTone;
};

export type WeeklyRevenueMovement = {
  projectedRevenue: number;
  likelyRevenue: number;
  revenueAtRisk: number;
  averageProbability: number;
};

export type WeeklyFounderReport = {
  score: number;
  tone: WeeklyReportTone;

  headline: string;
  summary: string;

  momentum: "Fuerte" | "Estable" | "Débil";
  executionDiscipline: "Alta" | "Media" | "Baja";
  pipelineHealth: "Saludable" | "En observación" | "Crítico";

  totalRelationships: number;
  activeRelationships: number;
  inactiveRelationships: number;

  overdueCount: number;
  ghostingCount: number;
  stalledCount: number;

  weeklyRevenue: WeeklyRevenueMovement;

  topOpportunities: WeeklyReportItem[];
  risks: WeeklyReportItem[];
  recommendations: WeeklyReportItem[];
};

function normalizeDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}

function daysSince(date?: string | null) {
  const parsed = normalizeDate(date);

  if (!parsed) return null;

  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.floor(
    (startOfToday().getTime() - parsed.getTime()) /
      msPerDay
  );
}

function daysUntil(date?: string | null) {
  const parsed = normalizeDate(date);

  if (!parsed) return null;

  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.floor(
    (parsed.getTime() - startOfToday().getTime()) /
      msPerDay
  );
}

function getRelationshipName(
  relationship: FounderBriefingRelationship
) {
  return (
    relationship.nombre ||
    relationship.name ||
    "Relación sin nombre"
  );
}

function getStatus(
  relationship: FounderBriefingRelationship
) {
  return (
    relationship.estado ||
    relationship.status ||
    ""
  )
    .toLowerCase()
    .trim();
}

function getRelationshipValue(
  relationship: FounderBriefingRelationship
) {
  return Number(relationship.monto || 50000);
}

function isWarm(
  relationship: FounderBriefingRelationship
) {
  const status = getStatus(relationship);

  return (
    status.includes("warm") ||
    status.includes("caliente") ||
    status.includes("interesado") ||
    status.includes("proposal") ||
    status.includes("propuesta") ||
    status.includes("lead")
  );
}

function isCold(
  relationship: FounderBriefingRelationship
) {
  const status = getStatus(relationship);

  return (
    status.includes("cold") ||
    status.includes("frio") ||
    status.includes("frío") ||
    status.includes("lost") ||
    status.includes("perdido") ||
    status.includes("cerrado")
  );
}

function buildItem(
  id: string,
  title: string,
  description: string,
  tone: WeeklyReportTone
): WeeklyReportItem {
  return {
    id,
    title,
    description,
    tone,
  };
}

function estimateProbability(
  relationship: FounderBriefingRelationship
) {
  const followUpDelta =
    daysUntil(relationship.proximo_contacto) ??
    daysUntil(relationship.recordatorio);

  const activityDays = daysSince(
    relationship.updated_at ||
      relationship.created_at
  );

  let probability = 35;

  if (isWarm(relationship)) {
    probability += 30;
  }

  if (followUpDelta === 0) {
    probability += 15;
  }

  if (followUpDelta === 1) {
    probability += 10;
  }

  if (
    followUpDelta !== null &&
    followUpDelta < 0
  ) {
    probability -= 20;
  }

  if (
    activityDays !== null &&
    activityDays <= 2
  ) {
    probability += 15;
  }

  if (
    activityDays !== null &&
    activityDays >= 7
  ) {
    probability -= 20;
  }

  if (isCold(relationship)) {
    probability -= 25;
  }

  return Math.max(
    5,
    Math.min(95, probability)
  );
}

function formatGs(value: number) {
  return `Gs. ${value.toLocaleString("es-PY")}`;
}

export function buildWeeklyFounderReport(
  relationships: FounderBriefingRelationship[] = []
): WeeklyFounderReport {
  const totalRelationships =
    relationships.length;

  const inactiveRelationships =
    relationships.filter((relationship) => {
      const days = daysSince(
        relationship.updated_at ||
          relationship.created_at
      );

      return (
        days !== null &&
        days >= 7
      );
    });

  const overdueRelationships =
    relationships.filter((relationship) => {
      const delta =
        daysUntil(
          relationship.proximo_contacto
        ) ??
        daysUntil(
          relationship.recordatorio
        );

      return (
        delta !== null &&
        delta < 0
      );
    });

  const ghostingRelationships =
    relationships.filter((relationship) => {
      const activityDays = daysSince(
        relationship.updated_at ||
          relationship.created_at
      );

      return (
        isWarm(relationship) &&
        activityDays !== null &&
        activityDays >= 5
      );
    });

  const stalledRelationships =
    relationships.filter((relationship) => {
      const activityDays = daysSince(
        relationship.updated_at ||
          relationship.created_at
      );

      return (
        activityDays !== null &&
        activityDays >= 10
      );
    });

  const forecast = relationships.map(
    (relationship) => {
      const probability =
        estimateProbability(relationship);

      const value =
        getRelationshipValue(relationship);

      return {
        relationship,
        probability,
        value,
        expectedValue: Math.round(
          (value * probability) / 100
        ),
      };
    }
  );

  const projectedRevenue =
    forecast.reduce(
      (sum, item) =>
        sum + item.expectedValue,
      0
    );

  const likelyRevenue = forecast
    .filter(
      (item) =>
        item.probability >= 60
    )
    .reduce(
      (sum, item) =>
        sum + item.expectedValue,
      0
    );

  const revenueAtRisk = forecast
    .filter(
      (item) =>
        item.probability <= 35
    )
    .reduce(
      (sum, item) =>
        sum + item.value,
      0
    );

  const averageProbability =
    forecast.length > 0
      ? Math.round(
          forecast.reduce(
            (sum, item) =>
              sum + item.probability,
            0
          ) / forecast.length
        )
      : 0;

  let score = 85;

  score -=
    overdueRelationships.length * 6;

  score -=
    ghostingRelationships.length * 5;

  score -=
    stalledRelationships.length * 4;

  score -=
    inactiveRelationships.length * 3;

  if (likelyRevenue > 0) {
    score += 4;
  }

  score = Math.max(
    0,
    Math.min(100, score)
  );

  const tone: WeeklyReportTone =
    score < 55
      ? "critical"
      : score < 75
        ? "warning"
        : "good";

  const momentum =
    likelyRevenue >= 300000
      ? "Fuerte"
      : likelyRevenue >= 100000
        ? "Estable"
        : "Débil";

  const executionDiscipline =
    overdueRelationships.length >= 5
      ? "Baja"
      : overdueRelationships.length >= 2
        ? "Media"
        : "Alta";

  const pipelineHealth =
    ghostingRelationships.length >= 4 ||
    stalledRelationships.length >= 4
      ? "Crítico"
      : ghostingRelationships.length >= 1 ||
          stalledRelationships.length >= 1
        ? "En observación"
        : "Saludable";

  const topOpportunities: WeeklyReportItem[] = [];
  const risks: WeeklyReportItem[] = [];
  const recommendations: WeeklyReportItem[] = [];

  forecast
    .sort(
      (a, b) =>
        b.expectedValue -
        a.expectedValue
    )
    .slice(0, 3)
    .forEach((item, index) => {
      topOpportunities.push(
        buildItem(
          `opportunity-${index}`,
          getRelationshipName(
            item.relationship
          ),
          `${item.probability}% de probabilidad • ${formatGs(
            item.expectedValue
          )} de ingreso esperado`,
          item.probability >= 70
            ? "good"
            : item.probability >= 45
              ? "warning"
              : "critical"
        )
      );
    });

  if (
    ghostingRelationships.length > 0
  ) {
    risks.push(
      buildItem(
        "ghosting-risk",
        "Riesgo de pérdida de contacto",
        `${ghostingRelationships.length} relación${
          ghostingRelationships.length === 1
            ? ""
            : "es"
        } muestra${
          ghostingRelationships.length === 1
            ? ""
            : "n"
        } señales de pérdida de momentum.`,
        ghostingRelationships.length >= 3
          ? "critical"
          : "warning"
      )
    );
  }

  if (
    overdueRelationships.length > 0
  ) {
    risks.push(
      buildItem(
        "overdue-followups",
        "Seguimientos vencidos detectados",
        `${overdueRelationships.length} seguimiento${
          overdueRelationships.length === 1
            ? ""
            : "s"
        } requiere${
          overdueRelationships.length === 1
            ? ""
            : "n"
        } ejecución inmediata.`,
        overdueRelationships.length >= 5
          ? "critical"
          : "warning"
      )
    );
  }

  if (
    stalledRelationships.length > 0
  ) {
    risks.push(
      buildItem(
        "stalled-pipeline",
        "Oportunidades detenidas en el pipeline",
        `${stalledRelationships.length} oportunidad${
          stalledRelationships.length === 1
            ? ""
            : "es"
        } necesita${
          stalledRelationships.length === 1
            ? ""
            : "n"
        } reactivación o cierre.`,
        stalledRelationships.length >= 3
          ? "critical"
          : "warning"
      )
    );
  }

  if (likelyRevenue > 0) {
    recommendations.push(
      buildItem(
        "protect-revenue",
        "Proteger ingresos de alta probabilidad",
        `Prioriza ${formatGs(
          likelyRevenue
        )} en ingresos probables antes de trabajar relaciones frías.`,
        "good"
      )
    );
  }

  if (
    ghostingRelationships.length > 0
  ) {
    recommendations.push(
      buildItem(
        "recover-ghosting",
        "Recuperar primero relaciones en riesgo",
        "Ejecuta seguimientos rápidos antes de que las oportunidades pierdan más temperatura comercial.",
        ghostingRelationships.length >= 3
          ? "critical"
          : "warning"
      )
    );
  }

  if (
    recommendations.length === 0
  ) {
    recommendations.push(
      buildItem(
        "pipeline-quality",
        "Mejorar calidad del pipeline",
        "Usa esta semana para fortalecer disciplina de seguimiento y claridad comercial por oportunidad.",
        "good"
      )
    );
  }

  const headline =
    tone === "critical"
      ? "La presión operativa semanal es elevada"
      : tone === "warning"
        ? "La semana requiere disciplina comercial"
        : "El momentum comercial se mantiene estable";

  const summary =
    totalRelationships === 0
      ? "ClienteYA necesita datos activos del pipeline para generar inteligencia semanal."
      : `ClienteYA analizó ${totalRelationships} relación${
          totalRelationships === 1
            ? ""
            : "es"
        } y proyecta ${formatGs(
          projectedRevenue
        )} de ingreso ponderado con ${averageProbability}% de probabilidad promedio de conversión.`;

  return {
    score,
    tone,

    headline,
    summary,

    momentum,
    executionDiscipline,
    pipelineHealth,

    totalRelationships,

    activeRelationships:
      totalRelationships -
      inactiveRelationships.length,

    inactiveRelationships:
      inactiveRelationships.length,

    overdueCount:
      overdueRelationships.length,

    ghostingCount:
      ghostingRelationships.length,

    stalledCount:
      stalledRelationships.length,

    weeklyRevenue: {
      projectedRevenue,
      likelyRevenue,
      revenueAtRisk,
      averageProbability,
    },

    topOpportunities,
    risks,
    recommendations,
  };
}