export type SectorKpiExplanationSector =
  | "general"
  | "beauty"
  | "wellness"
  | "gastronomy"
  | "medical"
  | "real_estate"
  | "automotive"
  | "education"
  | "services"
  | "retail"
  | "fitness"
  | "finance"
  | "legal"
  | "construction";

export type SectorKpiExplanationTone =
  | "emerald"
  | "sky"
  | "amber"
  | "red"
  | "slate";

export type SectorKpiExplanationUrgency =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type SectorKpiExplanationInput = {
  sector?: string | null;

  totalRelationships: number;
  activeRelationships: number;
  relationshipsToContactToday: number;
  overdueRelationships: number;
  paidRelationships: number;
  unpaidRelationships: number;
  totalRevenue: number;

  responseProbability?: number | null;
  closeProbability?: number | null;
  riskPercentage?: number | null;
};

export type SectorKpiExplanation = {
  id: string;
  title: string;
  valueLabel: string;
  explanation: string;
  founderMeaning: string;
  actionHint: string;
  tone: SectorKpiExplanationTone;
  urgency: SectorKpiExplanationUrgency;
};

export type SectorKpiExplanationResult = {
  sector: SectorKpiExplanationSector;
  title: string;
  summary: string;
  explanations: SectorKpiExplanation[];
};

function normalizeSector(
  sector?: string | null
): SectorKpiExplanationSector {
  const value = String(sector ?? "")
    .trim()
    .toLowerCase();

  if (
    value.includes("beauty") ||
    value.includes("belleza") ||
    value.includes("salon") ||
    value.includes("peluquer")
  ) {
    return "beauty";
  }

  if (
    value.includes("wellness") ||
    value.includes("spa") ||
    value.includes("masaje") ||
    value.includes("estetica")
  ) {
    return "wellness";
  }

  if (
    value.includes("gastr") ||
    value.includes("restaurant") ||
    value.includes("bar") ||
    value.includes("food") ||
    value.includes("comida")
  ) {
    return "gastronomy";
  }

  if (
    value.includes("medical") ||
    value.includes("medico") ||
    value.includes("salud") ||
    value.includes("clinica") ||
    value.includes("doctor")
  ) {
    return "medical";
  }

  if (
    value.includes("real") ||
    value.includes("estate") ||
    value.includes("inmobili")
  ) {
    return "real_estate";
  }

  if (
    value.includes("auto") ||
    value.includes("car") ||
    value.includes("vehiculo") ||
    value.includes("mecan")
  ) {
    return "automotive";
  }

  if (
    value.includes("educ") ||
    value.includes("curso") ||
    value.includes("school") ||
    value.includes("academ")
  ) {
    return "education";
  }

  if (
    value.includes("service") ||
    value.includes("servicio") ||
    value.includes("consult")
  ) {
    return "services";
  }

  if (
    value.includes("retail") ||
    value.includes("tienda") ||
    value.includes("shop") ||
    value.includes("venta")
  ) {
    return "retail";
  }

  if (
    value.includes("fitness") ||
    value.includes("gym") ||
    value.includes("entren")
  ) {
    return "fitness";
  }

  if (
    value.includes("finance") ||
    value.includes("finanza") ||
    value.includes("contable") ||
    value.includes("seguro")
  ) {
    return "finance";
  }

  if (
    value.includes("legal") ||
    value.includes("abogado") ||
    value.includes("jurid")
  ) {
    return "legal";
  }

  if (
    value.includes("construct") ||
    value.includes("obra") ||
    value.includes("arquitect")
  ) {
    return "construction";
  }

  return "general";
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-PY").format(Math.max(0, value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0;

  return clamp(Math.round((value / total) * 100));
}

