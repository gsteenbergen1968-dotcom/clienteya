import { buildRevenueAnalytics } from "./revenue-analytics";
import { buildPipelineAnalytics } from "./pipeline-analytics";
import { buildSmartQueue } from "./smart-queue";

type Cliente = {
  id: string;
  nombre: string;
  telefono?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SmartQueueCliente = Cliente & {
  telefono: string;
};

export type BusinessHealth = {
  score: number;
  label: string;
  tone: "green" | "amber" | "red" | "blue";
  summary: string;
  risks: string[];
  opportunities: string[];
  recommendations: string[];
};

function normalizeForSmartQueue(cliente: Cliente): SmartQueueCliente {
  return {
    ...cliente,
    telefono: cliente.telefono || "",
  };
}

export function buildBusinessHealth(clientes: Cliente[]): BusinessHealth {
  const revenue = buildRevenueAnalytics(clientes);
  const pipeline = buildPipelineAnalytics(clientes);
  const smartQueue = buildSmartQueue(clientes.map(normalizeForSmartQueue));

  let score = 70;

  const risks: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];

  if (clientes.length === 0) {
    return {
      score: 0,
      label: "Sin datos suficientes",
      tone: "blue",
      summary: "Todavía no hay suficientes clientes para medir salud comercial.",
      risks: ["No hay pipeline activo."],
      opportunities: ["Agrega leads para activar inteligencia comercial."],
      recommendations: ["Registrar clientes nuevos y definir próximo contacto."],
    };
  }

  if (revenue.conversionRate >= 60) {
    score += 15;
    opportunities.push("La conversión está fuerte.");
  } else if (revenue.conversionRate < 25) {
    score -= 20;
    risks.push("La conversión está baja.");
    recommendations.push("Revisar mensajes, seguimiento y oferta comercial.");
  }

  if (pipeline.sin_respuesta > pipeline.cerrado) {
    score -= 15;
    risks.push("Hay más clientes sin respuesta que cerrados.");
    recommendations.push("Usar mensajes cortos de reactivación.");
  }

  if (pipeline.esperando_pago > 0) {
    score += 10;
    opportunities.push("Hay clientes cerca de conversión en fase de pago.");
    recommendations.push("Priorizar comprobantes y confirmaciones de pago.");
  }

  if (smartQueue.length > 0) {
    opportunities.push("Hay acciones claras priorizadas para hoy.");
    recommendations.push("Ejecutar primero la Smart Action Queue.");
  } else {
    score -= 10;
    risks.push("No hay acciones prioritarias detectadas.");
  }

  if (revenue.expectedRevenue > revenue.wonRevenue) {
    opportunities.push("Hay revenue abierto que todavía puede convertirse.");
  }

  score = Math.max(0, Math.min(100, score));

  const label =
    score >= 80
      ? "Salud comercial fuerte"
      : score >= 55
        ? "Salud comercial estable"
        : "Salud comercial en riesgo";

  const tone = score >= 80 ? "green" : score >= 55 ? "amber" : "red";

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

export function getBusinessHealthClasses(tone: BusinessHealth["tone"]) {
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