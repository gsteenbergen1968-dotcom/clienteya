import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { ui } from "../../../lib/ui";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";
import KpiCard from "../../components/KpiCard";
import SectionCard from "../../components/SectionCard";
import EmptyState from "../../components/EmptyState";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";

import {
  canAccessPro,
  type ProfileAccess,
} from "../../../lib/access-control";

export const dynamic = "force-dynamic";

type RelationshipCurrency =
  | "PYG"
  | "USD";

type Relationship = {
  id: string;
  owner_id?: string | null;
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  relationship_type?: string | null;
  status?: string | null;
  notes?: string | null;
  reminder?: string | null;
  next_contact_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_contact_at?: string | null;

  expected_amount?: number | null;
  paid_amount?: number | null;
  currency?: RelationshipCurrency | null;
  paid_at?: string | null;
  invoice_number?: string | null;
  payment_description?: string | null;
};

type RelationshipView = {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  relationshipType: string | null;
  status: string | null;
  notes: string | null;
  reminder: string | null;
  nextContactAt: string | null;

  expectedAmount: number | null;
  paidAmount: number | null;
  currency: RelationshipCurrency;
  paid: boolean;
  paidAt: string | null;
  invoiceNumber: string | null;
  paymentDescription: string | null;

  createdAt: string | null;
  updatedAt: string | null;
};

type RelationshipAISummary = {
  summary: string;
  commercialSignal: string;
  risk: string;
  nextBestStep: string;
  tone: "emerald" | "amber" | "red" | "sky" | "slate";
};

type ActivityLog = {
  id: string;
  event_type: string;
  created_at: string;
};

type Profile = ProfileAccess & {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(
  date: string | null | undefined,
) {
  if (!date) return "—";

  const cleanDate =
    date.slice(0, 10);

  const parts =
    cleanDate.split("-");

  if (
    parts.length !== 3
  ) {
    return date;
  }

  const [
    year,
    month,
    day,
  ] = parts;

  return `${day}/${month}/${year}`;
}

function formatDateTime(
  date: string,
) {
  return new Intl.DateTimeFormat(
    "es-PY",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(
    new Date(date),
  );
}

function formatAmount(
  value: number | null | undefined,
  currency: RelationshipCurrency,
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(
      Number(value),
    )
  ) {
    return "—";
  }

  const amount =
    Number(value);

  if (
    currency === "USD"
  ) {
    return new Intl.NumberFormat(
      "es-PY",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      },
    ).format(amount);
  }

  return `Gs. ${new Intl.NumberFormat(
    "es-PY",
    {
      maximumFractionDigits: 0,
    },
  ).format(amount)}`;
}

