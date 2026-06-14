export type FounderStrategicSignalPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type FounderStrategicSignal = {
  title: string;
  description: string;
  recommendation: string;
  priority: FounderStrategicSignalPriority;
};

export type FounderStrategicSignalInput = {
  responseRate: number;
  conversionRate: number;
  followupRate: number;
  activeClients: number;
  opportunities: number;
  revenue: number;
};

export function getFounderStrategicSignalPriorityLabel(
  priority: FounderStrategicSignalPriority,
) {
  if (priority === "critical") return "Crítico";
  if (priority === "high") return "Alto";
  if (priority === "medium") return "Medio";
  return "Bajo";
}

export function getFounderStrategicSignalPriorityClasses(
  priority: FounderStrategicSignalPriority,
) {
  if (priority === "critical") {
    return "bg-red-50 text-red-700 ring-1 ring-red-200";
  }

  if (priority === "high") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  if (priority === "medium") {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }

  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
}

export function buildFounderStrategicSignals(
  input: FounderStrategicSignalInput,
): FounderStrategicSignal[] {
  const signals: FounderStrategicSignal[] = [];

  if (
    input.opportunities >= 10 &&
    input.conversionRate < 35
  ) {
    signals.push({
      title: "Crecimiento bloqueado",
      description:
        "El negocio está generando oportunidades, pero la conversión está limitando el crecimiento.",
      recommendation:
        "Revisar proceso comercial y priorizar clientes con mayor intención de compra.",
      priority: "high",
    });
  }

  if (
    input.responseRate >= 70 &&
    input.followupRate >= 80
  ) {
    signals.push({
      title: "Relaciones saludables",
      description:
        "Los clientes responden y reciben seguimiento constante. Existe una base comercial sólida.",
      recommendation:
        "Aumentar captación para aprovechar la capacidad comercial existente.",
      priority: "low",
    });
  }

  if (
    input.responseRate < 40 &&
    input.followupRate < 50
  ) {
    signals.push({
      title: "Riesgo de enfriamiento comercial",
      description:
        "Las relaciones comerciales muestran baja interacción y poco seguimiento.",
      recommendation:
        "Contactar clientes pendientes esta semana y recuperar conversaciones activas.",
      priority: "critical",
    });
  }

  if (
    input.activeClients < 5 &&
    input.opportunities < 5
  ) {
    signals.push({
      title: "Actividad insuficiente",
      description:
        "La actividad comercial actual podría ser insuficiente para sostener crecimiento futuro.",
      recommendation:
        "Incrementar prospección y generación de nuevas oportunidades.",
      priority: "medium",
    });
  }

  if (
    input.revenue > 0 &&
    input.conversionRate >= 60
  ) {
    signals.push({
      title: "Motor comercial eficiente",
      description:
        "Las oportunidades se convierten en ingresos de forma consistente.",
      recommendation:
        "Escalar volumen comercial manteniendo la calidad del seguimiento.",
      priority: "low",
    });
  }

  return signals;
}