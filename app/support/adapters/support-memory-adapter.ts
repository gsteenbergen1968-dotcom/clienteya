import type {
  AuditEvent,
  KnowledgeAnswer,
  KnowledgeCategory,
  KnowledgeFeedback,
  KnowledgeItem,
  LearningSignal,
  SupportAttachment,
  SupportConversation,
  SupportEscalation,
  SupportMessage,
  SupportRequest,
  SupportRole,
  SupportTeam,
  SupportUser,
  Translation,
} from "../models";

import type {
  SupportAdapter,
  SupportListOptions,
} from "./support-adapter";

export interface SupportMemoryAdapter extends SupportAdapter {
  getUsers(options?: SupportListOptions): Promise<SupportUser[]>;
  getUserById(id: string): Promise<SupportUser | null>;

  getRoles(): Promise<SupportRole[]>;
  getTeams(options?: SupportListOptions): Promise<SupportTeam[]>;

  getRequests(options?: SupportListOptions): Promise<SupportRequest[]>;
  getRequestById(id: string): Promise<SupportRequest | null>;

  getConversations(
    options?: SupportListOptions,
  ): Promise<SupportConversation[]>;

  getMessagesByConversationId(
    conversationId: string,
    options?: SupportListOptions,
  ): Promise<SupportMessage[]>;

  getAttachmentsByMessageId(
    messageId: string,
  ): Promise<SupportAttachment[]>;

  getKnowledgeItems(
    options?: SupportListOptions,
  ): Promise<KnowledgeItem[]>;

  getKnowledgeAnswersByItemId(
    knowledgeItemId: string,
  ): Promise<KnowledgeAnswer[]>;

  getKnowledgeCategories(): Promise<KnowledgeCategory[]>;

  getKnowledgeFeedbackByItemId(
    knowledgeItemId: string,
  ): Promise<KnowledgeFeedback[]>;

  getTranslationsByItemId(
    knowledgeItemId: string,
  ): Promise<Translation[]>;

  getLearningSignals(
    options?: SupportListOptions,
  ): Promise<LearningSignal[]>;

  getEscalations(
    options?: SupportListOptions,
  ): Promise<SupportEscalation[]>;

  getAuditEvents(
    options?: SupportListOptions,
  ): Promise<AuditEvent[]>;
}