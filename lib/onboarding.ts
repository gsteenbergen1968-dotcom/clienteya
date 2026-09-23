import { createAdminClient } from "./supabase/server";

function addDays(
  date: Date,
  days: number,
) {
  const d = new Date(date);

  d.setDate(
    d.getDate() + days,
  );

  return d;
}

export async function ensureProfileForNewUser(params: {
  userId: string;
  email?: string | null;
  name?: string | null;
}) {
  const {
    userId,
    email,
    name,
  } = params;

  const admin =
    createAdminClient();

  const existing =
    await admin
      .from("profiles")
      .select(
        "id, subscription_status, trial_ends_at, email, full_name",
      )
      .eq("id", userId)
      .maybeSingle();

  const currentProfile =
    existing.data;

  const trialEndsAt =
    currentProfile?.trial_ends_at ||
    addDays(
      new Date(),
      7,
    ).toISOString();

  const subscriptionStatus =
    currentProfile?.subscription_status ||
    "trial";

  await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email:
          currentProfile?.email ||
          email ||
          null,
        full_name:
          currentProfile?.full_name ||
          name ||
          null,
        subscription_status:
          subscriptionStatus,
        trial_ends_at:
          trialEndsAt,
      },
      {
        onConflict: "id",
      },
    );

  const existingBusinessSettings =
    await admin
      .from("business_settings")
      .select(
        "user_id, onboarding_completed",
      )
      .eq(
        "user_id",
        userId,
      )
      .maybeSingle();

  if (
    !existingBusinessSettings.data
  ) {
    await admin
      .from("business_settings")
      .insert({
        user_id: userId,
        onboarding_completed:
          false,
      });
  }
}