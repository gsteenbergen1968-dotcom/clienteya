import {
  detectRelationshipPhase,
  type RelationshipPhase,
} from "./phase-detection";

type Relationship = {
  id: string;
  nombre: string;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
};

export type PipelineAnalytics = {
  total: number;
  nuevo_lead: number;
  interesado: number;
  negociacion: number;
  esperando_pago: number;
  cerrado: number;
  perdido: number;
  sin_respuesta: number;
};

export function buildPipelineAnalytics(
  relationships: Relationship[]
): PipelineAnalytics {
  const analytics: PipelineAnalytics = {
    total: relationships.length,
    nuevo_lead: 0,
    interesado: 0,
    negociacion: 0,
    esperando_pago: 0,
    cerrado: 0,
    perdido: 0,
    sin_respuesta: 0,
  };

  for (const relationship of relationships) {
    const phase = detectRelationshipPhase(relationship);

    analytics[phase.phase]++;
  }

  return analytics;
}

export function getPipelinePercentage(
  value: number,
  total: number
) {
  if (total === 0) return 0;

  return Math.round((value / total) * 100);
}