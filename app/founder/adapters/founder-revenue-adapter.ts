import { createAdminClient } from "@/lib/supabase/server";

import type { FounderRevenueSnapshot } from "../models";

type BillingPaymentRow = {
  user_id: string;
  amount: number | string | null;
  status: string | null;
  confirmed_at: string | null;
};

function startOfCurrentMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfPreviousMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

function endOfPreviousMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function isConfirmed(payment: BillingPaymentRow): boolean {
  return payment.confirmed_at !== null;
}

function toAmount(value: number | string | null): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function collectFounderRevenueSnapshot(): Promise<FounderRevenueSnapshot> {
  const supabase = createAdminClient();
  const now = new Date();

  const { data, error } = await supabase
    .from("billing_payments")
    .select("user_id, amount, status, confirmed_at");

  if (error) {
    throw new Error(`Unable to collect founder revenue: ${error.message}`);
  }

  const payments = ((data ?? []) as BillingPaymentRow[]).filter(isConfirmed);

  const currentMonthStart = startOfCurrentMonth(now);
  const previousMonthStart = startOfPreviousMonth(now);
  const previousMonthEnd = endOfPreviousMonth(now);

  let currentMonthRevenue = 0;
  let previousMonthRevenue = 0;
  let lifetimeRevenue = 0;

  const activeUsers = new Set<string>();

  for (const payment of payments) {
    const amount = toAmount(payment.amount);

    lifetimeRevenue += amount;
    activeUsers.add(payment.user_id);

    if (!payment.confirmed_at) {
      continue;
    }

    const confirmed = new Date(payment.confirmed_at);

    if (confirmed >= currentMonthStart) {
      currentMonthRevenue += amount;
    }

    if (
      confirmed >= previousMonthStart &&
      confirmed < previousMonthEnd
    ) {
      previousMonthRevenue += amount;
    }
  }

  const annualRecurringRevenue = currentMonthRevenue * 12;

  const averageRevenuePerUser =
    activeUsers.size > 0
      ? Number((currentMonthRevenue / activeUsers.size).toFixed(2))
      : 0;

  const lifetimeValue =
    activeUsers.size > 0
      ? Number((lifetimeRevenue / activeUsers.size).toFixed(2))
      : 0;

  const monthlyGrowth =
    previousMonthRevenue > 0
      ? Number(
          (
            ((currentMonthRevenue - previousMonthRevenue) /
              previousMonthRevenue) *
            100
          ).toFixed(1)
        )
      : 0;

  return {
    generatedAt: now.toISOString(),

    totals: {
      monthlyRecurringRevenue: currentMonthRevenue,
      annualRecurringRevenue,
      monthlyGrowth,
      averageRevenuePerUser,
      lifetimeValue,
      monthlyChurnRate: 0,
      annualChurnRate: 0,
    },

    regions: [],
  };
}