function getSectorVocabulary(sector: SectorKpiExplanationSector) {
  const map: Record<
    SectorKpiExplanationSector,
    {
      relationship: string;
      active: string;
      contact: string;
      overdue: string;
      paid: string;
      revenue: string;
    }
  > = {
    general: {
      relationship: "relaciones registradas",
      active: "relaciones activas",
      contact: "seguimientos pendientes",
      overdue: "relaciones en riesgo",
      paid: "relaciones con pago",
      revenue: "ingresos registrados",
    },

    beauty: {
      relationship: "relaciones de belleza",
      active: "relaciones con actividad reciente",
      contact: "citas o seguimientos pendientes",
      overdue: "relaciones que pueden enfriarse",
      paid: "servicios cobrados",
      revenue: "ingresos de servicios",
    },

    wellness: {
      relationship: "relaciones de bienestar",
      active: "relaciones en seguimiento",
      contact: "contactos de cuidado pendientes",
      overdue: "relaciones que pierden ritmo",
      paid: "sesiones cobradas",
      revenue: "ingresos de sesiones",
    },

    gastronomy: {
      relationship: "relaciones o contactos comerciales",
      active: "relaciones con movimiento reciente",
      contact: "pedidos o seguimientos pendientes",
      overdue: "oportunidades que se enfrían",
      paid: "ventas cobradas",
      revenue: "ingresos de ventas",
    },

    medical: {
      relationship: "pacientes o contactos",
      active: "pacientes en seguimiento",
      contact: "controles o recordatorios pendientes",
      overdue: "pacientes sin continuidad",
      paid: "consultas cobradas",
      revenue: "ingresos de consultas",
    },

    real_estate: {
      relationship: "prospectos inmobiliarios",
      active: "prospectos activos",
      contact: "visitas o llamadas pendientes",
      overdue: "prospectos que pierden interés",
      paid: "operaciones registradas",
      revenue: "valor comercial registrado",
    },

    automotive: {
      relationship: "relaciones de vehículo",
      active: "relaciones activas",
      contact: "servicios o presupuestos pendientes",
      overdue: "relaciones que pueden ir a otro taller",
      paid: "trabajos cobrados",
      revenue: "ingresos de servicios",
    },

    education: {
      relationship: "alumnos o interesados",
      active: "alumnos activos",
      contact: "seguimientos académicos pendientes",
      overdue: "interesados que pierden motivación",
      paid: "inscripciones cobradas",
      revenue: "ingresos educativos",
    },

    services: {
      relationship: "relaciones de servicio",
      active: "relaciones activas",
      contact: "seguimientos pendientes",
      overdue: "relaciones que esperan respuesta",
      paid: "servicios cobrados",
      revenue: "ingresos de servicios",
    },

    retail: {
      relationship: "relaciones de tienda",
      active: "relaciones activas",
      contact: "ventas o consultas pendientes",
      overdue: "relaciones que pueden comprar en otro lugar",
      paid: "ventas cobradas",
      revenue: "ingresos de ventas",
    },

    fitness: {
      relationship: "miembros o interesados",
      active: "miembros activos",
      contact: "seguimientos de entrenamiento pendientes",
      overdue: "miembros que pierden constancia",
      paid: "planes cobrados",
      revenue: "ingresos de membresías",
    },

    finance: {
      relationship: "relaciones financieras",
      active: "relaciones activas",
      contact: "seguimientos financieros pendientes",
      overdue: "relaciones sin decisión",
      paid: "servicios cobrados",
      revenue: "ingresos registrados",
    },

    legal: {
      relationship: "relaciones o casos",
      active: "casos activos",
      contact: "seguimientos legales pendientes",
      overdue: "casos sin avance reciente",
      paid: "honorarios cobrados",
      revenue: "honorarios registrados",
    },

    construction: {
      relationship: "relaciones o proyectos",
      active: "proyectos activos",
      contact: "presupuestos o avances pendientes",
      overdue: "proyectos sin seguimiento",
      paid: "trabajos cobrados",
      revenue: "ingresos de proyectos",
    },
  };

  return map[sector];
}

function getSectorSummary(
  sector: SectorKpiExplanationSector,
  input: SectorKpiExplanationInput
) {
  const overdueRate = percentage(
    input.overdueRelationships,
    input.totalRelationships
  );

  const todayRate = percentage(
    input.relationshipsToContactToday,
    input.totalRelationships
  );

  if (input.totalRelationships <= 0) {
    return "ClienteYA todavía no tiene suficientes datos para explicar patrones. Agrega relaciones y seguimientos para activar inteligencia comercial.";
  }

  if (overdueRate >= 35) {
    return "ClienteYA detecta que una parte importante de las relaciones necesita atención. El foco debe estar en recuperar contacto antes de buscar más volumen.";
  }

  if (todayRate >= 30) {
    return "ClienteYA muestra varios seguimientos para hoy porque hay oportunidades que todavía pueden avanzar si se actúa a tiempo.";
  }

  if (
    input.activeRelationships >=
    input.totalRelationships * 0.6
  ) {
    return "ClienteYA muestra una base saludable: hay movimiento reciente y suficiente actividad para tomar decisiones comerciales con más confianza.";
  }

  return "ClienteYA resume estos indicadores para mostrar qué relaciones requieren acción, cuáles están activas y dónde puede estar el próximo ingreso.";
}

