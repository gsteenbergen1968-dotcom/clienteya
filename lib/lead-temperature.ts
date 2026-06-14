export type LeadTemperature =
  | "hot"
  | "warm"
  | "cold"
  | "inactive";

export type LeadTemperatureResult = {
  temperature: LeadTemperature;
  score: number;
  label: string;
  reason: string;
};

type Cliente = {
  estado?: string | null;
  notas?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  proximo_contacto?: string | null;
};

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function daysUntil(date: string | null | undefined) {
  if (!date) return null;

  const today = new Date();
  const target = new Date(date);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();

  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function getLeadTemperature(
  cliente: Cliente
): LeadTemperatureResult {
  let score = 40;

  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);

  const days = daysUntil(cliente.proximo_contacto);

  if (
    estado.includes("interes") ||
    estado.includes("lead") ||
    notas.includes("interesado")
  ) {
    score += 25;
  }

  if (
    notas.includes("precio") ||
    notas.includes("presupuesto") ||
    notas.includes("cotizacion") ||
    notas.includes("cotización")
  ) {
    score += 20;
  }

  if (cliente.monto && cliente.monto > 0) {
    score += 10;
  }

  if (cliente.pagado) {
    score += 25;
  }

  if (days !== null) {
    if (days < 0) {
      score -= 15;
    }

    if (days === 0) {
      score += 10;
    }

    if (days > 7) {
      score -= 10;
    }
  }

  if (
    estado.includes("sin respuesta") ||
    estado.includes("inactivo") ||
    notas.includes("no responde")
  ) {
    score -= 30;
  }

  score = Math.max(0, Math.min(100, score));

  if (score >= 80) {
    return {
      temperature: "hot",
      score,
      label: "Hot Lead",
      reason: "Alta intención comercial detectada.",
    };
  }

  if (score >= 60) {
    return {
      temperature: "warm",
      score,
      label: "Warm Lead",
      reason: "Existe potencial comercial activo.",
    };
  }

  if (score >= 35) {
    return {
      temperature: "cold",
      score,
      label: "Cold Lead",
      reason: "Interacción comercial baja o lenta.",
    };
  }

  return {
    temperature: "inactive",
    score,
    label: "Inactive",
    reason: "Lead con señales mínimas o inactivas.",
  };
}

export function getLeadTemperatureClasses(
  temperature: LeadTemperature
) {
  if (temperature === "hot") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (temperature === "warm") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (temperature === "cold") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}