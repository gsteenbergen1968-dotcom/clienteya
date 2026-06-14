type Cliente = {
  id: string;
  nombre: string;
  estado?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
  proximo_contacto?: string | null;
};

export type RevenueAnalytics = {
  totalPipelineValue: number;
  wonRevenue: number;
  expectedRevenue: number;
  weightedForecast: number;
  wonClients: number;
  openClients: number;
  hotClients: number;
  riskClients: number;
  conversionRate: number;
  forecastConfidence: "Alta" | "Media" | "Baja";
  pipelinePressure: "Alta" | "Media" | "Baja";
  momentumLabel: string;
  executiveSummary: string;
};

function normalize(value?: string | null) {
  return value?.toLowerCase().trim() || "";
}

function isWon(cliente: Cliente) {
  const estado = normalize(cliente.estado);

  return (
    cliente.pagado === true ||
    estado.includes("pagado") ||
    estado.includes("pagó") ||
    estado.includes("cerrado")
  );
}

function isHot(cliente: Cliente) {
  const estado = normalize(cliente.estado);

  return (
    estado.includes("interes") ||
    estado.includes("caliente") ||
    estado.includes("hot")
  );
}

function isRisk(cliente: Cliente) {
  const estado = normalize(cliente.estado);

  return (
    estado.includes("sin") ||
    estado.includes("frío") ||
    estado.includes("frio") ||
    estado.includes("riesgo")
  );
}

function getClientValue(cliente: Cliente) {
  return Number(cliente.monto || 50000);
}

function getForecastWeight(cliente: Cliente) {
  if (isWon(cliente)) return 1;
  if (isHot(cliente)) return 0.65;
  if (isRisk(cliente)) return 0.2;

  return 0.4;
}

function getForecastConfidence(conversionRate: number, hotClients: number) {
  if (conversionRate >= 35 || hotClients >= 4) return "Alta";
  if (conversionRate >= 15 || hotClients >= 2) return "Media";

  return "Baja";
}

function getPipelinePressure(openClients: number, riskClients: number) {
  if (riskClients >= 4 || openClients >= 8) return "Alta";
  if (riskClients >= 2 || openClients >= 4) return "Media";

  return "Baja";
}

function getMomentumLabel(conversionRate: number, hotClients: number) {
  if (conversionRate >= 40) return "Conversión fuerte";
  if (hotClients >= 3) return "Momentum comercial positivo";
  if (conversionRate <= 10) return "Conversión baja";

  return "Pipeline estable";
}

function getExecutiveSummary({
  forecastConfidence,
  pipelinePressure,
  hotClients,
  riskClients,
}: {
  forecastConfidence: RevenueAnalytics["forecastConfidence"];
  pipelinePressure: RevenueAnalytics["pipelinePressure"];
  hotClients: number;
  riskClients: number;
}) {
  if (pipelinePressure === "Alta") {
    return "Hay presión comercial elevada. Conviene priorizar seguimiento y evitar que oportunidades abiertas se enfríen.";
  }

  if (forecastConfidence === "Alta") {
    return "El forecast muestra buena probabilidad de conversión si se mantiene ritmo de contacto.";
  }

  if (hotClients > riskClients) {
    return "Hay más oportunidades activas que riesgos. El foco debe estar en cerrar antes de generar nuevos leads.";
  }

  return "El pipeline está estable, pero necesita seguimiento constante para aumentar conversión.";
}

export function buildRevenueAnalytics(clientes: Cliente[]): RevenueAnalytics {
  const totalPipelineValue = clientes.reduce(
    (sum, cliente) => sum + getClientValue(cliente),
    0
  );

  const wonClientsList = clientes.filter(isWon);
  const openClientsList = clientes.filter((cliente) => !isWon(cliente));
  const hotClientsList = openClientsList.filter(isHot);
  const riskClientsList = openClientsList.filter(isRisk);

  const wonRevenue = wonClientsList.reduce(
    (sum, cliente) => sum + getClientValue(cliente),
    0
  );

  const expectedRevenue = openClientsList.reduce(
    (sum, cliente) => sum + getClientValue(cliente),
    0
  );

  const weightedForecast = openClientsList.reduce(
    (sum, cliente) => sum + getClientValue(cliente) * getForecastWeight(cliente),
    0
  );

  const conversionRate =
    clientes.length === 0
      ? 0
      : Math.round((wonClientsList.length / clientes.length) * 100);

  const hotClients = hotClientsList.length;
  const riskClients = riskClientsList.length;

  const forecastConfidence = getForecastConfidence(
    conversionRate,
    hotClients
  );

  const pipelinePressure = getPipelinePressure(
    openClientsList.length,
    riskClients
  );

  const momentumLabel = getMomentumLabel(conversionRate, hotClients);

  return {
    totalPipelineValue,
    wonRevenue,
    expectedRevenue,
    weightedForecast,
    wonClients: wonClientsList.length,
    openClients: openClientsList.length,
    hotClients,
    riskClients,
    conversionRate,
    forecastConfidence,
    pipelinePressure,
    momentumLabel,
    executiveSummary: getExecutiveSummary({
      forecastConfidence,
      pipelinePressure,
      hotClients,
      riskClients,
    }),
  };
}

export function formatGuarani(value: number) {
  return `Gs.\u00A0${Math.round(value).toLocaleString("es-PY")}`;
}