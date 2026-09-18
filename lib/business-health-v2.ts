import { buildRevenueAnalyticsV2 } from "./revenue-analytics-v2";
import type { RelationshipRecord } from "./relationship-repository";
import { buildSmartQueue } from "./smart-queue";

export type BusinessHealthV2 = {
  score: number;
  label: string;
  tone: "green" | "amber" | "red" | "blue";
  summary: string;
  risks: string[];
  opportunities: string[];
  recommendations: string[];
};

type PipelineSummary = {
  noResponse: number;
  closed: number;
  awaitingPayment: number;
};

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function buildPipelineSummary(
  relationships: RelationshipRecord[],
): PipelineSummary {
  return relationships.reduce(
    (summary, relationship) => {
      const status = normalize(relationship.status);
      const notes = normalize(relationship.notes);
      const reminder = normalize(relationship.reminder);
      const text = `${status} ${notes} ${reminder}`;

      if (
        status.includes("sin respuesta") ||
        text.includes("no responde") ||
        text.includes("reintentar")
      ) {
        summary.noResponse += 1;
      }

      if (
        status.includes("cerr") ||
        status.includes("pag") ||
        status.includes("convert")
      ) {
        summary.closed += 1;
      }

      if (
        text.includes("esperando pago") ||
        text.includes("pendiente de pago") ||
        text.includes("transferencia") ||
        text.includes("comprobante")
      ) {
        summary.awaitingPayment += 1;
      }

      return summary;
    },
    {
      noResponse: 0,
      closed: 0,
      awaitingPayment: 0,
    },
  );
}

export function buildBusinessHealthV2(
  relationships: RelationshipRecord[],
): BusinessHealthV2 {
  const safeRelationships = Array.isArray(relationships)
    ? relationships
    : [];

  const revenue = buildRevenueAnalyticsV2(safeRelationships);
  const pipeline = buildPipelineSummary(safeRelationships);
  const smartQueue = buildSmartQueue(safeRelationships);

  if (safeRelationships.length === 0) {
    return {
      score: 0,
      label: "Sin datos suficientes",
      tone: "blue",
      summary:
        "Todavía no hay suficientes relaciones para medir salud comercial.",
      risks: ["No hay pipeline activo."],
      opportunities: [
        "Agrega relaciones para activar inteligencia comercial.",
      ],
      recommendations: [
        "Registrar nuevas relaciones y definir próximo contacto.",
      ],
    };
  }

  let score = 70;

  const risks: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];

  if (revenue.conversionRate >= 60) {
    score += 15;
    opportunities.push("La conversión está fuerte.");
  } else if (revenue.conversionRate < 25) {
    score -= 20;
    risks.push("La conversión está baja.");
    recommendations.push(
      "Revisar mensajes, seguimiento y oferta comercial.",
    );
  }

  if (pipeline.noResponse > pipeline.closed) {
    score -= 15;
    risks.push("Hay más relaciones sin respuesta que cerradas.");
    recommendations.push("Usar mensajes cortos de reactivación.");
  }

  if (pipeline.awaitingPayment > 0) {
    score += 10;
    opportunities.push(
      "Hay relaciones cerca de conversión en fase de pago.",
    );
    recommendations.push(
      "Priorizar comprobantes y confirmaciones de pago.",
    );
  }

  if (smartQueue.length > 0) {
    opportunities.push("Hay acciones claras priorizadas para hoy.");
    recommendations.push("Ejecutar primero la Smart Action Queue.");
  } else {
    score -= 10;
    risks.push("No hay acciones prioritarias detectadas.");
  }

  if (revenue.expectedRevenue > revenue.wonRevenue) {
    opportunities.push(
      "Hay ingresos abiertos que todavía pueden convertirse.",
    );
  }

  score = Math.max(0, Math.min(100, score));

  const label =
    score >= 80
      ? "Salud comercial fuerte"
      : score >= 55
        ? "Salud comercial estable"
        : "Salud comercial en riesgo";

  const tone: BusinessHealthV2["tone"] =
    score >= 80 ? "green" : score >= 55 ? "amber" : "red";

  const summary =
    score >= 80
      ? "El pipeline muestra buenas señales comerciales."
      : score >= 55
        ? "El pipeline está funcionando, pero necesita seguimiento constante."
        : "El pipeline necesita atención para evitar pérdida de oportunidades.";

  return {
    score,
    label,
    tone,
    summary,
    risks,
    opportunities,
    recommendations,
  };
}

export function getBusinessHealthClassesV2(
  tone: BusinessHealthV2["tone"],
): string {
  if (tone === "green") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  return "border-sky-200 bg-sky-50 text-sky-900";
}