function buildTotalRelationshipsExplanation(
  sector: SectorKpiExplanationSector,
  input: SectorKpiExplanationInput
): SectorKpiExplanation {
  const vocabulary = getSectorVocabulary(sector);

  const activeRate = percentage(
    input.activeRelationships,
    input.totalRelationships
  );

  return {
    id: "total-relationships",
    title: "Base comercial",
    valueLabel: `${formatNumber(input.totalRelationships)} ${
      vocabulary.relationship
    }`,
    explanation:
      input.totalRelationships > 0
        ? `ClienteYA cuenta todas las ${vocabulary.relationship} guardadas para medir el tamaño real de tu base comercial.`
        : "ClienteYA todavía no tiene relaciones suficientes para construir una lectura comercial.",
    founderMeaning:
      activeRate >= 60
        ? "La base tiene buen movimiento. Ahora el foco es convertir actividad en ingresos."
        : "La base existe, pero necesita más seguimiento para convertirse en una agenda comercial viva.",
    actionHint:
      input.totalRelationships > 0
        ? "Revisa primero las relaciones con acción pendiente."
        : "Agrega tus primeras relaciones para activar el sistema de seguimiento.",
    tone: input.totalRelationships > 0 ? "sky" : "slate",
    urgency: input.totalRelationships > 0 ? "low" : "medium",
  };
}

function buildActiveRelationshipsExplanation(
  sector: SectorKpiExplanationSector,
  input: SectorKpiExplanationInput
): SectorKpiExplanation {
  const vocabulary = getSectorVocabulary(sector);

  const activeRate = percentage(
    input.activeRelationships,
    input.totalRelationships
  );

  return {
    id: "active-relationships",
    title: "Actividad reciente",
    valueLabel: `${formatNumber(input.activeRelationships)} ${
      vocabulary.active
    }`,
    explanation:
      activeRate > 0
        ? "ClienteYA marca como activas las relaciones que todavía muestran movimiento, seguimiento o potencial comercial reciente."
        : "ClienteYA no detecta suficiente actividad reciente en la base actual.",
    founderMeaning:
      activeRate >= 60
        ? "Hay una buena señal de vida comercial. La prioridad es mantener el ritmo."
        : activeRate >= 30
          ? "Hay actividad, pero todavía no es suficientemente fuerte para confiar solo en la demanda natural."
          : "La base puede enfriarse si no se reactiva contacto pronto.",
    actionHint:
      activeRate >= 60
        ? "Mantén la frecuencia de seguimiento y busca cierres."
        : "Reactiva relaciones con mensajes simples y directos.",
    tone:
      activeRate >= 60
        ? "emerald"
        : activeRate >= 30
          ? "amber"
          : "red",
    urgency:
      activeRate >= 60
        ? "low"
        : activeRate >= 30
          ? "medium"
          : "high",
  };
}

function buildTodayContactExplanation(
  sector: SectorKpiExplanationSector,
  input: SectorKpiExplanationInput
): SectorKpiExplanation {
  const vocabulary = getSectorVocabulary(sector);

  const todayRate = percentage(
    input.relationshipsToContactToday,
    input.totalRelationships
  );

  return {
    id: "contact-today",
    title: "Acciones de hoy",
    valueLabel: `${formatNumber(
      input.relationshipsToContactToday
    )} ${vocabulary.contact}`,
    explanation:
      input.relationshipsToContactToday > 0
        ? `ClienteYA muestra estos ${vocabulary.contact} porque hay relaciones que necesitan una acción concreta hoy.`
        : "ClienteYA no detecta seguimientos urgentes para hoy.",
    founderMeaning:
      input.relationshipsToContactToday > 0
        ? "Estas acciones protegen oportunidades que todavía pueden avanzar."
        : "La agenda está limpia. Buen momento para crear nuevas oportunidades o revisar relaciones tibias.",
    actionHint:
      input.relationshipsToContactToday > 0
        ? "Empieza por la relación con mayor probabilidad de respuesta."
        : "Usa este espacio para prospectar o fortalecer relaciones existentes.",
    tone:
      input.relationshipsToContactToday === 0
        ? "emerald"
        : todayRate >= 30
          ? "amber"
          : "sky",
    urgency:
      input.relationshipsToContactToday === 0
        ? "low"
        : todayRate >= 30
          ? "high"
          : "medium",
  };
}

