import Link from "next/link";

import { buildSupportMemoryAdapter } from "../adapters";
import { buildSupportRepository } from "../repositories";

type ConversationItem = {
  id: string;
  relationName: string;
  subject: string;
  status: "Abierta" | "En progreso" | "Esperando";
  priority: "Crítica" | "Alta" | "Normal";
  updatedAt: string;
};

function getPriorityClasses(priority: ConversationItem["priority"]) {
  if (priority === "Crítica") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (priority === "Alta") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getConversationStatus(
  status: string | undefined,
  requiresHumanResponse: boolean,
): ConversationItem["status"] {
  if (
    status === "in_progress" ||
    status === "assigned"
  ) {
    return "En progreso";
  }

  if (
    status === "pending" ||
    status === "waiting" ||
    !requiresHumanResponse
  ) {
    return "Esperando";
  }

  return "Abierta";
}

function getConversationPriority(
  priority: string | undefined,
): ConversationItem["priority"] {
  if (priority === "urgent") {
    return "Crítica";
  }

  if (priority === "high") {
    return "Alta";
  }

  return "Normal";
}

function formatUpdatedAt(value: string | undefined): string {
  if (!value) {
    return "Sin actividad";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function SupportConversationsPage() {
  const adapter = buildSupportMemoryAdapter();
  const repository = buildSupportRepository(adapter);

  const [supportConversations, requests] = await Promise.all([
    repository.getConversations(),
    repository.getRequests(),
  ]);

  const requestsByConversationId = new Map(
    requests.map((request) => [
      request.conversationId,
      request,
    ]),
  );

  const conversations: ConversationItem[] = supportConversations
    .map((conversation) => {
      const request = requestsByConversationId.get(
        conversation.id,
      );

      return {
        id: conversation.id,
        relationName: request
          ? String(request.source)
          : "Relación sin identificar",
        subject: request
          ? String(request.intent)
          : "Conversación de soporte",
        status: getConversationStatus(
          request ? String(request.status) : undefined,
          conversation.requiresHumanResponse,
        ),
        priority: getConversationPriority(
          request ? String(request.priority) : undefined,
        ),
        updatedAt: formatUpdatedAt(
          conversation.lastMessageAt ??
            conversation.updatedAt,
        ),
      };
    })
    .sort((left, right) => {
      const leftDate = new Date(left.updatedAt).getTime();
      const rightDate = new Date(right.updatedAt).getTime();

      if (
        Number.isNaN(leftDate) ||
        Number.isNaN(rightDate)
      ) {
        return 0;
      }

      return rightDate - leftDate;
    });

  return (
    <main className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          SIP
        </p>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">
              Conversaciones
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Consulta el historial completo de las conversaciones gestionadas
              por el equipo de soporte.
            </p>
          </div>

          <Link
            href="/support/inbox"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
          >
            Abrir bandeja
          </Link>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Historial
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Todas las conversaciones
          </h2>
        </div>

        {conversations.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-black text-slate-950">
              No hay conversaciones disponibles
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Las conversaciones aparecerán aquí cuando SIP reciba y procese
              solicitudes de soporte.
            </p>

            <Link
              href="/support/inbox"
              className="mt-5 inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
            >
              Ir a la bandeja
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/support/conversations/${conversation.id}`}
                className="block rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-950">
                        {conversation.relationName}
                      </h3>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getPriorityClasses(
                          conversation.priority,
                        )}`}
                      >
                        {conversation.priority}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {conversation.subject}
                    </p>

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Actualizada: {conversation.updatedAt}
                    </p>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-sm font-black text-blue-700">
                      {conversation.status}
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-950">
                      Abrir conversación →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}