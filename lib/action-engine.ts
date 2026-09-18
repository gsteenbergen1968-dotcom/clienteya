import { createAdminClient } from "./supabase/server";

export type SuggestionActionType =
  | "contactado"
  | "listo"
  | "schedule";

function todayIsoDate() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function addDays(
  base: string,
  days: number,
) {
  const date =
    new Date(base);

  date.setDate(
    date.getDate() + days,
  );

  return date
    .toISOString()
    .split("T")[0];
}

export async function applySuggestionAction(
  params: {
    userId: string;
    relationshipId: string;
    actionType: SuggestionActionType;
  },
) {
  const {
    userId,
    relationshipId,
    actionType,
  } = params;

  const admin =
    createAdminClient();

  if (
    actionType ===
    "contactado"
  ) {
    await admin
      .from("relationships")
      .update({
        status:
          "Interesado",
        next_contact_at:
          addDays(
            todayIsoDate(),
            2,
          ),
        reminder:
          "Seguimiento automático",
        last_contact_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        relationshipId,
      )
      .eq(
        "owner_id",
        userId,
      );

    return;
  }

  if (
    actionType ===
    "listo"
  ) {
    await admin
      .from("relationships")
      .update({
        status:
          "Entregado",
        next_contact_at:
          null,
        reminder:
          null,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        relationshipId,
      )
      .eq(
        "owner_id",
        userId,
      );

    return;
  }

  await admin
    .from("relationships")
    .update({
      status:
        "Interesado",
      next_contact_at:
        addDays(
          todayIsoDate(),
          3,
        ),
      reminder:
        "Seguimiento automático",
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      relationshipId,
    )
    .eq(
      "owner_id",
      userId,
    );
}