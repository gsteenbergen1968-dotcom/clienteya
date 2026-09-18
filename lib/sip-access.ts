export type SipRole =
  | "founder"
  | "admin"
  | "support_lead"
  | "support_agent"
  | "knowledge_manager"
  | "viewer";

export type SipPermission =
  | "sip.access"
  | "inbox.read"
  | "conversations.read"
  | "conversations.reply"
  | "knowledge.read"
  | "knowledge.manage"
  | "escalations.read"
  | "escalations.manage"
  | "learning.read"
  | "analytics.read"
  | "settings.read"
  | "users.manage";

const rolePermissions: Record<SipRole, SipPermission[]> = {
  founder: ["sip.access","inbox.read","conversations.read","conversations.reply","knowledge.read","knowledge.manage","escalations.read","escalations.manage","learning.read","analytics.read","settings.read","users.manage"],
  admin: ["sip.access","inbox.read","conversations.read","conversations.reply","knowledge.read","knowledge.manage","escalations.read","escalations.manage","learning.read","analytics.read","settings.read","users.manage"],
  support_lead: ["sip.access","inbox.read","conversations.read","conversations.reply","knowledge.read","knowledge.manage","escalations.read","escalations.manage","learning.read","analytics.read"],
  support_agent: ["sip.access","inbox.read","conversations.read","conversations.reply","knowledge.read","escalations.read"],
  knowledge_manager: ["sip.access","knowledge.read","knowledge.manage","learning.read"],
  viewer: ["sip.access","inbox.read","conversations.read","knowledge.read","escalations.read","learning.read","analytics.read"],
};

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

function getConfiguredSipEmails() {
  return (process.env.CLIENTEYA_SIP_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getConfiguredFounderEmails() {
  return (process.env.CLIENTEYA_FOUNDER_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isSipFounder(email?: string | null) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return getConfiguredFounderEmails().includes(normalizedEmail);
}

export function canUseSip(email?: string | null) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return (
    isSipFounder(normalizedEmail) ||
    getConfiguredSipEmails().includes(normalizedEmail)
  );
}

export function getSipRole(email?: string | null): SipRole | null {
  if (!canUseSip(email)) {
    return null;
  }

  if (isSipFounder(email)) {
    return "founder";
  }

  return "support_agent";
}

export function getSipPermissions(role?: SipRole | null): SipPermission[] {
  if (!role) {
    return [];
  }

  return rolePermissions[role];
}

export function hasSipPermission(
  role: SipRole | null | undefined,
  permission: SipPermission,
) {
  if (!role) {
    return false;
  }

  return rolePermissions[role].includes(permission);
}