import { redirect } from "next/navigation";

import { AppHeader } from "../../components/AppHeader";
import MobileDashboardNav from "../MobileDashboardNav";
import SidebarNav from "../SidebarNav";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";

import { createSupportRuntime } from "../../support/create-support-runtime";
import { processSupportRequest } from "../../support/orchestrators/process-support-request";

import type {
  SupportConversation,
  SupportMessage,
  SupportRequest,
  SupportRequestIntent,
} from "../../support/models";

export const dynamic = "force-dynamic";

type SupportTopic = {
  value: string;
  label: string;
  description: string;
  intent: SupportRequestIntent;
};

type UserSupportConversation = {
  id: string;
  subject: string;
  status: string;
  lastActivity: string | null;
  messages: SupportMessage[];
};

const topics: SupportTopic[] = [
  {
    value: "resumen",
    label: "Resumen",
    description: "Preguntas sobre tu resumen y la información que ves al iniciar.",
    intent: "product",
  },
  {
    value: "planificacion",
    label: "Planificación",
    description: "Ayuda con tareas, próximos contactos y planificación.",
    intent: "product",
  },
  {
    value: "relaciones",
    label: "Relaciones",
    description: "Preguntas sobre relaciones, estados, datos o seguimiento.",
    intent: "product",
  },
  {
    value: "cockpit",
    label: "Cockpit",
    description: "Ayuda con inteligencia, métricas y recomendaciones.",
    intent: "product",
  },
  {
    value: "configuracion",
    label: "Configuración",
    description: "Datos de empresa, preferencias y configuración de ClienteYA.",
    intent: "company_data",
  },
  {
    value: "facturacion",
    label: "Facturación",
    description: "Consultas sobre plan, pagos o facturación.",
    intent: "billing",
  },
  {
    value: "acceso",
    label: "Acceso",
    description: "Problemas para ingresar o gestionar tu cuenta.",
    intent: "account",
  },
  {
    value: "otro",
    label: "Otro",
    description: "Cualquier otra consulta o problema.",
    intent: "other",
  },
];

function getTopic(value: string) {
  return topics.find((topic) => topic.value === value);
}

