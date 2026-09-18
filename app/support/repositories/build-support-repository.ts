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

import type {
  SupportAdapter,
  SupportListOptions,
} from "../adapters";

import type { SupportRepository } from "./support-repository";

export function buildSupportRepository(
  adapter: SupportAdapter,
): SupportRepository {
  return {
    async getUsers(
      options?: SupportListOptions,
    ): Promise<SupportUser[]> {
      return adapter.getUsers(options);
    },

    async getUser(
      userId: string,
    ): Promise<SupportUser | null> {
      return adapter.getUserById(userId);
    },

    async saveUser(
      user: SupportUser,
    ): Promise<void> {
      await adapter.saveUser(user);
    },

    async getRoles(): Promise<SupportRole[]> {
      return adapter.getRoles();
    },

    async getRole(
      roleId: string,
    ): Promise<SupportRole | null> {
      return adapter.getRoleById(roleId);
    },

    async saveRole(
      role: SupportRole,
    ): Promise<void> {
      await adapter.saveRole(role);
    },

    async getTeams(
      options?: SupportListOptions,
    ): Promise<SupportTeam[]> {
      return adapter.getTeams(options);
    },

    async getTeam(
      teamId: string,
    ): Promise<SupportTeam | null> {
      return adapter.getTeamById(teamId);
    },

    async saveTeam(
      team: SupportTeam,
    ): Promise<void> {
      await adapter.saveTeam(team);
    },

    async getRequests(
      options?: SupportListOptions,
    ): Promise<SupportRequest[]> {
      return adapter.getRequests(options);
    },

    async getRequest(
      requestId: string,
    ): Promise<SupportRequest | null> {
      return adapter.getRequestById(requestId);
    },

    async saveRequest(
      request: SupportRequest,
    ): Promise<void> {
      await adapter.saveRequest(request);
    },

    async getConversations(
      options?: SupportListOptions,
    ): Promise<SupportConversation[]> {
      return adapter.getConversations(options);
    },

    async getConversation(
      conversationId: SupportConversationId,
    ): Promise<SupportConversation | null> {
      return adapter.getConversationById(
        conversationId,
      );
    },

    async saveConversation(
      conversation: SupportConversation,
    ): Promise<void> {
      await adapter.saveConversation(
        conversation,
      );
    },

    async getMessages(
      conversationId: SupportConversationId,
      options?: SupportListOptions,
    ): Promise<SupportMessage[]> {
      return adapter.getMessagesByConversationId(
        conversationId,
        options,
      );
    },

    async getMessage(
      messageId: string,
    ): Promise<SupportMessage | null> {
      return adapter.getMessageById(messageId);
    },

    async saveMessage(
      message: SupportMessage,
    ): Promise<void> {
      await adapter.saveMessage(message);
    },

    async getAttachments(
      messageId: string,
    ): Promise<SupportAttachment[]> {
      return adapter.getAttachmentsByMessageId(
        messageId,
      );
    },

    async saveAttachment(
      attachment: SupportAttachment,
    ): Promise<void> {
      await adapter.saveAttachment(attachment);
    },

    async getKnowledgeItems(
      options?: SupportListOptions,
    ): Promise<KnowledgeItem[]> {
      return adapter.getKnowledgeItems(options);
    },

    async getKnowledgeItem(
      knowledgeItemId: string,
    ): Promise<KnowledgeItem | null> {
      return adapter.getKnowledgeItemById(
        knowledgeItemId,
      );
    },

    async saveKnowledgeItem(
      item: KnowledgeItem,
    ): Promise<void> {
      await adapter.saveKnowledgeItem(item);
    },

    async getKnowledgeAnswers(
      knowledgeItemId: string,
    ): Promise<KnowledgeAnswer[]> {
      return adapter.getKnowledgeAnswersByItemId(
        knowledgeItemId,
      );
    },

    async saveKnowledgeAnswer(
      answer: KnowledgeAnswer,
    ): Promise<void> {
      await adapter.saveKnowledgeAnswer(answer);
    },

    async getKnowledgeCategories(): Promise<KnowledgeCategory[]> {
      return adapter.getKnowledgeCategories();
    },

    async saveKnowledgeCategory(
      category: KnowledgeCategory,
    ): Promise<void> {
      await adapter.saveKnowledgeCategory(category);
    },

    async getKnowledgeFeedback(
      knowledgeItemId: string,
    ): Promise<KnowledgeFeedback[]> {
      return adapter.getKnowledgeFeedbackByItemId(
        knowledgeItemId,
      );
    },

    async saveKnowledgeFeedback(
      feedback: KnowledgeFeedback,
    ): Promise<void> {
      await adapter.saveKnowledgeFeedback(feedback);
    },

    async getTranslations(
      knowledgeItemId: string,
    ): Promise<Translation[]> {
      return adapter.getTranslationsByItemId(
        knowledgeItemId,
      );
    },

    async saveTranslation(
      translation: Translation,
    ): Promise<void> {
      await adapter.saveTranslation(translation);
    },

    async getLearningSignals(
      options?: SupportListOptions,
    ): Promise<LearningSignal[]> {
      return adapter.getLearningSignals(options);
    },

    async saveLearningSignal(
      signal: LearningSignal,
    ): Promise<void> {
      await adapter.saveLearningSignal(signal);
    },

    async getEscalations(
      options?: SupportListOptions,
    ): Promise<SupportEscalation[]> {
      return adapter.getEscalations(options);
    },

    async getEscalation(
      escalationId: string,
    ): Promise<SupportEscalation | null> {
      return adapter.getEscalationById(
        escalationId,
      );
    },

    async saveEscalation(
      escalation: SupportEscalation,
    ): Promise<void> {
      await adapter.saveEscalation(escalation);
    },

    async getAuditEvents(
      options?: SupportListOptions,
    ): Promise<AuditEvent[]> {
      return adapter.getAuditEvents(options);
    },

    async saveAuditEvent(
      event: AuditEvent,
    ): Promise<void> {
      await adapter.saveAuditEvent(event);
    },
  };
}