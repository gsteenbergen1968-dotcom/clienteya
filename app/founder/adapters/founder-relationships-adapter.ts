import { createAdminClient } from "@/lib/supabase/server";

import type { FounderEvidence } from "../models";

type RelationshipRow = {
  id: string;
  status: string | null;
  is_active: boolean | null;
  last_contact_at: string | null;
  created_at: string | null;
};

function startOfCurrentMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function isValidDate(value: string | null): value is string {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

export async function collectFounderRelationshipsEvidence(): Promise<
  FounderEvidence[]
> {
  const supabase = createAdminClient();
  const now = new Date();
  const observedAt = now.toISOString();
  const monthStart = startOfCurrentMonth(now);

  const { data, error } = await supabase
    .from("relationships")
    .select("id, status, is_active, last_contact_at, created_at");

  if (error) {
    throw new Error(
      `Unable to collect founder relationships evidence: ${error.message}`
    );
  }

  const relationships = (data ?? []) as RelationshipRow[];

  let activeRelationships = 0;
  let inactiveRelationships = 0;
  let newRelationshipsThisMonth = 0;
  let relationshipsWithContactHistory = 0;

  for (const relationship of relationships) {
    if (relationship.is_active === true) {
      activeRelationships++;
    } else {
      inactiveRelationships++;
    }

    if (isValidDate(relationship.created_at)) {
      const createdAt = new Date(relationship.created_at);

      if (createdAt >= monthStart) {
        newRelationshipsThisMonth++;
      }
    }

    if (isValidDate(relationship.last_contact_at)) {
      relationshipsWithContactHistory++;
    }
  }

  const totalRelationships = relationships.length;

  return [
    {
      id: crypto.randomUUID(),
      domain: "business",
      source: "database",
      title: "Total relationships",
      description:
        "Total number of relationships currently stored in ClienteYA.",
      value: totalRelationships,
      strength: "conclusive",
      status: "active",
      observedAt,
      sourceReference: "relationships",
    },
    {
      id: crypto.randomUUID(),
      domain: "business",
      source: "database",
      title: "Active relationships",
      description:
        "Relationships currently marked as active.",
      value: activeRelationships,
      strength: "conclusive",
      status: "active",
      observedAt,
      sourceReference: "relationships.is_active",
      metadata: {
        totalRelationships,
      },
    },
    {
      id: crypto.randomUUID(),
      domain: "business",
      source: "database",
      title: "Inactive relationships",
      description:
        "Relationships not currently marked as active.",
      value: inactiveRelationships,
      strength: "conclusive",
      status: "active",
      observedAt,
      sourceReference: "relationships.is_active",
      metadata: {
        totalRelationships,
      },
    },
    {
      id: crypto.randomUUID(),
      domain: "growth",
      source: "database",
      title: "New relationships this month",
      description:
        "Relationships created during the current calendar month.",
      value: newRelationshipsThisMonth,
      strength: "conclusive",
      status: "active",
      observedAt,
      sourceReference: "relationships.created_at",
    },
    {
      id: crypto.randomUUID(),
      domain: "business",
      source: "database",
      title: "Relationships with contact history",
      description:
        "Relationships with at least one recorded contact moment.",
      value: relationshipsWithContactHistory,
      strength: "strong",
      status: "active",
      observedAt,
      sourceReference: "relationships.last_contact_at",
      metadata: {
        totalRelationships,
      },
    },
  ];
}