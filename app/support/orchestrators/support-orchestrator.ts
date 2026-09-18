import type { SupportListOptions } from "../adapters";

import type {
  AutoAnswerEngine,
  ConversationEngine,
  EscalationEngine,
  FounderInsightEngine,
  KnowledgeEngine,
  LanguageDetectionEngine,
  LearningEngine,
  PriorityEngine,
  SimilarityEngine,
  TranslationEngine,
} from "../engines";

import type { SupportRepository } from "../repositories";

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

export type SupportOrchestratorDependencies = {
  repository: SupportRepository;

  knowledgeEngine: KnowledgeEngine;
  similarityEngine: SimilarityEngine;
  languageDetectionEngine: LanguageDetectionEngine;
  translationEngine: TranslationEngine;
  autoAnswerEngine: AutoAnswerEngine;
  conversationEngine: ConversationEngine;
  learningEngine: LearningEngine;
  escalationEngine: EscalationEngine;
  priorityEngine: PriorityEngine;
  founderInsightEngine: FounderInsightEngine;
};

export type SupportOrchestrator = {
  readonly repository: SupportRepository;

  readonly knowledgeEngine: KnowledgeEngine;
  readonly similarityEngine: SimilarityEngine;
  readonly languageDetectionEngine: LanguageDetectionEngine;
  readonly translationEngine: TranslationEngine;
  readonly autoAnswerEngine: AutoAnswerEngine;
  readonly conversationEngine: ConversationEngine;
  readonly learningEngine: LearningEngine;
  readonly escalationEngine: EscalationEngine;
  readonly priorityEngine: PriorityEngine;
  readonly founderInsightEngine: FounderInsightEngine;

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
};

export function createSupportOrchestrator(
  dependencies: SupportOrchestratorDependencies,
): SupportOrchestrator {
  return {
    ...dependencies,

    getUsers(options) {
      return dependencies.repository.getUsers(options);
    },

    getUser(userId) {
      return dependencies.repository.getUser(userId);
    },

    saveUser(user) {
      return dependencies.repository.saveUser(user);
    },

    getRoles() {
      return dependencies.repository.getRoles();
    },

    getRole(roleId) {
      return dependencies.repository.getRole(roleId);
    },

    saveRole(role) {
      return dependencies.repository.saveRole(role);
    },

    getTeams(options) {
      return dependencies.repository.getTeams(options);
    },

    getTeam(teamId) {
      return dependencies.repository.getTeam(teamId);
    },

    saveTeam(team) {
      return dependencies.repository.saveTeam(team);
    },

    getRequests(options) {
      return dependencies.repository.getRequests(options);
    },

    getRequest(requestId) {
      return dependencies.repository.getRequest(requestId);
    },

    saveRequest(request) {
      return dependencies.repository.saveRequest(request);
    },

    getConversations(options) {
      return dependencies.repository.getConversations(options);
    },

    getConversation(conversationId) {
      return dependencies.repository.getConversation(
        conversationId,
      );
    },

    saveConversation(conversation) {
      return dependencies.repository.saveConversation(
        conversation,
      );
    },

    getMessages(conversationId, options) {
      return dependencies.repository.getMessages(
        conversationId,
        options,
      );
    },

    getMessage(messageId) {
      return dependencies.repository.getMessage(messageId);
    },

    saveMessage(message) {
      return dependencies.repository.saveMessage(
        message,
      );
    },

    getAttachments(messageId) {
      return dependencies.repository.getAttachments(
        messageId,
      );
    },

    saveAttachment(attachment) {
      return dependencies.repository.saveAttachment(
        attachment,
      );
    },

    getKnowledgeItems(options) {
      return dependencies.repository.getKnowledgeItems(
        options,
      );
    },

    getKnowledgeItem(knowledgeItemId) {
      return dependencies.repository.getKnowledgeItem(
        knowledgeItemId,
      );
    },

    saveKnowledgeItem(item) {
      return dependencies.repository.saveKnowledgeItem(
        item,
      );
    },

    getKnowledgeAnswers(knowledgeItemId) {
      return dependencies.repository.getKnowledgeAnswers(
        knowledgeItemId,
      );
    },

    saveKnowledgeAnswer(answer) {
      return dependencies.repository.saveKnowledgeAnswer(
        answer,
      );
    },

    getKnowledgeCategories() {
      return dependencies.repository.getKnowledgeCategories();
    },

    saveKnowledgeCategory(category) {
      return dependencies.repository.saveKnowledgeCategory(
        category,
      );
    },

    getKnowledgeFeedback(knowledgeItemId) {
      return dependencies.repository.getKnowledgeFeedback(
        knowledgeItemId,
      );
    },

    saveKnowledgeFeedback(feedback) {
      return dependencies.repository.saveKnowledgeFeedback(
        feedback,
      );
    },

    getTranslations(knowledgeItemId) {
      return dependencies.repository.getTranslations(
        knowledgeItemId,
      );
    },

    saveTranslation(translation) {
      return dependencies.repository.saveTranslation(
        translation,
      );
    },

    getLearningSignals(options) {
      return dependencies.repository.getLearningSignals(
        options,
      );
    },

    saveLearningSignal(signal) {
      return dependencies.repository.saveLearningSignal(
        signal,
      );
    },

    getEscalations(options) {
      return dependencies.repository.getEscalations(options);
    },

    getEscalation(escalationId) {
      return dependencies.repository.getEscalation(
        escalationId,
      );
    },

    saveEscalation(escalation) {
      return dependencies.repository.saveEscalation(
        escalation,
      );
    },

    getAuditEvents(options) {
      return dependencies.repository.getAuditEvents(options);
    },

    saveAuditEvent(event) {
      return dependencies.repository.saveAuditEvent(event);
    },
  };
}