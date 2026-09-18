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

export type SupportListOptions = {
  limit?: number;
  offset?: number;
};

export type SupportAdapter = {
  getUsers(options?: SupportListOptions): Promise<SupportUser[]>;
  getUserById(id: string): Promise<SupportUser | null>;
  saveUser(user: SupportUser): Promise<SupportUser>;

  getRoles(): Promise<SupportRole[]>;
  getRoleById(id: string): Promise<SupportRole | null>;
  saveRole(role: SupportRole): Promise<SupportRole>;

  getTeams(options?: SupportListOptions): Promise<SupportTeam[]>;
  getTeamById(id: string): Promise<SupportTeam | null>;
  saveTeam(team: SupportTeam): Promise<SupportTeam>;

  getRequests(options?: SupportListOptions): Promise<SupportRequest[]>;
  getRequestById(id: string): Promise<SupportRequest | null>;
  saveRequest(request: SupportRequest): Promise<SupportRequest>;

  getConversations(
    options?: SupportListOptions,
  ): Promise<SupportConversation[]>;
  getConversationById(
    id: string,
  ): Promise<SupportConversation | null>;
  saveConversation(
    conversation: SupportConversation,
  ): Promise<SupportConversation>;

  getMessagesByConversationId(
    conversationId: string,
    options?: SupportListOptions,
  ): Promise<SupportMessage[]>;
  getMessageById(id: string): Promise<SupportMessage | null>;
  saveMessage(message: SupportMessage): Promise<SupportMessage>;

  getAttachmentsByMessageId(
    messageId: string,
  ): Promise<SupportAttachment[]>;
  saveAttachment(
    attachment: SupportAttachment,
  ): Promise<SupportAttachment>;

  getKnowledgeItems(
    options?: SupportListOptions,
  ): Promise<KnowledgeItem[]>;
  getKnowledgeItemById(id: string): Promise<KnowledgeItem | null>;
  saveKnowledgeItem(item: KnowledgeItem): Promise<KnowledgeItem>;

  getKnowledgeAnswersByItemId(
    knowledgeItemId: string,
  ): Promise<KnowledgeAnswer[]>;
  saveKnowledgeAnswer(
    answer: KnowledgeAnswer,
  ): Promise<KnowledgeAnswer>;

  getKnowledgeCategories(): Promise<KnowledgeCategory[]>;
  saveKnowledgeCategory(
    category: KnowledgeCategory,
  ): Promise<KnowledgeCategory>;

  getKnowledgeFeedbackByItemId(
    knowledgeItemId: string,
  ): Promise<KnowledgeFeedback[]>;
  saveKnowledgeFeedback(
    feedback: KnowledgeFeedback,
  ): Promise<KnowledgeFeedback>;

  getTranslationsByItemId(
    knowledgeItemId: string,
  ): Promise<Translation[]>;
  saveTranslation(translation: Translation): Promise<Translation>;

  getLearningSignals(
    options?: SupportListOptions,
  ): Promise<LearningSignal[]>;
  saveLearningSignal(
    signal: LearningSignal,
  ): Promise<LearningSignal>;

  getEscalations(
    options?: SupportListOptions,
  ): Promise<SupportEscalation[]>;
  getEscalationById(id: string): Promise<SupportEscalation | null>;
  saveEscalation(
    escalation: SupportEscalation,
  ): Promise<SupportEscalation>;

  getAuditEvents(
    options?: SupportListOptions,
  ): Promise<AuditEvent[]>;
  saveAuditEvent(event: AuditEvent): Promise<AuditEvent>;
};