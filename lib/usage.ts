import { createAdminClient } from "./supabase/server";

export type UsageResult = {
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyUsage({
  userId,
  feature,
  limit,
}: {
  userId: string;
  feature: string;
  limit: number;
}): Promise<UsageResult> {
  const admin = createAdminClient();
  const today = todayISO();

  const { data } = await admin
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("usage_date", today)
    .maybeSingle();

  const used = Number(data?.count || 0);
  const remaining = Math.max(limit - used, 0);

  return {
    used,
    limit,
    remaining,
    allowed: used < limit,
  };
}

export async function consumeDailyUsage({
  userId,
  feature,
  limit,
}: {
  userId: string;
  feature: string;
  limit: number;
}): Promise<UsageResult> {
  const admin = createAdminClient();
  const today = todayISO();

  const { data } = await admin
    .from("ai_usage")
    .select("id, count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("usage_date", today)
    .maybeSingle();

  if (!data) {
    await admin.from("ai_usage").insert({
      user_id: userId,
      feature,
      usage_date: today,
      count: 1,
    });

    return {
      used: 1,
      limit,
      remaining: Math.max(limit - 1, 0),
      allowed: true,
    };
  }

  const current = Number(data.count || 0);

  if (current >= limit) {
    return {
      used: current,
      limit,
      remaining: 0,
      allowed: false,
    };
  }

  const next = current + 1;

  await admin
    .from("ai_usage")
    .update({
      count: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  return {
    used: next,
    limit,
    remaining: Math.max(limit - next, 0),
    allowed: true,
  };
}