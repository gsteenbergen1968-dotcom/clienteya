import type { CommercialAction } from "./commercial-action-engine";

import {
  buildExecutiveDecisionEngine,
  type ExecutiveDecision,
} from "./executive-decision-engine";

import { buildSectorDecisionCopy } from "./sector-intelligence";

import { buildWhatsAppSectorMessage } from "./whatsapp-sector-intelligence";

export type DecisionPresentationBusinessSettings = {
  company_name?: string | null;
  business_name?: string | null;
  name?: string | null;
  business_type?: string | null;
  business_sector?: string | null;
  sector?: string | null;
  industry?: string | null;
  rubro?: string | null;
  category?: string | null;
  business_tone?: string | null;
  tone?: string | null;
  business_email?: string | null;
  business_phone?: string | null;
  whatsapp_number?: string | null;
  country_label?: string | null;
  city?: string | null;
  ai_prompt?: string | null;
};

export type DecisionPresentationChannel =
  | "dashboard"
  | "calendar"
  | "automation"
  | "cockpit"
  | "relationship";

export type DecisionPresentationTone =
  | "red"
  | "amber"
  | "emerald"
  | "violet"
  | "sky"
  | "slate";

export type DecisionPresentationItem = {
  id: string;
  relationshipId: string;
  name: string;
  phone: string;
  status: string;

  title: string;
  summary: string;
  recommendation: string;

  priority: ExecutiveDecision["priority"];
  bucket: ExecutiveDecision["bucket"];

  commercialScore: number;
  urgencyScore: number;
  memoryScore: number;

  amount: number;
  paid: boolean;
  nextContactAt: string | null;

  channels: DecisionPresentationChannel[];
};

export type DashboardDecisionPresentation = {
  id: string;
  name: string;
  phone: string;
  status: string;
  amount: number;

  score: number;
  label: string;
  reason: string;

  sectorHeadline: string;
  sectorActionPhrase: string;
  sectorReason: string;
  sectorPrimaryVerb: string;

  actionLabel: string;
  actionHref: string;

  tone: Exclude<DecisionPresentationTone, "violet">;

  commercialScore: number;
  memoryScore: number;
  relationshipScore: number;
};

export type CalendarDecisionPresentationUrgency =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "none";

export type CalendarDecisionPresentationActionType =
  | "contactado"
  | "listo"
  | "schedule";

export type CalendarDecisionPresentation = {
  id: string;
  relationshipId: string;
  name: string;
  phone: string;
  status: string;
  notes: string | null;
  memory: string | null;
  reminder: string | null;
  nextContactAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  amount: number;
  paid: boolean;
  paidAt: string | null;

  title: string;
  summary: string;
  recommendation: string;

  tone: DecisionPresentationTone;
  urgency: CalendarDecisionPresentationUrgency;

  actionType: CalendarDecisionPresentationActionType;
  actionLabel: string;
  nextActionLabel: string;

  score: number;
  commercialScore: number;
  urgencyScore: number;
  memoryScore: number;
  relationshipScore: number;

  daysUntilNextContact: number | null;
  bucket: ExecutiveDecision["bucket"];
};

export type DecisionPresentationResult = {
  decisions: DecisionPresentationItem[];
  dashboard: DashboardDecisionPresentation[];
  calendar: CalendarDecisionPresentation[];
  automations: DecisionPresentationItem[];
  cockpit: DecisionPresentationItem[];
  relationships: DecisionPresentationItem[];
};

export type BuildDecisionPresentationInput = {
  actions: CommercialAction[];
  businessType?: string | null;
  businessSettings?: DecisionPresentationBusinessSettings | null;
  companyName?: string | null;
  dashboardLimit?: number;
};

function normalizeText(
  value: string | null | undefined,
) {
  return (value || "")
    .toLowerCase()
    .trim();
}

function getWhatsappHref(
  phone: string | null | undefined,
  message?: string | null,
) {
  const raw = String(
    phone || "",
  ).replace(/\D/g, "");

  if (!raw) return "";

  let number = raw;

  if (
    number.startsWith("00")
  ) {
    number = number.slice(2);
  }

  if (
    number.startsWith("0")
  ) {
    number = number.slice(1);
  }

  if (
    !number.startsWith("595")
  ) {
    number = `595${number}`;
  }

  const baseHref =
    `https://wa.me/${number}`;

  const cleanMessage =
    message?.trim();

  if (!cleanMessage) {
    return baseHref;
  }

  return `${baseHref}?text=${encodeURIComponent(
    cleanMessage,
  )}`;
}

