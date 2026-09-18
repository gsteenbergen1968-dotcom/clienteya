import { createAdminClient } from "./supabase/server";

export type PlanAccess = {
  planType: "pro" | "enterprise" | null;
  subscriptionStatus: string;
  isActive: boolean;
  isPro: boolean;
  canUseAI: boolean;
  canUseAutomations: boolean;
};

export async function getPlanAccess(
  userId: string,
): Promise<PlanAccess> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("profiles")
    .select(
      "plan_type, subscription_status",
    )
    .eq("id", userId)
    .maybeSingle();

  const planType =
    data?.plan_type === "pro" ||
    data?.plan_type === "enterprise"
      ? data.plan_type
      : null;

  const subscriptionStatus =
    data?.subscription_status ||
    "trial";

  const isActive =
    subscriptionStatus === "active";

  const isPro =
    (planType === "pro" ||
      planType === "enterprise") &&
    isActive;

  return {
    planType,
    subscriptionStatus,
    isActive,
    isPro,
    canUseAI: isPro,
    canUseAutomations: isPro,
  };
}