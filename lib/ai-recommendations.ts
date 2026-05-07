type Cliente = {
  id: string;
  nombre: string;
  estado?: string | null;
  notas?: string | null;
  proximo_contacto?: string | null;
};

export type AIRecommendation = {
  title: string;
  description: string;
  tone: "green" | "amber" | "red" | "blue";
};

function daysSince(dateString?: string | null) {
  if (!dateString) return 0;

  const now = new Date();
  const target = new Date(dateString);

  const diff = now.getTime() - target.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function buildAIRecommendations(
  cliente: Cliente
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  const estado = (cliente.estado || "").toLowerCase();
  const notas = (cliente.notas || "").toLowerCase();

  const overdueDays = daysSince(cliente.proximo_contacto);

  if (overdueDays >= 7) {
    recommendations.push({
      title: "Lead enfriándose",
      description:
        "Este cliente lleva varios días sin seguimiento. Conviene responder hoy.",
      tone: "red",
    });
  }

  if (
    notas.includes("precio") ||
    notas.includes("interesado") ||
    notas.includes("listo")
  ) {
    recommendations.push({
      title: "Cliente listo para cerrar",
      description:
        "Las notas indican intención de compra. Momento ideal para cierre.",
      tone: "green",
    });
  }

  if (
    estado.includes("sin respuesta") ||
    estado.includes("no responde")
  ) {
    recommendations.push({
      title: "Enviar prueba social",
      description:
        "Comparte resultados, testimonios o casos de éxito para reactivar interés.",
      tone: "amber",
    });
  }

  if (
    estado.includes("pago") ||
    notas.includes("comprobante")
  ) {
    recommendations.push({
      title: "Pedir comprobante",
      description:
        "Haz seguimiento del comprobante para avanzar al siguiente paso.",
      tone: "blue",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Seguimiento saludable",
      description:
        "El cliente no presenta alertas importantes por ahora.",
      tone: "blue",
    });
  }

  return recommendations;
}