function getPresentationChannels(
  decision: ExecutiveDecision,
): DecisionPresentationChannel[] {
  const channels:
    DecisionPresentationChannel[] = [];

  if (
    decision.dashboard
  ) {
    channels.push(
      "dashboard",
    );
  }

  if (
    decision.calendar
  ) {
    channels.push(
      "calendar",
    );
  }

  if (
    decision.automation
  ) {
    channels.push(
      "automation",
    );
  }

  if (
    decision.cockpit
  ) {
    channels.push(
      "cockpit",
    );
  }

  if (
    decision.relationship
  ) {
    channels.push(
      "relationship",
    );
  }

  return channels;
}

function getPresentationTone(
  action: CommercialAction,
): DecisionPresentationTone {
  if (
    action.tone === "red"
  ) {
    return "red";
  }

  if (
    action.tone === "amber"
  ) {
    return "amber";
  }

  if (
    action.tone === "emerald"
  ) {
    return "emerald";
  }

  if (
    action.tone === "violet"
  ) {
    return "violet";
  }

  if (
    action.tone === "sky"
  ) {
    return "sky";
  }

  if (
    normalizeText(
      action.status,
    ).includes("pag")
  ) {
    return "emerald";
  }

  return "slate";
}

function getDashboardTone(
  action: CommercialAction,
): DashboardDecisionPresentation["tone"] {
  const tone =
    getPresentationTone(
      action,
    );

  if (
    tone === "violet"
  ) {
    return "sky";
  }

  return tone;
}

function getDecisionActionLabel({
  action,
  hasWhatsapp,
  whatsappActionLabel,
}: {
  action: CommercialAction;
  hasWhatsapp: boolean;
  whatsappActionLabel?: string | null;
}) {
  const value =
    normalizeText(
      action.actionLabel,
    );

  if (
    value.includes("revisar") ||
    value.includes("agendar")
  ) {
    return "Ver relación";
  }

  return hasWhatsapp
    ? whatsappActionLabel ||
        "Enviar WhatsApp"
    : "Ver relación";
}

function getDecisionActionHref({
  action,
  hasWhatsapp,
  whatsappMessage,
}: {
  action: CommercialAction;
  hasWhatsapp: boolean;
  whatsappMessage?: string | null;
}) {
  const value =
    normalizeText(
      action.actionLabel,
    );

  if (!hasWhatsapp) {
    return `/dashboard/relationships/${action.id}`;
  }

  if (
    value.includes("revisar") ||
    value.includes("agendar")
  ) {
    return `/dashboard/relationships/${action.id}`;
  }

  return getWhatsappHref(
    action.phone,
    whatsappMessage,
  );
}

function getDaysOverdue(
  action: CommercialAction,
) {
  if (
    typeof action.daysUntilContact !==
    "number"
  ) {
    return null;
  }

  return action.daysUntilContact < 0
    ? Math.abs(
        action.daysUntilContact,
      )
    : null;
}

function getRelationshipScore(
  action: CommercialAction,
) {
  let score = 40;

  score += Math.round(
    action.memoryScore * 0.35,
  );

  if (
    action.phone
  ) {
    score += 10;
  }

  if (
    action.reminder
  ) {
    score += 10;
  }

  if (
    action.notes
  ) {
    score += 10;
  }

  if (
    action.nextContactAt
  ) {
    score += 10;
  }

  if (
    action.paid ||
    normalizeText(
      action.status,
    ).includes("pag")
  ) {
    score += 10;
  }

  if (
    normalizeText(
      action.status,
    ).includes("cerr")
  ) {
    score -= 20;
  }

  return Math.max(
    0,
    Math.min(
      100,
      score,
    ),
  );
}

function getCalendarUrgency(
  decision: ExecutiveDecision,
): CalendarDecisionPresentationUrgency {
  if (
    decision.priority ===
    "critical"
  ) {
    return "critical";
  }

  if (
    decision.priority ===
    "high"
  ) {
    return "high";
  }

  if (
    decision.priority ===
    "medium"
  ) {
    return "medium";
  }

  if (
    decision.priority ===
    "low"
  ) {
    return "low";
  }

  return "none";
}

function getCalendarActionType(
  decision: ExecutiveDecision,
): CalendarDecisionPresentationActionType {
  if (
    decision.bucket ===
    "overdue"
  ) {
    return "contactado";
  }

  if (
    decision.bucket ===
    "today"
  ) {
    return "listo";
  }

  return "schedule";
}

