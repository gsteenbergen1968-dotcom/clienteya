export const labels = {
  aiScore: "Score AI",
  aiRecommendation: "Recomendación AI",
  aiSummary: "Resumen AI de la relación",
  aiRelationshipMemory: "Memoria comercial",
  aiNextBestStep: "Próximo mejor paso",

  businessHealth: "Salud comercial",
  healthScore: "Puntaje de salud",

  timeline: "Historial",
  activityTimeline: "Historial de actividad",

  smartQueue: "Cola inteligente",
  dailyFocus: "Foco del día",

  whatsappDraft: "Mensaje WhatsApp AI",
  sendWhatsapp: "Enviar WhatsApp",

  commercialSignal: "Señal comercial",
  commercialRisk: "Riesgo comercial",

  expectedRevenue: "Potencial",
  revenue: "Ingresos",

  automations: "Automatizaciones",
  followUps: "Seguimientos",
} as const;

export type LabelKey = keyof typeof labels;