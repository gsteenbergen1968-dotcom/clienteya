type Cliente = {
  nombre?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  pagado?: boolean | null;
  monto?: number | null;
};

export type AIClientSummary = {
  summary: string;
  commercialSignal: string;
  risk: string;
  nextBestStep: string;
  tone: "emerald" | "amber" | "red" | "sky" | "slate";
};

function daysUntil(date: string | null | undefined) {
  if (!date) return null;

  const today = new Date();
  const target = new Date(date);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase();
}

export function buildAIClientSummary(
  cliente: Cliente
): AIClientSummary {
  const estado = normalize(cliente.estado);
  const notas = normalize(cliente.notas);
  const recordatorio = normalize(cliente.recordatorio);

  const combined = `${estado} ${notas} ${recordatorio}`;

  const nextContactDelta = daysUntil(cliente.proximo_contacto);

  const paid =
    cliente.pagado ||
    estado.includes("pag") ||
    estado.includes("cerr");

  const interested =
    estado.includes("interes") ||
    combined.includes("precio") ||
    combined.includes("info") ||
    combined.includes("quiero") ||
    combined.includes("interesa");

  const cold =
    estado.includes("sin respuesta") ||
    combined.includes("despues") ||
    combined.includes("más adelante") ||
    combined.includes("mas adelante");

  const urgent =
    nextContactDelta !== null && nextContactDelta < 0;

  if (paid) {
    return {
      summary:
        "Cliente convertido correctamente y con señales positivas de continuidad.",

      commercialSignal:
        "La venta ya fue cerrada. Existe oportunidad de fidelización o recompra.",

      risk:
        "Riesgo comercial bajo. Evitar perder relación post-venta.",

      nextBestStep:
        "Enviar seguimiento post-venta y mantener contacto activo.",

      tone: "emerald",
    };
  }

  if (urgent) {
    return {
      summary:
        "El cliente tiene seguimiento vencido y necesita atención inmediata.",

      commercialSignal:
        "Todavía existe oportunidad comercial si se reactiva rápido.",

      risk:
        "Cada día sin respuesta reduce la probabilidad de conversión.",

      nextBestStep:
        "Enviar WhatsApp hoy y reagendar próximo contacto.",

      tone: "red",
    };
  }

  if (interested) {
    return {
      summary:
        "El cliente mostró interés comercial y sigue activo en el pipeline.",

      commercialSignal:
        "Buenas señales de intención. Existe potencial de conversión.",

      risk:
        "Demasiada demora puede enfriar la oportunidad.",

      nextBestStep:
        "Reducir fricción y pedir una decisión simple.",

      tone: "amber",
    };
  }

  if (cold) {
    return {
      summary:
        "La conversación perdió ritmo y el cliente parece menos activo.",

      commercialSignal:
        "Todavía hay oportunidad si el contacto vuelve a activarse.",

      risk:
        "El cliente puede desaparecer del pipeline si no hay seguimiento.",

      nextBestStep:
        "Enviar mensaje corto y amigable para reactivar conversación.",

      tone: "sky",
    };
  }

  return {
    summary:
      "Cliente en seguimiento normal dentro del pipeline comercial.",

    commercialSignal:
      "No hay señales negativas importantes por ahora.",

    risk:
      "Mantener consistencia en seguimiento y actualización de datos.",

    nextBestStep:
      "Continuar seguimiento y mantener el CRM actualizado.",

    tone: "slate",
  };
}

export function getAIClientSummaryClasses(
  tone: AIClientSummary["tone"]
) {
  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (tone === "sky") {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}