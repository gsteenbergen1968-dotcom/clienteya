import { createSipAdminClient } from "../../../lib/supabase/sip-server";

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
  SupportListOptions,
} from "./support-adapter";

import type {
  SupportMemoryAdapter,
} from "./support-memory-adapter";

type SupportRequestRow = {
  id: string;
  tenant_id: string;
  country_code: string;
  locale: string;
  conversation_id: string;
  source: SupportRequest["source"];
  channel: SupportRequest["channel"];
  intent: SupportRequest["intent"];
  subject: string | null;
  original_message: string;
  detected_language: string;
  status: SupportRequest["status"];
  priority: SupportRequest["priority"];
  assigned_user_id: string | null;
  assigned_team_id: string | null;
  matched_knowledge_item_id: string | null;
  match_confidence: number | null;
  resolution_type: SupportRequest["resolutionType"] | null;
  resolved_at: string | null;
  requires_founder_review: boolean;
  created_at: string;
  updated_at: string;
};

type SupportConversationRow = {
  id: string;
  tenant_id: string;
  country_code: string;
  locale: string;
  channel: SupportConversation["channel"];
  status: SupportConversation["status"];
  subject: string | null;
  participant_ids: string[];
  participants: SupportConversation["participants"];
  message_ids: string[];
  assigned_user_id: string | null;
  assigned_team_id: string | null;
  detected_language: string;
  last_message_at: string | null;
  resolved_at: string | null;
  is_unread: boolean;
  requires_human_response: boolean;
  created_at: string;
  updated_at: string;
};

