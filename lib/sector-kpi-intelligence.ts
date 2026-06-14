import {
  buildSectorKpiVocabulary,
  type SectorKpiTone,
} from "./sector-kpi-engine";
import { normalizeBusinessType, type BusinessType } from "./sector-intelligence";

export type SectorKpiClient = {
  id: string;
  nombre?: string | null;
  estado?: string | null;
  telefono?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
};

export type SectorKpiMetricKey =
  | "clients"
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

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dateDiffInDays(dateValue: string | null | undefined, today: string) {
  if (!dateValue) return null;

  const target = new Date(`${dateValue.slice(0, 10)}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);

  if (Number.isNaN(target.getTime()) || Number.isNaN(current.getTime())) {
    return null;
  }

  return Math.round(
    (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function daysSince(dateValue: string | null | undefined, today: string) {
  const diff = dateDiffInDays(dateValue, today);

  if (typeof diff !== "number") return null;

  return Math.max(0, Math.abs(diff));
}

function hasOpenValue(cliente: SectorKpiClient) {
  const value = Number(cliente.monto || 0);
  const estado = normalizeText(cliente.estado);

  return value > 0 && !cliente.pagado && !estado.includes("pag");
}

function isPaid(cliente: SectorKpiClient) {
  const estado = normalizeText(cliente.estado);

  return Boolean(cliente.pagado || estado.includes("pag"));
}

function isClosed(cliente: SectorKpiClient) {
  const estado = normalizeText(cliente.estado);

  return (
    estado.includes("cerr") ||
    estado.includes("perdido") ||
    estado.includes("cancel")
  );
}

function isInterested(cliente: SectorKpiClient) {
  const estado = normalizeText(cliente.estado);

  return (
    estado.includes("interes") ||
    estado.includes("propuesta") ||
    estado.includes("cotiz") ||
    estado.includes("visita") ||
    estado.includes("consulta")
  );
}

function isContacted(cliente: SectorKpiClient) {
  const estado = normalizeText(cliente.estado);

  return (
    estado.includes("contact") ||
    estado.includes("seguimiento") ||
    estado.includes("reun") ||
    estado.includes("llamada")
  );
}

function isNoResponse(cliente: SectorKpiClient) {
  const estado = normalizeText(cliente.estado);

  return (
    estado.includes("sin") ||
    estado.includes("ghost") ||
    estado.includes("no responde") ||
    estado.includes("inactivo")
  );
}

function isOverdue(cliente: SectorKpiClient, today: string) {
  const diff = dateDiffInDays(cliente.proximo_contacto, today);

  return typeof diff === "number" && diff < 0;
}

function isToday(cliente: SectorKpiClient, today: string) {
  return Boolean(cliente.proximo_contacto?.slice(0, 10) === today);
}

function isInactive(cliente: SectorKpiClient, today: string, thresholdDays = 21) {
  const updatedDays = daysSince(cliente.updated_at || cliente.created_at, today);
  const nextContactDiff = dateDiffInDays(cliente.proximo_contacto, today);

  if (isClosed(cliente) || isPaid(cliente)) return false;

  if (isNoResponse(cliente)) return true;

  if (typeof nextContactDiff === "number" && nextContactDiff < 0) return true;

  if (typeof updatedDays === "number" && updatedDays >= thresholdDays) {
    return true;
  }

  return false;
}

function countBy(
  clientes: SectorKpiClient[],
  predicate: (cliente: SectorKpiClient) => boolean
) {
  return clientes.filter(predicate).length;
}

function sumOpenValue(clientes: SectorKpiClient[]) {
  return clientes.reduce((sum, cliente) => {
    if (!hasOpenValue(cliente)) return sum;

    return sum + Number(cliente.monto || 0);
  }, 0);
}

function formatGs(value: number) {
  return `Gs.\u00A0${Number(value || 0).toLocaleString("es-PY")}`;
}

function getDefinition(
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>,
  key: SectorKpiMetricKey
) {
  return (
    vocabulary.kpis.find((kpi) => kpi.key === key) || {
      key,
      label: key,
      description: "Métrica comercial.",
      tone: "slate" as SectorKpiTone,
    }
  );
}

function buildMetric(input: {
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
  key: SectorKpiMetricKey;
  value: number;
  formattedValue?: string;
  toneOverride?: SectorKpiTone;
  descriptionOverride?: string;
}): SectorKpiMetric {
  const definition = getDefinition(input.vocabulary, input.key);

  return {
    key: input.key,
    label: definition.label,
    value: input.value,
    formattedValue: input.formattedValue || String(input.value),
    description: input.descriptionOverride || definition.description,
    tone: input.toneOverride || definition.tone,
  };
}

function buildGenericMetrics(input: {
  clientes: SectorKpiClient[];
  today: string;
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
}) {
  const activeClients = countBy(input.clientes, (cliente) => !isClosed(cliente));
  const urgent = countBy(input.clientes, (cliente) =>
    isOverdue(cliente, input.today)
  );
  const todayCount = countBy(input.clientes, (cliente) =>
    isToday(cliente, input.today)
  );
  const openValue = sumOpenValue(input.clientes);

  return [
    buildMetric({
      vocabulary: input.vocabulary,
      key: "clients",
      value: activeClients,
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "urgent",
      value: urgent,
      toneOverride: urgent > 0 ? "red" : "emerald",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "today",
      value: todayCount,
      toneOverride: todayCount > 0 ? "amber" : "slate",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "opportunity",
      value: openValue,
      formattedValue: formatGs(openValue),
      toneOverride: openValue > 0 ? "emerald" : "slate",
    }),
  ];
}

function buildConsultingMetrics(input: {
  clientes: SectorKpiClient[];
  today: string;
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
}) {
  const prospectos = countBy(input.clientes, (cliente) => !isClosed(cliente));
  const seguimientos = countBy(input.clientes, (cliente) =>
    isOverdue(cliente, input.today)
  );
  const reuniones = countBy(input.clientes, (cliente) =>
    isToday(cliente, input.today)
  );
  const oportunidades = sumOpenValue(
    input.clientes.filter((cliente) => !isClosed(cliente))
  );

  return [
    buildMetric({
      vocabulary: input.vocabulary,
      key: "clients",
      value: prospectos,
      descriptionOverride:
        "Prospectos activos o relaciones comerciales todavía abiertas.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "urgent",
      value: seguimientos,
      toneOverride: seguimientos > 0 ? "red" : "emerald",
      descriptionOverride:
        "Seguimientos vencidos que pueden enfriar una oportunidad profesional.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "today",
      value: reuniones,
      toneOverride: reuniones > 0 ? "amber" : "slate",
      descriptionOverride:
        "Reuniones, llamadas o contactos que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "opportunity",
      value: oportunidades,
      formattedValue: formatGs(oportunidades),
      toneOverride: oportunidades > 0 ? "emerald" : "slate",
      descriptionOverride:
        "Valor potencial de proyectos, propuestas o servicios abiertos.",
    }),
  ];
}

function buildFitnessMetrics(input: {
  clientes: SectorKpiClient[];
  today: string;
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
}) {
  const miembros = countBy(input.clientes, (cliente) => !isClosed(cliente));
  const inactivos = countBy(input.clientes, (cliente) =>
    isInactive(cliente, input.today, 21)
  );
  const renovaciones = countBy(input.clientes, (cliente) =>
    isToday(cliente, input.today)
  );
  const riesgoAbandono = countBy(input.clientes, (cliente) => {
    if (isClosed(cliente) || isPaid(cliente)) return false;

    return (
      isInactive(cliente, input.today, 21) ||
      isNoResponse(cliente) ||
      isOverdue(cliente, input.today)
    );
  });

  return [
    buildMetric({
      vocabulary: input.vocabulary,
      key: "clients",
      value: miembros,
      descriptionOverride:
        "Miembros y prospectos activos dentro de la memoria comercial.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "urgent",
      value: inactivos,
      toneOverride: inactivos > 0 ? "red" : "emerald",
      descriptionOverride:
        "Miembros o prospectos que muestran señales de inactividad.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "today",
      value: renovaciones,
      toneOverride: renovaciones > 0 ? "amber" : "slate",
      descriptionOverride:
        "Renovaciones, seguimientos o sesiones que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "opportunity",
      value: riesgoAbandono,
      toneOverride: riesgoAbandono > 0 ? "red" : "emerald",
      descriptionOverride:
        "Personas con riesgo de abandonar si no reciben seguimiento.",
    }),
  ];
}

function buildRealEstateMetrics(input: {
  clientes: SectorKpiClient[];
  today: string;
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
}) {
  const interesados = countBy(input.clientes, (cliente) => {
    if (isClosed(cliente)) return false;

    return isInterested(cliente) || isContacted(cliente) || !isPaid(cliente);
  });

  const visitas = countBy(input.clientes, (cliente) =>
    isToday(cliente, input.today)
  );

  const propiedades = countBy(input.clientes, (cliente) => {
    if (isClosed(cliente) || isPaid(cliente)) return false;

    return isInterested(cliente) || hasOpenValue(cliente);
  });

  const cierres = sumOpenValue(
    input.clientes.filter(
      (cliente) => !isClosed(cliente) && (isInterested(cliente) || hasOpenValue(cliente))
    )
  );

  return [
    buildMetric({
      vocabulary: input.vocabulary,
      key: "clients",
      value: interesados,
      descriptionOverride:
        "Interesados activos en propiedades, visitas o consultas inmobiliarias.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "urgent",
      value: visitas,
      toneOverride: visitas > 0 ? "red" : "slate",
      descriptionOverride:
        "Visitas o seguimientos inmobiliarios que necesitan atención inmediata.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "today",
      value: propiedades,
      toneOverride: propiedades > 0 ? "amber" : "slate",
      descriptionOverride:
        "Propiedades, consultas o expedientes comerciales abiertos.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "opportunity",
      value: cierres,
      formattedValue: formatGs(cierres),
      toneOverride: cierres > 0 ? "emerald" : "slate",
      descriptionOverride:
        "Valor potencial de cierres u operaciones inmobiliarias abiertas.",
    }),
  ];
}

function buildRestaurantMetrics(input: {
  clientes: SectorKpiClient[];
  today: string;
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
}) {
  const clientes = countBy(input.clientes, (cliente) => !isClosed(cliente));
  const reactivaciones = countBy(input.clientes, (cliente) =>
    isInactive(cliente, input.today, 14)
  );
  const reservas = countBy(input.clientes, (cliente) =>
    isToday(cliente, input.today)
  );
  const ingresos = sumOpenValue(input.clientes);

  return [
    buildMetric({
      vocabulary: input.vocabulary,
      key: "clients",
      value: clientes,
      descriptionOverride:
        "Clientes registrados con relación comercial activa o recuperable.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "urgent",
      value: reactivaciones,
      toneOverride: reactivaciones > 0 ? "red" : "emerald",
      descriptionOverride:
        "Clientes ausentes que pueden volver con una invitación simple.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "today",
      value: reservas,
      toneOverride: reservas > 0 ? "amber" : "slate",
      descriptionOverride:
        "Reservas, pedidos o seguimientos que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "opportunity",
      value: ingresos,
      formattedValue: formatGs(ingresos),
      toneOverride: ingresos > 0 ? "emerald" : "slate",
      descriptionOverride:
        "Valor potencial de pedidos, visitas o recompras abiertas.",
    }),
  ];
}

function buildRetailMetrics(input: {
  clientes: SectorKpiClient[];
  today: string;
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
}) {
  const compradores = countBy(input.clientes, (cliente) => !isClosed(cliente));
  const recompras = countBy(input.clientes, (cliente) =>
    isInactive(cliente, input.today, 21)
  );
  const seguimientos = countBy(input.clientes, (cliente) =>
    isToday(cliente, input.today)
  );
  const ventas = sumOpenValue(input.clientes);

  return [
    buildMetric({
      vocabulary: input.vocabulary,
      key: "clients",
      value: compradores,
      descriptionOverride:
        "Clientes o compradores registrados con potencial comercial.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "urgent",
      value: recompras,
      toneOverride: recompras > 0 ? "red" : "emerald",
      descriptionOverride:
        "Clientes que pueden volver a comprar con seguimiento oportuno.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "today",
      value: seguimientos,
      toneOverride: seguimientos > 0 ? "amber" : "slate",
      descriptionOverride:
        "Pedidos, consultas o seguimientos que requieren acción hoy.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "opportunity",
      value: ventas,
      formattedValue: formatGs(ventas),
      toneOverride: ventas > 0 ? "emerald" : "slate",
      descriptionOverride:
        "Valor potencial de ventas o pedidos abiertos.",
    }),
  ];
}

function buildBeautyMetrics(input: {
  clientes: SectorKpiClient[];
  today: string;
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
}) {
  const clientes = countBy(input.clientes, (cliente) => !isClosed(cliente));
  const sinCita = countBy(input.clientes, (cliente) =>
    isInactive(cliente, input.today, 21)
  );
  const reservas = countBy(input.clientes, (cliente) =>
    isToday(cliente, input.today)
  );
  const recompra = sumOpenValue(input.clientes);

  return [
    buildMetric({
      vocabulary: input.vocabulary,
      key: "clients",
      value: clientes,
      descriptionOverride:
        "Clientes activos o recuperables para nuevas citas o servicios.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "urgent",
      value: sinCita,
      toneOverride: sinCita > 0 ? "red" : "emerald",
      descriptionOverride:
        "Clientes sin cita reciente que pueden volver con una invitación.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "today",
      value: reservas,
      toneOverride: reservas > 0 ? "amber" : "slate",
      descriptionOverride:
        "Reservas, citas o seguimientos que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "opportunity",
      value: recompra,
      formattedValue: formatGs(recompra),
      toneOverride: recompra > 0 ? "emerald" : "slate",
      descriptionOverride:
        "Valor potencial de nuevas citas, productos o servicios abiertos.",
    }),
  ];
}

function buildAutomotiveMetrics(input: {
  clientes: SectorKpiClient[];
  today: string;
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
}) {
  const interesados = countBy(input.clientes, (cliente) => !isClosed(cliente));
  const cotizaciones = countBy(input.clientes, (cliente) =>
    isOverdue(cliente, input.today)
  );
  const pruebas = countBy(input.clientes, (cliente) =>
    isToday(cliente, input.today)
  );
  const ventas = sumOpenValue(input.clientes);

  return [
    buildMetric({
      vocabulary: input.vocabulary,
      key: "clients",
      value: interesados,
      descriptionOverride:
        "Clientes con interés en vehículo, servicio o cotización.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "urgent",
      value: cotizaciones,
      toneOverride: cotizaciones > 0 ? "red" : "emerald",
      descriptionOverride:
        "Cotizaciones o conversaciones que requieren seguimiento urgente.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "today",
      value: pruebas,
      toneOverride: pruebas > 0 ? "amber" : "slate",
      descriptionOverride:
        "Pruebas, llamadas o seguimientos que requieren acción hoy.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "opportunity",
      value: ventas,
      formattedValue: formatGs(ventas),
      toneOverride: ventas > 0 ? "emerald" : "slate",
      descriptionOverride:
        "Valor potencial de ventas o servicios abiertos.",
    }),
  ];
}

function buildMedicalMetrics(input: {
  clientes: SectorKpiClient[];
  today: string;
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
}) {
  const pacientes = countBy(input.clientes, (cliente) => !isClosed(cliente));
  const pendientes = countBy(input.clientes, (cliente) =>
    isOverdue(cliente, input.today)
  );
  const consultas = countBy(input.clientes, (cliente) =>
    isToday(cliente, input.today)
  );
  const continuidad = countBy(input.clientes, (cliente) => {
    if (isClosed(cliente)) return false;

    return isPaid(cliente) || Boolean(cliente.proximo_contacto);
  });

  return [
    buildMetric({
      vocabulary: input.vocabulary,
      key: "clients",
      value: pacientes,
      descriptionOverride:
        "Pacientes o contactos registrados con seguimiento activo.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "urgent",
      value: pendientes,
      toneOverride: pendientes > 0 ? "red" : "emerald",
      descriptionOverride:
        "Pacientes que necesitan seguimiento pendiente o confirmación.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "today",
      value: consultas,
      toneOverride: consultas > 0 ? "amber" : "slate",
      descriptionOverride:
        "Consultas, controles o contactos que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "opportunity",
      value: continuidad,
      toneOverride: continuidad > 0 ? "emerald" : "slate",
      descriptionOverride:
        "Relaciones con continuidad clínica o seguimiento activo.",
    }),
  ];
}

function buildEducationMetrics(input: {
  clientes: SectorKpiClient[];
  today: string;
  vocabulary: ReturnType<typeof buildSectorKpiVocabulary>;
}) {
  const alumnos = countBy(input.clientes, (cliente) => !isClosed(cliente));
  const inscripciones = countBy(input.clientes, (cliente) =>
    isInterested(cliente) || isOverdue(cliente, input.today)
  );
  const seguimientos = countBy(input.clientes, (cliente) =>
    isToday(cliente, input.today)
  );
  const oportunidades = sumOpenValue(input.clientes);

  return [
    buildMetric({
      vocabulary: input.vocabulary,
      key: "clients",
      value: alumnos,
      descriptionOverride:
        "Alumnos, prospectos o interesados registrados.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "urgent",
      value: inscripciones,
      toneOverride: inscripciones > 0 ? "red" : "emerald",
      descriptionOverride:
        "Interesados que pueden avanzar a inscripción con seguimiento.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "today",
      value: seguimientos,
      toneOverride: seguimientos > 0 ? "amber" : "slate",
      descriptionOverride:
        "Contactos académicos que requieren atención hoy.",
    }),
    buildMetric({
      vocabulary: input.vocabulary,
      key: "opportunity",
      value: oportunidades,
      formattedValue: formatGs(oportunidades),
      toneOverride: oportunidades > 0 ? "emerald" : "slate",
      descriptionOverride:
        "Valor potencial de inscripciones, cursos o continuidad.",
    }),
  ];
}

export function buildSectorKpiIntelligence(input: {
  clientes: SectorKpiClient[];
  businessType?: string | null;
  today?: string;
}): SectorKpiIntelligenceResult {
  const today = input.today || todayISO();
  const businessType = normalizeBusinessType(input.businessType);
  const vocabulary = buildSectorKpiVocabulary(businessType);

  const baseInput = {
    clientes: input.clientes || [],
    today,
    vocabulary,
  };

  let metrics: SectorKpiMetric[];

  if (businessType === "restaurant") {
    metrics = buildRestaurantMetrics(baseInput);
  } else if (businessType === "fitness") {
    metrics = buildFitnessMetrics(baseInput);
  } else if (businessType === "real_estate") {
    metrics = buildRealEstateMetrics(baseInput);
  } else if (businessType === "retail") {
    metrics = buildRetailMetrics(baseInput);
  } else if (businessType === "beauty") {
    metrics = buildBeautyMetrics(baseInput);
  } else if (businessType === "automotive") {
    metrics = buildAutomotiveMetrics(baseInput);
  } else if (businessType === "medical") {
    metrics = buildMedicalMetrics(baseInput);
  } else if (businessType === "education") {
    metrics = buildEducationMetrics(baseInput);
  } else if (businessType === "consulting" || businessType === "services") {
    metrics = buildConsultingMetrics(baseInput);
  } else {
    metrics = buildGenericMetrics(baseInput);
  }

  return {
    businessType,
    sectorLabel: vocabulary.sectorLabel,
    dashboardTitle: vocabulary.dashboardTitle,
    dashboardDescription: vocabulary.dashboardDescription,
    metrics,
  };
}