function formatSupportDate(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getUserMessageLabel(type: string) {
  if (type === "support_reply") {
    return "Respuesta de soporte";
  }

  if (type === "automatic_answer") {
    return "Respuesta automática";
  }

  return "Tu consulta";
}

function getUserMessageClasses(type: string) {
  if (type === "support_reply") {
    return "border-blue-200 bg-blue-50";
  }

  if (type === "automatic_answer") {
    return "border-emerald-200 bg-emerald-50";
  }

  return "border-slate-200 bg-slate-50";
}

async function submitSupportRequest(formData: FormData) {
  "use server";

  const authSupabase = await createAuthServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const topicValue = String(formData.get("topic") ?? "").trim();
  const messageText = String(formData.get("message") ?? "").trim();

  const topic = getTopic(topicValue);

  if (!topic || !messageText) {
    redirect("/dashboard/support?error=missing");
  }

  const runtime = createSupportRuntime();
  const orchestrator = runtime.orchestrator;

  const now = new Date().toISOString();
  const conversationId = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  const messageId = crypto.randomUUID();

  const displayName =
    String(
      user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email ??
        "Usuario ClienteYA",
    ).trim() || "Usuario ClienteYA";

  const locale = "es";
  const countryCode = "PY";

  const conversation: SupportConversation = {
    id: conversationId,
    scope: {
      tenantId: user.id,
      countryCode,
      locale,
    },
    channel: "in_app",
    status: "new",
    subject: topic.label,
    participantIds: [user.id],
    participants: [
      {
        id: user.id,
        type: "customer",
        displayName,
        email: user.email ?? undefined,
      },
    ],
    messageIds: [messageId],
    detectedLanguage: locale,
    lastMessageAt: now,
    isUnread: true,
    requiresHumanResponse: true,
    createdAt: now,
    updatedAt: now,
  };

  const request: SupportRequest = {
    id: requestId,
    scope: {
      tenantId: user.id,
      countryCode,
      locale,
    },
    conversationId,
    source: "user",
    channel: "in_app",
    intent: topic.intent,
    subject: topic.label,
    originalMessage: messageText,
    detectedLanguage: locale,
    status: "new",
    priority: "normal",
    requiresFounderReview: false,
    createdAt: now,
    updatedAt: now,
  };

  const message: SupportMessage = {
    id: messageId,
    conversationId,
    type: "user_message",
    actorType: "customer",
    actorId: user.id,
    content: messageText,
    language: locale,
    deliveryStatus: "sent",
    isInternal: false,
    isEdited: false,
    sentAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await orchestrator.saveConversation(conversation);
  await orchestrator.saveRequest(request);
  await orchestrator.saveMessage(message);

  const result = await processSupportRequest(
    orchestrator,
    requestId,
    conversationId,
  );

  const automaticAnswer = result.messages
    .filter((item) => item.type === "automatic_answer")
    .at(-1);

  if (automaticAnswer) {
    redirect(
      `/dashboard/support?sent=1&answer=${encodeURIComponent(
        automaticAnswer.content,
      )}`,
    );
  }

  redirect("/dashboard/support?sent=1&human=1");
}

type SupportPageProps = {
  searchParams?: Promise<{
    sent?: string;
    human?: string;
    answer?: string;
    error?: string;
  }>;
};

export default async function DashboardSupportPage({
  searchParams,
}: SupportPageProps) {
  const authSupabase = await createAuthServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};

  const runtime = createSupportRuntime();
  const orchestrator = runtime.orchestrator;

  const allConversations =
    await orchestrator.getConversations();

  const ownConversations =
    allConversations
      .filter(
        (conversation) =>
          conversation.scope.tenantId === user.id ||
          conversation.participantIds.includes(user.id),
      )
      .sort((left, right) => {
        const leftDate =
          left.lastMessageAt ??
          left.updatedAt ??
          left.createdAt;

        const rightDate =
          right.lastMessageAt ??
          right.updatedAt ??
          right.createdAt;

        return (
          new Date(rightDate).getTime() -
          new Date(leftDate).getTime()
        );
      })
      .slice(0, 5);

  const supportConversations: UserSupportConversation[] =
    await Promise.all(
      ownConversations.map(
        async (conversation) => {
          const messages =
            await orchestrator.getMessages(
              conversation.id,
            );

          const visibleMessages =
            messages
              .filter(
                (message) =>
                  !message.isInternal &&
                  [
                    "user_message",
                    "support_reply",
                    "automatic_answer",
                  ].includes(
                    String(message.type),
                  ),
              )
              .sort((left, right) => {
                const leftDate =
                  left.sentAt ??
                  left.createdAt;

                const rightDate =
                  right.sentAt ??
                  right.createdAt;

                return (
                  new Date(leftDate).getTime() -
                  new Date(rightDate).getTime()
                );
              });

          return {
            id: conversation.id,
            subject:
              conversation.subject?.trim() ||
              "Soporte",
            status:
              String(conversation.status),
            lastActivity:
              conversation.lastMessageAt ??
              conversation.updatedAt ??
              null,
            messages:
              visibleMessages,
          };
        },
      ),
    );

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="min-w-0 flex-1 px-4 pb-40 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
            <div className="mx-auto w-full max-w-4xl">
              <div className="space-y-6">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)] sm:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                    Soporte ClienteYA
                  </p>

                  <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    ¿Cómo podemos ayudarte?
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                    Selecciona el tema y cuéntanos qué necesitas. ClienteYA
                    buscará primero una respuesta disponible y, si hace falta,
                    enviará tu consulta al equipo de soporte.
                  </p>
                </section>

                {params.error === "missing" ? (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
                    Selecciona un tema y escribe tu consulta antes de enviarla.
                  </div>
                ) : null}

                {params.sent === "1" && params.answer ? (
                  <section className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-6">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      Respuesta inmediata
                    </p>

                    <h2 className="mt-2 text-xl font-black text-emerald-950">
                      Encontramos una respuesta para tu consulta
                    </h2>

                    <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-emerald-900">
                      {params.answer}
                    </p>
                  </section>
                ) : null}

                {params.sent === "1" && params.human === "1" ? (
                  <section className="rounded-[30px] border border-blue-200 bg-blue-50 p-6">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                      Consulta recibida
                    </p>

                    <h2 className="mt-2 text-xl font-black text-slate-950">
                      Tu consulta será revisada
                    </h2>

                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                      No encontramos una respuesta automática suficientemente
                      confiable. Tu consulta ya fue enviada al equipo de soporte.
                    </p>
                  </section>
                ) : null}

                <form
                  action={submitSupportRequest}
                  className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)] sm:p-8"
                >
                  <div>
                    <label
                      htmlFor="topic"
                      className="text-sm font-black text-slate-950"
                    >
                      Tema
                    </label>

                    <select
                      id="topic"
                      name="topic"
                      required
                      defaultValue=""
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="" disabled>
                        Seleccionar tema
                      </option>

                      {topics.map((topic) => (
                        <option key={topic.value} value={topic.value}>
                          {topic.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6">
                    <label
                      htmlFor="message"
                      className="text-sm font-black text-slate-950"
                    >
                      Tu consulta
                    </label>

                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      placeholder="Describe brevemente qué necesitas..."
                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 sm:w-auto"
                    >
                      Enviar consulta
                    </button>
                  </div>
                </form>

                {supportConversations.length > 0 ? (
                  <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)] sm:p-8">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                        Mis consultas
                      </p>

                      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                        Historial de soporte
                      </h2>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        Aquí aparecen tus consultas recientes y las respuestas
                        enviadas por ClienteYA.
                      </p>
                    </div>

                    <div className="mt-5 space-y-4">
                      {supportConversations.map(
                        (conversation) => (
                          <article
                            key={conversation.id}
                            className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h3 className="text-lg font-black text-slate-950">
                                  {conversation.subject}
                                </h3>

                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  {conversation.status}
                                </p>
                              </div>

                              {conversation.lastActivity ? (
                                <p className="text-xs font-semibold text-slate-500">
                                  {formatSupportDate(
                                    conversation.lastActivity,
                                  )}
                                </p>
                              ) : null}
                            </div>

                            <div className="mt-4 space-y-3">
                              {conversation.messages.map(
                                (message) => (
                                  <div
                                    key={message.id}
                                    className={`rounded-2xl border p-4 ${getUserMessageClasses(
                                      String(message.type),
                                    )}`}
                                  >
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                                        {getUserMessageLabel(
                                          String(message.type),
                                        )}
                                      </p>

                                      <p className="text-xs font-semibold text-slate-500">
                                        {formatSupportDate(
                                          message.sentAt ??
                                            message.createdAt,
                                        )}
                                      </p>
                                    </div>

                                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                                      {message.content}
                                    </p>
                                  </div>
                                ),
                              )}
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="lg:hidden">
        <MobileDashboardNav />
      </div>
    </div>
  );
}