import { buildClientMemory } from "./client-memory";

type Cliente = {
  id: string;
  nombre: string;
  telefono?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  monto?: number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
  created_at?: string | null;
};

export type DailyFocusItem = {
  cliente: Cliente;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium";
  action:
    | "contact_now"
    | "close_sale"
    | "reactivate"
    | "schedule_followup"
    | "relationship";
  score: number;
};

export type DailyFocusEngine = {
  summary: string;
  operationalAdvice: string;

  topPriorities: DailyFocusItem[];

  hotLeads: DailyFocusItem[];

  ghostingRisks: DailyFocusItem[];

  revenueOpportunities: DailyFocusItem[];

  noTouchRisks: DailyFocusItem[];

  stats: {
    critical: number;
    high: number;
    medium: number;
    hotLeads: number;
    ghostingRisks: number;
    revenuePipeline: number;
  };
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(date: string | null | undefined, today: string) {
  if (!date) return null;

  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);

  return Math.round(
    (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function buildPriority(
  score: number
): "critical" | "high" | "medium" {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";

  return "medium";
}

function buildAction(memory: ReturnType<typeof buildClientMemory>) {
  if (memory.recommendedAction === "close") {
    return "close_sale";
  }

  if (memory.recommendedAction === "reactivate") {
    return "reactivate";
  }

  if (memory.recommendedAction === "maintain_relationship") {
    return "relationship";
  }

  if (memory.recommendedAction === "schedule") {
    return "schedule_followup";
  }

  return "contact_now";
}

function buildDescription(
  cliente: Cliente,
  memory: ReturnType<typeof buildClientMemory>
) {
  const amount =
    cliente.monto && cliente.monto > 0
      ? ` Potencial: ${cliente.monto.toLocaleString("es-PY")} PYG.`
      : "";

  return `${memory.summary} ${memory.nextBestStep}${amount}`;
}

function buildTitle(
  cliente: Cliente,
  memory: ReturnType<typeof buildClientMemory>
) {
  if (memory.salesTemperature === "hot") {
    return `🔥 ${cliente.nombre} puede cerrar hoy`;
  }

  if (memory.ghostingRisk === "high") {
    return `⚠️ ${cliente.nombre} está desapareciendo`;
  }

  if (memory.salesTemperature === "closed") {
    return `💚 Mantener relación con ${cliente.nombre}`;
  }

  if (memory.followupFatigue === "high") {
    return `🧠 ${cliente.nombre} necesita menos presión`;
  }

  return `📌 Seguimiento para ${cliente.nombre}`;
}

function buildFocusItem(cliente: Cliente): DailyFocusItem {
  const memory = buildClientMemory(cliente);

  return {
    cliente,
    title: buildTitle(cliente, memory),
    description: buildDescription(cliente, memory),
    priority: buildPriority(memory.score),
    action: buildAction(memory),
    score: memory.score,
  };
}

export function buildDailyFocus(
  clientes: Cliente[]
): DailyFocusEngine {
  const today = todayISO();

  const focusItems = clientes.map(buildFocusItem);

  const sorted = [...focusItems].sort((a, b) => b.score - a.score);

  const hotLeads = sorted.filter((item) => {
    const memory = buildClientMemory(item.cliente);

    return memory.salesTemperature === "hot";
  });

  const ghostingRisks = sorted.filter((item) => {
    const memory = buildClientMemory(item.cliente);

    return memory.ghostingRisk === "high";
  });

  const revenueOpportunities = sorted.filter((item) => {
    return (item.cliente.monto || 0) > 0;
  });

  const noTouchRisks = sorted.filter((item) => {
    const memory = buildClientMemory(item.cliente);

    const delta = daysBetween(
      item.cliente.proximo_contacto,
      today
    );

    return (
      memory.salesTemperature === "hot" &&
      delta !== null &&
      delta < 0
    );
  });

  const critical = sorted.filter(
    (item) => item.priority === "critical"
  );

  const high = sorted.filter(
    (item) => item.priority === "high"
  );

  const medium = sorted.filter(
    (item) => item.priority === "medium"
  );

  let summary =
    "La operación está estable. Mantener ritmo de seguimiento.";

  let operationalAdvice =
    "Prioriza clientes con mayor intención comercial antes de hacer nuevos contactos.";

  if (critical.length >= 3) {
    summary =
      "Hay múltiples oportunidades críticas que necesitan atención inmediata.";

    operationalAdvice =
      "Enfócate primero en cerrar oportunidades calientes y recuperar clientes en riesgo.";
  } else if (ghostingRisks.length >= 3) {
    summary =
      "Hay señales fuertes de ghosting en varios clientes.";

    operationalAdvice =
      "Reduce presión comercial y utiliza mensajes más suaves y simples.";
  } else if (hotLeads.length >= 3) {
    summary =
      "Hay varias oportunidades calientes listas para avanzar.";

    operationalAdvice =
      "Este es un buen momento para pedir decisiones claras y cerrar ventas.";
  }

  return {
    summary,
    operationalAdvice,

    topPriorities: sorted.slice(0, 5),

    hotLeads: hotLeads.slice(0, 5),

    ghostingRisks: ghostingRisks.slice(0, 5),

    revenueOpportunities: revenueOpportunities.slice(0, 5),

    noTouchRisks: noTouchRisks.slice(0, 5),

    stats: {
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      hotLeads: hotLeads.length,
      ghostingRisks: ghostingRisks.length,
      revenuePipeline: revenueOpportunities.reduce(
        (acc, item) => acc + (item.cliente.monto || 0),
        0
      ),
    },
  };
}