type SupportMessageRow = {
  id: string;
  conversation_id: string;
  type: SupportMessage["type"];
  actor_type: SupportMessage["actorType"];
  actor_id: string | null;
  content: string;
  language: string;
  delivery_status: SupportMessage["deliveryStatus"];
  knowledge_item_id: string | null;
  confidence: number | null;
  is_internal: boolean;
  is_edited: boolean;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapSupportRequest(row: SupportRequestRow): SupportRequest {
  return {
    id: row.id,
    scope: {
      tenantId: row.tenant_id,
      countryCode: row.country_code,
      locale: row.locale,
    },
    conversationId: row.conversation_id,
    source: row.source,
    channel: row.channel,
    intent: row.intent,
    subject: row.subject ?? undefined,
    originalMessage: row.original_message,
    detectedLanguage: row.detected_language,
    status: row.status,
    priority: row.priority,
    assignedUserId: row.assigned_user_id ?? undefined,
    assignedTeamId: row.assigned_team_id ?? undefined,
    matchedKnowledgeItemId:
      row.matched_knowledge_item_id ?? undefined,
    matchConfidence: row.match_confidence ?? undefined,
    resolutionType: row.resolution_type ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    requiresFounderReview: row.requires_founder_review,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSupportRequestRow(
  request: SupportRequest,
): SupportRequestRow {
  return {
    id: request.id,
    tenant_id: request.scope.tenantId,
    country_code: request.scope.countryCode,
    locale: request.scope.locale,
    conversation_id: request.conversationId,
    source: request.source,
    channel: request.channel,
    intent: request.intent,
    subject: request.subject ?? null,
    original_message: request.originalMessage,
    detected_language: request.detectedLanguage,
    status: request.status,
    priority: request.priority,
    assigned_user_id: request.assignedUserId ?? null,
    assigned_team_id: request.assignedTeamId ?? null,
    matched_knowledge_item_id:
      request.matchedKnowledgeItemId ?? null,
    match_confidence: request.matchConfidence ?? null,
    resolution_type: request.resolutionType ?? null,
    resolved_at: request.resolvedAt ?? null,
    requires_founder_review:
      request.requiresFounderReview,
    created_at: request.createdAt,
    updated_at: request.updatedAt,
  };
}

function mapSupportConversation(
  row: SupportConversationRow,
): SupportConversation {
  return {
    id: row.id,
    scope: {
      tenantId: row.tenant_id,
      countryCode: row.country_code,
      locale: row.locale,
    },
    channel: row.channel,
    status: row.status,
    subject: row.subject ?? undefined,
    participantIds: row.participant_ids,
    participants: row.participants,
    messageIds: row.message_ids,
    assignedUserId: row.assigned_user_id ?? undefined,
    assignedTeamId: row.assigned_team_id ?? undefined,
    detectedLanguage: row.detected_language,
    lastMessageAt: row.last_message_at ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    isUnread: row.is_unread,
    requiresHumanResponse: row.requires_human_response,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSupportConversationRow(
  conversation: SupportConversation,
): SupportConversationRow {
  return {
    id: conversation.id,
    tenant_id: conversation.scope.tenantId,
    country_code: conversation.scope.countryCode,
    locale: conversation.scope.locale,
    channel: conversation.channel,
    status: conversation.status,
    subject: conversation.subject ?? null,
    participant_ids: conversation.participantIds,
    participants: conversation.participants,
    message_ids: conversation.messageIds,
    assigned_user_id: conversation.assignedUserId ?? null,
    assigned_team_id: conversation.assignedTeamId ?? null,
    detected_language: conversation.detectedLanguage,
    last_message_at: conversation.lastMessageAt ?? null,
    resolved_at: conversation.resolvedAt ?? null,
    is_unread: conversation.isUnread,
    requires_human_response: conversation.requiresHumanResponse,
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
  };
}

function mapSupportMessage(
  row: SupportMessageRow,
): SupportMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    type: row.type,
    actorType: row.actor_type,
    actorId: row.actor_id ?? undefined,
    content: row.content,
    language: row.language,
    deliveryStatus: row.delivery_status,
    knowledgeItemId: row.knowledge_item_id ?? undefined,
    confidence: row.confidence ?? undefined,
    isInternal: row.is_internal,
    isEdited: row.is_edited,
    sentAt: row.sent_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSupportMessageRow(
  message: SupportMessage,
): SupportMessageRow {
  return {
    id: message.id,
    conversation_id: message.conversationId,
    type: message.type,
    actor_type: message.actorType,
    actor_id: message.actorId ?? null,
    content: message.content,
    language: message.language,
    delivery_status: message.deliveryStatus,
    knowledge_item_id: message.knowledgeItemId ?? null,
    confidence: message.confidence ?? null,
    is_internal: message.isInternal,
    is_edited: message.isEdited,
    sent_at: message.sentAt ?? null,
    delivered_at: message.deliveredAt ?? null,
    created_at: message.createdAt,
    updated_at: message.updatedAt,
  };
}

function applyListOptions<T>(
  query: T,
  options?: SupportListOptions,
): T {
  const rangedQuery = query as T & {
    range(from: number, to: number): T;
  };

  if (!options?.limit) {
    return query;
  }

  const from = options.offset ?? 0;
  const to = from + options.limit - 1;

  return rangedQuery.range(from, to);
}

function notImplemented(name: string): never {
  throw new Error(
    `Support Supabase adapter method not implemented yet: ${name}`,
  );
}

export function createSupportSupabaseAdapter(): SupportMemoryAdapter {
  return {
    async getRequests(
      options?: SupportListOptions,
    ): Promise<SupportRequest[]> {
      const supabase = createSipAdminClient();

      let query = supabase
        .from("support_requests")
        .select("*")
        .order("created_at", { ascending: false });

      query = applyListOptions(query, options);

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `Unable to load support requests: ${error.message}`,
        );
      }

      return (data as SupportRequestRow[]).map(
        mapSupportRequest,
      );
    },

    async getRequestById(
      id: string,
    ): Promise<SupportRequest | null> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `Unable to load support request ${id}: ${error.message}`,
        );
      }

      return data
        ? mapSupportRequest(data as SupportRequestRow)
        : null;
    },

    async saveRequest(
      request: SupportRequest,
    ): Promise<SupportRequest> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_requests")
        .upsert(toSupportRequestRow(request), {
          onConflict: "id",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(
          `Unable to save support request ${request.id}: ${error.message}`,
        );
      }

      return mapSupportRequest(data as SupportRequestRow);
    },

    async getUsers(
      _options?: SupportListOptions,
    ): Promise<SupportUser[]> {
      return notImplemented("getUsers");
    },

    async getUserById(
      _id: string,
    ): Promise<SupportUser | null> {
      return notImplemented("getUserById");
    },

    async saveUser(
      _user: SupportUser,
    ): Promise<SupportUser> {
      return notImplemented("saveUser");
    },

    async getRoles(): Promise<SupportRole[]> {
      return notImplemented("getRoles");
    },

    async getRoleById(
      _id: string,
    ): Promise<SupportRole | null> {
      return notImplemented("getRoleById");
    },

    async saveRole(
      _role: SupportRole,
    ): Promise<SupportRole> {
      return notImplemented("saveRole");
    },

    async getTeams(
      _options?: SupportListOptions,
    ): Promise<SupportTeam[]> {
      return notImplemented("getTeams");
    },

    async getTeamById(
      _id: string,
    ): Promise<SupportTeam | null> {
      return notImplemented("getTeamById");
    },

    async saveTeam(
      _team: SupportTeam,
    ): Promise<SupportTeam> {
      return notImplemented("saveTeam");
    },

    async getConversations(
      options?: SupportListOptions,
    ): Promise<SupportConversation[]> {
      const supabase = createSipAdminClient();

      let query = supabase
        .from("support_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      query = applyListOptions(query, options);

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `Unable to load support conversations: ${error.message}`,
        );
      }

      return (data as SupportConversationRow[]).map(
        mapSupportConversation,
      );
    },

    async getConversationById(
      id: string,
    ): Promise<SupportConversation | null> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `Unable to load support conversation ${id}: ${error.message}`,
        );
      }

      return data
        ? mapSupportConversation(
            data as SupportConversationRow,
          )
        : null;
    },

    async saveConversation(
      conversation: SupportConversation,
    ): Promise<SupportConversation> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_conversations")
        .upsert(toSupportConversationRow(conversation), {
          onConflict: "id",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(
          `Unable to save support conversation ${conversation.id}: ${error.message}`,
        );
      }

      return mapSupportConversation(
        data as SupportConversationRow,
      );
    },

    async getMessagesByConversationId(
      conversationId: string,
      options?: SupportListOptions,
    ): Promise<SupportMessage[]> {
      const supabase = createSipAdminClient();

      let query = supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      query = applyListOptions(query, options);

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `Unable to load support messages for conversation ${conversationId}: ${error.message}`,
        );
      }

      return (data as SupportMessageRow[]).map(
        mapSupportMessage,
      );
    },

    async getMessageById(
      id: string,
    ): Promise<SupportMessage | null> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `Unable to load support message ${id}: ${error.message}`,
        );
      }

      return data
        ? mapSupportMessage(data as SupportMessageRow)
        : null;
    },

    async saveMessage(
      message: SupportMessage,
    ): Promise<SupportMessage> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_messages")
        .upsert(toSupportMessageRow(message), {
          onConflict: "id",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(
          `Unable to save support message ${message.id}: ${error.message}`,
        );
      }

      return mapSupportMessage(data as SupportMessageRow);
    },

    async getAttachmentsByMessageId(
      _messageId: string,
    ): Promise<SupportAttachment[]> {
      return notImplemented(
        "getAttachmentsByMessageId",
      );
    },

    async saveAttachment(
      _attachment: SupportAttachment,
    ): Promise<SupportAttachment> {
      return notImplemented("saveAttachment");
    },

    async getKnowledgeItems(
      _options?: SupportListOptions,
    ): Promise<KnowledgeItem[]> {
      return notImplemented("getKnowledgeItems");
    },

    async getKnowledgeItemById(
      _id: string,
    ): Promise<KnowledgeItem | null> {
      return notImplemented("getKnowledgeItemById");
    },

    async saveKnowledgeItem(
      _item: KnowledgeItem,
    ): Promise<KnowledgeItem> {
      return notImplemented("saveKnowledgeItem");
    },

    async getKnowledgeAnswersByItemId(
      _knowledgeItemId: string,
    ): Promise<KnowledgeAnswer[]> {
      return notImplemented(
        "getKnowledgeAnswersByItemId",
      );
    },

    async saveKnowledgeAnswer(
      _answer: KnowledgeAnswer,
    ): Promise<KnowledgeAnswer> {
      return notImplemented("saveKnowledgeAnswer");
    },

    async getKnowledgeCategories(): Promise<
      KnowledgeCategory[]
    > {
      return notImplemented(
        "getKnowledgeCategories",
      );
    },

    async saveKnowledgeCategory(
      _category: KnowledgeCategory,
    ): Promise<KnowledgeCategory> {
      return notImplemented("saveKnowledgeCategory");
    },

    async getKnowledgeFeedbackByItemId(
      _knowledgeItemId: string,
    ): Promise<KnowledgeFeedback[]> {
      return notImplemented(
        "getKnowledgeFeedbackByItemId",
      );
    },

    async saveKnowledgeFeedback(
      _feedback: KnowledgeFeedback,
    ): Promise<KnowledgeFeedback> {
      return notImplemented("saveKnowledgeFeedback");
    },

    async getTranslationsByItemId(
      _knowledgeItemId: string,
    ): Promise<Translation[]> {
      return notImplemented(
        "getTranslationsByItemId",
      );
    },

    async saveTranslation(
      _translation: Translation,
    ): Promise<Translation> {
      return notImplemented("saveTranslation");
    },

    async getLearningSignals(
      _options?: SupportListOptions,
    ): Promise<LearningSignal[]> {
      return notImplemented("getLearningSignals");
    },

    async saveLearningSignal(
      _signal: LearningSignal,
    ): Promise<LearningSignal> {
      return notImplemented("saveLearningSignal");
    },

    async getEscalations(
      _options?: SupportListOptions,
    ): Promise<SupportEscalation[]> {
      return notImplemented("getEscalations");
    },

    async getEscalationById(
      _id: string,
    ): Promise<SupportEscalation | null> {
      return notImplemented("getEscalationById");
    },

    async saveEscalation(
      _escalation: SupportEscalation,
    ): Promise<SupportEscalation> {
      return notImplemented("saveEscalation");
    },

    async getAuditEvents(
      _options?: SupportListOptions,
    ): Promise<AuditEvent[]> {
      return notImplemented("getAuditEvents");
    },

    async saveAuditEvent(
      _event: AuditEvent,
    ): Promise<AuditEvent> {
      return notImplemented("saveAuditEvent");
    },
  };
}