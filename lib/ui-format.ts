export function formatDateES(date?: string | Date | null) {
  if (!date) return "Sin fecha";

  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(parsedDate.getTime())) return "Fecha inválida";

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function formatDateTimeES(date?: string | Date | null) {
  if (!date) return "Sin fecha";

  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(parsedDate.getTime())) return "Fecha inválida";

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

export function formatCurrencyPYG(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "₲ 0";
  }

  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

export function getRelationshipStatusLabel(status?: string | null) {
  const normalized = status?.toLowerCase().trim();

  if (!normalized) return "Sin estado";

  const labels: Record<string, string> = {
    active: "Activo",
    activo: "Activo",
    inactive: "Inactivo",
    inactivo: "Inactivo",
    pending: "Pendiente",
    pendiente: "Pendiente",
    completed: "Completado",
    completado: "Completado",
    done: "Completado",
    overdue: "Vencido",
    vencido: "Vencido",
    lost: "Perdido",
    perdido: "Perdido",
    won: "Ganado",
    ganado: "Ganado",
    prospect: "Prospecto",
    prospecto: "Prospecto",
    lead: "Lead",
  };

  return labels[normalized] ?? status;
}

export function getPriorityLabel(priority?: string | null) {
  const normalized = priority?.toLowerCase().trim();

  if (!normalized) return "Sin prioridad";

  const labels: Record<string, string> = {
    urgent: "Urgente",
    urgente: "Urgente",
    high: "Alta prioridad",
    alta: "Alta prioridad",
    medium: "Prioridad media",
    media: "Prioridad media",
    low: "Baja prioridad",
    baja: "Baja prioridad",
  };

  return labels[normalized] ?? priority;
}

export function getRelativeDateLabel(date?: string | Date | null) {
  if (!date) return "Sin fecha";

  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(parsedDate.getTime())) return "Fecha inválida";

  const today = new Date();
  const target = new Date(parsedDate);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffInMs = target.getTime() - today.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) return "Vencido";
  if (diffInDays === 0) return "Hoy";
  if (diffInDays === 1) return "Mañana";
  if (diffInDays <= 7) return "Esta semana";

  return formatDateES(parsedDate);
}