function buildOverdueExplanation(
  sector: SectorKpiExplanationSector,
  input: SectorKpiExplanationInput
): SectorKpiExplanation {
  const vocabulary = getSectorVocabulary(sector);

  const overdueRate = percentage(
    input.overdueRelationships,
    input.totalRelationships
  );

  return {
    id: "overdue-relationships",
    title: "Riesgo comercial",
    valueLabel: `${formatNumber(input.overdueRelationships)} ${
      vocabulary.overdue
    }`,
    explanation:
      input.overdueRelationships > 0
        ? "ClienteYA marca estos casos porque llevan demasiado tiempo sin una acción clara o sin continuidad comercial."
        : "ClienteYA no detecta relaciones atrasadas en este momento.",
    founderMeaning:
      overdueRate >= 35
        ? "Aquí puede estar la pérdida silenciosa: relaciones que no dicen que no, pero se enfrían."
        : overdueRate > 0
          ? "Hay algunos puntos de atención, pero todavía se pueden recuperar con seguimiento rápido."
          : "La base está bajo control. No hay señales fuertes de abandono por falta de seguimiento.",
    actionHint:
      input.overdueRelationships > 0
        ? "Envía mensajes cortos de recuperación antes de insistir con venta directa."
        : "Mantén la disciplina de seguimiento para que esta cifra siga baja.",
    tone:
      overdueRate >= 35
        ? "red"
        : overdueRate > 0
          ? "amber"
          : "emerald",
    urgency:
      overdueRate >= 35
        ? "critical"
        : overdueRate > 0
          ? "medium"
          : "low",
  };
}

function buildPaymentExplanation(
  sector: SectorKpiExplanationSector,
  input: SectorKpiExplanationInput
): SectorKpiExplanation {
  const vocabulary = getSectorVocabulary(sector);

  const paymentRate = percentage(
    input.paidRelationships,
    input.paidRelationships + input.unpaidRelationships
  );

  return {
    id: "payment-status",
    title: "Estado de cobro",
    valueLabel: `${formatNumber(input.paidRelationships)} ${
      vocabulary.paid
    }`,
    explanation:
      input.paidRelationships + input.unpaidRelationships > 0
        ? "ClienteYA compara relaciones cobradas y pendientes para mostrar la salud inmediata del flujo de caja."
        : "ClienteYA todavía no tiene suficientes datos de cobro para explicar el flujo comercial.",
    founderMeaning:
      paymentRate >= 70
        ? "El cobro está fuerte. La operación puede enfocarse más en crecimiento."
        : paymentRate >= 40
          ? "Hay ventas, pero el flujo todavía necesita control."
          : "Puede haber dinero pendiente que afecta la estabilidad diaria.",
    actionHint:
      input.unpaidRelationships > 0
        ? "Prioriza recordatorios de pago antes de abrir demasiadas oportunidades nuevas."
        : "Mantén registro de cada cobro para que el sistema aprenda mejor.",
    tone:
      paymentRate >= 70
        ? "emerald"
        : paymentRate >= 40
          ? "amber"
          : "red",
    urgency:
      paymentRate >= 70
        ? "low"
        : paymentRate >= 40
          ? "medium"
          : "high",
  };
}

function buildRevenueExplanation(
  sector: SectorKpiExplanationSector,
  input: SectorKpiExplanationInput
): SectorKpiExplanation {
  const vocabulary = getSectorVocabulary(sector);

  return {
    id: "revenue",
    title: "Ingresos visibles",
    valueLabel: formatCurrency(input.totalRevenue),
    explanation:
      input.totalRevenue > 0
        ? `ClienteYA suma los ${vocabulary.revenue} para que el founder vea el impacto comercial de la base actual.`
        : "ClienteYA no detecta ingresos registrados todavía.",
    founderMeaning:
      input.totalRevenue > 0
        ? "Ya existe valor comercial registrado. El siguiente paso es entender qué relaciones producen más."
        : "Sin ingresos registrados, el sistema todavía no puede separar actividad de resultado.",
    actionHint:
      input.totalRevenue > 0
        ? "Compara ingresos con relaciones activas para detectar los mejores segmentos."
        : "Registra montos y pagos para activar lectura financiera real.",
    tone: input.totalRevenue > 0 ? "emerald" : "slate",
    urgency: input.totalRevenue > 0 ? "low" : "medium",
  };
}

