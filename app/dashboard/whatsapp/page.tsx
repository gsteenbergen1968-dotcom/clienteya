import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AppHeader } from "../../components/AppHeader";
import KpiCard from "../../components/KpiCard";
import SectionCard from "../../components/SectionCard";
import SidebarNav from "../SidebarNav";
import PageHeader from "../components/PageHeader";

import { createRelationshipService } from "../../../lib/relationship-service";
import { adaptRelationshipMemory } from "../../../lib/relationship-memory-adapter";
import {
  buildRelationshipMemory,
  getRelationshipMemoryClasses,
  type RelationshipMemoryProfile,
} from "../../../lib/relationship-memory";
import type { RelationshipRecord } from "../../../lib/relationship-repository";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { createAdminClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type MessageVariant = {
  id: string;
  label: string;
  tone: string;
  title: string;
  message: string;
  reason: string;
};

type RelationshipPhase = {
  label: string;
  tone: "red" | "amber" | "orange" | "sky" | "emerald" | "slate";
  description: string;
};

type BusinessContext = {
  companyName: string | null;
  businessType: string;
  businessTone: string;
  aiPrompt: string | null;
};

type BusinessSettingsRecord = {
  company_name: string | null;
  business_type: string | null;
  business_tone: string | null;
  ai_prompt: string | null;
};

function addDaysISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function cleanPhone(
  phone: string | null | undefined,
): string {
  return String(phone ?? "").replace(/[^\d]/g, "");
}

function normalizeWhatsAppPhone(
  phone: string | null | undefined,
): string {
  let number = cleanPhone(phone);

  if (number.startsWith("00")) {
    number = number.slice(2);
  }

  if (number.startsWith("0")) {
    number = number.slice(1);
  }

  if (
    number &&
    !number.startsWith("595")
  ) {
    number = `595${number}`;
  }

  return number;
}

function buildWhatsAppUrl(
  phone: string | null | undefined,
  message: string,
): string {
  const number =
    normalizeWhatsAppPhone(phone);

  if (!number) {
    return "/dashboard/relationships";
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(
    message,
  )}`;
}

function daysBetween(
  date: string | null | undefined,
  today: string,
): number | null {
  if (!date) {
    return null;
  }

  const target =
    new Date(
      `${date.slice(0, 10)}T00:00:00`,
    );

  const current =
    new Date(
      `${today}T00:00:00`,
    );

  if (
    Number.isNaN(target.getTime()) ||
    Number.isNaN(current.getTime())
  ) {
    return null;
  }

  return Math.round(
    (
      target.getTime() -
      current.getTime()
    ) /
      (1000 * 60 * 60 * 24),
  );
}

function normalizeRelationshipType(
  value: string | null | undefined,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeBusinessValue(
  value: string | null | undefined,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isNonSalesRelationship(
  relationship: RelationshipRecord,
): boolean {
  const type =
    normalizeRelationshipType(
      relationship.relationship_type,
    );

  return [
    "proveedor",
    "socio",
    "inversor",
    "inversionista",
    "contacto de red",
    "embajador",
  ].includes(type);
}

function isPaid(
  relationship: RelationshipRecord,
): boolean {
  if (
    isNonSalesRelationship(
      relationship,
    )
  ) {
    return false;
  }

  const status =
    relationship.status?.toLowerCase() ??
    "";

  return (
    status.includes("pag") ||
    status.includes("convert")
  );
}

function getRelationshipPhase(
  relationship: RelationshipRecord,
  today: string,
): RelationshipPhase {
  const status =
    relationship.status?.toLowerCase() ??
    "";

  const type =
    normalizeRelationshipType(
      relationship.relationship_type,
    );

  const delta =
    daysBetween(
      relationship.next_contact_at,
      today,
    );

  if (type === "proveedor") {
    if (
      delta !== null &&
      delta < 0
    ) {
      return {
        label:
          "Proveedor · seguimiento vencido",
        tone:
          "red",
        description:
          "Hay un seguimiento pendiente con este proveedor. Conviene retomar la coordinación.",
      };
    }

    if (delta === 0) {
      return {
        label:
          "Proveedor · seguimiento hoy",
        tone:
          "amber",
        description:
          "Buen momento para confirmar el asunto pendiente o el próximo paso con el proveedor.",
      };
    }

    return {
      label:
        "Proveedor",
      tone:
        "sky",
      description:
        "Relación de proveedor. La prioridad es coordinación, continuidad y claridad operativa.",
    };
  }

  if (type === "socio") {
    return {
      label:
        "Socio",
      tone:
        delta !== null &&
        delta <= 0
          ? "amber"
          : "sky",
      description:
        "Relación de socio. Mantener alineación, confianza y próximos acuerdos claros.",
    };
  }

  if (
    type === "inversor" ||
    type === "inversionista"
  ) {
    return {
      label:
        "Inversor",
      tone:
        delta !== null &&
        delta <= 0
          ? "amber"
          : "sky",
      description:
        "Relación con inversor. Priorizar información relevante, claridad y continuidad.",
    };
  }

  if (
    type ===
    "contacto de red"
  ) {
    return {
      label:
        "Contacto de red",
      tone:
        "slate",
      description:
        "Relación de red profesional. Mantener un vínculo natural y útil, sin forzar una venta.",
    };
  }

  if (
    type === "embajador"
  ) {
    return {
      label:
        "Embajador",
      tone:
        "sky",
      description:
        "Relación de embajador. Mantener cercanía, reconocimiento y participación.",
    };
  }

  if (
    isPaid(
      relationship,
    )
  ) {
    return {
      label:
        "Relación pagada",
      tone:
        "emerald",
      description:
        "Ya convirtió. El mejor mensaje es de continuidad o recompra.",
    };
  }

  if (
    delta !== null &&
    delta < 0
  ) {
    return {
      label:
        "Seguimiento vencido",
      tone:
        "red",
      description:
        "Esta relación necesita una reactivación simple y directa.",
    };
  }

  if (delta === 0) {
    return {
      label:
        "Seguimiento hoy",
      tone:
        "amber",
      description:
        "Buen momento para escribir con un mensaje corto.",
    };
  }

  if (
    status.includes(
      "interes",
    )
  ) {
    return {
      label:
        "Oportunidad",
      tone:
        "amber",
      description:
        "La relación mostró interés. Conviene impulsar el siguiente paso.",
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
        "Necesita un mensaje suave para retomar la conversación.",
    };
  }

  if (
    status.includes(
      "contact",
    )
  ) {
    return {
      label:
        "Contactada",
      tone:
        "sky",
      description:
        "Ya existe contacto previo. Mantener el ritmo.",
    };
  }

  return {
    label:
      "Nueva relación",
    tone:
      "slate",
    description:
      "Relación nueva o sin suficiente información todavía.",
  };
}

function getPhaseClasses(
  tone: RelationshipPhase["tone"],
): string {
  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (tone === "orange") {
    return "border-orange-200 bg-orange-50 text-orange-800";
  }

  if (tone === "sky") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (
    tone === "emerald"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getRelationshipName(
  relationship: RelationshipRecord,
): string {
  return (
    relationship.name?.trim() ||
    relationship.company?.trim() ||
    "Relación sin nombre"
  );
}

function getRecommendedToneLabel(
  tone: RelationshipMemoryProfile["recommendedTone"],
): string {
  if (tone === "soft") {
    return "Suave";
  }

  if (tone === "direct") {
    return "Directo";
  }

  if (
    tone === "post_sale"
  ) {
    return "Postventa";
  }

  return "Balanceado";
}

function getBusinessTypeLabel(
  businessType: string,
): string {
  const value =
    normalizeBusinessValue(
      businessType,
    );

  if (
    value === "restaurant"
  ) {
    return "Restaurante / Gastronomía";
  }

  if (
    value === "consulting"
  ) {
    return "Consultoría";
  }

  if (
    value === "real_estate"
  ) {
    return "Inmobiliaria";
  }

  if (
    value === "fitness"
  ) {
    return "Fitness / Gimnasio";
  }

  if (
    value === "beauty"
  ) {
    return "Belleza / Peluquería / Spa";
  }

  if (
    value === "retail"
  ) {
    return "Retail / Tienda";
  }

  if (
    value === "automotive"
  ) {
    return "Automotriz";
  }

  if (
    value === "medical"
  ) {
    return "Salud / Clínica";
  }

  if (
    value === "education"
  ) {
    return "Educación / Cursos";
  }

  if (
    value === "services"
  ) {
    return "Servicios";
  }

  return "General";
}

function getSupplierSubject(
  businessType: string,
): string {
  const value =
    normalizeBusinessValue(
      businessType,
    );

  if (
    value === "restaurant"
  ) {
    return "pedido, entrega, producto o condición pendiente";
  }

  if (
    value === "consulting"
  ) {
    return "servicio, condición o coordinación pendiente";
  }

  if (
    value === "real_estate"
  ) {
    return "servicio, documentación o coordinación pendiente";
  }

  if (
    value === "fitness"
  ) {
    return "servicio, insumo o coordinación pendiente";
  }

  if (
    value === "beauty"
  ) {
    return "producto, insumo, entrega o coordinación pendiente";
  }

  if (
    value === "retail"
  ) {
    return "producto, stock, entrega o condición pendiente";
  }

  if (
    value === "automotive"
  ) {
    return "pieza, servicio, entrega o condición pendiente";
  }

  if (
    value === "medical"
  ) {
    return "insumo, servicio, entrega o coordinación pendiente";
  }

  if (
    value === "education"
  ) {
    return "servicio, material o coordinación pendiente";
  }

  if (
    value === "services"
  ) {
    return "servicio, presupuesto o coordinación pendiente";
  }

  return "asunto o coordinación pendiente";
}

function getCommercialNextStep(
  businessType: string,
): string {
  const value =
    normalizeBusinessValue(
      businessType,
    );

  if (
    value === "restaurant"
  ) {
    return "pedido, reserva, visita o próximo paso";
  }

  if (
    value === "consulting"
  ) {
    return "propuesta, reunión o próximo paso";
  }

  if (
    value === "real_estate"
  ) {
    return "propiedad, visita o siguiente paso";
  }

  if (
    value === "fitness"
  ) {
    return "membresía, entrenamiento o próximo paso";
  }

  if (
    value === "beauty"
  ) {
    return "cita, reserva o próximo paso";
  }

  if (
    value === "retail"
  ) {
    return "producto, compra o próximo paso";
  }

  if (
    value === "automotive"
  ) {
    return "cotización, prueba o próximo paso";
  }

  if (
    value === "medical"
  ) {
    return "consulta, control o próximo paso";
  }

  if (
    value === "education"
  ) {
    return "inscripción, clase o próximo paso";
  }

  if (
    value === "services"
  ) {
    return "presupuesto, trabajo o próximo paso";
  }

  return "siguiente paso";
}

function getToneGreeting(
  name: string,
  context: BusinessContext,
): string {
  const tone =
    normalizeBusinessValue(
      context.businessTone,
    );

  const prompt =
    normalizeBusinessValue(
      context.aiPrompt,
    );

  const noEmoji =
    prompt.includes(
      "sin emoji",
    ) ||
    prompt.includes(
      "no emoji",
    );

  const emoji =
    noEmoji
      ? ""
      : " 👋";

  if (tone === "formal") {
    return `Hola ${name},`;
  }

  return `Hola ${name}${emoji}`;
}

function getToneClosing(
  context: BusinessContext,
): string {
  const tone =
    normalizeBusinessValue(
      context.businessTone,
    );

  if (tone === "formal") {
    return "Quedo atento.";
  }

  if (tone === "directo") {
    return "Quedo atento para coordinarlo.";
  }

  if (tone === "vendedor") {
    return "Si te parece, lo dejamos encaminado hoy.";
  }

  if (tone === "amable") {
    return "Cuando puedas, quedo atento. Gracias.";
  }

  return "Quedo atento.";
}

function buildMemoryMessage(
  relationship: RelationshipRecord,
  memory: RelationshipMemoryProfile,
  businessContext: BusinessContext,
): string {
  const name =
    getRelationshipName(
      relationship,
    );

  const type =
    normalizeRelationshipType(
      relationship.relationship_type,
    );

  const greeting =
    getToneGreeting(
      name,
      businessContext,
    );

  const closing =
    getToneClosing(
      businessContext,
    );

  const supplierSubject =
    getSupplierSubject(
      businessContext.businessType,
    );

  const commercialNextStep =
    getCommercialNextStep(
      businessContext.businessType,
    );

  if (
    type === "proveedor"
  ) {
    return `${greeting}

Te escribo para dar seguimiento al ${supplierSubject}.

¿Te parece si confirmamos el próximo paso?

${closing}`;
  }

  if (
    type === "socio"
  ) {
    return `${greeting}

Te escribo para mantenernos alineados y revisar el próximo paso que tenemos pendiente.

¿Te parece si lo coordinamos?

${closing}`;
  }

  if (
    type === "inversor" ||
    type === "inversionista"
  ) {
    return `${greeting}

Quería retomar el contacto y compartir contigo el próximo punto relevante.

¿Te parece bien que lo revisemos?

${closing}`;
  }

  if (
    type ===
    "contacto de red"
  ) {
    return `${greeting}

Quería retomar el contacto y saber cómo estás. Me gustaría que sigamos en comunicación.

${closing}`;
  }

  if (
    type === "embajador"
  ) {
    return `${greeting}

Quería mantener el contacto y agradecerte por seguir cerca. Tenemos novedades que me gustaría compartir contigo.

${closing}`;
  }

  if (
    memory.recommendedTone ===
    "post_sale"
  ) {
    return `${greeting}

Quería agradecerte nuevamente y asegurarme de que todo esté bien.

Si necesitas algo más o quieres revisar el próximo paso, estoy atento.`;
  }

  if (
    memory.recommendedTone ===
    "soft"
  ) {
    return `${greeting}

Solo quería retomar nuestra conversación con calma y ver si todavía tiene sentido avanzar con el ${commercialNextStep}.

${closing}`;
  }

  if (
    memory.recommendedTone ===
    "direct"
  ) {
    return `${greeting}

Te escribo para confirmar si avanzamos con el ${commercialNextStep}.

¿Lo coordinamos?

${closing}`;
  }

  return `${greeting}

Te escribo para dar seguimiento y revisar el ${commercialNextStep}.

¿Te parece bien que lo revisemos?

${closing}`;
}

function buildVariants(
  relationship: RelationshipRecord,
  memory: RelationshipMemoryProfile,
  businessContext: BusinessContext,
): MessageVariant[] {
  const name =
    getRelationshipName(
      relationship,
    );

  const type =
    normalizeRelationshipType(
      relationship.relationship_type,
    );

  const recommendedMessage =
    buildMemoryMessage(
      relationship,
      memory,
      businessContext,
    );

  const greeting =
    getToneGreeting(
      name,
      businessContext,
    );

  const closing =
    getToneClosing(
      businessContext,
    );

  const supplierSubject =
    getSupplierSubject(
      businessContext.businessType,
    );

  const commercialNextStep =
    getCommercialNextStep(
      businessContext.businessType,
    );

  if (
    type === "proveedor"
  ) {
    return [
      {
        id:
          "recommended",
        label:
          "Recomendado",
        tone:
          getRecommendedToneLabel(
            memory.recommendedTone,
          ),
        title:
          "Mejor siguiente mensaje",
        message:
          recommendedMessage,
        reason:
          memory.nextBestStep,
      },
      {
        id:
          "soft",
        label:
          "Suave",
        tone:
          "Amable",
        title:
          "Seguimiento cordial",
        message:
          `${greeting}

Quería retomar con calma el ${supplierSubject}.

Cuando tengas un momento, me confirmas por favor.

${closing}`,
        reason:
          "Útil para mantener una buena relación con el proveedor sin generar presión.",
      },
      {
        id:
          "direct",
        label:
          "Directo",
        tone:
          "Operativo",
        title:
          "Confirmar próximo paso",
        message:
          `${greeting}

Te escribo para confirmar el ${supplierSubject}.

¿Podemos dejarlo coordinado hoy?

${closing}`,
        reason:
          "Útil cuando necesitas una confirmación concreta del proveedor.",
      },
    ];
  }

  return [
    {
      id:
        "recommended",
      label:
        "Recomendado",
      tone:
        getRecommendedToneLabel(
          memory.recommendedTone,
        ),
      title:
        "Mejor siguiente mensaje",
      message:
        recommendedMessage,
      reason:
        memory.nextBestStep,
    },
    {
      id:
        "soft",
      label:
        "Suave",
      tone:
        "Amable",
      title:
        "Mensaje menos directo",
      message:
        `${greeting}

Solo quería retomar nuestra conversación con calma y ver si todavía tiene sentido avanzar con el ${commercialNextStep}.

${closing}`,
      reason:
        "Útil cuando hay riesgo de perder el contacto o demasiados seguimientos.",
    },
    {
      id:
        "direct",
      label:
        "Directo",
      tone:
        "Comercial",
      title:
        "Mensaje más enfocado en acción",
      message:
        `${greeting}

Te escribo para confirmar si avanzamos con el ${commercialNextStep}.

¿Lo coordinamos?

${closing}`,
      reason:
        "Útil cuando la relación está activa y falta una decisión.",
    },
  ];
}

function SuccessBanner({
  ok,
}: {
  ok?: string;
}) {
  if (!ok) {
    return null;
  }

  const messages: Record<string, string> = {
    contacted:
      "Relación marcada como contactada.",
    followup:
      "Seguimiento programado correctamente.",
    closed:
      "Relación cerrada correctamente.",
  };

  return (
    <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
      ✅{" "}
      {messages[ok] ||
        "Acción guardada correctamente."}
    </div>
  );
}

function VariantCard({
  variant,
  relationship,
  isPrimary = false,
}: {
  variant: MessageVariant;
  relationship: RelationshipRecord;
  isPrimary?: boolean;
}) {
  const whatsappUrl =
    buildWhatsAppUrl(
      relationship.phone,
      variant.message,
    );

  return (
    <div
      className={`min-w-0 rounded-[28px] border p-4 shadow-sm sm:p-5 ${
        isPrimary
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-4 flex flex-col gap-3">
        <div className="min-w-0">
          <div
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
              isPrimary
                ? "border-emerald-200 bg-white text-emerald-700"
                : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            {variant.label}
          </div>

          <h2 className="mt-3 break-words text-lg font-bold leading-tight text-slate-950 sm:text-xl">
            {variant.title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tono: {variant.tone}
          </p>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Abrir WhatsApp
        </a>
      </div>

      <div className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800">
        <p className="whitespace-pre-wrap break-words">
          {variant.message}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
        💡 {variant.reason}
      </div>
    </div>
  );
}

function RelationshipMemoryPanel({
  memory,
}: {
  memory: RelationshipMemoryProfile;
}) {
  return (
    <div
      className={`rounded-[28px] border p-5 shadow-sm ${getRelationshipMemoryClasses(
        memory,
      )}`}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-current bg-white/60 px-3 py-1 text-xs font-semibold">
            Memoria de seguimiento IA
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            {memory.label}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6">
            {memory.summary}
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm font-semibold">
          Puntuación de memoria:{" "}
          {memory.score}/100
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Riesgo
          </p>

          <p className="mt-2 text-sm font-medium leading-6">
            {memory.risk}
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Tono recomendado
          </p>

          <p className="mt-2 text-sm font-medium leading-6">
            {getRecommendedToneLabel(
              memory.recommendedTone,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Próximo mejor paso
          </p>

          <p className="mt-2 text-sm font-medium leading-6">
            {memory.nextBestStep}
          </p>
        </div>
      </div>
    </div>
  );
}

function RelationshipContextCard({
  relationship,
  phase,
  score,
  memory,
  businessContext,
}: {
  relationship: RelationshipRecord;
  phase: RelationshipPhase;
  score: number;
  memory: RelationshipMemoryProfile;
  businessContext: BusinessContext;
}) {
  return (
    <SectionCard
      badge="Contexto"
      title={getRelationshipName(
        relationship,
      )}
      description={
        relationship.phone ||
        "Sin teléfono"
      }
      actions={
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPhaseClasses(
            phase.tone,
          )}`}
        >
          {phase.label}
        </span>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tipo de relación
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {relationship.relationship_type ||
              "Sin tipo definido"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Sector del negocio
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {getBusinessTypeLabel(
              businessContext.businessType,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Estado
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {relationship.status ||
              "Nuevo"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Próximo contacto
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {formatDate(
              relationship.next_contact_at,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Puntuación IA
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {score}/100
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tono del negocio
          </p>

          <p className="mt-1 font-semibold capitalize text-slate-900">
            {businessContext.businessTone}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Memoria
          </p>

          <p className="mt-1 line-clamp-2 font-semibold text-slate-900">
            {memory.label}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${getPhaseClasses(
          phase.tone,
        )}`}
      >
        {phase.description}
      </div>
    </SectionCard>
  );
}

function ActionPanel({
  relationship,
  onContacted,
  onSchedule,
  onClose,
}: {
  relationship: RelationshipRecord;
  onContacted: (
    formData: FormData,
  ) => Promise<void>;
  onSchedule: (
    formData: FormData,
  ) => Promise<void>;
  onClose: (
    formData: FormData,
  ) => Promise<void>;
}) {
  const showPaidAction =
    !isNonSalesRelationship(
      relationship,
    );

  return (
    <SectionCard
      badge="Relaciones"
      title="Después de enviar"
      description="Mantén la relación actualizada con una acción rápida."
    >
      <div className="grid gap-3">
        <form action={onContacted}>
          <input
            type="hidden"
            name="id"
            value={relationship.id}
          />

          <button
            type="submit"
            className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            Marcar contactada
          </button>
        </form>

        <form action={onSchedule}>
          <input
            type="hidden"
            name="id"
            value={relationship.id}
          />

          <button
            type="submit"
            className="w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            Seguimiento en 3 días
          </button>
        </form>

        {showPaidAction ? (
          <form action={onClose}>
            <input
              type="hidden"
              name="id"
              value={relationship.id}
            />

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Cerrar como pagada
            </button>
          </form>
        ) : null}
      </div>
    </SectionCard>
  );
}

async function recordRelationshipActivity({
  userId,
  relationshipId,
  eventType,
}: {
  userId: string;
  relationshipId: string;
  eventType:
    | "contactado"
    | "followup_scheduled"
    | "closed";
}) {
  const admin =
    createAdminClient();

  const { error } =
    await admin
      .from("activity_logs")
      .insert({
        user_id:
          userId,
        relationship_id:
          relationshipId,
        event_type:
          eventType,
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }
}

function revalidateRelationshipViews(
  relationshipId: string,
) {
  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    "/dashboard/relationships",
  );

  revalidatePath(
    "/dashboard/automations",
  );

  revalidatePath(
    "/dashboard/whatsapp",
  );

  revalidatePath(
    "/dashboard/planning",
  );

  revalidatePath(
    `/dashboard/relationships/${relationshipId}`,
  );

  revalidatePath(
    `/dashboard/edit?id=${relationshipId}`,
  );
}

export default async function WhatsAppPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    ok?: string;
  }>;
}) {
  const {
    id,
    ok,
  } =
    await searchParams;

  const auth =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await auth.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!id) {
    redirect(
      "/dashboard/relationships",
    );
  }

  async function actionContacted(
    formData: FormData,
  ) {
    "use server";

    const auth =
      await createAuthServerClient();

    const {
      data: { user },
    } =
      await auth.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const relationshipId =
      String(
        formData.get("id") ??
          "",
      ).trim();

    if (!relationshipId) {
      redirect(
        "/dashboard/relationships",
      );
    }

    const service =
      createRelationshipService();

    await service.updateRelationship(
      relationshipId,
      user.id,
      {
        status:
          "Contactado",
        reminder:
          "Contactado desde WhatsApp AI",
        next_contact_at:
          addDaysISO(3),
        last_contact_at:
          new Date().toISOString(),
      },
    );

    await recordRelationshipActivity({
      userId:
        user.id,
      relationshipId,
      eventType:
        "contactado",
    });

    revalidateRelationshipViews(
      relationshipId,
    );

    redirect(
      `/dashboard/whatsapp?id=${relationshipId}&ok=contacted`,
    );
  }

  async function actionSchedule(
    formData: FormData,
  ) {
    "use server";

    const auth =
      await createAuthServerClient();

    const {
      data: { user },
    } =
      await auth.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const relationshipId =
      String(
        formData.get("id") ??
          "",
      ).trim();

    if (!relationshipId) {
      redirect(
        "/dashboard/relationships",
      );
    }

    const service =
      createRelationshipService();

    await service.updateRelationship(
      relationshipId,
      user.id,
      {
        status:
          "Sin respuesta",
        reminder:
          "Reintentar contacto en 3 días",
        next_contact_at:
          addDaysISO(3),
      },
    );

    await recordRelationshipActivity({
      userId:
        user.id,
      relationshipId,
      eventType:
        "followup_scheduled",
    });

    revalidateRelationshipViews(
      relationshipId,
    );

    redirect(
      `/dashboard/whatsapp?id=${relationshipId}&ok=followup`,
    );
  }

  async function actionClose(
    formData: FormData,
  ) {
    "use server";

    const auth =
      await createAuthServerClient();

    const {
      data: { user },
    } =
      await auth.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const relationshipId =
      String(
        formData.get("id") ??
          "",
      ).trim();

    if (!relationshipId) {
      redirect(
        "/dashboard/relationships",
      );
    }

    const service =
      createRelationshipService();

    await service.updateRelationship(
      relationshipId,
      user.id,
      {
        status:
          "Pagó",
        reminder:
          "Cerrado como pagado desde WhatsApp AI",
        next_contact_at:
          null,
      },
    );

    await recordRelationshipActivity({
      userId:
        user.id,
      relationshipId,
      eventType:
        "closed",
    });

    revalidateRelationshipViews(
      relationshipId,
    );

    redirect(
      `/dashboard/whatsapp?id=${relationshipId}&ok=closed`,
    );
  }

  const relationshipService =
    createRelationshipService();

  const relationship =
    await relationshipService.getRelationship(
      id,
      user.id,
    );

  if (!relationship) {
    redirect(
      "/dashboard/relationships",
    );
  }

  const {
    data: businessSettingsData,
  } =
    await auth
      .from(
        "business_settings",
      )
      .select(
        "company_name,business_type,business_tone,ai_prompt",
      )
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();

  const businessSettings =
    (
      businessSettingsData ||
      null
    ) as BusinessSettingsRecord | null;

  const businessContext: BusinessContext = {
    companyName:
      businessSettings?.company_name ??
      null,
    businessType:
      businessSettings?.business_type ||
      "general",
    businessTone:
      businessSettings?.business_tone ||
      "cercano",
    aiPrompt:
      businessSettings?.ai_prompt ??
      null,
  };

  const relationshipMemoryModel =
    adaptRelationshipMemory({
      id:
        relationship.id,
      name:
        relationship.name ||
        relationship.company ||
        "Relación sin nombre",
      company:
        relationship.company,
      phone:
        relationship.phone,
      relationship_type:
        relationship.relationship_type,
      status:
        relationship.status,
      notes:
        relationship.notes,
      reminder:
        relationship.reminder,
      next_follow_up_at:
        relationship.next_contact_at,
      estimated_value:
        relationship.expected_amount,
      pagado:
        isPaid(
          relationship,
        ),
      payment_date:
        relationship.paid_at,
      created_at:
        relationship.created_at,
    });

  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10,
      );

  const phase =
    getRelationshipPhase(
      relationship,
      today,
    );

  const memory =
    buildRelationshipMemory(
      relationshipMemoryModel,
    );

  const score =
    memory.score;

  const variants =
    buildVariants(
      relationship,
      memory,
      businessContext,
    );

  const primary =
    variants[0];

  const alternatives =
    variants.slice(1);

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1500px]">
              <SuccessBanner
                ok={ok}
              />

              <PageHeader
                title="WhatsApp IA"
                description="Elige el mejor mensaje, abre WhatsApp y actualiza la relación en un clic."
                badge="Inteligencia de mensajes"
                actionHref="/dashboard/relationships"
                actionLabel="Volver a relaciones"
              />

              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    label="Puntuación IA"
                    value={`${score}/100`}
                    tone="sky"
                  />

                  <KpiCard
                    label="Memoria"
                    value={
                      memory.label
                    }
                    tone="amber"
                  />

                  <KpiCard
                    label="Próximo"
                    value={formatDate(
                      relationship.next_contact_at,
                    )}
                  />

                  <KpiCard
                    label="Estado"
                    value={
                      relationship.status ||
                      "Nuevo"
                    }
                    tone="emerald"
                  />
                </div>

                <RelationshipMemoryPanel
                  memory={memory}
                />

                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                  <div className="space-y-6">
                    <RelationshipContextCard
                      relationship={
                        relationship
                      }
                      phase={
                        phase
                      }
                      score={
                        score
                      }
                      memory={
                        memory
                      }
                      businessContext={
                        businessContext
                      }
                    />

                    <ActionPanel
                      relationship={
                        relationship
                      }
                      onContacted={
                        actionContacted
                      }
                      onSchedule={
                        actionSchedule
                      }
                      onClose={
                        actionClose
                      }
                    />
                  </div>

                  <div className="min-w-0 space-y-6">
                    <SectionCard
                      badge="Recomendado"
                      title="Mensaje principal"
                      description="ClienteYA recomienda este mensaje usando tu sector, tono, memoria y contexto de la relación."
                    >
                      <VariantCard
                        variant={
                          primary
                        }
                        relationship={
                          relationship
                        }
                        isPrimary
                      />
                    </SectionCard>

                    <SectionCard
                      badge="Alternativas"
                      title="Otros tonos"
                      description="Elige el mensaje que mejor encaja con el contexto de esta relación."
                    >
                      <div className="grid min-w-0 gap-5">
                        {alternatives.map(
                          (
                            variant,
                          ) => (
                            <VariantCard
                              key={
                                variant.id
                              }
                              variant={
                                variant
                              }
                              relationship={
                                relationship
                              }
                            />
                          ),
                        )}
                      </div>
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