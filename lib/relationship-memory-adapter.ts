import type {
  RelationshipEngagementSignal,
  RelationshipLifecycleStatus,
  RelationshipMemoryModel,
  RelationshipPaymentStatus,
} from "@/lib/domain/relationship-memory-model";

export type RelationshipMemorySource = {
  id: string | number;

  nombre?: string | null;
  name?: string | null;

  empresa?: string | null;
  company?: string | null;

  telefono?: string | null;
  phone?: string | null;

  tipo_relacion?: string | null;
  relationship_type?: string | null;
  relationshipType?: string | null;

  estado?: string | null;
  status?: string | null;

  engagement_signal?: string | null;
  engagementSignal?: string | null;

  notas?: string | null;
  notes?: string | null;
  memory?: string | null;

  recordatorio?: string | null;
  reminder?: string | null;

  proximo_contacto?: string | null;
  next_follow_up_at?: string | null;

  monto?: number | string | null;
  estimated_value?: number | string | null;

  pagado?: boolean | null;
  payment_status?: string | null;

  fecha_pago?: string | null;
  payment_date?: string | null;

  created_at?: string | null;
};

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";

  return value.trim();
}

function normalizeNullableText(value: unknown) {
  const normalized = normalizeText(value);

  return normalized || null;
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value
      .trim()
      .replace(/\./g, "")
      .replace(",", ".");

    if (!normalized) return null;

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeLifecycleStatus(
  value: unknown,
): RelationshipLifecycleStatus {
  const normalized = normalizeText(value).toLowerCase();

  if (
    normalized === "new" ||
    normalized === "nuevo" ||
    normalized === "nueva"
  ) {
    return "new";
  }

  if (
    normalized === "contacted" ||
    normalized === "contactado" ||
    normalized === "contactada"
  ) {
    return "contacted";
  }

  if (
    normalized === "interested" ||
    normalized === "interesado" ||
    normalized === "interesada" ||
    normalized === "interés" ||
    normalized === "interes"
  ) {
    return "interested";
  }

  if (
    normalized === "inactive" ||
    normalized === "inactivo" ||
    normalized === "inactiva"
  ) {
    return "inactive";
  }

  if (
    normalized === "closed" ||
    normalized === "cerrado" ||
    normalized === "cerrada"
  ) {
    return "closed";
  }

  return "unknown";
}

function normalizeEngagementSignal(
  value: unknown,
): RelationshipEngagementSignal {
  const normalized = normalizeText(value).toLowerCase();

  if (
    normalized === "high" ||
    normalized === "alto" ||
    normalized === "alta"
  ) {
    return "high";
  }

  if (
    normalized === "medium" ||
    normalized === "medio" ||
    normalized === "media"
  ) {
    return "medium";
  }

  if (
    normalized === "low" ||
    normalized === "bajo" ||
    normalized === "baja"
  ) {
    return "low";
  }

  return "unknown";
}

function normalizePaymentStatus(
  source: RelationshipMemorySource,
): RelationshipPaymentStatus {
  if (source.pagado === true) return "paid";

  if (source.pagado === false) return "unpaid";

  const normalized = normalizeText(
    source.payment_status,
  ).toLowerCase();

  if (
    normalized === "paid" ||
    normalized === "pagado" ||
    normalized === "pagada"
  ) {
    return "paid";
  }

  if (
    normalized === "unpaid" ||
    normalized === "pendiente" ||
    normalized === "no pagado" ||
    normalized === "no pagada"
  ) {
    return "unpaid";
  }

  return "unknown";
}

function buildConversationContext(
  source: RelationshipMemorySource,
) {
  return [
    source.notas,
    source.notes,
    source.memory,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join("\n");
}

function buildReminderContext(
  source: RelationshipMemorySource,
) {
  return [
    source.recordatorio,
    source.reminder,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join("\n");
}

export function adaptRelationshipMemory(
  source: RelationshipMemorySource,
): RelationshipMemoryModel {
  return {
    id: String(source.id),

    name:
      normalizeText(source.nombre) ||
      normalizeText(source.name) ||
      "Relación sin nombre",

    company:
      normalizeNullableText(source.empresa) ??
      normalizeNullableText(source.company),

    phone:
      normalizeNullableText(source.telefono) ??
      normalizeNullableText(source.phone),

    relationshipType:
      normalizeNullableText(source.tipo_relacion) ??
      normalizeNullableText(source.relationship_type) ??
      normalizeNullableText(source.relationshipType),

    lifecycleStatus: normalizeLifecycleStatus(
      source.estado ?? source.status,
    ),

    engagementSignal: normalizeEngagementSignal(
      source.engagement_signal ??
        source.engagementSignal,
    ),

    conversationContext:
      buildConversationContext(source),

    reminderContext:
      buildReminderContext(source),

    nextFollowUpAt:
      normalizeNullableText(source.proximo_contacto) ??
      normalizeNullableText(source.next_follow_up_at),

    estimatedValue: normalizeNumber(
      source.monto ?? source.estimated_value,
    ),

    paymentStatus:
      normalizePaymentStatus(source),

    paymentDate:
      normalizeNullableText(source.fecha_pago) ??
      normalizeNullableText(source.payment_date),

    createdAt:
      normalizeNullableText(source.created_at),
  };
}

export function adaptRelationshipMemories(
  sources: RelationshipMemorySource[],
): RelationshipMemoryModel[] {
  return sources.map(adaptRelationshipMemory);
}