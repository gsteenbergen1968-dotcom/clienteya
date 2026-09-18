export type FounderBriefingTone = "good" | "warning" | "critical";

export type FounderBriefingRelationship = {
  id?: string | number;
  nombre?: string | null;
  name?: string | null;
  telefono?: string | null;
  phone?: string | null;
  estado?: string | null;
  status?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
};

export type FounderBriefingItem = {
  id: string;
  title: string;
  description: string;
  tone: FounderBriefingTone;
};

export type PipelineRiskItem = {
  id: string;
  relationshipName: string;
  riskType: "ghosting" | "stalled" | "hot" | "revenue";
  title: string;
  description: string;
  tone: FounderBriefingTone;
  value?: number;
};

export type RevenueForecastItem = {
  id: string;
  relationshipName: string;
  probability: number;
  expectedValue: number;
  pipelineValue: number;
  category: "hot" | "likely" | "delayed" | "risk";
  title: string;
  description: string;
  tone: FounderBriefingTone;
};

export type FounderBriefing = {
  score: number;
  tone: FounderBriefingTone;
  headline: string;
  summary: string;
  insight: string;
  founderFocus: string;
  statusLabel: string;
  operationalPressure: "Baja" | "Media" | "Alta";
  commercialMomentum: "Débil" | "Estable" | "Fuerte";
  executionRisk: "Bajo" | "Elevado" | "Crítico";
  riskScore: number;
  revenueAtRisk: number;
  hotLeadCount: number;
  ghostingRiskCount: number;
  stalledCount: number;
  projectedRevenue: number;
  likelyRevenue: number;
  delayedRevenue: number;
  forecastConfidence: "Baja" | "Media" | "Alta";
  averageConversionProbability: number;
  revenueForecast: RevenueForecastItem[];
  pipelineRisks: PipelineRiskItem[];
  priorities: FounderBriefingItem[];
  opportunities: FounderBriefingItem[];
  risks: FounderBriefingItem[];
  recommendations: FounderBriefingItem[];
};

function normalizeDate(value?: string | null): Date | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function startOfToday() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysSince(date?: string | null) {
  const parsed = normalizeDate(date);

  if (!parsed) return null;

  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.floor((startOfToday().getTime() - parsed.getTime()) / msPerDay);
}

function daysUntil(date?: string | null) {
  const parsed = normalizeDate(date);

  if (!parsed) return null;

  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.floor((parsed.getTime() - startOfToday().getTime()) / msPerDay);
}

function getRelationshipName(relationship: FounderBriefingRelationship) {
  return relationship.nombre || relationship.name || "Relación sin nombre";
}

function getStatus(relationship: FounderBriefingRelationship) {
  return (relationship.estado || relationship.status || "").toLowerCase().trim();
}

function getRelationshipValue(relationship: FounderBriefingRelationship) {
  return Number(relationship.monto || 50000);
}

function isPaid(relationship: FounderBriefingRelationship) {
  const status = getStatus(relationship);

  return (
    relationship.pagado === true ||
    status.includes("pagó") ||
    status.includes("pago") ||
    status.includes("pagado")
  );
}

function isWarm(relationship: FounderBriefingRelationship) {
  const status = getStatus(relationship);

  return (
    status.includes("warm") ||
    status.includes("caliente") ||
    status.includes("interesado") ||
    status.includes("interested") ||
    status.includes("propuesta") ||
    status.includes("proposal") ||
    status.includes("lead")
  );
}

function isColdOrLost(relationship: FounderBriefingRelationship) {
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
  tone: FounderBriefingTone
): FounderBriefingItem {
  return {
    id,
    title,
    description,
    tone,
  };
}

function buildPipelineRisk(
  id: string,
  relationshipName: string,
  riskType: PipelineRiskItem["riskType"],
  title: string,
  description: string,
  tone: FounderBriefingTone,
  value?: number
): PipelineRiskItem {
  return {
    id,
    relationshipName,
    riskType,
    title,
    description,
    tone,
    value,
  };
}

