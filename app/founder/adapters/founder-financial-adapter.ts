import { createAdminClient } from "@/lib/supabase/server";

import type { FounderEvidence } from "../models/founder-model";

type BillingPaymentRow = {
  amount: number | string | null;
  status: string | null;
  confirmed_at: string | null;
};

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

export async function collectFinancialEvidence(): Promise<FounderEvidence[]> {
  const supabase = createAdminClient();
  const observedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("billing_payments")
    .select("amount, status, confirmed_at");

  if (error) {
    throw new Error(
      `Unable to collect financial evidence: ${error.message}`
    );
  }

  const payments = (data ?? []) as BillingPaymentRow[];

  const confirmedPayments = payments.filter(
    (payment) => payment.confirmed_at !== null
  );

  const confirmedRevenue = confirmedPayments.reduce(
    (total, payment) => total + toAmount(payment.amount),
    0
  );

  return [
    {
      id: crypto.randomUUID(),
      domain: "business",
      source: "financial",
      title: "Financial evidence",
      description:
        "Financial evidence collected from confirmed billing payments.",
      value: {
        confirmedPayments: confirmedPayments.length,
        confirmedRevenue,
      },
      strength: "conclusive",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference: "billing_payments",
      metadata: {
        liveData: true,
        paymentCount: confirmedPayments.length,
        confirmedRevenue,
      },
    },
  ];
}