function getCalendarActionLabel(
  decision: ExecutiveDecision,
) {
  if (
    decision.bucket ===
    "overdue"
  ) {
    return "✔ Contactado";
  }

  if (
    decision.bucket ===
    "today"
  ) {
    return "✔ Listo";
  }

  return "Agendar siguiente";
}

function findActionForDecision(
  decision: ExecutiveDecision,
  actions: CommercialAction[],
) {
  return actions.find(
    (
      action,
    ) =>
      action.relationshipId ===
      decision.relationshipId,
  );
}

function toDecisionPresentationItem({
  decision,
  action,
}: {
  decision: ExecutiveDecision;
  action: CommercialAction;
}): DecisionPresentationItem {
  return {
    id:
      action.id,

    relationshipId:
      decision.relationshipId,

    name:
      action.name,

    phone:
      action.phone,

    status:
      action.status,

    title:
      decision.title,

    summary:
      decision.summary,

    recommendation:
      decision.recommendation,

    priority:
      decision.priority,

    bucket:
      decision.bucket,

    commercialScore:
      decision.commercialScore,

    urgencyScore:
      decision.urgencyScore,

    memoryScore:
      decision.memoryScore,

    amount:
      Number(
        action.amount || 0,
      ),

    paid:
      Boolean(
        action.paid,
      ),

    nextContactAt:
      action.nextContactAt,

    channels:
      getPresentationChannels(
        decision,
      ),
  };
}

function toDashboardPresentation({
  decision,
  action,
  businessType,
  businessSettings,
  companyName,
}: {
  decision: ExecutiveDecision;
  action: CommercialAction;
  businessType?: string | null;
  businessSettings?: DecisionPresentationBusinessSettings | null;
  companyName?: string | null;
}): DashboardDecisionPresentation {
  const hasWhatsapp =
    Boolean(
      getWhatsappHref(
        action.phone,
      ),
    );

  const value =
    Number(
      action.amount || 0,
    );

  const isPaid =
    Boolean(
      action.paid,
    ) ||
    normalizeText(
      action.status,
    ).includes("pag");

  const daysOverdue =
    getDaysOverdue(
      action,
    );

  const sectorDecision =
    buildSectorDecisionCopy({
      businessType:
        businessType ||
        "general",

      decisionLabel:
        action.actionLabel,

      reason:
        decision.summary,

      estado:
        action.status,

      daysOverdue,

      hasWhatsapp,

      isPaid,

      hasValue:
        value > 0,
    });

  const whatsappSectorMessage =
    buildWhatsAppSectorMessage({
      relationship: {
        id:
          action.id,

        nombre:
          action.name,

        telefono:
          action.phone,

        estado:
          action.status,

        notas:
          action.notes,

        recordatorio:
          action.reminder,

        proximo_contacto:
          action.nextContactAt,

        monto:
          action.amount,

        pagado:
          action.paid,
      },

      business: {
        company_name:
          companyName ||
          businessSettings?.company_name ||
          null,

        business_type:
          businessType ||
          businessSettings?.business_type ||
          null,

        business_tone:
          businessSettings?.business_tone ||
          businessSettings?.tone ||
          null,

        ai_prompt:
          businessSettings?.ai_prompt ||
          null,

        whatsapp_number:
          businessSettings?.whatsapp_number ||
          null,
      },

      decisionLabel:
        action.actionLabel,

      reason:
        decision.summary,

      daysOverdue,
    });

  return {
    id:
      action.id,

    name:
      action.name,

    phone:
      action.phone,

    status:
      action.status,

    amount:
      value,

    score:
      decision.commercialScore,

    label:
      action.actionLabel,

    reason:
      decision.summary,

    sectorHeadline:
      sectorDecision.headline,

    sectorActionPhrase:
      sectorDecision.actionPhrase ||
      decision.recommendation,

    sectorReason:
      sectorDecision.humanReason ||
      decision.summary,

    sectorPrimaryVerb:
      sectorDecision.primaryVerb,

    actionLabel:
      getDecisionActionLabel({
        action,
        hasWhatsapp,
        whatsappActionLabel:
          whatsappSectorMessage.actionLabel,
      }),

    actionHref:
      getDecisionActionHref({
        action,
        hasWhatsapp,
        whatsappMessage:
          whatsappSectorMessage.message,
      }),

    tone:
      getDashboardTone(
        action,
      ),

    commercialScore:
      decision.commercialScore,

    memoryScore:
      decision.memoryScore,

    relationshipScore:
      getRelationshipScore(
        action,
      ),
  };
}