function getConversionProbability(
  relationship: FounderBriefingRelationship
) {
  const status = getStatus(relationship);

  const followUpDelta =
    daysUntil(relationship.proximo_contacto) ??
    daysUntil(relationship.recordatorio);

  const lastActivityDays = daysSince(
    relationship.updated_at || relationship.created_at
  );

  let probability = 35;

  if (isPaid(relationship)) probability = 100;
  if (isWarm(relationship)) probability += 25;

  if (status.includes("propuesta") || status.includes("proposal")) {
    probability += 20;
  }

  if (status.includes("contact")) probability += 10;
  if (status.includes("nuevo")) probability += 5;

  if (followUpDelta === 0) probability += 15;
  if (followUpDelta === 1) probability += 10;
  if (followUpDelta !== null && followUpDelta < 0) probability -= 15;
  if (followUpDelta !== null && followUpDelta <= -3) probability -= 10;

  if (lastActivityDays !== null && lastActivityDays <= 2) probability += 15;
  if (lastActivityDays !== null && lastActivityDays >= 7) probability -= 15;
  if (lastActivityDays !== null && lastActivityDays >= 14) probability -= 10;

  if (isColdOrLost(relationship)) probability -= 30;

  return Math.max(5, Math.min(95, probability));
}

function getForecastCategory(
  relationship: FounderBriefingRelationship,
  probability: number
): RevenueForecastItem["category"] {
  const followUpDelta =
    daysUntil(relationship.proximo_contacto) ??
    daysUntil(relationship.recordatorio);

  const lastActivityDays = daysSince(
    relationship.updated_at || relationship.created_at
  );

  if (
    probability >= 75 &&
    (followUpDelta === 0 ||
      followUpDelta === 1 ||
      (lastActivityDays !== null && lastActivityDays <= 2))
  ) {
    return "hot";
  }

  if (probability >= 60) {
    return "likely";
  }

  if (
    probability >= 35 &&
    ((followUpDelta !== null && followUpDelta < 0) ||
      (lastActivityDays !== null && lastActivityDays >= 7))
  ) {
    return "delayed";
  }

  return "risk";
}

function getForecastTone(
  category: RevenueForecastItem["category"]
): FounderBriefingTone {
  if (category === "hot" || category === "likely") {
    return "good";
  }

  if (category === "delayed") {
    return "warning";
  }

  return "critical";
}

function getForecastTitle(category: RevenueForecastItem["category"]) {
  if (category === "hot") return "Alta probabilidad de cierre";
  if (category === "likely") return "Ingreso probable";
  if (category === "delayed") return "Ingreso retrasado";

  return "Ingreso en riesgo";
}

function getForecastDescription(
  category: RevenueForecastItem["category"],
  probability: number
) {
  if (category === "hot") {
    return `Probabilidad estimada de conversión: ${probability}%. Un contacto rápido puede acelerar el cierre.`;
  }

  if (category === "likely") {
    return `Probabilidad estimada de conversión: ${probability}%. Mantén seguimiento comercial disciplinado.`;
  }

  if (category === "delayed") {
    return `Probabilidad estimada de conversión: ${probability}%. La oportunidad sigue viva, pero necesita movimiento.`;
  }

  return `Probabilidad estimada de conversión: ${probability}%. Existe riesgo alto de pérdida si no hay una acción clara.`;
}

function buildRevenueForecastItem(
  relationship: FounderBriefingRelationship
): RevenueForecastItem {
  const probability = getConversionProbability(relationship);
  const pipelineValue = getRelationshipValue(relationship);
  const expectedValue = Math.round((pipelineValue * probability) / 100);
  const category = getForecastCategory(relationship, probability);

  return {
    id: String(
      relationship.id ||
        `${getRelationshipName(relationship)}-${pipelineValue}`
    ),
    relationshipName: getRelationshipName(relationship),
    probability,
    expectedValue,
    pipelineValue,
    category,
    title: getForecastTitle(category),
    description: getForecastDescription(category, probability),
    tone: getForecastTone(category),
  };
}

function formatGsInternal(value: number) {
  return `Gs. ${value.toLocaleString("es-ES")}`;
}

