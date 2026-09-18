import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { createSipAuthServerClient } from "@/lib/supabase/sip-auth-server";

import { buildSupportMemoryAdapter } from "../../adapters";
import { buildSupportRepository } from "../../repositories";
import { createSupportRuntime } from "../../create-support-runtime";

import type {
  SupportMessage,
} from "../../models";

export const dynamic = "force-dynamic";

type SupportConversationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string | undefined): string {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getMessageTypeLabel(type: string): string {
  if (type === "user_message") {
    return "Customer";
  }

  if (type === "support_reply") {
    return "Support";
  }

  if (type === "automatic_answer") {
    return "Automatic answer";
  }

  if (type === "internal_note") {
    return "Internal note";
  }

  return "System";
}

function getMessageClasses(type: string): string {
  if (type === "user_message") {
    return "border-slate-200 bg-white";
  }

  if (type === "support_reply") {
    return "border-blue-200 bg-blue-50";
  }

  if (type === "automatic_answer") {
    return "border-emerald-200 bg-emerald-50";
  }

  if (type === "internal_note") {
    return "border-amber-200 bg-amber-50";
  }

  return "border-slate-200 bg-slate-50";
}

function getCustomerName(
  participants: {
    type: string;
    displayName?: string;
    email?: string;
  }[],
): string {
  const customer = participants.find(
    (participant) => participant.type === "customer",
  );

  return (
    customer?.displayName?.trim() ||
    customer?.email?.trim() ||
    "ClienteYA user"
  );
}

async function submitSupportReply(formData: FormData) {
  "use server";

  const authSupabase = await createSipAuthServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/sip-login");
  }

  const conversationId = String(
    formData.get("conversationId") ?? "",
  ).trim();

  const reply = String(
    formData.get("reply") ?? "",
  ).trim();

  if (!conversationId || !reply) {
    redirect(
      `/support/conversations/${conversationId}?error=missing`,
    );
  }

  const runtime = createSupportRuntime();
  const orchestrator = runtime.orchestrator;

  const [conversation, requests] = await Promise.all([
    orchestrator.getConversation(conversationId),
    orchestrator.getRequests(),
  ]);

  if (!conversation) {
    notFound();
  }

  const request = requests.find(
    (item) => item.conversationId === conversationId,
  );

  const targetLocale =
    conversation.detectedLanguage ||
    request?.detectedLanguage ||
    conversation.scope.locale ||
    "es";

  let deliveredReply = reply;
  let deliveredLanguage = "en";
  let translated = false;

  if (targetLocale !== "en") {
    try {
      const translationResult =
        await orchestrator.translationEngine.translate({
          sourceText: reply,
          sourceLocale: "en",
          targetLocale,
        });

      if (translationResult.translatedText?.trim()) {
        deliveredReply =
          translationResult.translatedText.trim();
        deliveredLanguage =
          targetLocale;
        translated = true;
      }
    } catch (error) {
      console.error(
        "SIP outgoing translation unavailable; sending original support reply.",
        error,
      );
    }
  }

  const now = new Date().toISOString();
  const messageId = crypto.randomUUID();

  const supportMessage: SupportMessage = {
    id: messageId,
    conversationId,
    type: "support_reply",
    actorType: "support_user",
    actorId: user.id,
    content: deliveredReply,
    language: deliveredLanguage,
    deliveryStatus: "sent",
    isInternal: false,
    isEdited: false,
    sentAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const internalNoteId =
    translated
      ? crypto.randomUUID()
      : null;

  const internalNote: SupportMessage | null =
    internalNoteId
      ? {
          id: internalNoteId,
          conversationId,
          type: "internal_note",
          actorType: "support_user",
          actorId: user.id,
          content: reply,
          language: "en",
          deliveryStatus: "sent",
          isInternal: true,
          isEdited: false,
          sentAt: now,
          createdAt: now,
          updatedAt: now,
        }
      : null;

  if (internalNote) {
    await orchestrator.saveMessage(
      internalNote,
    );
  }

  await orchestrator.saveMessage(
    supportMessage,
  );

  await orchestrator.saveConversation({
    ...conversation,
    status: "answered",
    messageIds: [
      ...conversation.messageIds,
      ...(internalNote
        ? [internalNote.id]
        : []),
      messageId,
    ],
    lastMessageAt: now,
    requiresHumanResponse: false,
    updatedAt: now,
  });

  if (request) {
    await orchestrator.saveRequest({
      ...request,
      status: "answered",
      resolutionType: "human",
      updatedAt: now,
    });
  }

  revalidatePath(
    `/support/conversations/${conversationId}`,
  );

  revalidatePath("/support/inbox");
  revalidatePath("/support");
  revalidatePath("/dashboard/support");

  redirect(
    `/support/conversations/${conversationId}?sent=1`,
  );
}

type SearchParams = {
  sent?: string;
  error?: string;
};

export default async function SupportConversationDetailPage({
  params,
}: SupportConversationDetailPageProps) {
  const authSupabase = await createSipAuthServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/sip-login");
  }

  const { id } = await params;

  const adapter = buildSupportMemoryAdapter();
  const repository = buildSupportRepository(adapter);

  const [conversation, messages, requests] = await Promise.all([
    repository.getConversation(id),
    repository.getMessages(id),
    repository.getRequests(),
  ]);

  if (!conversation) {
    notFound();
  }

  const request = requests.find(
    (item) => item.conversationId === conversation.id,
  );

  const sortedMessages = [...messages].sort((left, right) => {
    const leftDate = left.sentAt ?? left.createdAt;
    const rightDate = right.sentAt ?? right.createdAt;

    return (
      new Date(leftDate).getTime() -
      new Date(rightDate).getTime()
    );
  });

  const customerName = getCustomerName(
    conversation.participants,
  );

  return (
    <main className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              SIP
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Support Conversation
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Review the full context and message history for this support
              conversation.
            </p>
          </div>

          <Link
            href="/support/conversations"
            className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
          >
            Back to Conversations
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-[26px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Customer
          </p>

          <p className="mt-2 text-lg font-black text-slate-950">
            {customerName}
          </p>
        </article>

        <article className="rounded-[26px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Source
          </p>

          <p className="mt-2 text-lg font-black text-slate-950">
            {request
              ? String(request.source)
              : "Unknown"}
          </p>
        </article>

        <article className="rounded-[26px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Channel
          </p>

          <p className="mt-2 text-lg font-black text-slate-950">
            {request
              ? String(request.channel)
              : "Unknown"}
          </p>
        </article>

        <article className="rounded-[26px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Priority
          </p>

          <p className="mt-2 text-lg font-black text-slate-950">
            {request
              ? String(request.priority)
              : "normal"}
          </p>
        </article>

        <article className="rounded-[26px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Status
          </p>

          <p className="mt-2 text-lg font-black text-slate-950">
            {request
              ? String(request.status)
              : "new"}
          </p>
        </article>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              History
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Messages
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-600">
              Last activity: {formatDate(conversation.lastMessageAt)}
            </p>
          </div>

          <p className="text-sm font-black text-slate-700">
            {sortedMessages.length} message
            {sortedMessages.length === 1 ? "" : "s"}
          </p>
        </div>

        {sortedMessages.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-black text-slate-950">
              No messages available
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Messages will appear here when SIP processes this conversation.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {sortedMessages.map((message) => (
              <article
                key={message.id}
                className={`rounded-3xl border p-5 ${getMessageClasses(
                  String(message.type),
                )}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-black text-slate-950">
                    {getMessageTypeLabel(
                      String(message.type),
                    )}
                  </p>

                  <p className="text-xs font-semibold text-slate-500">
                    {formatDate(
                      message.sentAt ??
                        message.createdAt,
                    )}
                  </p>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                  {message.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Human Response
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Reply to Customer
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Write the support response in English. SIP translates the customer
            delivery automatically when the translation service is available.
          </p>
        </div>

        <form
          action={submitSupportReply}
          className="mt-5"
        >
          <input
            type="hidden"
            name="conversationId"
            value={conversation.id}
          />

          <textarea
            name="reply"
            required
            rows={6}
            placeholder="Write the support response..."
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
            >
              Send Reply
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}