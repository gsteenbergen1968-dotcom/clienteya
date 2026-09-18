export type RelationshipEngagementSignal =
  | "high"
  | "medium"
  | "low"
  | "unknown";

export type RelationshipPaymentStatus =
  | "paid"
  | "unpaid"
  | "unknown";

export type RelationshipLifecycleStatus =
  | "new"
  | "contacted"
  | "interested"
  | "inactive"
  | "closed"
  | "unknown";

export type RelationshipMemoryModel = {
  id: string;

  name: string;

  company: string | null;

  phone: string | null;

  relationshipType: string | null;

  lifecycleStatus: RelationshipLifecycleStatus;

  engagementSignal: RelationshipEngagementSignal;

  conversationContext: string;

  reminderContext: string;

  nextFollowUpAt: string | null;

  estimatedValue: number | null;

  paymentStatus: RelationshipPaymentStatus;

  paymentDate: string | null;

  createdAt: string | null;
};