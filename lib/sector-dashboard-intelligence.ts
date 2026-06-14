import {
  buildSectorDecisionCopy,
  getBusinessTypeLabel,
  getSectorVocabulary,
  normalizeBusinessType,
  type BusinessType,
  type SectorDecisionTone,
  type SectorSignal,
} from "./sector-intelligence";

export type SectorDashboardClient = {
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
  clienteId: string;
  clienteNombre: string;
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

function getClientName(cliente: SectorDashboardClient) {
  return cliente.nombre?.trim() || "Cliente sin nombre";
}

function buildDecisionLabel(cliente: SectorDashboardClient) {
  const nextContactInDays = daysUntil(cliente.proximo_contacto);
  const daysSinceUpdate = daysBetween(cliente.updated_at || cliente.created_at);
  const hasValue = Boolean(cliente.monto && cliente.monto > 0);

  if (cliente.pagado) return "Mantener relación";

  if (typeof nextContactInDays === "number" && nextContactInDays <= 0) {
    return "Actuar hoy";
  }

  if (hasValue) return "Cerrar oportunidad";

  if (daysSinceUpdate >= 10) return "Reactivar cliente";

  if (typeof nextContactInDays === "number" && nextContactInDays <= 3) {
    return "Preparar seguimiento";
  }

  return "Dar seguimiento";
}

function buildReason(cliente: SectorDashboardClient) {
  const nextContactInDays = daysUntil(cliente.proximo_contacto);
  const daysSinceUpdate = daysBetween(cliente.updated_at || cliente.created_at);

  if (cliente.pagado) {
    return "Cliente ya generó valor. Mantén la relación activa.";
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

  return "Cliente necesita una acción comercial clara.";
}

function calculatePriorityScore(cliente: SectorDashboardClient) {
  let score = 40;

  const nextContactInDays = daysUntil(cliente.proximo_contacto);
  const daysSinceUpdate = daysBetween(cliente.updated_at || cliente.created_at);

  if (cliente.pagado) score += 5;

  if (cliente.monto && cliente.monto > 0) score += 20;

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

  if (cliente.telefono) score += 8;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function buildSectorDashboardPriorities(input: {
  clientes: SectorDashboardClient[];
  business?: SectorDashboardBusiness | null;
  limit?: number;
}): SectorDashboardPriority[] {
  const businessType = normalizeBusinessType(input.business?.business_sector);
  const sectorLabel = getBusinessTypeLabel(businessType);
  const vocabulary = getSectorVocabulary(businessType);
  const limit = input.limit || 3;

  return input.clientes
    .map((cliente) => {
      const decisionLabel = buildDecisionLabel(cliente);
      const reason = buildReason(cliente);
      const priorityScore = calculatePriorityScore(cliente);

      const sectorCopy = buildSectorDecisionCopy({
        businessType,
        decisionLabel,
        reason,
        estado: cliente.estado,
        daysOverdue: daysBetween(cliente.updated_at || cliente.created_at),
        hasWhatsapp: Boolean(cliente.telefono),
        isPaid: Boolean(cliente.pagado),
        hasValue: Boolean(cliente.monto && cliente.monto > 0),
      });

      const clienteNombre = getClientName(cliente);

      return {
        id: `sector-priority-${cliente.id}`,
        clienteId: cliente.id,
        clienteNombre,
        businessType,
        sectorLabel,
        signal: sectorCopy.signal,
        title: `${clienteNombre}: ${sectorCopy.headline || vocabulary.followUp}`,
        description: sectorCopy.actionPhrase,
        actionLabel: sectorCopy.primaryVerb,
        reason: sectorCopy.humanReason,
        tone: sectorCopy.tone,
        priorityScore,
        href: `/dashboard/clientes/${cliente.id}`,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);
}

export function buildSectorDashboardIntro(input: {
  business?: SectorDashboardBusiness | null;
}) {
  const businessType = normalizeBusinessType(input.business?.business_sector);
  const sectorLabel = getBusinessTypeLabel(businessType);

  if (businessType === "restaurant") {
    return {
      eyebrow: "Inteligencia para restaurante",
      title: "Clientes que pueden volver hoy",
      description:
        "ClienteYA detecta clientes ausentes, reservas pendientes y oportunidades de nueva visita.",
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
      title: "Clientes con recompra probable",
      description:
        "ClienteYA detecta clientes sin retorno, tickets abiertos y oportunidades de recompra.",
      sectorLabel,
    };
  }

  return {
    eyebrow: "Inteligencia comercial",
    title: "Clientes que necesitan acción",
    description:
      "ClienteYA detecta prioridades comerciales y convierte datos en acciones simples.",
    sectorLabel,
  };
}