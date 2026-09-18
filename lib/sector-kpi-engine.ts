import {
  getBusinessTypeLabel,
  normalizeBusinessType,
  type BusinessType,
} from "./sector-intelligence";

export type SectorKpiTone = "slate" | "red" | "amber" | "sky" | "emerald";

export type SectorKpiDefinition = {
  key: string;
  label: string;
  description: string;
  tone: SectorKpiTone;
};

export type SectorKpiVocabulary = {
  businessType: BusinessType;
  sectorLabel: string;
  dashboardTitle: string;
  dashboardDescription: string;
  kpis: SectorKpiDefinition[];
};

export function buildSectorKpiVocabulary(
  businessType?: string | null
): SectorKpiVocabulary {
  const normalizedType = normalizeBusinessType(businessType);
  const sectorLabel = getBusinessTypeLabel(normalizedType);

  if (normalizedType === "restaurant") {
    return {
      businessType: normalizedType,
      sectorLabel,
      dashboardTitle: "Pulso comercial del restaurante",
      dashboardDescription:
        "ClienteYA resume relaciones, ausencias, reactivaciones e ingresos potenciales.",
      kpis: [
        {
          key: "relationships",
          label: "Relaciones",
          description: "Personas registradas en la memoria comercial.",
          tone: "slate",
        },
        {
          key: "urgent",
          label: "Reactivaciones",
          description: "Relaciones que pueden volver si se contactan hoy.",
          tone: "red",
        },
        {
          key: "today",
          label: "Reservas",
          description: "Seguimientos o reservas que necesitan atención hoy.",
          tone: "amber",
        },
        {
          key: "opportunity",
          label: "Ingresos",
          description: "Valor potencial de pedidos, reservas o recompra.",
          tone: "emerald",
        },
      ],
    };
  }

  if (normalizedType === "fitness") {
    return {
      businessType: normalizedType,
      sectorLabel,
      dashboardTitle: "Pulso comercial del gimnasio",
      dashboardDescription:
        "ClienteYA resume miembros, inactivos, renovaciones y riesgo de abandono.",
      kpis: [
        {
          key: "relationships",
          label: "Miembros",
          description: "Personas registradas como miembros o prospectos.",
          tone: "slate",
        },
        {
          key: "urgent",
          label: "Inactivos",
          description: "Miembros que necesitan reactivación inmediata.",
          tone: "red",
        },
        {
          key: "today",
          label: "Renovaciones",
          description: "Seguimientos o renovaciones que requieren atención hoy.",
          tone: "amber",
        },
        {
          key: "opportunity",
          label: "Riesgo abandono",
          description: "Valor comercial que puede perderse sin seguimiento.",
          tone: "emerald",
        },
      ],
    };
  }

  if (normalizedType === "real_estate") {
    return {
      businessType: normalizedType,
      sectorLabel,
      dashboardTitle: "Pulso comercial inmobiliario",
      dashboardDescription:
        "ClienteYA resume interesados, visitas, propiedades abiertas y cierres potenciales.",
      kpis: [
        {
          key: "relationships",
          label: "Interesados",
          description: "Personas activas en búsqueda o consulta inmobiliaria.",
          tone: "slate",
        },
        {
          key: "urgent",
          label: "Visitas",
          description: "Interesados que necesitan seguimiento urgente.",
          tone: "red",
        },
        {
          key: "today",
          label: "Propiedades",
          description: "Seguimientos o propiedades que requieren acción hoy.",
          tone: "amber",
        },
        {
          key: "opportunity",
          label: "Cierres",
          description: "Valor potencial de operaciones abiertas.",
          tone: "emerald",
        },
      ],
    };
  }

  if (normalizedType === "retail") {
    return {
      businessType: normalizedType,
      sectorLabel,
      dashboardTitle: "Pulso comercial retail",
      dashboardDescription:
        "ClienteYA resume compradores, recompras, seguimientos y ventas potenciales.",
      kpis: [
        {
          key: "relationships",
          label: "Compradores",
          description: "Relaciones registradas con historial o intención de compra.",
          tone: "slate",
        },
        {
          key: "urgent",
          label: "Recompras",
          description: "Relaciones que pueden volver a comprar con seguimiento.",
          tone: "red",
        },
        {
          key: "today",
          label: "Seguimientos",
          description: "Contactos comerciales que requieren atención hoy.",
          tone: "amber",
        },
        {
          key: "opportunity",
          label: "Ventas",
          description: "Valor potencial de compras o pedidos abiertos.",
          tone: "emerald",
        },
      ],
    };
  }

  if (normalizedType === "beauty") {
    return {
      businessType: normalizedType,
      sectorLabel,
      dashboardTitle: "Pulso comercial de belleza",
      dashboardDescription:
        "ClienteYA resume citas, relaciones sin retorno, reservas y oportunidades de recompra.",
      kpis: [
        {
          key: "relationships",
          label: "Relaciones",
          description: "Personas registradas en la memoria comercial.",
          tone: "slate",
        },
        {
          key: "urgent",
          label: "Sin cita",
          description: "Relaciones que pueden volver con una invitación simple.",
          tone: "red",
        },
        {
          key: "today",
          label: "Reservas",
          description: "Citas o seguimientos que necesitan atención hoy.",
          tone: "amber",
        },
        {
          key: "opportunity",
          label: "Recompra",
          description: "Valor potencial de servicios, productos o nueva cita.",
          tone: "emerald",
        },
      ],
    };
  }

  if (normalizedType === "automotive") {
    return {
      businessType: normalizedType,
      sectorLabel,
      dashboardTitle: "Pulso comercial automotriz",
      dashboardDescription:
        "ClienteYA resume interesados, cotizaciones, pruebas y ventas potenciales.",
      kpis: [
        {
          key: "relationships",
          label: "Interesados",
          description: "Relaciones registradas con interés comercial.",
          tone: "slate",
        },
        {
          key: "urgent",
          label: "Cotizaciones",
          description: "Oportunidades que requieren seguimiento urgente.",
          tone: "red",
        },
        {
          key: "today",
          label: "Pruebas",
          description: "Seguimientos o pruebas que necesitan acción hoy.",
          tone: "amber",
        },
        {
          key: "opportunity",
          label: "Ventas",
          description: "Valor potencial de operaciones abiertas.",
          tone: "emerald",
        },
      ],
    };
  }

  if (normalizedType === "medical") {
    return {
      businessType: normalizedType,
      sectorLabel,
      dashboardTitle: "Pulso de seguimiento del paciente",
      dashboardDescription:
        "ClienteYA resume pacientes, consultas pendientes, controles y continuidad.",
      kpis: [
        {
          key: "relationships",
          label: "Pacientes",
          description: "Personas registradas con seguimiento activo.",
          tone: "slate",
        },
        {
          key: "urgent",
          label: "Pendientes",
          description: "Pacientes que necesitan seguimiento prioritario.",
          tone: "red",
        },
        {
          key: "today",
          label: "Consultas",
          description: "Consultas o controles que requieren atención hoy.",
          tone: "amber",
        },
        {
          key: "opportunity",
          label: "Continuidad",
          description: "Relaciones que deben mantenerse activas con cuidado.",
          tone: "emerald",
        },
      ],
    };
  }

  if (normalizedType === "education") {
    return {
      businessType: normalizedType,
      sectorLabel,
      dashboardTitle: "Pulso comercial educativo",
      dashboardDescription:
        "ClienteYA resume alumnos, inscripciones, seguimientos y oportunidades académicas.",
      kpis: [
        {
          key: "relationships",
          label: "Alumnos",
          description: "Alumnos o prospectos registrados.",
          tone: "slate",
        },
        {
          key: "urgent",
          label: "Inscripciones",
          description: "Interesados que necesitan seguimiento inmediato.",
          tone: "red",
        },
        {
          key: "today",
          label: "Seguimientos",
          description: "Contactos académicos que requieren acción hoy.",
          tone: "amber",
        },
        {
          key: "opportunity",
          label: "Oportunidades",
          description: "Valor potencial de inscripciones o continuidad.",
          tone: "emerald",
        },
      ],
    };
  }

  if (normalizedType === "consulting" || normalizedType === "services") {
    return {
      businessType: normalizedType,
      sectorLabel,
      dashboardTitle: "Pulso comercial profesional",
      dashboardDescription:
        "ClienteYA resume prospectos, seguimientos, reuniones y oportunidades abiertas.",
      kpis: [
        {
          key: "relationships",
          label: "Prospectos",
          description: "Contactos comerciales o relaciones potenciales.",
          tone: "slate",
        },
        {
          key: "urgent",
          label: "Seguimientos",
          description: "Prospectos que requieren contacto prioritario.",
          tone: "red",
        },
        {
          key: "today",
          label: "Reuniones",
          description: "Acciones o reuniones que requieren atención hoy.",
          tone: "amber",
        },
        {
          key: "opportunity",
          label: "Oportunidades",
          description: "Valor potencial de oportunidades abiertas.",
          tone: "emerald",
        },
      ],
    };
  }

  return {
    businessType: normalizedType,
    sectorLabel,
    dashboardTitle: "Pulso comercial",
    dashboardDescription:
      "ClienteYA resume relaciones, urgencias, acciones de hoy y oportunidades.",
    kpis: [
      {
        key: "relationships",
        label: "Relaciones",
        description: "Personas registradas en la memoria comercial.",
        tone: "slate",
      },
      {
        key: "urgent",
        label: "Urgentes",
        description: "Relaciones que necesitan atención prioritaria.",
        tone: "red",
      },
      {
        key: "today",
        label: "Hoy",
        description: "Acciones comerciales que requieren atención hoy.",
        tone: "amber",
      },
      {
        key: "opportunity",
        label: "Oportunidad",
        description: "Valor potencial de oportunidades abiertas.",
        tone: "emerald",
      },
    ],
  };
}

export function getSectorKpiByKey(
  vocabulary: SectorKpiVocabulary,
  key: string
): SectorKpiDefinition {
  return (
    vocabulary.kpis.find((kpi) => kpi.key === key) || {
      key,
      label: key,
      description: "Métrica comercial.",
      tone: "slate",
    }
  );
}