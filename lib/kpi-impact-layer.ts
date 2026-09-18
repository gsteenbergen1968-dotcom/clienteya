export type KPIImpactPriority = "critical" | "high" | "medium" | "low";

export type KPIImpactSignal = {
  title: string;
  impact: string;
  recommendation: string;
  priority: KPIImpactPriority;
};

export type KPIImpactInput = {
  responseRate: number;
  conversionRate: number;
  followupRate: number;
  activeRelationships: number;
  opportunities: number;
};

export type KPIImpactResult = {
  score: number;
  signals: KPIImpactSignal[];
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function getKPIImpactPriorityLabel(
  priority: KPIImpactPriority
) {
  if (priority === "critical") return "Crítico";
  if (priority === "high") return "Alto";
  if (priority === "medium") return "Medio";

  return "Bajo";
}

export function getKPIImpactPriorityClasses(
  priority: KPIImpactPriority
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

export function buildKPIImpactSignals(
  input: KPIImpactInput
): KPIImpactResult {
  const signals: KPIImpactSignal[] = [];

  if (input.conversionRate < 25) {
    signals.push({
      title: "Conversión baja",
      impact:
        "Las oportunidades están entrando al sistema, pero no se están convirtiendo al ritmo necesario.",
      recommendation:
        "Revisar propuesta comercial, seguimiento y próximos pasos con relaciones calientes.",
      priority: "high",
    });
  } else if (input.conversionRate >= 60) {
    signals.push({
      title: "Conversión saludable",
      impact:
        "El proceso comercial está convirtiendo oportunidades de forma eficiente.",
      recommendation:
        "Mantener el proceso actual y aumentar actividad comercial controlada.",
      priority: "low",
    });
  }

  if (input.responseRate < 40) {
    signals.push({
      title: "Respuesta débil",
      impact:
        "Las relaciones están respondiendo menos de lo esperado, lo que puede enfriar oportunidades comerciales.",
      recommendation:
        "Priorizar contactos pendientes hoy y usar mensajes más directos por WhatsApp.",
      priority: "high",
    });
  } else if (input.responseRate >= 70) {
    signals.push({
      title: "Relación activa",
      impact:
        "Existe buena actividad de respuesta y las relaciones comerciales siguen vivas.",
      recommendation:
        "Aprovechar esta actividad para avanzar cierres o confirmar próximos pasos.",
      priority: "low",
    });
  }

  if (input.followupRate < 50) {
    signals.push({
      title: "Seguimiento insuficiente",
      impact:
        "Las oportunidades pueden enfriarse porque no reciben seguimiento constante.",
      recommendation:
        "Crear acciones inmediatas de seguimiento para las relaciones con mayor valor.",
      priority: "critical",
    });
  } else if (input.followupRate >= 80) {
    signals.push({
      title: "Disciplina comercial fuerte",
      impact:
        "El seguimiento comercial es consistente y reduce el riesgo de oportunidades olvidadas.",
      recommendation:
        "Mantener la rutina actual y medir si mejora la conversión.",
      priority: "low",
    });
  }

  if (
    input.opportunities >= 10 &&
    input.conversionRate < 35
  ) {
    signals.push({
      title: "Demanda sin cierre suficiente",
      impact:
        "Hay oportunidades disponibles, pero el negocio no está capturando todo el potencial comercial.",
      recommendation:
        "Optimizar proceso de cierre y revisar relaciones con alta probabilidad.",
      priority: "high",
    });
  }

  if (
    input.activeRelationships < 5 &&
    input.opportunities < 5
  ) {
    signals.push({
      title: "Base comercial limitada",
      impact:
        "La actividad comercial actual puede ser insuficiente para sostener crecimiento.",
      recommendation:
        "Aumentar captación y generar nuevas conversaciones comerciales esta semana.",
      priority: "medium",
    });
  }

  const score = clamp(
    Math.round(
      input.responseRate * 0.25 +
        input.conversionRate * 0.3 +
        input.followupRate * 0.3 +
        Math.min(input.activeRelationships * 2, 10) +
        Math.min(input.opportunities * 1.5, 10)
    )
  );

  return {
    score,
    signals,
  };
}