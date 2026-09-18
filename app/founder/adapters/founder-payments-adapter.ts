import { createAdminClient } from "@/lib/supabase/server";

import type { FounderPaymentsSnapshot } from "../models";

type BillingPaymentRow = {
  user_id: string;
  amount: number | string | null;
  status: string | null;
  confirmed_at: string | null;
};

function normalize(value: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function toAmount(value: number | string |null): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function collectFounderPaymentsSnapshot(): Promise<FounderPaymentsSnapshot> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("billing_payments")
    .select("user_id, amount, status, confirmed_at");

  if (error) {
    throw new Error(
      `Unable to collect founder payments: ${error.message}`
    );
  }

  const payments = (data ?? []) as BillingPaymentRow[];

  let successfulPayments = 0;
  let failedPayments = 0;
  let pendingPayments = 0;
  let refundedPayments = 0;
  let monthlyCollectedRevenue = 0;

  const activeSubscriptions = new Set<string>();

  for (const payment of payments) {
    const status = normalize(payment.status);

    if (payment.confirmed_at) {
      successfulPayments++;
      monthlyCollectedRevenue += toAmount(payment.amount);
      activeSubscriptions.add(payment.user_id);
      continue;
    }

    if (
      status === "pending" ||
      status === "waiting" ||
      status === "processing"
    ) {
      pendingPayments++;
      continue;
    }

    if (
      status === "failed" ||
      status === "cancelled" ||
      status === "canceled" ||
      status === "rejected"
    ) {
      failedPayments++;
      continue;
    }

    if (
      status === "refunded" ||
      status === "refund"
    ) {
      refundedPayments++;
    }
  }

  const totalProcessed =
    successfulPayments +
    failedPayments +
    pendingPayments +
    refundedPayments;

  const collectionRate =
    totalProcessed > 0
      ? Number(
          ((successfulPayments / totalProcessed) * 100).toFixed(1)
        )
      : 0;

  return {
    generatedAt: new Date().toISOString(),

    totals: {
      activeSubscriptions: activeSubscriptions.size,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      monthlyCollectedRevenue,
      collectionRate,
    },

    regions: [],
  };
}