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

type SupportUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  team_id: string | null;
  locale: SupportUser["locale"];
  time_zone: string;
  status: SupportUser["status"];
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

type SupportTeamRow = {
  id: string;
  name: string;
  description: string | null;
  type: SupportTeam["type"];
  manager_id: string | null;
  member_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SupportRoleRow = {
  id: string;
  key: SupportRole["key"];
  name: string;
  description: string | null;
  permissions: SupportRole["permissions"];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
};

type SupportAttachmentRow = {
  id: string;
  message_id: string;
  file_name: string;
  file_type: SupportAttachment["fileType"];
  mime_type: string;
  file_size: number;
  storage_path: string;
  status: SupportAttachment["status"];
  uploaded_by_user_id: string | null;
  checksum: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

type KnowledgeItemRow = {
  id: string;
  title: string;
  canonical_question: string;
  canonical_answer: string;
  canonical_language: KnowledgeItem["canonicalLanguage"];
  category_id: string;
  status: KnowledgeItem["status"];
  visibility: KnowledgeItem["visibility"];
  tenant_id: string | null;
  country_code: string | null;
  keywords: string[];
  supported_locales: KnowledgeItem["supportedLocales"];
  created_by_user_id: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  usage_count: number;
  automatic_resolution_count: number;
  human_resolution_count: number;
  average_confidence: number | null;
  average_satisfaction: number | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

type KnowledgeAnswerRow = {
  id: string;
  knowledge_item_id: string;
  locale: KnowledgeAnswer["locale"];
  title: string;
  answer: string;
  status: KnowledgeAnswer["status"];
  source: KnowledgeAnswer["source"];
  version: number;
  created_by_user_id: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  published_at: string | null;
  usage_count: number;
  average_satisfaction: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type KnowledgeCategoryRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  sort_order: number;
  status: KnowledgeCategory["status"];
  is_system_category: boolean;
  created_at: string;
  updated_at: string;
};

type AuditEventRow = {
  id:string;
  event:AuditEvent["event"];
  resource:AuditEvent["resource"];
  resource_id:string;
  performed_by_user_id:string|null;
  description:string;
  metadata:Record<string,unknown>|null;
  ip_address:string|null;
  user_agent:string|null;
  created_at:string;
  updated_at:string;
};

type EscalationRow = {
  id:string;
  conversation_id:string;
  knowledge_item_id:string|null;
  reason:SupportEscalation["reason"];
  status:SupportEscalation["status"];
  priority:SupportEscalation["priority"];
  title:string;
  description:string;
  assigned_user_id:string|null;
  assigned_team_id:string|null;
  created_by_user_id:string|null;
  resolved_by_user_id:string|null;
  requires_founder_review:boolean;
  assigned_at:string|null;
  resolved_at:string|null;
  closed_at:string|null;
  created_at:string;
  updated_at:string;
};

type LearningSignalRow = {
  id:string;
  type:LearningSignal["type"];
  status:LearningSignal["status"];
  source:LearningSignal["source"];
  title:string;
  description:string;
  conversation_id:string|null;
  knowledge_item_id:string|null;
  locale:LearningSignal["locale"]|null;
  confidence:number|null;
  occurrence_count:number;
  affected_user_count:number;
  requires_founder_review:boolean;
  reviewed_by_user_id:string|null;
  reviewed_at:string|null;
  implemented_at:string|null;
  created_at:string;
  updated_at:string;
};

type TranslationRow = {
  id: string;
  knowledge_item_id: string;
  source_locale: Translation["sourceLocale"];
  target_locale: Translation["targetLocale"];
  source_text: string;
  translated_text: string;
  status: Translation["status"];
  source: Translation["source"];
  version: number;
  created_by_user_id: string | null;
  reviewed_by_user_id: string | null;
  approved_by_user_id: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  quality_score: number | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

type KnowledgeFeedbackRow = {
  id: string;
  knowledge_item_id: string;
  type: KnowledgeFeedback["type"];
  source: KnowledgeFeedback["source"];
  locale: KnowledgeFeedback["locale"];
  rating: number | null;
  comment: string | null;
  submitted_by_user_id: string | null;
  requires_review: boolean;
  reviewed: boolean;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id:row.id,event:row.event,resource:row.resource,resourceId:row.resource_id,
    performedByUserId:row.performed_by_user_id??undefined,
    description:row.description,metadata:row.metadata??undefined,
    ipAddress:row.ip_address??undefined,userAgent:row.user_agent??undefined,
    createdAt:row.created_at,updatedAt:row.updated_at,
  };
}
function toAuditEventRow(e: AuditEvent): AuditEventRow {
  return {
    id:e.id,event:e.event,resource:e.resource,resource_id:e.resourceId,
    performed_by_user_id:e.performedByUserId??null,
    description:e.description,metadata:e.metadata??null,
    ip_address:e.ipAddress??null,user_agent:e.userAgent??null,
    created_at:e.createdAt,updated_at:e.updatedAt,
  };
}

function mapEscalation(row: EscalationRow): SupportEscalation {
  return {
    id:row.id,conversationId:row.conversation_id,knowledgeItemId:row.knowledge_item_id??undefined,
    reason:row.reason,status:row.status,priority:row.priority,title:row.title,description:row.description,
    assignedUserId:row.assigned_user_id??undefined,assignedTeamId:row.assigned_team_id??undefined,
    createdByUserId:row.created_by_user_id??undefined,resolvedByUserId:row.resolved_by_user_id??undefined,
    requiresFounderReview:row.requires_founder_review,assignedAt:row.assigned_at??undefined,
    resolvedAt:row.resolved_at??undefined,closedAt:row.closed_at??undefined,
    createdAt:row.created_at,updatedAt:row.updated_at,
  };
}
function toEscalationRow(e: SupportEscalation): EscalationRow {
  return {
    id:e.id,conversation_id:e.conversationId,knowledge_item_id:e.knowledgeItemId??null,
    reason:e.reason,status:e.status,priority:e.priority,title:e.title,description:e.description,
    assigned_user_id:e.assignedUserId??null,assigned_team_id:e.assignedTeamId??null,
    created_by_user_id:e.createdByUserId??null,resolved_by_user_id:e.resolvedByUserId??null,
    requires_founder_review:e.requiresFounderReview,assigned_at:e.assignedAt??null,
    resolved_at:e.resolvedAt??null,closed_at:e.closedAt??null,
    created_at:e.createdAt,updated_at:e.updatedAt,
  };
}

function mapLearningSignal(row: LearningSignalRow): LearningSignal {
  return {
    id: row.id,type: row.type,status: row.status,source: row.source,
    title: row.title,description: row.description,
    conversationId: row.conversation_id ?? undefined,
    knowledgeItemId: row.knowledge_item_id ?? undefined,
    locale: row.locale ?? undefined,
    confidence: row.confidence ?? undefined,
    occurrenceCount: row.occurrence_count,
    affectedUserCount: row.affected_user_count,
    requiresFounderReview: row.requires_founder_review,
    reviewedByUserId: row.reviewed_by_user_id ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    implementedAt: row.implemented_at ?? undefined,
    createdAt: row.created_at,updatedAt: row.updated_at,
  };
}
function toLearningSignalRow(signal: LearningSignal): LearningSignalRow {
  return {
    id:signal.id,type:signal.type,status:signal.status,source:signal.source,
    title:signal.title,description:signal.description,
    conversation_id:signal.conversationId??null,
    knowledge_item_id:signal.knowledgeItemId??null,
    locale:signal.locale??null,
    confidence:signal.confidence??null,
    occurrence_count:signal.occurrenceCount,
    affected_user_count:signal.affectedUserCount,
    requires_founder_review:signal.requiresFounderReview,
    reviewed_by_user_id:signal.reviewedByUserId??null,
    reviewed_at:signal.reviewedAt??null,
    implemented_at:signal.implementedAt??null,
    created_at:signal.createdAt,updated_at:signal.updatedAt,
  };
}

function mapTranslation(
  row: TranslationRow,
): Translation {
  return {
    id: row.id,
    knowledgeItemId: row.knowledge_item_id,
    sourceLocale: row.source_locale,
    targetLocale: row.target_locale,
    sourceText: row.source_text,
    translatedText: row.translated_text,
    status: row.status,
    source: row.source,
    version: row.version,
    createdByUserId: row.created_by_user_id ?? undefined,
    reviewedByUserId: row.reviewed_by_user_id ?? undefined,
    approvedByUserId: row.approved_by_user_id ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    qualityScore: row.quality_score ?? undefined,
    lastUsedAt: row.last_used_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTranslationRow(
  translation: Translation,
): TranslationRow {
  return {
    id: translation.id,
    knowledge_item_id: translation.knowledgeItemId,
    source_locale: translation.sourceLocale,
    target_locale: translation.targetLocale,
    source_text: translation.sourceText,
    translated_text: translation.translatedText,
    status: translation.status,
    source: translation.source,
    version: translation.version,
    created_by_user_id: translation.createdByUserId ?? null,
    reviewed_by_user_id: translation.reviewedByUserId ?? null,
    approved_by_user_id: translation.approvedByUserId ?? null,
    reviewed_at: translation.reviewedAt ?? null,
    approved_at: translation.approvedAt ?? null,
    quality_score: translation.qualityScore ?? null,
    last_used_at: translation.lastUsedAt ?? null,
    created_at: translation.createdAt,
    updated_at: translation.updatedAt,
  };
}

function mapKnowledgeFeedback(
  row: KnowledgeFeedbackRow,
): KnowledgeFeedback {
  return {
    id: row.id,
    knowledgeItemId: row.knowledge_item_id,
    type: row.type,
    source: row.source,
    locale: row.locale,
    rating: row.rating ?? undefined,
    comment: row.comment ?? undefined,
    submittedByUserId:
      row.submitted_by_user_id ?? undefined,
    requiresReview: row.requires_review,
    reviewed: row.reviewed,
    reviewedByUserId:
      row.reviewed_by_user_id ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toKnowledgeFeedbackRow(
  feedback: KnowledgeFeedback,
): KnowledgeFeedbackRow {
  return {
    id: feedback.id,
    knowledge_item_id: feedback.knowledgeItemId,
    type: feedback.type,
    source: feedback.source,
    locale: feedback.locale,
    rating: feedback.rating ?? null,
    comment: feedback.comment ?? null,
    submitted_by_user_id:
      feedback.submittedByUserId ?? null,
    requires_review: feedback.requiresReview,
    reviewed: feedback.reviewed,
    reviewed_by_user_id:
      feedback.reviewedByUserId ?? null,
    reviewed_at: feedback.reviewedAt ?? null,
    created_at: feedback.createdAt,
    updated_at: feedback.updatedAt,
  };
}

function mapKnowledgeCategory(
  row: KnowledgeCategoryRow,
): KnowledgeCategory {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description ?? undefined,
    parentCategoryId: row.parent_category_id ?? undefined,
    sortOrder: row.sort_order,
    status: row.status,
    isSystemCategory: row.is_system_category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toKnowledgeCategoryRow(
  category: KnowledgeCategory,
): KnowledgeCategoryRow {
  return {
    id: category.id,
    key: category.key,
    name: category.name,
    description: category.description ?? null,
    parent_category_id: category.parentCategoryId ?? null,
    sort_order: category.sortOrder,
    status: category.status,
    is_system_category: category.isSystemCategory,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  };
}

function mapKnowledgeItem(
  row: KnowledgeItemRow,
): KnowledgeItem {
  return {
    id: row.id,
    title: row.title,
    canonicalQuestion: row.canonical_question,
    canonicalAnswer: row.canonical_answer,
    canonicalLanguage: row.canonical_language,
    categoryId: row.category_id,
    status: row.status,
    visibility: row.visibility,
    scope: {
      tenantId: row.tenant_id ?? undefined,
      countryCode: row.country_code ?? undefined,
    },
    keywords: row.keywords,
    supportedLocales: row.supported_locales,
    createdByUserId:
      row.created_by_user_id ?? undefined,
    approvedByUserId:
      row.approved_by_user_id ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    usageCount: row.usage_count,
    automaticResolutionCount:
      row.automatic_resolution_count,
    humanResolutionCount:
      row.human_resolution_count,
    averageConfidence:
      row.average_confidence ?? undefined,
    averageSatisfaction:
      row.average_satisfaction ?? undefined,
    lastUsedAt: row.last_used_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toKnowledgeItemRow(
  item: KnowledgeItem,
): KnowledgeItemRow {
  return {
    id: item.id,
    title: item.title,
    canonical_question: item.canonicalQuestion,
    canonical_answer: item.canonicalAnswer,
    canonical_language: item.canonicalLanguage,
    category_id: item.categoryId,
    status: item.status,
    visibility: item.visibility,
    tenant_id: item.scope.tenantId ?? null,
    country_code: item.scope.countryCode ?? null,
    keywords: item.keywords,
    supported_locales: item.supportedLocales,
    created_by_user_id:
      item.createdByUserId ?? null,
    approved_by_user_id:
      item.approvedByUserId ?? null,
    approved_at: item.approvedAt ?? null,
    usage_count: item.usageCount,
    automatic_resolution_count:
      item.automaticResolutionCount,
    human_resolution_count:
      item.humanResolutionCount,
    average_confidence:
      item.averageConfidence ?? null,
    average_satisfaction:
      item.averageSatisfaction ?? null,
    last_used_at: item.lastUsedAt ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function mapKnowledgeAnswer(
  row: KnowledgeAnswerRow,
): KnowledgeAnswer {
  return {
    id: row.id,
    knowledgeItemId: row.knowledge_item_id,
    locale: row.locale,
    title: row.title,
    answer: row.answer,
    status: row.status,
    source: row.source,
    version: row.version,
    createdByUserId: row.created_by_user_id ?? undefined,
    approvedByUserId: row.approved_by_user_id ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
    usageCount: row.usage_count,
    averageSatisfaction: row.average_satisfaction ?? undefined,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toKnowledgeAnswerRow(
  answer: KnowledgeAnswer,
): KnowledgeAnswerRow {
  return {
    id: answer.id,
    knowledge_item_id: answer.knowledgeItemId,
    locale: answer.locale,
    title: answer.title,
    answer: answer.answer,
    status: answer.status,
    source: answer.source,
    version: answer.version,
    created_by_user_id: answer.createdByUserId ?? null,
    approved_by_user_id: answer.approvedByUserId ?? null,
    approved_at: answer.approvedAt ?? null,
    published_at: answer.publishedAt ?? null,
    usage_count: answer.usageCount,
    average_satisfaction: answer.averageSatisfaction ?? null,
    is_default: answer.isDefault,
    created_at: answer.createdAt,
    updated_at: answer.updatedAt,
  };
}

function mapSupportAttachment(
  row: SupportAttachmentRow,
): SupportAttachment {
  return {
    id: row.id,
    messageId: row.message_id,
    fileName: row.file_name,
    fileType: row.file_type,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    storagePath: row.storage_path,
    status: row.status,
    uploadedByUserId:
      row.uploaded_by_user_id ?? undefined,
    checksum: row.checksum ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSupportAttachmentRow(
  attachment: SupportAttachment,
): SupportAttachmentRow {
  return {
    id: attachment.id,
    message_id: attachment.messageId,
    file_name: attachment.fileName,
    file_type: attachment.fileType,
    mime_type: attachment.mimeType,
    file_size: attachment.fileSize,
    storage_path: attachment.storagePath,
    status: attachment.status,
    uploaded_by_user_id:
      attachment.uploadedByUserId ?? null,
    checksum: attachment.checksum ?? null,
    deleted_at: attachment.deletedAt ?? null,
    created_at: attachment.createdAt,
    updated_at: attachment.updatedAt,
  };
}

function mapSupportRole(row: SupportRoleRow): SupportRole {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description ?? undefined,
    permissions: row.permissions,
    isSystemRole: row.is_system_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSupportRoleRow(
  role: SupportRole,
): SupportRoleRow {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description ?? null,
    permissions: role.permissions,
    is_system_role: role.isSystemRole,
    created_at: role.createdAt,
    updated_at: role.updatedAt,
  };
}

function mapSupportTeam(row: SupportTeamRow): SupportTeam {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type,
    managerId: row.manager_id ?? undefined,
    memberIds: row.member_ids,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSupportTeamRow(
  team: SupportTeam,
): SupportTeamRow {
  return {
    id: team.id,
    name: team.name,
    description: team.description ?? null,
    type: team.type,
    manager_id: team.managerId ?? null,
    member_ids: team.memberIds,
    is_active: team.isActive,
    created_at: team.createdAt,
    updated_at: team.updatedAt,
  };
}

function mapSupportUser(row: SupportUserRow): SupportUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    roleId: row.role_id,
    teamId: row.team_id ?? undefined,
    locale: row.locale,
    timeZone: row.time_zone,
    status: row.status,
    lastLoginAt: row.last_login_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSupportUserRow(
  user: SupportUser,
): SupportUserRow {
  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    role_id: user.roleId,
    team_id: user.teamId ?? null,
    locale: user.locale,
    time_zone: user.timeZone,
    status: user.status,
    last_login_at: user.lastLoginAt ?? null,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

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
      const supabase = createSipAdminClient()

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
      const supabase = createSipAdminClient()

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
      const supabase = createSipAdminClient()

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
      options?: SupportListOptions,
    ): Promise<SupportUser[]> {
      const supabase = createSipAdminClient()

      let query = supabase
        .from("support_users")
        .select("*")
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true });

      query = applyListOptions(query, options);

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `Unable to load support users: ${error.message}`,
        );
      }

      return (data as SupportUserRow[]).map(
        mapSupportUser,
      );
    },

    async getUserById(
      id: string,
    ): Promise<SupportUser | null> {
      const supabase = createSipAdminClient()

      const { data, error } = await supabase
        .from("support_users")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `Unable to load support user ${id}: ${error.message}`,
        );
      }

      return data
        ? mapSupportUser(data as SupportUserRow)
        : null;
    },

    async saveUser(
      user: SupportUser,
    ): Promise<SupportUser> {
      const supabase = createSipAdminClient()

      const { data, error } = await supabase
        .from("support_users")
        .upsert(toSupportUserRow(user), {
          onConflict: "id",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(
          `Unable to save support user ${user.id}: ${error.message}`,
        );
      }

      return mapSupportUser(data as SupportUserRow);
    },

    async getRoles(): Promise<SupportRole[]> {
      const supabase = createSipAdminClient()

      const { data, error } = await supabase
        .from("support_roles")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(
          `Unable to load support roles: ${error.message}`,
        );
      }

      return (data as SupportRoleRow[]).map(
        mapSupportRole,
      );
    },

    async getRoleById(
      id: string,
    ): Promise<SupportRole | null> {
      const supabase = createSipAdminClient()

      const { data, error } = await supabase
        .from("support_roles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `Unable to load support role ${id}: ${error.message}`,
        );
      }

      return data
        ? mapSupportRole(data as SupportRoleRow)
        : null;
    },

    async saveRole(
      role: SupportRole,
    ): Promise<SupportRole> {
      const supabase = createSipAdminClient()

      const { data, error } = await supabase
        .from("support_roles")
        .upsert(toSupportRoleRow(role), {
          onConflict: "id",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(
          `Unable to save support role ${role.id}: ${error.message}`,
        );
      }

      return mapSupportRole(data as SupportRoleRow);
    },

    async getTeams(
      options?: SupportListOptions,
    ): Promise<SupportTeam[]> {
      const supabase = createSipAdminClient();

      let query = supabase
        .from("support_teams")
        .select("*")
        .order("name", { ascending: true });

      query = applyListOptions(query, options);

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `Unable to load support teams: ${error.message}`,
        );
      }

      return (data as SupportTeamRow[]).map(
        mapSupportTeam,
      );
    },

    async getTeamById(
      id: string,
    ): Promise<SupportTeam | null> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_teams")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `Unable to load support team ${id}: ${error.message}`,
        );
      }

      return data
        ? mapSupportTeam(data as SupportTeamRow)
        : null;
    },

    async saveTeam(
      team: SupportTeam,
    ): Promise<SupportTeam> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_teams")
        .upsert(toSupportTeamRow(team), {
          onConflict: "id",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(
          `Unable to save support team ${team.id}: ${error.message}`,
        );
      }

      return mapSupportTeam(data as SupportTeamRow);
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
      messageId: string,
    ): Promise<SupportAttachment[]> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_attachments")
        .select("*")
        .eq("message_id", messageId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(
          `Unable to load support attachments for message ${messageId}: ${error.message}`,
        );
      }

      return (data as SupportAttachmentRow[]).map(
        mapSupportAttachment,
      );
    },

    async saveAttachment(
      attachment: SupportAttachment,
    ): Promise<SupportAttachment> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_attachments")
        .upsert(toSupportAttachmentRow(attachment), {
          onConflict: "id",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(
          `Unable to save support attachment ${attachment.id}: ${error.message}`,
        );
      }

      return mapSupportAttachment(
        data as SupportAttachmentRow,
      );
    },

    async getKnowledgeItems(
      options?: SupportListOptions,
    ): Promise<KnowledgeItem[]> {
      const supabase = createSipAdminClient();

      let query = supabase
        .from("support_knowledge_items")
        .select("*")
        .order("updated_at", { ascending: false });

      query = applyListOptions(query, options);

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `Unable to load support knowledge items: ${error.message}`,
        );
      }

      return (data as KnowledgeItemRow[]).map(
        mapKnowledgeItem,
      );
    },

    async getKnowledgeItemById(
      id: string,
    ): Promise<KnowledgeItem | null> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_knowledge_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `Unable to load support knowledge item ${id}: ${error.message}`,
        );
      }

      return data
        ? mapKnowledgeItem(data as KnowledgeItemRow)
        : null;
    },

    async saveKnowledgeItem(
      item: KnowledgeItem,
    ): Promise<KnowledgeItem> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_knowledge_items")
        .upsert(toKnowledgeItemRow(item), {
          onConflict: "id",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(
          `Unable to save support knowledge item ${item.id}: ${error.message}`,
        );
      }

      return mapKnowledgeItem(
        data as KnowledgeItemRow,
      );
    },

    async getKnowledgeAnswersByItemId(
      knowledgeItemId: string,
    ): Promise<KnowledgeAnswer[]> {
      const supabase=createSipAdminClient();
      const {data,error}=await supabase.from("support_knowledge_answers").select("*").eq("knowledge_item_id",knowledgeItemId).order("version",{ascending:false});
      if(error){throw new Error(`Unable to load support knowledge answers: ${error.message}`);}
      return (data as KnowledgeAnswerRow[]).map(mapKnowledgeAnswer);
    },

    async saveKnowledgeAnswer(
      answer: KnowledgeAnswer,
    ): Promise<KnowledgeAnswer> {
      const supabase=createSipAdminClient();
      const {data,error}=await supabase.from("support_knowledge_answers").upsert(toKnowledgeAnswerRow(answer),{onConflict:"id"}).select("*").single();
      if(error){throw new Error(`Unable to save support knowledge answer ${answer.id}: ${error.message}`);}
      return mapKnowledgeAnswer(data as KnowledgeAnswerRow);
    },

    async getKnowledgeCategories(): Promise<KnowledgeCategory[]> {
      const supabase=createSipAdminClient();
      const {data,error}=await supabase.from("support_knowledge_categories").select("*").order("sort_order");
      if(error){throw new Error(`Unable to load support knowledge categories: ${error.message}`);}
      return (data as KnowledgeCategoryRow[]).map(mapKnowledgeCategory);
    },

    async saveKnowledgeCategory(
      category: KnowledgeCategory,
    ): Promise<KnowledgeCategory> {
      const supabase=createSipAdminClient();
      const {data,error}=await supabase.from("support_knowledge_categories").upsert(toKnowledgeCategoryRow(category),{onConflict:"id"}).select("*").single();
      if(error){throw new Error(`Unable to save support knowledge category ${category.id}: ${error.message}`);}
      return mapKnowledgeCategory(data as KnowledgeCategoryRow);
    },

    async getKnowledgeFeedbackByItemId(
      knowledgeItemId: string,
    ): Promise<KnowledgeFeedback[]> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_knowledge_feedback")
        .select("*")
        .eq("knowledge_item_id", knowledgeItemId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(
          `Unable to load support knowledge feedback for item ${knowledgeItemId}: ${error.message}`,
        );
      }

      return (data as KnowledgeFeedbackRow[]).map(
        mapKnowledgeFeedback,
      );
    },

    async saveKnowledgeFeedback(
      feedback: KnowledgeFeedback,
    ): Promise<KnowledgeFeedback> {
      const supabase = createSipAdminClient();

      const { data, error } = await supabase
        .from("support_knowledge_feedback")
        .upsert(toKnowledgeFeedbackRow(feedback), {
          onConflict: "id",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(
          `Unable to save support knowledge feedback ${feedback.id}: ${error.message}`,
        );
      }

      return mapKnowledgeFeedback(
        data as KnowledgeFeedbackRow,
      );
    },

    async getTranslationsByItemId(
      knowledgeItemId: string,
    ): Promise<Translation[]> {
      const supabase=createSipAdminClient();
      const {data,error}=await supabase.from("support_translations").select("*").eq("knowledge_item_id",knowledgeItemId).order("version",{ascending:false});
      if(error){throw new Error(`Unable to load support translations: ${error.message}`);}
      return (data as TranslationRow[]).map(mapTranslation);
    },

    async saveTranslation(
      translation: Translation,
    ): Promise<Translation> {
      const supabase=createSipAdminClient();
      const {data,error}=await supabase.from("support_translations").upsert(toTranslationRow(translation),{onConflict:"id"}).select("*").single();
      if(error){throw new Error(`Unable to save support translation ${translation.id}: ${error.message}`);}
      return mapTranslation(data as TranslationRow);
    },

    async getLearningSignals(
      options?: SupportListOptions,
    ): Promise<LearningSignal[]> {
      const supabase=createSipAdminClient();
      let query=supabase.from("support_learning_signals").select("*").order("created_at",{ascending:false});
      query=applyListOptions(query,options);
      const {data,error}=await query;
      if(error) throw new Error(`Unable to load support learning signals: ${error.message}`);
      return (data as LearningSignalRow[]).map(mapLearningSignal);
    },

    async saveLearningSignal(
      signal: LearningSignal,
    ): Promise<LearningSignal> {
      const supabase=createSipAdminClient();
      const {data,error}=await supabase.from("support_learning_signals").upsert(toLearningSignalRow(signal),{onConflict:"id"}).select("*").single();
      if(error) throw new Error(`Unable to save support learning signal ${signal.id}: ${error.message}`);
      return mapLearningSignal(data as LearningSignalRow);
    },

    async getEscalations(options?: SupportListOptions): Promise<SupportEscalation[]> {
      const supabase=createSipAdminClient();
      let query=supabase.from("support_escalations").select("*").order("created_at",{ascending:false});
      query=applyListOptions(query,options);
      const {data,error}=await query;
      if(error) throw new Error(`Unable to load support escalations: ${error.message}`);
      return (data as EscalationRow[]).map(mapEscalation);
    },

    async getEscalationById(id:string): Promise<SupportEscalation|null> {
      const supabase=createSipAdminClient();
      const {data,error}=await supabase.from("support_escalations").select("*").eq("id",id).maybeSingle();
      if(error) throw new Error(`Unable to load support escalation ${id}: ${error.message}`);
      return data?mapEscalation(data as EscalationRow):null;
    },

    async saveEscalation(escalation:SupportEscalation): Promise<SupportEscalation> {
      const supabase=createSipAdminClient();
      const {data,error}=await supabase.from("support_escalations").upsert(toEscalationRow(escalation),{onConflict:"id"}).select("*").single();
      if(error) throw new Error(`Unable to save support escalation ${escalation.id}: ${error.message}`);
      return mapEscalation(data as EscalationRow);
    },

    async getAuditEvents(options?: SupportListOptions): Promise<AuditEvent[]> {
      const supabase=createSipAdminClient();
      let query=supabase.from("support_audit_events").select("*").order("created_at",{ascending:false});
      query=applyListOptions(query,options);
      const {data,error}=await query;
      if(error) throw new Error(`Unable to load support audit events: ${error.message}`);
      return (data as AuditEventRow[]).map(mapAuditEvent);
    },

    async saveAuditEvent(event: AuditEvent): Promise<AuditEvent> {
      const supabase=createSipAdminClient();
      const {data,error}=await supabase.from("support_audit_events").upsert(toAuditEventRow(event),{onConflict:"id"}).select("*").single();
      if(error) throw new Error(`Unable to save support audit event ${event.id}: ${error.message}`);
      return mapAuditEvent(data as AuditEventRow);
    },
  };
  }