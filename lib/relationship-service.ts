import {
  createRelationshipRepository,
  type RelationshipRecord,
  type RelationshipRepository,
} from "./relationship-repository";
import { createAdminClient } from "./supabase/server";

export type RelationshipCurrency =
  | "PYG"
  | "USD";

export type CreateRelationshipInput = Omit<
  Partial<RelationshipRecord>,
  "id" | "created_at" | "updated_at"
> & {
  owner_id: string;
};

export type UpdateRelationshipInput = Partial<
  Omit<
    RelationshipRecord,
    "id" | "owner_id" | "created_at" | "updated_at"
  >
>;

export type MarkRelationshipAsPaidInput = {
  paid_amount?: number | null;
  currency?: RelationshipCurrency;
  paid_at?: string | null;
  invoice_number?: string | null;
  payment_description?: string | null;
};

type RelationshipActivityType =
  | "contactado"
  | "followup_scheduled"
  | "closed";

function tomorrowIsoDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  return date.toISOString().slice(0, 10);
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized =
    value?.trim();

  return normalized
    ? normalized
    : null;
}

function normalizeAmount(
  value: number | null | undefined,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error(
      "Invalid relationship payment amount.",
    );
  }

  return amount;
}

function normalizeCurrency(
  value: RelationshipCurrency | null | undefined,
): RelationshipCurrency {
  if (
    value === "USD"
  ) {
    return "USD";
  }

  return "PYG";
}

async function recordRelationshipActivity({
  ownerId,
  relationshipId,
  eventType,
}: {
  ownerId: string;
  relationshipId: string;
  eventType: RelationshipActivityType;
}): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("activity_logs")
    .insert({
      user_id: ownerId,
      relationship_id: relationshipId,
      event_type: eventType,
    });

  if (error) {
    throw new Error(error.message);
  }
}

export class RelationshipService {
  constructor(
    private readonly repository: RelationshipRepository =
      createRelationshipRepository(),
  ) {}

  async getRelationships(
    ownerId: string,
  ): Promise<RelationshipRecord[]> {
    return this.repository.findAll(ownerId);
  }

  async getRelationship(
    id: string,
    ownerId: string,
  ): Promise<RelationshipRecord | null> {
    return this.repository.findById(id, ownerId);
  }

  async createRelationship(
    input: CreateRelationshipInput,
  ): Promise<RelationshipRecord> {
    return this.repository.create({
      ...input,
      currency:
        normalizeCurrency(
          input.currency,
        ),
      expected_amount:
        normalizeAmount(
          input.expected_amount,
        ),
      paid_amount:
        normalizeAmount(
          input.paid_amount,
        ),
      invoice_number:
        normalizeOptionalText(
          input.invoice_number,
        ),
      payment_description:
        normalizeOptionalText(
          input.payment_description,
        ),
    });
  }

  async updateRelationship(
    id: string,
    ownerId: string,
    input: UpdateRelationshipInput,
  ): Promise<RelationshipRecord> {
    const values: UpdateRelationshipInput = {
      ...input,
    };

    if (
      Object.prototype.hasOwnProperty.call(
        input,
        "expected_amount",
      )
    ) {
      values.expected_amount =
        normalizeAmount(
          input.expected_amount,
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        input,
        "paid_amount",
      )
    ) {
      values.paid_amount =
        normalizeAmount(
          input.paid_amount,
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        input,
        "currency",
      )
    ) {
      values.currency =
        normalizeCurrency(
          input.currency,
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        input,
        "invoice_number",
      )
    ) {
      values.invoice_number =
        normalizeOptionalText(
          input.invoice_number,
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        input,
        "payment_description",
      )
    ) {
      values.payment_description =
        normalizeOptionalText(
          input.payment_description,
        );
    }

    return this.repository.update(
      id,
      ownerId,
      values,
    );
  }

  async deleteRelationship(
    id: string,
    ownerId: string,
  ): Promise<void> {
    await this.repository.delete(
      id,
      ownerId,
    );
  }

  async relationshipExists(
    id: string,
    ownerId: string,
  ): Promise<boolean> {
    const relationship =
      await this.repository.findById(
        id,
        ownerId,
      );

    return relationship !== null;
  }

  async getRelationshipCount(
    ownerId: string,
  ): Promise<number> {
    const relationships =
      await this.repository.findAll(
        ownerId,
      );

    return relationships.length;
  }

  async markAsContacted(
    id: string,
    ownerId: string,
  ): Promise<RelationshipRecord> {
    await this.getRequiredRelationship(
      id,
      ownerId,
    );

    const updatedRelationship =
      await this.repository.update(
        id,
        ownerId,
        {
          status:
            "Contactado",
          reminder:
            "Relación marcada como contactada desde el detalle.",
          last_contact_at:
            new Date().toISOString(),
        },
      );

    await recordRelationshipActivity({
      ownerId,
      relationshipId:
        id,
      eventType:
        "contactado",
    });

    return updatedRelationship;
  }

  async scheduleForTomorrow(
    id: string,
    ownerId: string,
  ): Promise<RelationshipRecord> {
    await this.getRequiredRelationship(
      id,
      ownerId,
    );

    const nextContactAt =
      tomorrowIsoDate();

    const updatedRelationship =
      await this.repository.update(
        id,
        ownerId,
        {
          next_contact_at:
            nextContactAt,
          reminder:
            "Seguimiento programado para mañana desde el detalle.",
        },
      );

    await recordRelationshipActivity({
      ownerId,
      relationshipId:
        id,
      eventType:
        "followup_scheduled",
    });

    return updatedRelationship;
  }

  async markAsPaid(
    id: string,
    ownerId: string,
    payment: MarkRelationshipAsPaidInput = {},
  ): Promise<RelationshipRecord> {
    const relationship =
      await this.getRequiredRelationship(
        id,
        ownerId,
      );

    const paidAmount =
      normalizeAmount(
        payment.paid_amount,
      );

    const currency =
      normalizeCurrency(
        payment.currency ??
          relationship.currency,
      );

    const paidAt =
      payment.paid_at === null
        ? null
        : payment.paid_at ||
          new Date().toISOString();

    const updatedRelationship =
      await this.repository.update(
        id,
        ownerId,
        {
          status:
            "Pagó",
          paid_amount:
            paidAmount,
          currency,
          paid_at:
            paidAt,
          invoice_number:
            normalizeOptionalText(
              payment.invoice_number,
            ),
          payment_description:
            normalizeOptionalText(
              payment.payment_description,
            ),
          reminder:
            "Relación marcada como pagada desde el detalle.",
        },
      );

    await recordRelationshipActivity({
      ownerId,
      relationshipId:
        id,
      eventType:
        "closed",
    });

    return updatedRelationship;
  }

  private async getRequiredRelationship(
    id: string,
    ownerId: string,
  ): Promise<RelationshipRecord> {
    const relationship =
      await this.repository.findById(
        id,
        ownerId,
      );

    if (!relationship) {
      throw new Error(
        "Relationship not found.",
      );
    }

    return relationship;
  }
}

export function createRelationshipService(): RelationshipService {
  return new RelationshipService();
}