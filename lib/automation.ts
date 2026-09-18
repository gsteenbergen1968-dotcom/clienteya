export type Relationship = {
  id: string;
  full_name: string;
  status: string;
  next_contact_at: string | null;
  reminder: string | null;
  phone?: string | null;
};

export type Suggestion = {
  relationship: Relationship;
  type: "today" | "overdue" | "no_date" | "new" | "paid";
  score: number;
  label: string;
};

function daysDiff(date: string) {
  const today = new Date();
  const target = new Date(date);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getRelationshipSuggestion(
  relationship: Relationship,
): Suggestion | null {
  if (!relationship.next_contact_at) {
    return {
      relationship,
      type: "no_date",
      score: 70,
      label: "Sin próxima fecha",
    };
  }

  const diff = daysDiff(relationship.next_contact_at);

  if (diff < 0) {
    return {
      relationship,
      type: "overdue",
      score: 90,
      label: "Seguimiento atrasado",
    };
  }

  if (diff === 0) {
    return {
      relationship,
      type: "today",
      score: 85,
      label: "Contactar hoy",
    };
  }

  if (diff === 1) {
    return {
      relationship,
      type: "today",
      score: 75,
      label: "Preparar contacto",
    };
  }

  if (relationship.status === "Nuevo") {
    return {
      relationship,
      type: "new",
      score: 60,
      label: "Primer contacto",
    };
  }

  if (relationship.status === "Pagó") {
    return {
      relationship,
      type: "paid",
      score: 40,
      label: "Postventa",
    };
  }

  return null;
}

export function getTopRelationshipSuggestions(
  relationships: Relationship[],
  limit = 3,
): Suggestion[] {
  return relationships
    .map(getRelationshipSuggestion)
    .filter((s): s is Suggestion => s !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}