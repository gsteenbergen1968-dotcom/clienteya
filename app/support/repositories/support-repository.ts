import type {
  AuditEvent,
  KnowledgeAnswer,
  KnowledgeCategory,
  KnowledgeFeedback,
  KnowledgeItem,
  LearningSignal,
  SupportAttachment,
  SupportConversation,
  SupportConversationId,
  SupportEscalation,
  SupportMessage,
  SupportRequest,
  SupportRole,
  SupportTeam,
  SupportUser,
  Translation,
} from "../models";

import type { SupportListOptions } from "../adapters";

export interface SupportRepository {
  getUsers(
    options?: SupportListOptions,
  ): Promise<SupportUser[]>;

  getUser(
    userId: string,
  ): Promise<SupportUser | null>;

  saveUser(
    user: SupportUser,
  ): Promise<void>;

  getRoles(): Promise<SupportRole[]>;

  getRole(
    roleId: string,
  ): Promise<SupportRole | null>;

  saveRole(
    role: SupportRole,
  ): Promise<void>;

  getTeams(
    options?: SupportListOptions,
  ): Promise<SupportTeam[]>;

  getTeam(
    teamId: string,
  ): Promise<SupportTeam | null>;

  saveTeam(
    team: SupportTeam,
  ): Promise<void>;

  getRequests(
    options?: SupportListOptions,
  ): Promise<SupportRequest[]>;

  getRequest(
    requestId: string,
  ): Promise<SupportRequest | null>;

  saveRequest(
    request: SupportRequest,
  ): Promise<void>;

  getConversations(
    options?: SupportListOptions,
  ): Promise<SupportConversation[]>;

  getConversation(
    conversationId: SupportConversationId,
  ): Promise<SupportConversation | null>;

  saveConversation(
    conversation: SupportConversation,
  ): Promise<void>;

  getMessages(
    conversationId: SupportConversationId,
    options?: SupportListOptions,
  ): Promise<SupportMessage[]>;

  getMessage(
    messageId: string,
  ): Promise<SupportMessage | null>;

  saveMessage(
    message: SupportMessage,
  ): Promise<void>;

  getAttachments(
    messageId: string,
  ): Promise<SupportAttachment[]>;

  saveAttachment(
    attachment: SupportAttachment,
  ): Promise<void>;

  getKnowledgeItems(
    options?: SupportListOptions,
  ): Promise<KnowledgeItem[]>;

  getKnowledgeItem(
    knowledgeItemId: string,
  ): Promise<KnowledgeItem | null>;

  saveKnowledgeItem(
    item: KnowledgeItem,
  ): Promise<void>;

  getKnowledgeAnswers(
    knowledgeItemId: string,
  ): Promise<KnowledgeAnswer[]>;

  saveKnowledgeAnswer(
    answer: KnowledgeAnswer,
  ): Promise<void>;

  getKnowledgeCategories(): Promise<KnowledgeCategory[]>;

  saveKnowledgeCategory(
    category: KnowledgeCategory,
  ): Promise<void>;

  getKnowledgeFeedback(
    knowledgeItemId: string,
  ): Promise<KnowledgeFeedback[]>;

  saveKnowledgeFeedback(
    feedback: KnowledgeFeedback,
  ): Promise<void>;

  getTranslations(
    knowledgeItemId: string,
  ): Promise<Translation[]>;

  saveTranslation(
    translation: Translation,
  ): Promise<void>;

  getLearningSignals(
    options?: SupportListOptions,
  ): Promise<LearningSignal[]>;

  saveLearningSignal(
    signal: LearningSignal,
  ): Promise<void>;

  getEscalations(
    options?: SupportListOptions,
  ): Promise<SupportEscalation[]>;

  getEscalation(
    escalationId: string,
  ): Promise<SupportEscalation | null>;

  saveEscalation(
    escalation: SupportEscalation,
  ): Promise<void>;

  getAuditEvents(
    options?: SupportListOptions,
  ): Promise<AuditEvent[]>;

  saveAuditEvent(
    event: AuditEvent,
  ): Promise<void>;
}