function buildProbabilityExplanation(
  input: SectorKpiExplanationInput
): SectorKpiExplanation | null {
  const responseProbability =
    typeof input.responseProbability === "number"
      ? clamp(Math.round(input.responseProbability))
      : null;

  const closeProbability =
    typeof input.closeProbability === "number"
      ? clamp(Math.round(input.closeProbability))
      : null;

  if (
    responseProbability === null &&
    closeProbability === null
  ) {
    return null;
  }

  const bestValue = Math.max(
    responseProbability ?? 0,
    closeProbability ?? 0
  );

  return {
    id: "commercial-probability",
    title: "Probabilidad comercial",
    valueLabel:
      responseProbability !== null &&
      closeProbability !== null
        ? `${responseProbability}% respuesta · ${closeProbability}% cierre`
        : responseProbability !== null
          ? `${responseProbability}% respuesta`
          : `${closeProbability}% cierre`,
    explanation:
      "ClienteYA combina señales de seguimiento, actividad, riesgo y contexto para estimar qué tan probable es avanzar comercialmente.",
    founderMeaning:
      bestValue >= 70
        ? "Hay buena oportunidad. Conviene actuar con claridad y no dejar enfriar la relación."
        : bestValue >= 40
          ? "La oportunidad existe, pero necesita mejor timing o más confianza."
          : "La señal comercial es débil. Conviene reactivar antes de intentar cerrar.",
    actionHint:
      bestValue >= 70
        ? "Envía un mensaje directo con una próxima acción concreta."
        : bestValue >= 40
          ? "Haz una pregunta simple para recuperar conversación."
          : "Usa un mensaje suave de reactivación, no presión de venta.",
    tone:
      bestValue >= 70
        ? "emerald"
        : bestValue >= 40
          ? "amber"
          : "red",
    urgency:
      bestValue >= 70
        ? "medium"
        : bestValue >= 40
          ? "medium"
          : "high",
  };
}

export function buildSectorKpiExplanations(
  input: SectorKpiExplanationInput
): SectorKpiExplanationResult {
  const sector = normalizeSector(input.sector);

  const explanations: SectorKpiExplanation[] = [
    buildTotalRelationshipsExplanation(sector, input),
    buildActiveRelationshipsExplanation(sector, input),
    buildTodayContactExplanation(sector, input),
    buildOverdueExplanation(sector, input),
    buildPaymentExplanation(sector, input),
    buildRevenueExplanation(sector, input),
  ];

  const probabilityExplanation =
    buildProbabilityExplanation(input);

  if (probabilityExplanation) {
    explanations.push(probabilityExplanation);
  }

  return {
    sector,
    title: "Por qué ClienteYA muestra estos números",
    summary: getSectorSummary(sector, input),
    explanations,
  };
}

export function getSectorKpiExplanationToneClasses(
  tone: SectorKpiExplanationTone
) {
  const map: Record<SectorKpiExplanationTone, string> = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-950",
    sky:
      "border-sky-200 bg-sky-50 text-sky-950",
    amber:
      "border-amber-200 bg-amber-50 text-amber-950",
    red:
      "border-red-200 bg-red-50 text-red-950",
    slate:
      "border-slate-200 bg-slate-50 text-slate-950",
  };

  return map[tone];
}

export function getSectorKpiExplanationBadgeClasses(
  tone: SectorKpiExplanationTone
) {
  const map: Record<SectorKpiExplanationTone, string> = {
    emerald:
      "border-emerald-200 bg-emerald-100 text-emerald-800",
    sky:
      "border-sky-200 bg-sky-100 text-sky-800",
    amber:
      "border-amber-200 bg-amber-100 text-amber-800",
    red:
      "border-red-200 bg-red-100 text-red-800",
    slate:
      "border-slate-200 bg-slate-100 text-slate-700",
  };

  return map[tone];
}

export function getSectorKpiExplanationUrgencyLabel(
  urgency: SectorKpiExplanationUrgency
) {
  const map: Record<SectorKpiExplanationUrgency, string> = {
    low: "Controlado",
    medium: "Atención",
    high: "Prioridad",
    critical: "Crítico",
  };

  return map[urgency];
}