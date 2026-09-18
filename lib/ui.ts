export const ui = {
  brand: {
    name: "ClienteYA",
    context: "Sistema ejecutivo para gestión comercial",
  },

  layout: {
    page: "mx-auto w-full max-w-7xl px-4 pb-24 pt-4 sm:px-6 lg:px-8",
    section: "space-y-6",
    grid: {
      executive: "grid gap-4 xl:grid-cols-12",
      cards: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
      twoColumn: "grid gap-4 xl:grid-cols-2",
      threeColumn: "grid gap-4 xl:grid-cols-3",
    },
  },

  cards: {
    base:
      "rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all",
    hover: "hover:border-slate-300 hover:shadow-md",
    padding: {
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
    },
  },

  surfaces: {
    glass: "backdrop-blur-xl bg-white/80 border border-white/40 shadow-sm",
    muted: "bg-slate-50 border border-slate-200",
    elevated: "bg-white shadow-lg border border-slate-200",
  },

  typography: {
    pageTitle: "text-3xl font-black tracking-tight text-slate-900 sm:text-4xl",
    sectionTitle: "text-xl font-black tracking-tight text-slate-900",
    cardTitle: "text-base font-bold text-slate-900",
    body: "text-sm text-slate-600",
    muted: "text-sm text-slate-500",
    kpi: "text-3xl font-black tracking-tight text-slate-900",
    label: "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400",
  },

  buttons: {
    base:
      "inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl px-4 py-2 text-sm font-black shadow-sm transition active:scale-[0.98]",
    primary:
      "inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]",
    secondary:
      "inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]",
    success:
      "inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100 active:scale-[0.98]",
    danger:
      "inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100 active:scale-[0.98]",
    ghost:
      "inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 active:scale-[0.98]",
    blue:
      "inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]",
    compact: {
      primary:
        "inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]",
      secondary:
        "inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]",
      success:
        "inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100 active:scale-[0.98]",
      danger:
        "inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 shadow-sm transition hover:bg-red-100 active:scale-[0.98]",
      ghost:
        "inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 active:scale-[0.98]",
    },
  },

  inputs: {
    base:
      "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200",
    label: "mb-2 block text-sm font-semibold text-slate-700",
  },

  badges: {
    neutral:
      "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700",
    success:
      "inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700",
    warning:
      "inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700",
    danger:
      "inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700",
    info:
      "inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700",
  },

  mobile: {
    bottomNavHeight: "h-20",
    safeBottom: "pb-24",
    touch: "min-h-[48px] min-w-[48px]",
  },

  animations: {
    card: "transition-all duration-200",
    hover: "hover:-translate-y-[1px]",
  },

  nav: {
    dashboard: "Resumen",
    cockpit: "Cockpit",
    relaciones: "Relaciones",
    calendario: "Planificación",
    automations: "Automatizaciones",
    nuevaRelacion: "Nueva relación",
    configuracion: "Configuración",
    salir: "Salir",
  },

  actions: {
    create: "Crear",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    view: "Ver",
    open: "Abrir",
    close: "Cerrar",
    continue: "Continuar",
    contact: "Contactar",
    markDone: "Marcar como listo",
    refresh: "Actualizar",
    filter: "Filtrar",
    clearFilters: "Limpiar filtros",
    search: "Buscar",
  },

  status: {
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
    completed: "Completado",
    overdue: "Vencido",
    today: "Hoy",
    tomorrow: "Mañana",
    thisWeek: "Esta semana",
    noDate: "Sin fecha",
    urgent: "Urgente",
    high: "Alta prioridad",
    medium: "Prioridad media",
    low: "Baja prioridad",
  },

  dashboard: {
    title: "Resumen ejecutivo",
    description:
      "Vista central de relaciones, ingresos, riesgos comerciales y prioridades operativas.",
    dailyFocus: "Enfoque diario",
    aiCockpit: "AI Cockpit",
    founderBriefing: "Founder Briefing",
    revenueForecast: "Proyección de ingresos",
    pipelineRisk: "Riesgo de pipeline",
    noDataTitle: "Sin información disponible",
    noDataDescription:
      "Cuando haya actividad suficiente, ClienteYA mostrará aquí los indicadores ejecutivos.",
  },

  relationships: {
    title: "Relaciones",
    description:
      "Gestiona relaciones, seguimiento comercial, recordatorios y oportunidades activas.",
    newRelationship: "Nueva relación",
    relationshipName: "Nombre de la relación",
    phone: "Teléfono",
    email: "Correo electrónico",
    company: "Empresa",
    status: "Estado",
    nextContact: "Próximo contacto",
    reminder: "Recordatorio",
    notes: "Notas",
    noRelationshipsTitle: "Todavía no hay relaciones",
    noRelationshipsDescription:
      "Agrega tu primera relación para comenzar a construir tu pipeline comercial.",
  },

  calendar: {
    title: "Calendario",
    description:
      "Visualiza recordatorios, seguimientos y acciones comerciales pendientes.",
    upcoming: "Próximos seguimientos",
    overdue: "Seguimientos vencidos",
    noEventsTitle: "Sin eventos programados",
    noEventsDescription:
      "Los próximos contactos y recordatorios aparecerán aquí automáticamente.",
  },

  automations: {
    title: "Automatizaciones",
    description:
      "Reglas inteligentes para detectar acciones pendientes, riesgos y oportunidades.",
    activeRules: "Reglas activas",
    detectedActions: "Acciones detectadas",
    noAutomationsTitle: "Sin automatizaciones activas",
    noAutomationsDescription:
      "Cuando existan relaciones con seguimiento pendiente, ClienteYA generará alertas automáticas.",
  },

  ai: {
    cockpitTitle: "AI Cockpit",
    cockpitDescription:
      "Centro inteligente para priorizar relaciones, riesgos y oportunidades.",
    briefingTitle: "Founder Briefing",
    briefingDescription:
      "Resumen ejecutivo con lo más importante para tomar decisiones rápidas.",
    focusTitle: "Enfoque diario",
    focusDescription:
      "Las acciones más importantes que requieren atención hoy.",
    insight: "Insight AI",
    recommendation: "Recomendación",
    riskDetected: "Riesgo detectado",
    opportunityDetected: "Oportunidad detectada",
  },

  revenue: {
    title: "Proyección de ingresos",
    description:
      "Estimación ejecutiva basada en pipeline, actividad y oportunidades actuales.",
    expectedRevenue: "Ingresos esperados",
    potentialRevenue: "Ingresos potenciales",
    conversionRisk: "Riesgo de conversión",
    pipelineValue: "Valor del pipeline",
  },

  empty: {
    defaultTitle: "Sin datos disponibles",
    defaultDescription:
      "Cuando haya suficiente información, esta sección se actualizará automáticamente.",
  },

  errors: {
    genericTitle: "Algo salió mal",
    genericDescription:
      "No se pudo cargar la información. Intenta actualizar la página.",
    missingData: "Información incompleta",
    unauthorized: "No tienes acceso a esta sección",
  },
} as const;

export type UI = typeof ui;