import type {
  SupportEntity,
  SupportUserId,
} from "./support-model";

export type AuditEventType =
  | "created"
  | "updated"
  | "deleted"
  | "assigned"
  | "reassigned"
  | "resolved"
  | "closed"
  | "knowledge_created"
  | "knowledge_updated"
  | "knowledge_approved"
  | "translation_created"
  | "translation_approved"
  | "escalated"
  | "login"
  | "logout";

export type AuditResourceType =
  | "user"
  | "team"
  | "role"
  | "request"
  | "conversation"
  | "message"
  | "knowledge_item"
  | "knowledge_answer"
  | "translation"
  | "learning_signal"
  | "escalation";

export type AuditEvent = SupportEntity & {
  event: AuditEventType;
  resource: AuditResourceType;
  resourceId: string;

  performedByUserId?: SupportUserId;

  description: string;

  metadata?: Record<string, unknown>;

  ipAddress?: string;
  userAgent?: string;
};