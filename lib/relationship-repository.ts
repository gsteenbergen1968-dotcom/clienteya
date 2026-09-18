import { createAdminClient } from "./supabase/server";

export type RelationshipRecord = {
  id: string;
  owner_id: string;

  name: string | null;
  company: string | null;

  phone: string | null;
  email: string | null;

  relationship_type: string | null;
  status: string | null;
  birthday: string | null;

  notes: string | null;
  reminder: string | null;
  next_contact_at: string | null;
  last_contact_at: string | null;

  country: string | null;
  source: string | null;
  source_reference: string | null;
  import_batch_id: string | null;

  is_active: boolean | null;

  expected_amount: number | null;
  paid_amount: number | null;
  currency: "PYG" | "USD";
  paid_at: string | null;
  invoice_number: string | null;
  payment_description: string | null;

  created_at: string;
  updated_at: string | null;
};

export type CreateRelationshipRecord = Omit<
  RelationshipRecord,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string | null;
};

export type UpdateRelationshipRecord = Partial<
  Omit<RelationshipRecord, "id" | "owner_id" | "created_at">
>;

export class RelationshipRepository {
  private readonly supabase = createAdminClient();

  async findAll(ownerId: string): Promise<RelationshipRecord[]> {
    const { data, error } = await this.supabase
      .from("relationships")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as RelationshipRecord[];
  }

  async findById(
    id: string,
    ownerId: string,
  ): Promise<RelationshipRecord | null> {
    const { data, error } = await this.supabase
      .from("relationships")
      .select("*")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as RelationshipRecord | null;
  }

  async create(
    relationship: Partial<RelationshipRecord>,
  ): Promise<RelationshipRecord> {
    const { data, error } = await this.supabase
      .from("relationships")
      .insert(relationship)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as RelationshipRecord;
  }

  async update(
    id: string,
    ownerId: string,
    values: UpdateRelationshipRecord,
  ): Promise<RelationshipRecord> {
    const { data, error } = await this.supabase
      .from("relationships")
      .update({
        ...values,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as RelationshipRecord;
  }

  async delete(
    id: string,
    ownerId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("relationships")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId);

    if (error) {
      throw error;
    }
  }
}

export function createRelationshipRepository() {
  return new RelationshipRepository();
}