function daysBetween(
  date: string | null | undefined,
  today: string,
) {
  if (!date) return null;

  const target =
    new Date(
      `${date.slice(0, 10)}T00:00:00`,
    );

  const current =
    new Date(
      `${today}T00:00:00`,
    );

  if (
    Number.isNaN(
      target.getTime(),
    ) ||
    Number.isNaN(
      current.getTime(),
    )
  ) {
    return null;
  }

  return Math.round(
    (
      target.getTime() -
      current.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function cleanPhone(
  phone: string | null | undefined,
) {
  return (
    phone ?? ""
  ).replace(
    /[^\d]/g,
    "",
  );
}

function normalizeWhatsAppPhone(
  phone: string | null | undefined,
) {
  let number =
    cleanPhone(phone);

  if (
    number.startsWith("00")
  ) {
    number =
      number.slice(2);
  }

  if (
    number.startsWith("0")
  ) {
    number =
      number.slice(1);
  }

  if (
    number &&
    !number.startsWith("595")
  ) {
    number =
      `595${number}`;
  }

  return number;
}

function buildWhatsAppUrl(
  phone: string,
  message: string,
) {
  const number =
    normalizeWhatsAppPhone(
      phone,
    );

  if (!number) return "";

  return `https://wa.me/${number}?text=${encodeURIComponent(
    message,
  )}`;
}

function normalizeText(
  value: string | null | undefined,
) {
  return (
    value || ""
  )
    .toLowerCase()
    .trim();
}

function getRelationshipTypeKey(
  relationshipType: string | null | undefined,
) {
  return normalizeText(
    relationshipType,
  );
}

function parseOptionalAmount(
  value: FormDataEntryValue | null,
): number | null {
  const raw =
    String(
      value ?? "",
    ).trim();

  if (!raw) {
    return null;
  }

  const amount =
    Number(raw);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error(
      "Importe inválido.",
    );
  }

  return amount;
}

function normalizeOptionalText(
  value: FormDataEntryValue | null,
): string | null {
  const normalized =
    String(
      value ?? "",
    ).trim();

  return normalized || null;
}

function toRelationshipView(
  relationship: Relationship,
): RelationshipView {
  const status =
    normalizeText(
      relationship.status,
    );

  return {
    id:
      relationship.id,

    name:
      relationship.name ||
      relationship.company ||
      "Relación sin nombre",

    company:
      relationship.company ??
      null,

    phone:
      relationship.phone ??
      "",

    email:
      relationship.email ??
      null,

    relationshipType:
      relationship.relationship_type ??
      null,

    status:
      relationship.status ??
      null,

    notes:
      relationship.notes ??
      null,

    reminder:
      relationship.reminder ??
      null,

    nextContactAt:
      relationship.next_contact_at ??
      null,

    expectedAmount:
      relationship.expected_amount ??
      null,

    paidAmount:
      relationship.paid_amount ??
      null,

    currency:
      relationship.currency === "USD"
        ? "USD"
        : "PYG",

    paid:
      status.includes("pag") ||
      status.includes("convert"),

    paidAt:
      relationship.paid_at ??
      null,

    invoiceNumber:
      relationship.invoice_number ??
      null,

    paymentDescription:
      relationship.payment_description ??
      null,

    createdAt:
      relationship.created_at ??
      null,

    updatedAt:
      relationship.updated_at ??
      relationship.last_contact_at ??
      relationship.created_at ??
      null,
  };
}

function getActivityLabel(
  type: string,
) {
  if (
    type === "contactado"
  ) {
    return "Relación contactada";
  }

  if (
    type === "followup_scheduled"
  ) {
    return "Seguimiento agendado";
  }

  if (
    type === "closed"
  ) {
    return "Relación marcada como pagada";
  }

  if (
    type === "no_response"
  ) {
    return "Relación sin respuesta";
  }

  if (
    type === "followup"
  ) {
    return "Seguimiento ejecutado";
  }

  if (
    type === "manual_update"
  ) {
    return "Relación actualizada";
  }

  return "Actividad registrada";
}

function getActivityIcon(
  type: string,
) {
  if (
    type === "contactado"
  ) {
    return "✅";
  }

  if (
    type === "followup_scheduled"
  ) {
    return "⏰";
  }

  if (
    type === "closed"
  ) {
    return "💰";
  }

  if (
    type === "no_response"
  ) {
    return "🚫";
  }

  if (
    type === "followup"
  ) {
    return "📨";
  }

  if (
    type === "manual_update"
  ) {
    return "✏️";
  }

  return "📌";
}

function getRelationshipPhase(
  relationship: RelationshipView,
  today: string,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  const relationshipType =
    getRelationshipTypeKey(
      relationship.relationshipType,
    );

  const delta =
    daysBetween(
      relationship.nextContactAt,
      today,
    );

  if (
    delta !== null &&
    delta < 0
  ) {
    return {
      label:
        "Follow-up vencido",
      tone:
        "red",
      description:
        "Esta relación necesita seguimiento inmediato.",
    };
  }

  if (
    delta === 0
  ) {
    return {
      label:
        "Seguimiento hoy",
      tone:
        "amber",
      description:
        "El mejor momento para contactarla es hoy.",
    };
  }

  if (
    relationshipType.includes("proveedor")
  ) {
    return {
      label:
        "Proveedor",
      tone:
        "sky",
      description:
        "Relación de suministro. Mantener coordinación, condiciones y continuidad.",
    };
  }

  if (
    relationshipType.includes("socio")
  ) {
    return {
      label:
        "Socio",
      tone:
        "sky",
      description:
        "Relación estratégica. Mantener alineación y próximos acuerdos.",
    };
  }

  if (
    relationshipType.includes("inversor")
  ) {
    return {
      label:
        "Inversor",
      tone:
        "amber",
      description:
        "Relación de inversión. Mantener contexto, confianza y próximos hitos.",
    };
  }

  if (
    relationshipType.includes("cliente") &&
    (
      relationship.paid ||
      status.includes("pag")
    )
  ) {
    return {
      label:
        "Cliente activo",
      tone:
        "emerald",
      description:
        "Relación activa. Mantener contacto y buscar continuidad.",
    };
  }

  if (
    relationshipType.includes("embajador")
  ) {
    return {
      label:
        "Embajador",
      tone:
        "emerald",
      description:
        "Relación de recomendación. Cuidar vínculo y facilitar nuevas conexiones.",
    };
  }

  if (
    relationshipType.includes("contacto de red")
  ) {
    return {
      label:
        "Contacto de red",
      tone:
        "sky",
      description:
        "Relación de networking. Mantener contexto y contacto relevante.",
    };
  }

  if (
    relationship.paid ||
    status.includes("pag")
  ) {
    return {
      label:
        "Relación convertida",
      tone:
        "emerald",
      description:
        "Relación convertida. Mantener contacto y buscar continuidad.",
    };
  }

  if (
    status.includes("interes")
  ) {
    return {
      label:
        "Oportunidad",
      tone:
        "amber",
      description:
        "Relación con interés comercial activo.",
    };
  }

  if (
    status.includes("sin")
  ) {
    return {
      label:
        "Sin respuesta",
      tone:
        "orange",
      description:
        "Conviene reactivar con un mensaje simple.",
    };
  }

  if (
    status.includes("contact")
  ) {
    return {
      label:
        "Contactado",
      tone:
        "sky",
      description:
        "Ya existe contacto. Mantener el ritmo.",
    };
  }

  return {
    label:
      relationshipType.includes("prospecto")
        ? "Prospecto"
        : "Nueva relación",
    tone:
      "slate",
    description:
      relationshipType.includes("prospecto")
        ? "Prospecto en etapa inicial."
        : "Relación en etapa inicial.",
  };
}

function getPhaseClasses(
  tone: string,
) {
  if (
    tone === "red"
  ) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (
    tone === "amber"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (
    tone === "orange"
  ) {
    return "border-orange-200 bg-orange-50 text-orange-800";
  }

  if (
    tone === "sky"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (
    tone === "emerald"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getScore(
  relationship: RelationshipView,
  today: string,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  const delta =
    daysBetween(
      relationship.nextContactAt,
      today,
    );

  let score = 45;

  if (
    status.includes("interes")
  ) {
    score += 25;
  }

  if (
    status.includes("contact")
  ) {
    score += 15;
  }

  if (
    status.includes("sin")
  ) {
    score += 5;
  }

  if (
    status.includes("pag") ||
    relationship.paid
  ) {
    score += 30;
  }

  if (
    status.includes("cerr")
  ) {
    score -= 25;
  }

  if (
    delta !== null &&
    delta < 0
  ) {
    score += 25;
  }

  if (
    delta === 0
  ) {
    score += 20;
  }

  if (
    delta === 1
  ) {
    score += 10;
  }

  if (
    (
      relationship.expectedAmount ??
      0
    ) > 0 ||
    (
      relationship.paidAmount ??
      0
    ) > 0
  ) {
    score += 10;
  }

  return Math.max(
    0,
    Math.min(
      100,
      score,
    ),
  );
}

function buildRelationshipAISummary(
  relationship: RelationshipView,
  today: string,
): RelationshipAISummary {
  const status =
    normalizeText(
      relationship.status,
    );

  const relationshipType =
    getRelationshipTypeKey(
      relationship.relationshipType,
    );

  const notes =
    normalizeText(
      relationship.notes,
    );

  const reminder =
    normalizeText(
      relationship.reminder,
    );

  const combined =
    `${status} ${notes} ${reminder}`;

  const nextContactDelta =
    daysBetween(
      relationship.nextContactAt,
      today,
    );

  const overdue =
    nextContactDelta !== null &&
    nextContactDelta < 0;

  if (
    relationshipType.includes("proveedor")
  ) {
    return {
      summary:
        overdue
          ? "La relación con este proveedor tiene un seguimiento vencido y requiere coordinación."
          : "Relación activa con un proveedor. La prioridad es mantener claridad operativa y continuidad.",
      commercialSignal:
        "El valor está en suministro, condiciones, servicio y confiabilidad; no en conversión de venta.",
      risk:
        overdue
          ? "Un seguimiento pendiente puede afectar coordinación, condiciones o continuidad del suministro."
          : "Evitar perder contexto sobre acuerdos, condiciones, entregas o próximos compromisos.",
      nextBestStep:
        overdue
          ? "Retomar contacto hoy y confirmar el próximo compromiso con el proveedor."
          : "Confirmar el siguiente punto operativo, condición o fecha relevante.",
      tone:
        overdue
          ? "red"
          : "sky",
    };
  }

  if (
    relationshipType.includes("socio")
  ) {
    return {
      summary:
        "Relación estratégica con un socio. La prioridad es alineación, acuerdos y continuidad.",
      commercialSignal:
        "La señal principal es el avance de compromisos compartidos y oportunidades de colaboración.",
      risk:
        overdue
          ? "Hay un seguimiento estratégico pendiente que puede frenar coordinación o decisiones."
          : "El principal riesgo es perder alineación o dejar acuerdos sin siguiente paso claro.",
      nextBestStep:
        overdue
          ? "Retomar hoy el acuerdo pendiente y definir responsable y próximo hito."
          : "Definir el próximo acuerdo, responsable o hito conjunto.",
      tone:
        overdue
          ? "red"
          : "sky",
    };
  }

  if (
    relationshipType.includes("inversor")
  ) {
    return {
      summary:
        "Relación con un inversor. La prioridad es mantener confianza, contexto y próximos hitos claros.",
      commercialSignal:
        "La señal relevante es el nivel de interés, avance y claridad sobre la oportunidad de inversión.",
      risk:
        overdue
          ? "Un seguimiento vencido puede enfriar el interés o reducir confianza."
          : "Evitar largos silencios o información incompleta sobre avances y próximos hitos.",
      nextBestStep:
        overdue
          ? "Retomar contacto hoy con una actualización concreta y un siguiente paso."
          : "Compartir el avance relevante y acordar el próximo punto de contacto.",
      tone:
        overdue
          ? "red"
          : "amber",
    };
  }

  if (
    relationshipType.includes("embajador")
  ) {
    return {
      summary:
        "Relación con un embajador. El valor está en confianza, recomendación y conexión con nuevas relaciones.",
      commercialSignal:
        "Una relación activa puede generar referencias, visibilidad y nuevas conexiones de calidad.",
      risk:
        "El vínculo pierde valor si solo se activa cuando se necesita una recomendación.",
      nextBestStep:
        "Mantener contacto genuino y facilitar una próxima conexión o actualización relevante.",
      tone:
        "emerald",
    };
  }

  if (
    relationshipType.includes("contacto de red")
  ) {
    return {
      summary:
        "Relación de networking. La prioridad es conservar contexto y mantener un vínculo relevante.",
      commercialSignal:
        "Puede aportar información, introducciones u oportunidades futuras sin ser una venta directa.",
      risk:
        overdue
          ? "La relación puede enfriarse si el contacto pendiente no se retoma."
          : "Evitar contactos genéricos sin una razón clara o valor para la otra persona.",
      nextBestStep:
        overdue
          ? "Retomar el contacto pendiente con un mensaje breve y contextual."
          : "Mantener el vínculo con una actualización o motivo concreto.",
      tone:
        overdue
          ? "red"
          : "sky",
    };
  }

  const paid =
    relationship.paid ||
    status.includes("pag");

  const interested =
    status.includes("interes") ||
    combined.includes("precio") ||
    combined.includes("info") ||
    combined.includes("quiero") ||
    combined.includes("interesa");

  const cold =
    status.includes("sin respuesta") ||
    combined.includes("despues") ||
    combined.includes("después") ||
    combined.includes("más adelante") ||
    combined.includes("mas adelante");

  if (paid) {
    return {
      summary:
        relationshipType.includes("cliente")
          ? "Cliente activo con una conversión registrada y señales positivas de continuidad."
          : "Relación convertida correctamente y con señales positivas de continuidad.",
      commercialSignal:
        "La venta ya fue cerrada. Existe oportunidad de fidelización o recompra.",
      risk:
        "Riesgo comercial bajo. Evitar perder la relación post-venta.",
      nextBestStep:
        "Enviar seguimiento post-venta y mantener contacto activo.",
      tone:
        "emerald",
    };
  }

  if (overdue) {
    return {
      summary:
        "La relación tiene seguimiento vencido y necesita atención inmediata.",
      commercialSignal:
        "Todavía existe oportunidad comercial si se reactiva rápido.",
      risk:
        "Cada día sin respuesta reduce la probabilidad de conversión.",
      nextBestStep:
        "Enviar WhatsApp hoy y definir un nuevo próximo contacto.",
      tone:
        "red",
    };
  }

  if (interested) {
    return {
      summary:
        "La relación mostró interés comercial y sigue activa.",
      commercialSignal:
        "Buenas señales de intención. Existe potencial de conversión.",
      risk:
        "Demasiada demora puede enfriar la oportunidad.",
      nextBestStep:
        "Reducir fricción y pedir una decisión simple.",
      tone:
        "amber",
    };
  }

  if (cold) {
    return {
      summary:
        "La conversación perdió ritmo y la relación parece menos activa.",
      commercialSignal:
        "Todavía hay oportunidad si el contacto vuelve a activarse.",
      risk:
        "La relación puede perder prioridad si no hay seguimiento.",
      nextBestStep:
        "Enviar un mensaje corto y humano para reactivar la conversación.",
      tone:
        "sky",
    };
  }

  return {
    summary:
      relationshipType.includes("prospecto")
        ? "Prospecto en seguimiento normal."
        : "Relación en seguimiento normal.",
    commercialSignal:
      "No hay señales negativas importantes por ahora.",
    risk:
      "Mantener consistencia en seguimiento y actualización de contexto.",
    nextBestStep:
      "Continuar seguimiento y mantener la relación actualizada.",
    tone:
      "slate",
  };
}

function getRelationshipAISummaryClasses(
  tone: RelationshipAISummary["tone"],
) {
  if (
    tone === "emerald"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (
    tone === "amber"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (
    tone === "red"
  ) {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (
    tone === "sky"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}

function buildRecommendation(
  relationship: RelationshipView,
  today: string,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  const relationshipType =
    getRelationshipTypeKey(
      relationship.relationshipType,
    );

  const delta =
    daysBetween(
      relationship.nextContactAt,
      today,
    );

  if (
    relationshipType.includes("proveedor")
  ) {
    return {
      title:
        delta !== null &&
        delta < 0
          ? "Retomar proveedor"
          : "Mantener coordinación",
      action:
        delta !== null &&
        delta < 0
          ? "Contactar al proveedor y confirmar el compromiso pendiente."
          : "Confirmar próximo punto operativo o comercial.",
      description:
        "Esta relación es un proveedor. La prioridad es continuidad, condiciones, servicio y próximos compromisos; no convertir una oportunidad.",
    };
  }

  if (
    relationshipType.includes("socio")
  ) {
    return {
      title:
        "Alinear siguiente hito",
      action:
        "Definir próximo acuerdo, responsable o fecha.",
      description:
        "Esta relación es estratégica. Conviene mantener alineación y convertir conversaciones en compromisos claros.",
    };
  }

  if (
    relationshipType.includes("inversor")
  ) {
    return {
      title:
        "Mantener avance",
      action:
        "Compartir una actualización concreta y acordar el siguiente hito.",
      description:
        "Con un inversor, la prioridad es confianza, información relevante y continuidad del proceso.",
    };
  }

  if (
    relationshipType.includes("embajador")
  ) {
    return {
      title:
        "Cuidar vínculo",
      action:
        "Mantener contacto y facilitar una próxima conexión relevante.",
      description:
        "El valor de esta relación está en confianza, recomendación y nuevas conexiones.",
    };
  }

  if (
    relationshipType.includes("contacto de red")
  ) {
    return {
      title:
        "Mantener red activa",
      action:
        "Contactar con un motivo concreto y relevante.",
      description:
        "No es una oportunidad de venta directa. Conserva contexto y mantén un vínculo útil para ambas partes.",
    };
  }

  if (
    relationship.paid ||
    status.includes("pag")
  ) {
    return {
      title:
        "Mantener relación",
      action:
        "Enviar mensaje de seguimiento post-venta.",
      description:
        "Esta relación ya convirtió. La mejor acción es cuidar el vínculo y preparar continuidad.",
    };
  }

  if (
    delta !== null &&
    delta < 0
  ) {
    return {
      title:
        "Contactar ahora",
      action:
        "Enviar WhatsApp y marcar como contactado.",
      description:
        "El follow-up está vencido. Esta relación debe aparecer como prioridad operativa.",
    };
  }

  if (
    delta === 0
  ) {
    return {
      title:
        "Seguimiento de hoy",
      action:
        "Enviar WhatsApp hoy.",
      description:
        "La relación está en el momento correcto para recibir seguimiento.",
    };
  }

  if (
    status.includes("interes")
  ) {
    return {
      title:
        "Convertir oportunidad",
      action:
        "Enviar mensaje directo con siguiente paso.",
      description:
        "La relación mostró interés. Conviene reducir fricción y pedir una decisión simple.",
    };
  }

  if (
    status.includes("sin")
  ) {
    return {
      title:
        "Reactivar conversación",
      action:
        "Enviar mensaje corto y suave.",
      description:
        "Evita presionar. Busca una respuesta simple para reabrir la conversación.",
    };
  }

  return {
    title:
      "Mantener seguimiento",
    action:
      "Actualizar datos o programar próximo contacto.",
    description:
      "Todavía no hay señales fuertes. Mantén la relación ordenada en ClienteYA.",
  };
}

function buildWhatsAppMessage(
  relationship: RelationshipView,
  today: string,
) {
  const status =
    normalizeText(
      relationship.status,
    );

  const relationshipType =
    getRelationshipTypeKey(
      relationship.relationshipType,
    );

  const delta =
    daysBetween(
      relationship.nextContactAt,
      today,
    );

  if (
    relationshipType.includes("proveedor")
  ) {
    if (
      delta !== null &&
      delta < 0
    ) {
      return `Hola ${relationship.name} 👋

Quería retomar el punto que teníamos pendiente y confirmar cómo seguimos con la coordinación.

¿Podemos revisar el próximo paso?`;
    }

    return `Hola ${relationship.name} 👋

Te escribo para mantener al día nuestra coordinación y revisar el próximo punto pendiente.

¿Te parece si lo coordinamos?`;
  }

  if (
    relationshipType.includes("socio")
  ) {
    return `Hola ${relationship.name} 👋

Quería retomar nuestra coordinación y revisar el siguiente punto que tenemos por delante.

¿Te parece si definimos el próximo paso?`;
  }

  if (
    relationshipType.includes("inversor")
  ) {
    return `Hola ${relationship.name} 👋

Quería darte seguimiento y mantenerte al día sobre el próximo paso.

¿Te parece si coordinamos un momento para revisarlo?`;
  }

  if (
    relationshipType.includes("contacto de red") ||
    relationshipType.includes("embajador")
  ) {
    return `Hola ${relationship.name} 👋

Quería saludarte y retomar el contacto de forma breve.

¿Te parece si nos ponemos al día?`;
  }

  if (
    delta !== null &&
    delta < 0
  ) {
    return `Hola ${relationship.name} 👋

Te escribo para retomar nuestro seguimiento. Vi que teníamos pendiente volver a conversar y no quería dejarlo pasar.

¿Te parece si revisamos el siguiente paso?`;
  }

  if (
    delta === 0
  ) {
    return `Hola ${relationship.name} 👋

Tal como habíamos previsto, te escribo para dar seguimiento hoy.

¿Quieres que avancemos con el siguiente paso?`;
  }

  if (
    status.includes("interes")
  ) {
    return `Hola ${relationship.name} 👋

Gracias por el interés. Te escribo porque creo que podemos avanzar de forma simple con el siguiente paso.

¿Te gustaría que lo coordinemos?`;
  }

  if (
    status.includes("sin")
  ) {
    return `Hola ${relationship.name} 👋

Solo quería retomar por aquí de forma rápida.

¿Sigue siendo buen momento para conversar sobre esto?`;
  }

  return `Hola ${relationship.name} 👋

Te escribo para dar seguimiento y revisar el siguiente paso.

Quedo atento.`;
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function AISummaryPanel({
  relationship,
  today,
}: {
  relationship: RelationshipView;
  today: string;
}) {
  const summary =
    buildRelationshipAISummary(
      relationship,
      today,
    );

  return (
    <div
      className={`rounded-[28px] border p-5 shadow-sm ${getRelationshipAISummaryClasses(
        summary.tone,
      )}`}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-current bg-white/60 px-3 py-1 text-xs font-semibold">
            Resumen inteligente de la relación
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            ClienteYA piensa contigo
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6">
            {summary.summary}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Señal comercial
          </p>

          <p className="mt-2 text-sm font-medium leading-6">
            {summary.commercialSignal}
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Riesgo
          </p>

          <p className="mt-2 text-sm font-medium leading-6">
            {summary.risk}
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Próximo mejor paso
          </p>

          <p className="mt-2 text-sm font-medium leading-6">
            {summary.nextBestStep}
          </p>
        </div>
      </div>
    </div>
  );
}

async function getFounderModeForUser(
  userId: string,
  userEmail?: string | null,
) {
  const admin =
    createAdminClient();

  const {
    data: profileData,
  } =
    await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

  const profile =
    (
      profileData ||
      null
    ) as Profile | null;

  const profileAccess = {
    ...(profile || {}),
    email:
      profile?.email ||
      userEmail ||
      null,
  } as ProfileAccess;

  const access =
    canAccessPro(
      profileAccess,
    );

  return {
    admin,
    founderModeActive:
      access.reason ===
      "founder_mode",
    hasAccess:
      access.allowed,
  };
}

export default async function EditRelationshipPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
  }>;
}) {
  const params =
    await searchParams;

  const relationshipId =
    params.id;

  if (!relationshipId) {
    redirect(
      "/dashboard/relationships",
    );
  }

  const supabase =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    admin,
    founderModeActive,
    hasAccess,
  } =
    await getFounderModeForUser(
      user.id,
      user.email,
    );

  if (!hasAccess) {
    redirect("/dashboard");
  }

  let relationshipQuery =
    admin
      .from("relationships")
      .select("*")
      .eq(
        "id",
        relationshipId,
      );

  if (
    !founderModeActive
  ) {
    relationshipQuery =
      relationshipQuery.eq(
        "owner_id",
        user.id,
      );
  }

  const {
    data: relationshipData,
    error,
  } =
    await relationshipQuery.maybeSingle();

  if (
    error ||
    !relationshipData
  ) {
    redirect(
      "/dashboard/relationships",
    );
  }

  const relationship =
    relationshipData as Relationship;

  let logsQuery =
    admin
      .from("activity_logs")
      .select(
        "id,event_type,created_at",
      )
      .eq(
        "relationship_id",
        relationshipId,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );

  if (
    !founderModeActive
  ) {
    logsQuery =
      logsQuery.eq(
        "user_id",
        user.id,
      );
  }

  const {
    data: logs,
  } =
    await logsQuery;

  async function updateRelationship(
    formData: FormData,
  ) {
    "use server";

    const supabase =
      await createAuthServerClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const {
      admin,
      founderModeActive,
      hasAccess,
    } =
      await getFounderModeForUser(
        user.id,
        user.email,
      );

    if (!hasAccess) {
      redirect(
        "/dashboard",
      );
    }

    const id =
      String(
        formData.get("id") ||
          "",
      );

    if (!id) {
      redirect(
        "/dashboard/relationships",
      );
    }

    let existingQuery =
      admin
        .from("relationships")
        .select(
          "id,owner_id,status,paid_at",
        )
        .eq(
          "id",
          id,
        );

    if (
      !founderModeActive
    ) {
      existingQuery =
        existingQuery.eq(
          "owner_id",
          user.id,
        );
    }

    const {
      data:
        existingRelationship,
      error:
        existingError,
    } =
      await existingQuery.maybeSingle();

    if (
      existingError ||
      !existingRelationship
    ) {
      throw new Error(
        existingError?.message ||
          "Relationship not found.",
      );
    }

    const nextContactAt =
      normalizeOptionalText(
        formData.get(
          "next_contact_at",
        ),
      );

    const reminder =
      normalizeOptionalText(
        formData.get(
          "reminder",
        ),
      );

    const relationshipType =
      normalizeOptionalText(
        formData.get(
          "relationship_type",
        ),
      );

    const status =
      String(
        formData.get(
          "status",
        ) ||
          "",
      );

    const expectedAmount =
      parseOptionalAmount(
        formData.get(
          "expected_amount",
        ),
      );

    const paidAmount =
      parseOptionalAmount(
        formData.get(
          "paid_amount",
        ),
      );

    const currencyValue =
      String(
        formData.get(
          "currency",
        ) ||
          "PYG",
      );

    const currency:
      RelationshipCurrency =
        currencyValue ===
        "USD"
          ? "USD"
          : "PYG";

    const paidAtInput =
      normalizeOptionalText(
        formData.get(
          "paid_at",
        ),
      );

    const invoiceNumber =
      normalizeOptionalText(
        formData.get(
          "invoice_number",
        ),
      );

    const paymentDescription =
      normalizeOptionalText(
        formData.get(
          "payment_description",
        ),
      );

    const isPaidStatus =
      normalizeText(
        status,
      ).includes(
        "pag",
      );

    const isSupplier =
      getRelationshipTypeKey(
        relationshipType,
      ).includes(
        "proveedor",
      );

    if (
      !isSupplier &&
      isPaidStatus &&
      paidAmount === null
    ) {
      throw new Error(
        "El importe pagado es obligatorio cuando la relación está marcada como Pagó.",
      );
    }

    const hasSupplierPayment =
      isSupplier &&
      paidAmount !== null;

    const shouldStorePayment =
      isSupplier
        ? hasSupplierPayment
        : isPaidStatus;

    const paidAt =
      shouldStorePayment
        ? (
            paidAtInput
              ? `${paidAtInput}T12:00:00.000Z`
              : existingRelationship.paid_at ||
                new Date().toISOString()
          )
        : null;

    let updateQuery =
      admin
        .from("relationships")
        .update({
          name:
            String(
              formData.get(
                "name",
              ) ||
                "",
            ),

          phone:
            String(
              formData.get(
                "phone",
              ) ||
                "",
            ),

          company:
            normalizeOptionalText(
              formData.get(
                "company",
              ),
            ),

          email:
            normalizeOptionalText(
              formData.get(
                "email",
              ),
            ),

          relationship_type:
            relationshipType,

          status,

          notes:
            normalizeOptionalText(
              formData.get(
                "notes",
              ),
            ),

          reminder,

          next_contact_at:
            nextContactAt,

          expected_amount:
            expectedAmount,

          paid_amount:
            shouldStorePayment
              ? paidAmount
              : null,

          currency,

          paid_at:
            paidAt,

          invoice_number:
            shouldStorePayment
              ? invoiceNumber
              : null,

          payment_description:
            shouldStorePayment
              ? paymentDescription
              : null,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          id,
        );

    if (
      !founderModeActive
    ) {
      updateQuery =
        updateQuery.eq(
          "owner_id",
          user.id,
        );
    }

    const {
      error:
        updateError,
    } =
      await updateQuery;

    if (
      updateError
    ) {
      throw new Error(
        updateError.message,
      );
    }

    const {
      error:
        activityError,
    } =
      await admin
        .from(
          "activity_logs",
        )
        .insert({
          user_id:
            user.id,
          relationship_id:
            id,
          event_type:
            "manual_update",
        });

    if (
      activityError
    ) {
      throw new Error(
        activityError.message,
      );
    }

    revalidatePath(
      "/dashboard",
    );

    revalidatePath(
      "/dashboard/relationships",
    );

    revalidatePath(
      "/dashboard/planning",
    );

    revalidatePath(
      "/dashboard/automations",
    );

    revalidatePath(
      "/dashboard/cockpit",
    );

    revalidatePath(
      `/dashboard/relationships/${id}`,
    );

    revalidatePath(
      `/dashboard/edit?id=${id}`,
    );

    redirect(
      `/dashboard/edit?id=${id}`,
    );
  }

  const typedRelationship =
    toRelationshipView(
      relationship,
    );

  const isSupplier =
    getRelationshipTypeKey(
      typedRelationship.relationshipType,
    ).includes("proveedor");

  const today =
    todayISO();

  const phase =
    getRelationshipPhase(
      typedRelationship,
      today,
    );

  const score =
    getScore(
      typedRelationship,
      today,
    );

  const recommendation =
    buildRecommendation(
      typedRelationship,
      today,
    );

  const whatsappMessage =
    buildWhatsAppMessage(
      typedRelationship,
      today,
    );

  const whatsappUrl =
    buildWhatsAppUrl(
      typedRelationship.phone,
      whatsappMessage,
    );

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1400px]">
              <PageHeader
                title={
                  typedRelationship.name
                }
                description="Editar relación, revisar contexto e inteligencia y preparar la próxima acción."
                actionHref="/dashboard/relationships"
                actionLabel="Volver a relaciones"
              />

              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    label="AI score"
                    value={`${score}/100`}
                    tone="sky"
                  />

                  <KpiCard
                    label="Fase"
                    value={phase.label}
                    tone="amber"
                  />

                  <KpiCard
                    label="Próximo contacto"
                    value={formatDate(
                      typedRelationship.nextContactAt,
                    )}
                  />

                  <KpiCard
                    label="Actividades"
                    value={
                      logs?.length ||
                      0
                    }
                    tone="emerald"
                  />
                </div>

                <AISummaryPanel
                  relationship={
                    typedRelationship
                  }
                  today={today}
                />

                <div
                  className={`rounded-[28px] border p-5 shadow-sm ${getPhaseClasses(
                    phase.tone,
                  )}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-2 inline-flex rounded-full border border-current bg-white/60 px-3 py-1 text-xs font-semibold">
                        AI recomendación
                      </div>

                      <h2 className="text-2xl font-bold tracking-tight">
                        {
                          recommendation.title
                        }
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-6">
                        {
                          recommendation.description
                        }
                      </p>

                      <p className="mt-3 text-sm font-semibold">
                        Acción:{" "}
                        {
                          recommendation.action
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {whatsappUrl ? (
                        <a
                          href={
                            whatsappUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className={
                            ui.buttons.success
                          }
                        >
                          Enviar WhatsApp
                        </a>
                      ) : null}

                      <Link
                        href={`/dashboard/whatsapp?id=${typedRelationship.id}`}
                        className={
                          ui.buttons.secondary
                        }
                      >
                        WhatsApp AI
                      </Link>

                      <Link
                        href={`/dashboard/relationships/${typedRelationship.id}`}
                        className={
                          ui.buttons.secondary
                        }
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                  <SectionCard
                    badge="Editar"
                    title="Datos de la relación"
                    description="Mantén la información actualizada para que ClienteYA entienda correctamente el contexto de la relación."
                  >
                    <form
                      action={
                        updateRelationship
                      }
                      className="space-y-5"
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={
                          typedRelationship.id
                        }
                      />

                      <FormField label="Nombre">
                        <input
                          name="name"
                          defaultValue={
                            typedRelationship.name
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Teléfono">
                        <input
                          name="phone"
                          defaultValue={
                            typedRelationship.phone
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Empresa">
                        <input
                          name="company"
                          defaultValue={
                            typedRelationship.company ||
                            ""
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Correo electrónico">
                        <input
                          type="email"
                          name="email"
                          defaultValue={
                            typedRelationship.email ||
                            ""
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Tipo de relación">
                        <select
                          name="relationship_type"
                          defaultValue={
                            typedRelationship.relationshipType ||
                            ""
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        >
                          <option value="">
                            Seleccionar
                          </option>

                          <option value="Prospecto">
                            Prospecto
                          </option>

                          <option value="Cliente">
                            Cliente
                          </option>

                          <option value="Socio">
                            Socio
                          </option>

                          <option value="Proveedor">
                            Proveedor
                          </option>

                          <option value="Inversor">
                            Inversor
                          </option>

                          <option value="Contacto de red">
                            Contacto de red
                          </option>

                          <option value="Embajador">
                            Embajador
                          </option>

                          <option value="Otro">
                            Otro
                          </option>
                        </select>
                      </FormField>

                      <FormField label="Estado">
                        <select
                          name="status"
                          defaultValue={
                            typedRelationship.status ||
                            ""
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        >
                          <option value="">
                            Seleccionar estado
                          </option>

                          <option value="Nuevo lead">
                            Nuevo lead
                          </option>

                          <option value="Contactado">
                            Contactado
                          </option>

                          <option value="Interesado">
                            Interesado
                          </option>

                          <option value="Sin respuesta">
                            Sin respuesta
                          </option>

                          <option value="Pagó">
                            Pagó
                          </option>

                          <option value="Cerrado">
                            Cerrado
                          </option>
                        </select>
                      </FormField>

                      <FormField label="Próximo contacto">
                        <input
                          type="date"
                          name="next_contact_at"
                          defaultValue={
                            typedRelationship.nextContactAt ||
                            ""
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Recordatorio">
                        <textarea
                          name="reminder"
                          defaultValue={
                            typedRelationship.reminder ||
                            ""
                          }
                          rows={3}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Notas">
                        <textarea
                          name="notes"
                          defaultValue={
                            typedRelationship.notes ||
                            ""
                          }
                          rows={6}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <div className="rounded-[26px] border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
                        <div className="mb-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                            {isSupplier
                              ? "Información del proveedor"
                              : "Información comercial"}
                          </p>

                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                            {isSupplier
                              ? "Registra el importe previsto y lo pagado al proveedor sin cambiar su estado comercial."
                              : "Registra el valor esperado y, cuando la relación esté marcada como Pagó, el importe real recibido."}
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            label={
                              isSupplier
                                ? "Importe previsto"
                                : "Valor esperado"
                            }
                          >
                            <input
                              type="number"
                              name="expected_amount"
                              min="0"
                              step={
                                typedRelationship.currency ===
                                "USD"
                                  ? "0.01"
                                  : "1"
                              }
                              defaultValue={
                                typedRelationship.expectedAmount ??
                                ""
                              }
                              placeholder="0"
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                            />
                          </FormField>

                          <FormField
                            label={
                              isSupplier
                                ? "Pagado al proveedor"
                                : "Importe pagado"
                            }
                          >
                            <input
                              type="number"
                              name="paid_amount"
                              min="0"
                              step={
                                typedRelationship.currency ===
                                "USD"
                                  ? "0.01"
                                  : "1"
                              }
                              defaultValue={
                                typedRelationship.paidAmount ??
                                ""
                              }
                              placeholder="0"
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                            />
                          </FormField>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <FormField label="Moneda">
                            <select
                              name="currency"
                              defaultValue={
                                typedRelationship.currency
                              }
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                            >
                              <option value="PYG">
                                PYG · Guaraníes
                              </option>

                              <option value="USD">
                                USD · Dólares
                              </option>
                            </select>
                          </FormField>

                          <FormField label="Fecha de pago">
                            <input
                              type="date"
                              name="paid_at"
                              defaultValue={
                                typedRelationship.paidAt
                                  ? typedRelationship.paidAt.slice(
                                      0,
                                      10,
                                    )
                                  : ""
                              }
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                            />
                          </FormField>
                        </div>

                        <div className="mt-4">
                          <FormField label="Número de factura">
                            <input
                              type="text"
                              name="invoice_number"
                              defaultValue={
                                typedRelationship.invoiceNumber ||
                                ""
                              }
                              placeholder="Opcional"
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                            />
                          </FormField>
                        </div>

                        <div className="mt-4">
                          <FormField label="Concepto del pago">
                            <textarea
                              name="payment_description"
                              defaultValue={
                                typedRelationship.paymentDescription ||
                                ""
                              }
                              rows={3}
                              placeholder={
                                isSupplier
                                  ? "Ej. Compra de insumos"
                                  : "Ej. Consultoría agosto"
                              }
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                            />
                          </FormField>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className={
                            ui.buttons.primary
                          }
                        >
                          Guardar cambios
                        </button>

                        <Link
                          href={`/dashboard/relationships/${typedRelationship.id}`}
                          className={
                            ui.buttons.secondary
                          }
                        >
                          Volver al detalle
                        </Link>

                        <Link
                          href="/dashboard/relationships"
                          className={
                            ui.buttons.secondary
                          }
                        >
                          Cancelar
                        </Link>
                      </div>
                    </form>
                  </SectionCard>

                  <div className="space-y-6">
                    <SectionCard
                      badge="Memoria"
                      title="Memoria de la relación"
                      description="Resumen actual de la relación."
                    >
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Tipo de relación
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {
                              typedRelationship.relationshipType ||
                              "—"
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Estado actual
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {
                              typedRelationship.status ||
                              "—"
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Fase AI
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {
                              phase.label
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Próximo contacto
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {formatDate(
                              typedRelationship.nextContactAt,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            {isSupplier
                              ? "Importe previsto"
                              : "Valor esperado"}
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {formatAmount(
                              typedRelationship.expectedAmount,
                              typedRelationship.currency,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            {isSupplier
                              ? "Pagado al proveedor"
                              : "Importe pagado"}
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {formatAmount(
                              typedRelationship.paidAmount,
                              typedRelationship.currency,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Fecha de pago
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {formatDate(
                              typedRelationship.paidAt,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Factura
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {
                              typedRelationship.invoiceNumber ||
                              "—"
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Concepto
                          </p>

                          <p className="mt-1 font-medium leading-6 text-slate-700">
                            {
                              typedRelationship.paymentDescription ||
                              "—"
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Recordatorio
                          </p>

                          <p className="mt-1 font-medium leading-6 text-slate-700">
                            {
                              typedRelationship.reminder ||
                              "—"
                            }
                          </p>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard
                      badge="Historial"
                      title="Actividad reciente"
                      description={`${logs?.length || 0} actividad(es) registrada(s).`}
                    >
                      {!logs ||
                      logs.length ===
                        0 ? (
                        <EmptyState
                          icon="📌"
                          title="No hay actividad todavía"
                          description="Cuando actualices o contactes la relación, aparecerá aquí."
                        />
                      ) : (
                        <div className="space-y-3">
                          {logs.map(
                            (
                              log: ActivityLog,
                            ) => (
                              <div
                                key={
                                  log.id
                                }
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                              >
                                <p className="text-sm font-medium text-slate-800">
                                  {getActivityIcon(
                                    log.event_type,
                                  )}{" "}
                                  {getActivityLabel(
                                    log.event_type,
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {formatDateTime(
                                    log.created_at,
                                  )}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}