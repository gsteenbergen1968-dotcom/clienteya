import {
  buildMemoryPatternClusters,
  type CommercialMemoryClient,
} from "./memory-pattern-clusters";

export type FounderMemoryBriefing = {
  memoryScore: number;
  memoryLabel: string;
  summary: string;
  founderReminder: string;
  strongestPattern: string;
  mainRisk: string;
  bestAction: string;
  totalPatterns: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function buildFounderMemoryBriefing(
  clients: CommercialMemoryClient[],
): FounderMemoryBriefing {
  const patterns = buildMemoryPatternClusters(clients);

  const totalPatterns = patterns.clusters.length;

  const totalClients =
    Number((patterns.summary as any)?.totalClients) ||
    clients.length ||
    0;

  const calculatedScore =
    40 +
    totalPatterns * 8 +
    clients.length * 0.5 +
    totalClients * 0.25;

  const memoryScore = clamp(
    Math.round(
      Number.isFinite(calculatedScore)
        ? calculatedScore
        : 40,
    ),
  );

  let memoryLabel = "Inicial";

  if (memoryScore >= 85) {
    memoryLabel = "Excelente";
  } else if (memoryScore >= 70) {
    memoryLabel = "Avanzada";
  } else if (memoryScore >= 55) {
    memoryLabel = "Activa";
  }

  const strongestPattern =
    patterns.clusters[0]?.title ??
    "ClienteYA todavía está aprendiendo patrones.";

  const mainRisk =
    (patterns.summary as any)?.mainRisk ||
    "No se detectan riesgos relevantes actualmente.";

  const bestAction =
    (patterns.summary as any)?.bestAction ||
    "Continúa registrando actividad comercial.";

  const summary =
    totalPatterns > 0
      ? `ClienteYA detectó ${totalPatterns} patrones comerciales relevantes en tu negocio.`
      : "ClienteYA todavía está construyendo memoria comercial.";

  const founderReminder =
    totalPatterns > 0
      ? "La memoria comercial mejora cuando cada interacción queda registrada."
      : "Registra contactos, seguimientos y pagos para acelerar el aprendizaje de ClienteYA.";

  return {
    memoryScore: Number.isFinite(memoryScore)
      ? memoryScore
      : 40,
    memoryLabel,
    summary,
    founderReminder,
    strongestPattern,
    mainRisk,
    bestAction,
    totalPatterns,
  };
}