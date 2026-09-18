import { createAdminClient } from "@/lib/supabase/server";

import type { FounderEvidence } from "../models/founder-model";

type TableCountResult = {
  table: string;
  count: number;
};

async function collectTableCount(
  table: string
): Promise<TableCountResult> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from(table)
    .select("*", {
      count: "exact",
      head: true,
    });

  if (error) {
    throw new Error(
      `Unable to collect database evidence for ${table}: ${error.message}`
    );
  }

  return {
    table,
    count: count ?? 0,
  };
}

export async function collectDatabaseEvidence(): Promise<FounderEvidence[]> {
  const observedAt = new Date().toISOString();

  const [relationships, billingPayments] = await Promise.all([
    collectTableCount("relationships"),
    collectTableCount("billing_payments"),
  ]);

  const totalRecords =
    relationships.count + billingPayments.count;

  return [
    {
      id: crypto.randomUUID(),
      domain: "business",
      source: "database",
      title: "Database evidence",
      description:
        "Live record counts collected from verified ClienteYA database tables.",
      value: {
        totalRecords,
        tables: {
          relationships: relationships.count,
          billingPayments: billingPayments.count,
        },
      },
      strength: "conclusive",
      status: "active",
      observedAt,
      validUntil: null,
      sourceReference:
        "relationships, billing_payments",
      metadata: {
        liveData: true,
        verifiedTables: 2,
        totalRecords,
        relationships: relationships.count,
        billingPayments: billingPayments.count,
      },
    },
  ];
}