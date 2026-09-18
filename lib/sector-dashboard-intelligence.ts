import {
  buildSectorDecisionCopy,
  getBusinessTypeLabel,
  getSectorVocabulary,
  normalizeBusinessType,
  type BusinessType,
  type SectorDecisionTone,
  type SectorSignal,
} from "./sector-intelligence";

export type SectorDashboardRelationship = {
  id: string;
  nombre?: string | null;
  estado?: string | null;
  telefono?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  pagado?: boolean | null;
  monto?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SectorDashboardBusiness = {
  business_name?: string | null;
  business_sector?: string | null;
  tone?: string | null;
};

export type SectorDashboardPriority = {
  id: string;
  relationshipId: string;
  relationshipName: string;
  businessType: BusinessType;
  sectorLabel: string;
  signal: SectorSignal;
  title: string;
  description: string;
  actionLabel: string;
  reason: string;
  tone: SectorDecisionTone;
  priorityScore: number;
  href: string;
};

function daysBetween(date?: string | null) {
  if (!date) return 0;

  const target = new Date(date);

  if (Number.isNaN(target.getTime())) return 0;

  const now = new Date();
  const diff = now.getTime() - target.getTime();

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function daysUntil(date?: string | null) {
  if (!date) return null;

  const target = new Date(date);

  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  const diff = target.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getRelationshipName(relationship: SectorDashboardRelationship) {
  return relationship.nombre?.trim() || "Relación sin nombre";
}

function buildDecisionLabel(relationship: SectorDashboardRelationship) {
  const nextContactInDays = daysUntil(relationship.proximo_contacto);
  const daysSinceUpdate = daysBetween(
    relationship.updated_at || relationship.created_at,
  );
  const hasValue = Boolean(relationship.monto && relationship.monto > 0);

  if (relationship.pagado) return "Mantener relación";

  if (typeof nextContactInDays === "number" && nextContactInDays <= 0) {
    return "Actuar hoy";
  }

  if (hasValue) return "Cerrar oportunidad";

  if (daysSinceUpdate >= 10) return "Reactivar relación";

  if (typeof nextContactInDays === "number" && nextContactInDays <= 3) {
    return "Preparar seguimiento";
  }

  return "Dar seguimiento";
}

function buildReason(relationship: SectorDashboardRelationship) {
  const nextContactInDays = daysUntil(relationship.proximo_contacto);
  const daysSinceUpdate = daysBetween(
    relationship.updated_at || relationship.created_at,
  );

  if (relationship.pagado) {
    return "La relación ya generó valor. Mantén la relación activa.";
  }

  if (typeof nextContactInDays === "number" && nextContactInDays < 0) {
    return `Seguimiento atrasado hace ${Math.abs(nextContactInDays)} día(s).`;
  }

  if (typeof nextContactInDays === "number" && nextContactInDays === 0) {
    return "Seguimiento programado para hoy.";
  }

  if (daysSinceUpdate >= 10) {
    return `Sin movimiento visible desde hace ${daysSinceUpdate} día(s).`;
  }

  if (typeof nextContactInDays === "number" && nextContactInDays <= 3) {
    return `Próximo contacto en ${nextContactInDays} día(s).`;
  }

  return "La relación necesita una acción comercial clara.";
}

function calculatePriorityScore(relationship: SectorDashboardRelationship) {
  let score = 40;

  const nextContactInDays = daysUntil(relationship.proximo_contacto);
  const daysSinceUpdate = daysBetween(
    relationship.updated_at || relationship.created_at,
  );

  if (relationship.pagado) score += 5;

  if (relationship.monto && relationship.monto > 0) score += 20;

  if (typeof nextContactInDays === "number" && nextContactInDays < 0) {
    score += 35;
  }

  if (typeof nextContactInDays === "number" && nextContactInDays === 0) {
    score += 30;
  }

  if (typeof nextContactInDays === "number" && nextContactInDays > 0) {
    score += Math.max(0, 15 - nextContactInDays * 3);
  }

  if (daysSinceUpdate >= 14) score += 25;
  else if (daysSinceUpdate >= 7) score += 15;
  else if (daysSinceUpdate >= 3) score += 8;

  if (relationship.telefono) score += 8;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function buildSectorDashboardPriorities(input: {
  relationships: SectorDashboardRelationship[];
  business?: SectorDashboardBusiness | null;
  limit?: number;
}): SectorDashboardPriority[] {
  const businessType = normalizeBusinessType(
    input.business?.business_sector,
  );

  const sectorLabel = getBusinessTypeLabel(businessType);
  const vocabulary = getSectorVocabulary(businessType);
  const limit = input.limit || 3;

  return input.relationships
    .map((relationship) => {
      const decisionLabel = buildDecisionLabel(relationship);
      const reason = buildReason(relationship);
      const priorityScore = calculatePriorityScore(relationship);

      const sectorCopy = buildSectorDecisionCopy({
        businessType,
        decisionLabel,
        reason,
        estado: relationship.estado,
        daysOverdue: daysBetween(
          relationship.updated_at || relationship.created_at,
        ),
        hasWhatsapp: Boolean(relationship.telefono),
        isPaid: Boolean(relationship.pagado),
        hasValue: Boolean(
          relationship.monto && relationship.monto > 0,
        ),
      });

      const relationshipName = getRelationshipName(relationship);

      return {
        id: `sector-priority-${relationship.id}`,
        relationshipId: relationship.id,
        relationshipName,
        businessType,
        sectorLabel,
        signal: sectorCopy.signal,
        title: `${relationshipName}: ${
          sectorCopy.headline || vocabulary.followUp
        }`,
        description: sectorCopy.actionPhrase,
        actionLabel: sectorCopy.primaryVerb,
        reason: sectorCopy.humanReason,
        tone: sectorCopy.tone,
        priorityScore,
        href: `/dashboard/relationships/${relationship.id}`,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);
}

export function buildSectorDashboardIntro(input: {
  business?: SectorDashboardBusiness | null;
}) {
  const businessType = normalizeBusinessType(
    input.business?.business_sector,
  );

  const sectorLabel = getBusinessTypeLabel(businessType);

  if (businessType === "restaurant") {
    return {
      eyebrow: "Inteligencia para restaurante",
      title: "Relaciones que pueden volver hoy",
      description:
        "ClienteYA detecta relaciones ausentes, reservas pendientes y oportunidades de nueva visita.",
      sectorLabel,
    };
  }

  if (businessType === "fitness") {
    return {
      eyebrow: "Inteligencia para fitness",
      title: "Miembros que necesitan atención",
      description:
        "ClienteYA detecta miembros inactivos, renovaciones pendientes y riesgo de cancelación.",
      sectorLabel,
    };
  }

  if (businessType === "real_estate") {
    return {
      eyebrow: "Inteligencia inmobiliaria",
      title: "Interesados que necesitan seguimiento",
      description:
        "ClienteYA detecta visitas pendientes, interesados calientes y oportunidades que pueden enfriarse.",
      sectorLabel,
    };
  }

  if (businessType === "retail") {
    return {
      eyebrow: "Inteligencia para retail",
      title: "Relaciones con recompra probable",
      description:
        "ClienteYA detecta relaciones sin retorno, tickets abiertos y oportunidades de recompra.",
      sectorLabel,
    };
  }

  return {
    eyebrow: "Inteligencia comercial",
    title: "Relaciones que necesitan acción",
    description:
      "ClienteYA detecta prioridades comerciales y convierte datos en acciones simples.",
    sectorLabel,
  };
}