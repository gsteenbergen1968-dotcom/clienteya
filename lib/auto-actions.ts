import { createAdminClient } from "./supabase/server";

type Relationship = {
  id: string;
  owner_id: string | null;
  status: string | null;
  next_contact_at?: string | null;
  reminder?: string | null;
};

function todayIsoDate() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function addDays(
  base: string,
  days: number,
) {
  const date = new Date(base);

  date.setDate(
    date.getDate() + days,
  );

  return date
    .toISOString()
    .split("T")[0];
}

export async function runAutoActionsForUser(
  userId: string,
) {
  const admin =
    createAdminClient();

  const today =
    todayIsoDate();

  const {
    data: relationships,
  } = await admin
    .from("relationships")
    .select(
      "id,owner_id,status,next_contact_at,reminder",
    )
    .eq(
      "owner_id",
      userId,
    );

  const rows =
    (relationships || []) as Relationship[];

  for (
    const relationship of rows
  ) {
    const status =
      relationship.status
        ?.toLowerCase?.() ||
      "";

    const nextContactAt =
      relationship.next_contact_at ??
      null;

    const reminder =
      relationship.reminder ??
      null;

    if (
      status === "pagó" ||
      status === "pagado" ||
      status === "entregado"
    ) {
      continue;
    }

    if (
      nextContactAt &&
      nextContactAt < today
    ) {
      await admin
        .from("relationships")
        .update({
          status:
            "Interesado",
          next_contact_at:
            addDays(
              today,
              2,
            ),
          reminder:
            "Seguimiento automático",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          relationship.id,
        )
        .eq(
          "owner_id",
          userId,
        );

      continue;
    }

    if (
      (
        status === "interesado" ||
        status === "nuevo"
      ) &&
      !nextContactAt
    ) {
      await admin
        .from("relationships")
        .update({
          status:
            status === "nuevo"
              ? "Nuevo"
              : "Interesado",
          next_contact_at:
            addDays(
              today,
              3,
            ),
          reminder:
            reminder ||
            "Seguimiento automático",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          relationship.id,
        )
        .eq(
          "owner_id",
          userId,
        );
    }
  }
}