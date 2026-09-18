import type {
  CommercialMemoryRelationship as CommercialMemoryOSRelationship,
} from "./commercial-memory-os";

export type CommercialMemoryRelationship = {
  id: string;
  owner_id?: string | null;

  name?: string | null;
  company?: string | null;
  phone?: string | null;
  status?: string | null;
  notes?: string | null;
  reminder?: string | null;
  next_contact_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
  last_contact_at?: string | null;
};

function isPaidStatus(
  status: string | null | undefined,
): boolean {
  const value = (status || "")
    .trim()
    .toLowerCase();

  return (
    value.includes("pag") ||
    value.includes("convert")
  );
}

export function adaptRelationshipToCommercialMemory(
  relationship: CommercialMemoryRelationship,
): CommercialMemoryOSRelationship {
  return {
    id: relationship.id,

    nombre:
      relationship.name ??
      relationship.company ??
      null,

    telefono:
      relationship.phone ?? null,

    estado:
      relationship.status ?? null,

    notas:
      relationship.notes ?? null,

    recordatorio:
      relationship.reminder ?? null,

    proximo_contacto:
      relationship.next_contact_at ?? null,

    monto:
      0,

    pagado:
      isPaidStatus(
        relationship.status,
      ),

    fecha_pago:
      null,

    created_at:
      relationship.created_at ?? null,

    updated_at:
      relationship.updated_at ??
      relationship.last_contact_at ??
      relationship.created_at ??
      null,
  };
}

export function adaptRelationshipsToCommercialMemory(
  relationships: CommercialMemoryRelationship[],
): CommercialMemoryOSRelationship[] {
  return relationships.map(
    adaptRelationshipToCommercialMemory,
  );
}