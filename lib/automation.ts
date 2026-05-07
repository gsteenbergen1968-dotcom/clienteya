export type Cliente = {
  id: string;
  nombre: string;
  estado: string;
  proximo_contacto: string | null;
  recordatorio: string | null;
  telefono?: string | null;
};

export type Suggestion = {
  cliente: Cliente;
  type: "hoy" | "atrasado" | "sin_fecha" | "nuevo" | "pago";
  score: number;
  label: string;
};

function daysDiff(date: string) {
  const today = new Date();
  const target = new Date(date);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getClienteSuggestion(cliente: Cliente): Suggestion | null {
  // 1. SIN PRÓXIMO CONTACTO (probleem)
  if (!cliente.proximo_contacto) {
    return {
      cliente,
      type: "sin_fecha",
      score: 70,
      label: "Sin próxima fecha",
    };
  }

  const diff = daysDiff(cliente.proximo_contacto);

  // 2. ATRASADO
  if (diff < 0) {
    return {
      cliente,
      type: "atrasado",
      score: 90,
      label: "Seguimiento atrasado",
    };
  }

  // 3. HOY
  if (diff === 0) {
    return {
      cliente,
      type: "hoy",
      score: 85,
      label: "Contactar hoy",
    };
  }

  // 4. MAÑANA / PRÓXIMO
  if (diff === 1) {
    return {
      cliente,
      type: "hoy",
      score: 75,
      label: "Preparar contacto",
    };
  }

  // 5. NUEVO cliente
  if (cliente.estado === "Nuevo") {
    return {
      cliente,
      type: "nuevo",
      score: 60,
      label: "Primer contacto",
    };
  }

  return null;
}

export function getTopSuggestions(clientes: Cliente[], limit = 3): Suggestion[] {
  return clientes
    .map(getClienteSuggestion)
    .filter((s): s is Suggestion => s !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}