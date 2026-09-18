// lib/relationship-detail-service.ts

import { createRelationshipService } from "./relationship-service";
import type { RelationshipRecord } from "./relationship-repository";

export type RelationshipDetail = {
  relationship: RelationshipRecord;
};

export class RelationshipDetailService {
  constructor(
    private readonly relationshipService = createRelationshipService(),
  ) {}

  async getRelationshipDetail(
    id: string,
    ownerId: string,
  ): Promise<RelationshipDetail> {
    const relationship = await this.relationshipService.getRelationship(
      id,
      ownerId,
    );

    if (!relationship) {
      throw new Error("Relationship not found.");
    }

    return {
      relationship,
    };
  }

  async markAsContacted(
    id: string,
    ownerId: string,
  ): Promise<RelationshipRecord> {
    return this.relationshipService.markAsContacted(id, ownerId);
  }

  async scheduleForTomorrow(
    id: string,
    ownerId: string,
  ): Promise<RelationshipRecord> {
    return this.relationshipService.scheduleForTomorrow(id, ownerId);
  }

  async markAsPaid(
    id: string,
    ownerId: string,
  ): Promise<RelationshipRecord> {
    return this.relationshipService.markAsPaid(id, ownerId);
  }
}

export function createRelationshipDetailService() {
  return new RelationshipDetailService();
}