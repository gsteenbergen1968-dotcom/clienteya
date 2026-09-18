// lib/relationship-actions.ts

import { createRelationshipService } from "./relationship-service";

function addDaysISO(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export type RelationshipActionResult = {
  ok: boolean;
  message: string;
};

const relationshipService = createRelationshipService();

export async function markRelationshipContacted(
  ownerId: string,
  relationshipId: string,
): Promise<RelationshipActionResult> {
  await relationshipService.updateRelationship(
    relationshipId,
    ownerId,
    {
      status: "Contactado",
      next_contact_at: addDaysISO(3),
      reminder: "Revisar respuesta en 3 días",
    },
  );

  return {
    ok: true,
    message: "Relación marcada como Contactada.",
  };
}

export async function scheduleRelationshipFollowup(
  ownerId: string,
  relationshipId: string,
  days = 3,
): Promise<RelationshipActionResult> {
  await relationshipService.updateRelationship(
    relationshipId,
    ownerId,
    {
      next_contact_at: addDaysISO(days),
      reminder: `Seguimiento automático en ${days} días`,
    },
  );

  return {
    ok: true,
    message: `Seguimiento programado en ${days} días.`,
  };
}

export async function closeRelationship(
  ownerId: string,
  relationshipId: string,
): Promise<RelationshipActionResult> {
  await relationshipService.updateRelationship(
    relationshipId,
    ownerId,
    {
      status: "Cerrado",
      next_contact_at: null,
      reminder: "Relación cerrada",
    },
  );

  return {
    ok: true,
    message: "Relación cerrada.",
  };
}

export async function markRelationshipNoResponse(
  ownerId: string,
  relationshipId: string,
): Promise<RelationshipActionResult> {
  await relationshipService.updateRelationship(
    relationshipId,
    ownerId,
    {
      status: "Sin respuesta",
      next_contact_at: addDaysISO(3),
      reminder: "Reintentar contacto en 3 días",
    },
  );

  return {
    ok: true,
    message: "Relación marcada como Sin respuesta.",
  };
}