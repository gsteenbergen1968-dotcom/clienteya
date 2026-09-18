export type RelationshipTemperature =
  | "hot"
  | "warm"
  | "cold"
  | "inactive";

export type RelationshipTemperatureResult = {
  temperature: RelationshipTemperature;
  score: number;
  label: string;
  reason: string;
};

type Relationship = {
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

  return Math.round(
    diff / (1000 * 60 * 60 * 24)
  );
}

export function getRelationshipTemperature(
  relationship: Relationship
): RelationshipTemperatureResult {
  let score = 40;

  const estado = normalize(relationship.estado);
  const notas = normalize(relationship.notas);

  const days = daysUntil(
    relationship.proximo_contacto
  );

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

  if (
    relationship.monto &&
    relationship.monto > 0
  ) {
    score += 10;
  }

  if (relationship.pagado) {
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

  score = Math.max(
    0,
    Math.min(100, score)
  );

  if (score >= 80) {
    return {
      temperature: "hot",
      score,
      label: "Relación caliente",
      reason:
        "Alta intención comercial detectada.",
    };
  }

  if (score >= 60) {
    return {
      temperature: "warm",
      score,
      label: "Relación activa",
      reason:
        "Existe potencial comercial activo.",
    };
  }

  if (score >= 35) {
    return {
      temperature: "cold",
      score,
      label: "Relación fría",
      reason:
        "Interacción comercial baja o lenta.",
    };
  }

  return {
    temperature: "inactive",
    score,
    label: "Inactiva",
    reason:
      "Relación con señales mínimas o inactivas.",
  };
}

export function getRelationshipTemperatureClasses(
  temperature: RelationshipTemperature
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