import { createAdminClient } from "@/lib/supabase/server";

import type { FounderGrowthSnapshot } from "../models";

type ProfileGrowthRow = {
  created_at: string | null;
  subscription_status: string | null;
  plan_type: string | null;
};

function normalizeValue(value: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function isTrialProfile(profile: ProfileGrowthRow): boolean {
  const status = normalizeValue(profile.subscription_status);
  const plan = normalizeValue(profile.plan_type);

  return status === "trial" || plan === "trial";
}

function isProfessionalProfile(profile: ProfileGrowthRow): boolean {
  return normalizeValue(profile.plan_type) === "professional";
}

function isCorporateProfile(profile: ProfileGrowthRow): boolean {
  return normalizeValue(profile.plan_type) === "corporate";
}

function isActiveProfile(profile: ProfileGrowthRow): boolean {
  const status = normalizeValue(profile.subscription_status);

  return (
    status === "active" ||
    status === "trialing" ||
    status === "paid" ||
    status === "approved"
  );
}

function isCreatedSince(
  createdAt: string | null,
  startDate: Date
): boolean {
  if (!createdAt) {
    return false;
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return false;
  }

  return createdDate >= startDate;
}

export async function collectFounderGrowthSnapshot(): Promise<FounderGrowthSnapshot> {
  const supabase = createAdminClient();
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  const currentDay = startOfWeek.getDay();
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("created_at, subscription_status, plan_type");

  if (error) {
    throw new Error(
      `Unable to collect founder growth data: ${error.message}`
    );
  }

  const profiles = (data ?? []) as ProfileGrowthRow[];

  const totalUsers = profiles.length;

  const activeUsers = profiles.filter(isActiveProfile).length;
  const trialUsers = profiles.filter(isTrialProfile).length;
  const professionalUsers =
    profiles.filter(isProfessionalProfile).length;
  const corporateUsers =
    profiles.filter(isCorporateProfile).length;

  const paidUsers = professionalUsers + corporateUsers;

  const conversionRate =
    totalUsers > 0
      ? Number(((paidUsers / totalUsers) * 100).toFixed(1))
      : 0;

  const growthToday = profiles.filter((profile) =>
    isCreatedSince(profile.created_at, startOfToday)
  ).length;

  const growthThisWeek = profiles.filter((profile) =>
    isCreatedSince(profile.created_at, startOfWeek)
  ).length;

  const growthThisMonth = profiles.filter((profile) =>
    isCreatedSince(profile.created_at, startOfMonth)
  ).length;

  return {
    generatedAt: now.toISOString(),

    totals: {
      totalUsers,
      activeUsers,
      trialUsers,
      professionalUsers,
      corporateUsers,
      conversionRate,
      growthToday,
      growthThisWeek,
      growthThisMonth,
    },

    regions: [],
  };
}