export function buildFounderBriefing(
  relationships: FounderBriefingRelationship[] = []
): FounderBriefing {
  const totalRelationships = relationships.length;

  const openRelationships = relationships.filter(
    (relationship) => !isPaid(relationship)
  );

  const warmRelationships = openRelationships.filter(isWarm);

  const coldOrLostRelationships = openRelationships.filter(isColdOrLost);

  const overdueFollowUps = openRelationships.filter((relationship) => {
    const followUpDelta =
      daysUntil(relationship.proximo_contacto) ??
      daysUntil(relationship.recordatorio);

    return followUpDelta !== null && followUpDelta < 0;
  });

  const todaysFollowUps = openRelationships.filter((relationship) => {
    const followUpDelta =
      daysUntil(relationship.proximo_contacto) ??
      daysUntil(relationship.recordatorio);

    return followUpDelta === 0;
  });

  const inactiveRelationships = openRelationships.filter((relationship) => {
    const lastActivityDays = daysSince(
      relationship.updated_at || relationship.created_at
    );

    return lastActivityDays !== null && lastActivityDays >= 7;
  });

  const ghostingRiskRelationships = openRelationships.filter(
    (relationship) => {
      const lastActivityDays = daysSince(
        relationship.updated_at || relationship.created_at
      );

      const followUpDelta =
        daysUntil(relationship.proximo_contacto) ??
        daysUntil(relationship.recordatorio);

      return (
        !isColdOrLost(relationship) &&
        ((isWarm(relationship) &&
          lastActivityDays !== null &&
          lastActivityDays >= 5) ||
          (followUpDelta !== null && followUpDelta <= -2))
      );
    }
  );

  const stalledRelationships = openRelationships.filter((relationship) => {
    const lastActivityDays = daysSince(
      relationship.updated_at || relationship.created_at
    );

    const followUpDelta =
      daysUntil(relationship.proximo_contacto) ??
      daysUntil(relationship.recordatorio);

    return (
      !isColdOrLost(relationship) &&
      lastActivityDays !== null &&
      lastActivityDays >= 10 &&
      (followUpDelta === null || followUpDelta < 0)
    );
  });

  const hotLeadRelationships = openRelationships.filter((relationship) => {
    const followUpDelta =
      daysUntil(relationship.proximo_contacto) ??
      daysUntil(relationship.recordatorio);

    const lastActivityDays = daysSince(
      relationship.updated_at || relationship.created_at
    );

    return (
      isWarm(relationship) &&
      (followUpDelta === 0 ||
        followUpDelta === 1 ||
        (lastActivityDays !== null && lastActivityDays <= 2))
    );
  });

  const revenueForecast = openRelationships
    .map(buildRevenueForecastItem)
    .sort((a, b) => b.expectedValue - a.expectedValue);

  const projectedRevenue = revenueForecast.reduce(
    (sum, item) => sum + item.expectedValue,
    0
  );

  const likelyRevenue = revenueForecast
    .filter((item) => item.category === "hot" || item.category === "likely")
    .reduce((sum, item) => sum + item.expectedValue, 0);

  const delayedRevenue = revenueForecast
    .filter((item) => item.category === "delayed")
    .reduce((sum, item) => sum + item.expectedValue, 0);

  const revenueAtRisk = revenueForecast
    .filter((item) => item.category === "risk")
    .reduce((sum, item) => sum + item.pipelineValue, 0);

  const averageConversionProbability =
    revenueForecast.length > 0
      ? Math.round(
          revenueForecast.reduce((sum, item) => sum + item.probability, 0) /
            revenueForecast.length
        )
      : 0;

  const forecastConfidence =
    revenueForecast.length >= 10
      ? "Alta"
      : revenueForecast.length >= 4
        ? "Media"
        : "Baja";

  const riskScore = Math.max(
    0,
    Math.min(
      100,
      ghostingRiskRelationships.length * 18 +
        stalledRelationships.length * 15 +
        overdueFollowUps.length * 10 +
        inactiveRelationships.length * 5
    )
  );

  let score = 88;

  score -= overdueFollowUps.length * 7;
  score -= inactiveRelationships.length * 3;
  score -= coldOrLostRelationships.length * 2;
  score -= ghostingRiskRelationships.length * 4;
  score -= stalledRelationships.length * 4;

  if (todaysFollowUps.length >= 1) score += 3;
  if (hotLeadRelationships.length >= 1) score += 5;
  if (warmRelationships.length >= 3) score += 5;
  if (likelyRevenue > 0) score += 3;

  score = Math.max(0, Math.min(100, score));

  const tone: FounderBriefingTone =
    score < 55 ? "critical" : score < 75 ? "warning" : "good";

  const operationalPressure =
    overdueFollowUps.length >= 5 || todaysFollowUps.length >= 8
      ? "Alta"
      : overdueFollowUps.length >= 2 || todaysFollowUps.length >= 4
        ? "Media"
        : "Baja";

  const commercialMomentum =
    hotLeadRelationships.length >= 3 || warmRelationships.length >= 5
      ? "Fuerte"
      : hotLeadRelationships.length >= 1 || warmRelationships.length >= 2
        ? "Estable"
        : "Débil";

  const executionRisk =
    ghostingRiskRelationships.length >= 4 || overdueFollowUps.length >= 5
      ? "Crítico"
      : ghostingRiskRelationships.length >= 1 ||
          overdueFollowUps.length >= 2 ||
          inactiveRelationships.length >= 5
        ? "Elevado"
        : "Bajo";

  const pipelineRisks: PipelineRiskItem[] = [];

  ghostingRiskRelationships.slice(0, 3).forEach((relationship, index) => {
    pipelineRisks.push(
      buildPipelineRisk(
        `ghosting-${relationship.id || index}`,
        getRelationshipName(relationship),
        "ghosting",
        "Riesgo de pérdida de contacto",
        "Relación con señales de interés o seguimiento vencido, pero sin movimiento comercial suficiente.",
        "critical",
        getRelationshipValue(relationship)
      )
    );
  });

  stalledRelationships.slice(0, 3).forEach((relationship, index) => {
    pipelineRisks.push(
      buildPipelineRisk(
        `stalled-${relationship.id || index}`,
        getRelationshipName(relationship),
        "stalled",
        "Oportunidad detenida",
        "Oportunidad sin avance comercial claro. Requiere decisión: recuperar, avanzar o cerrar.",
        "warning",
        getRelationshipValue(relationship)
      )
    );
  });

  hotLeadRelationships.slice(0, 3).forEach((relationship, index) => {
    pipelineRisks.push(
      buildPipelineRisk(
        `hot-${relationship.id || index}`,
        getRelationshipName(relationship),
        "hot",
        "Oportunidad caliente",
        "Relación con señales activas. Prioriza contacto rápido para proteger conversión.",
        "good",
        getRelationshipValue(relationship)
      )
    );
  });

  const priorities: FounderBriefingItem[] = [];
  const opportunities: FounderBriefingItem[] = [];
  const risks: FounderBriefingItem[] = [];
  const recommendations: FounderBriefingItem[] = [];

  if (ghostingRiskRelationships.length > 0) {
    priorities.push(
      buildItem(
        "ghosting-risk",
        `${ghostingRiskRelationships.length} relación${
          ghostingRiskRelationships.length === 1 ? "" : "es"
        } con riesgo de pérdida de contacto`,
        "Recupera estos contactos antes de que el pipeline pierda velocidad comercial.",
        ghostingRiskRelationships.length >= 3 ? "critical" : "warning"
      )
    );
  }

  if (overdueFollowUps.length > 0) {
    priorities.push(
      buildItem(
        "overdue-follow-ups",
        `${overdueFollowUps.length} seguimiento${
          overdueFollowUps.length === 1 ? "" : "s"
        } vencido${overdueFollowUps.length === 1 ? "" : "s"}`,
        "Estas relaciones necesitan atención inmediata antes de que se pierda el momentum comercial.",
        overdueFollowUps.length >= 5 ? "critical" : "warning"
      )
    );

    risks.push(
      buildItem(
        "pipeline-slippage",
        "Deslizamiento del pipeline",
        "Hay seguimientos planificados que ya vencieron. Esto puede reducir la probabilidad de conversión.",
        overdueFollowUps.length >= 5 ? "critical" : "warning"
      )
    );
  }

  if (likelyRevenue > 0) {
    opportunities.push(
      buildItem(
        "likely-revenue",
        "Ingreso probable detectado",
        `ClienteYA estima ${formatGsInternal(
          likelyRevenue
        )} como ingreso con mayor probabilidad de conversión.`,
        "good"
      )
    );
  }

  if (delayedRevenue > 0) {
    risks.push(
      buildItem(
        "delayed-revenue",
        "Ingreso retrasado",
        `Hay ${formatGsInternal(
          delayedRevenue
        )} en oportunidades que siguen vivas, pero necesitan movimiento comercial.`,
        "warning"
      )
    );
  }

  if (stalledRelationships.length > 0) {
    risks.push(
      buildItem(
        "stalled-pipeline",
        `${stalledRelationships.length} oportunidad${
          stalledRelationships.length === 1 ? "" : "es"
        } detenida${stalledRelationships.length === 1 ? "" : "s"}`,
        "Estas oportunidades necesitan una decisión comercial: avanzar, reactivar o cerrar.",
        stalledRelationships.length >= 3 ? "critical" : "warning"
      )
    );
  }

  if (todaysFollowUps.length > 0) {
    priorities.push(
      buildItem(
        "today-follow-ups",
        `${todaysFollowUps.length} acción${
          todaysFollowUps.length === 1 ? "" : "es"
        } comercial${todaysFollowUps.length === 1 ? "" : "es"} para hoy`,
        "Completa estos seguimientos antes de abrir nuevos frentes comerciales.",
        todaysFollowUps.length >= 8 ? "warning" : "good"
      )
    );
  }

  if (hotLeadRelationships.length > 0) {
    opportunities.push(
      buildItem(
        "hot-leads",
        `${hotLeadRelationships.length} oportunidad${
          hotLeadRelationships.length === 1 ? "" : "es"
        } caliente${hotLeadRelationships.length === 1 ? "" : "s"}`,
        "Estas relaciones muestran señales recientes. Un contacto rápido puede mejorar la conversión.",
        "good"
      )
    );
  }

  if (warmRelationships.length > 0) {
    opportunities.push(
      buildItem(
        "warm-pipeline",
        `${warmRelationships.length} oportunidad${
          warmRelationships.length === 1 ? "" : "es"
        } comercial${warmRelationships.length === 1 ? "" : "es"} en pipeline`,
        "Existen señales de intención comercial o movimiento activo.",
        warmRelationships.length >= 5 ? "good" : "warning"
      )
    );
  }

  if (inactiveRelationships.length > 0) {
    risks.push(
      buildItem(
        "inactive-relationships",
        `${inactiveRelationships.length} relación${
          inactiveRelationships.length === 1 ? "" : "es"
        } inactiva${inactiveRelationships.length === 1 ? "" : "s"}`,
        "No muestran actividad reciente y pueden necesitar una acción de reactivación.",
        inactiveRelationships.length >= 8 ? "critical" : "warning"
      )
    );
  }

  if (revenueAtRisk > 0) {
    risks.push(
      buildItem(
        "revenue-at-risk",
        "Ingreso en riesgo detectado",
        `Hay ${formatGsInternal(
          revenueAtRisk
        )} asociado a oportunidades con baja probabilidad o pérdida de momentum.`,
        revenueAtRisk >= 250000 ? "critical" : "warning"
      )
    );
  }

  if (totalRelationships === 0) {
    priorities.push(
      buildItem(
        "empty-system",
        "Sin datos comerciales todavía",
        "Carga relaciones activas para activar la capa de inteligencia founder.",
        "warning"
      )
    );

    recommendations.push(
      buildItem(
        "start-with-input",
        "Carga leads activos primero",
        "La inteligencia del briefing mejora cuando existen estados, seguimientos y actividad registrada.",
        "good"
      )
    );
  }

  if (ghostingRiskRelationships.length > 0) {
    const examples = ghostingRiskRelationships
      .slice(0, 3)
      .map((relationship) => getRelationshipName(relationship))
      .join(", ");

    recommendations.push(
      buildItem(
        "recover-ghosting",
        "Recupera primero relaciones con riesgo de pérdida de contacto",
        examples
          ? `Comienza con: ${examples}. Usa un mensaje corto, directo y orientado a decisión.`
          : "Comienza por los contactos con seguimiento vencido y mayor valor comercial.",
        ghostingRiskRelationships.length >= 3 ? "critical" : "warning"
      )
    );
  }

  if (likelyRevenue > 0) {
    recommendations.push(
      buildItem(
        "protect-likely-revenue",
        "Protege el ingreso probable",
        "Trabaja primero las oportunidades con mayor probabilidad antes de invertir tiempo en leads fríos.",
        "good"
      )
    );
  }

  if (hotLeadRelationships.length > 0) {
    recommendations.push(
      buildItem(
        "convert-hot-leads",
        "Convierte oportunidades calientes hoy",
        "Prioriza contacto rápido con leads activos antes de trabajar oportunidades frías.",
        "good"
      )
    );
  }

  if (stalledRelationships.length > 0) {
    recommendations.push(
      buildItem(
        "clean-stalled",
        "Limpia oportunidades detenidas",
        "Define si cada oportunidad debe avanzar, recibir una última acción o cerrarse.",
        "warning"
      )
    );
  }

  if (priorities.length === 0) {
    priorities.push(
      buildItem(
        "stable-day",
        "Día operativo estable",
        "No se detecta presión crítica. Usa el día para mejorar la calidad del pipeline.",
        "good"
      )
    );
  }

  if (opportunities.length === 0 && totalRelationships > 0) {
    opportunities.push(
      buildItem(
        "create-momentum",
        "Crear oportunidades comerciales",
        "No se detectaron oportunidades calientes. Enfócate en reactivación o generación de nuevos leads.",
        "warning"
      )
    );
  }

  if (risks.length === 0) {
    risks.push(
      buildItem(
        "no-major-risk",
        "Sin riesgo operativo mayor",
        "La actividad actual no muestra señales críticas.",
        "good"
      )
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      buildItem(
        "focus-quality",
        "Mejora la calidad del pipeline",
        "Actualiza estados, fechas de seguimiento y próximos pasos para mantener control comercial.",
        "good"
      )
    );
  }

  const headline =
    tone === "critical"
      ? "La operación requiere atención inmediata"
      : tone === "warning"
        ? "Disciplina operativa requerida hoy"
        : "Ritmo operativo estable";

  const statusLabel =
    tone === "critical"
      ? "Atención crítica"
      : tone === "warning"
        ? "Requiere atención"
        : "Operación estable";

  const summary =
    totalRelationships === 0
      ? "ClienteYA está listo para generar inteligencia founder cuando exista actividad comercial registrada."
      : `ClienteYA analizó ${totalRelationships} relación${
          totalRelationships === 1 ? "" : "es"
        }, proyecta ${formatGsInternal(
          projectedRevenue
        )} en ingreso ponderado y detecta ${averageConversionProbability}% de probabilidad promedio de conversión.`;

  const insight =
    likelyRevenue > 0
      ? `El forecast muestra ingreso probable por ${formatGsInternal(
          likelyRevenue
        )}. La prioridad es proteger estas oportunidades con seguimiento rápido y claro.`
      : ghostingRiskRelationships.length > 0
        ? "El pipeline muestra riesgo de pérdida de momentum. La prioridad es recuperar relaciones con señales de interés antes de que se enfríen."
        : stalledRelationships.length > 0
          ? "Existen oportunidades detenidas. El foco debe estar en decidir cuáles avanzar, reactivar o cerrar."
          : hotLeadRelationships.length > 0
            ? "Hay oportunidades calientes activas. El día debe enfocarse en conversión rápida y seguimiento comercial."
            : tone === "critical"
              ? "El sistema muestra señales de pérdida de control comercial. Recupera primero seguimientos vencidos y oportunidades con mayor intención."
              : tone === "warning"
                ? "El pipeline necesita disciplina de seguimiento. Cierra atrasos antes de generar más actividad nueva."
                : "La operación está bajo control. Usa este momento para mejorar calidad de datos y velocidad comercial.";

  const founderFocus =
    likelyRevenue > 0
      ? "Protección de ingreso probable"
      : ghostingRiskRelationships.length > 0
        ? "Recuperación de relaciones en riesgo"
        : hotLeadRelationships.length > 0
          ? "Conversión de oportunidades calientes"
          : stalledRelationships.length > 0
            ? "Limpieza del pipeline detenido"
            : overdueFollowUps.length > 0
              ? "Recuperación de seguimientos vencidos"
              : "Generación y reactivación comercial";

  return {
    score,
    tone,
    headline,
    summary,
    insight,
    founderFocus,
    statusLabel,
    operationalPressure,
    commercialMomentum,
    executionRisk,
    riskScore,
    revenueAtRisk,
    hotLeadCount: hotLeadRelationships.length,
    ghostingRiskCount: ghostingRiskRelationships.length,
    stalledCount: stalledRelationships.length,
    projectedRevenue,
    likelyRevenue,
    delayedRevenue,
    forecastConfidence,
    averageConversionProbability,
    revenueForecast,
    pipelineRisks,
    priorities,
    opportunities,
    risks,
    recommendations,
  };
}