function toCalendarPresentation({
  decision,
  action,
}: {
  decision: ExecutiveDecision;
  action: CommercialAction;
}): CalendarDecisionPresentation {
  return {
    id:
      action.id,

    relationshipId:
      decision.relationshipId,

    name:
      action.name,

    phone:
      action.phone,

    status:
      action.status,

    notes:
      action.notes,

    memory:
      action.memory,

    reminder:
      action.reminder,

    nextContactAt:
      action.nextContactAt,

    createdAt:
      action.createdAt,

    updatedAt:
      action.updatedAt,

    amount:
      Number(
        action.amount || 0,
      ),

    paid:
      Boolean(
        action.paid,
      ),

    paidAt:
      action.paidAt,

    title:
      decision.title,

    summary:
      decision.summary,

    recommendation:
      decision.recommendation,

    tone:
      getPresentationTone(
        action,
      ),

    urgency:
      getCalendarUrgency(
        decision,
      ),

    actionType:
      getCalendarActionType(
        decision,
      ),

    actionLabel:
      getCalendarActionLabel(
        decision,
      ),

    nextActionLabel:
      action.actionLabel,

    score:
      decision.commercialScore,

    commercialScore:
      decision.commercialScore,

    urgencyScore:
      decision.urgencyScore,

    memoryScore:
      decision.memoryScore,

    relationshipScore:
      getRelationshipScore(
        action,
      ),

    daysUntilNextContact:
      action.daysUntilContact,

    bucket:
      decision.bucket,
  };
}

export function buildDecisionPresentation({
  actions,
  businessType,
  businessSettings,
  companyName,
  dashboardLimit = 3,
}: BuildDecisionPresentationInput): DecisionPresentationResult {
  const safeActions =
    actions ?? [];

  const decisionResult =
    buildExecutiveDecisionEngine(
      safeActions,
    );

  const decisions =
    decisionResult.decisions
      .map(
        (
          decision,
        ) => {
          const action =
            findActionForDecision(
              decision,
              safeActions,
            );

          if (!action) {
            return null;
          }

          return toDecisionPresentationItem({
            decision,
            action,
          });
        },
      )
      .filter(
        (
          item,
        ): item is DecisionPresentationItem =>
          Boolean(item),
      );

  const dashboard =
    decisionResult.dashboard
      .slice(
        0,
        Math.max(
          0,
          dashboardLimit,
        ),
      )
      .map(
        (
          decision,
        ) => {
          const action =
            findActionForDecision(
              decision,
              safeActions,
            );

          if (!action) {
            return null;
          }

          return toDashboardPresentation({
            decision,
            action,
            businessType,
            businessSettings,
            companyName,
          });
        },
      )
      .filter(
        (
          item,
        ): item is DashboardDecisionPresentation =>
          Boolean(item),
      );

  const calendar =
    decisionResult.calendar
      .map(
        (
          decision,
        ) => {
          const action =
            findActionForDecision(
              decision,
              safeActions,
            );

          if (!action) {
            return null;
          }

          return toCalendarPresentation({
            decision,
            action,
          });
        },
      )
      .filter(
        (
          item,
        ): item is CalendarDecisionPresentation =>
          Boolean(item),
      );

  return {
    decisions,
    dashboard,
    calendar,

    automations:
      decisions.filter(
        (
          item,
        ) =>
          item.channels.includes(
            "automation",
          ),
      ),

    cockpit:
      decisions.filter(
        (
          item,
        ) =>
          item.channels.includes(
            "cockpit",
          ),
      ),

    relationships:
      decisions.filter(
        (
          item,
        ) =>
          item.channels.includes(
            "relationship",
          ),
      ),
  };
}

export function buildDashboardDecisionPresentation({
  actions,
  businessType,
  businessSettings,
  companyName,
  limit = 3,
}: {
  actions: CommercialAction[];
  businessType?: string | null;
  businessSettings?: DecisionPresentationBusinessSettings | null;
  companyName?: string | null;
  limit?: number;
}): DashboardDecisionPresentation[] {
  return buildDecisionPresentation({
    actions,
    businessType,
    businessSettings,
    companyName,
    dashboardLimit:
      limit,
  }).dashboard;
}

export function buildCalendarDecisionPresentation({
  actions,
}: {
  actions: CommercialAction[];
}): CalendarDecisionPresentation[] {
  return buildDecisionPresentation({
    actions,
  }).calendar;
}