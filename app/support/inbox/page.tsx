import Link from "next/link";

import { buildSupportMemoryAdapter } from "../adapters";
import { buildSupportRepository } from "../repositories";

type InboxItem = {
  id: string;
  customer: string;
  subject: string;
  message: string;
  status: "Nuevo" | "En progreso" | "Esperando";
  priority: "Alta" | "Normal";
};

const primary =
  "inline-flex items-center justify-center rounded-2xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800";

function getInboxStatus(status: string): InboxItem["status"] {
  if (
    status === "in_progress" ||
    status === "assigned" ||
    status === "analysing" ||
    status === "escalated"
  ) {
    return "En progreso";
  }

  if (
    status === "pending" ||
    status === "waiting" ||
    status === "waiting_for_user"
  ) {
    return "Esperando";
  }

  return "Nuevo";
}

export default async function SupportInboxPage() {
  const adapter = buildSupportMemoryAdapter();
  const repository = buildSupportRepository(adapter);

  const [requests, conversations] = await Promise.all([
    repository.getRequests(),
    repository.getConversations(),
  ]);

  const conversationsById = new Map(
    conversations.map((conversation) => [
      conversation.id,
      conversation,
    ]),
  );

  const items: InboxItem[] = requests
    .filter(
      (request) =>
        !["resolved", "closed"].includes(
          String(request.status),
        ),
    )
    .sort((left, right) => {
      const priorityOrder: Record<string, number> = {
        urgent: 3,
        high: 2,
        normal: 1,
        low: 0,
      };

      return (
        (priorityOrder[String(right.priority)] ?? 0) -
        (priorityOrder[String(left.priority)] ?? 0)
      );
    })
    .map((request) => {
      const conversation =
        conversationsById.get(request.conversationId);

      const customer =
        conversation?.participants.find(
          (participant) =>
            participant.type === "customer",
        );

      return {
        id: request.conversationId,
        customer:
          customer?.displayName?.trim() ||
          customer?.email?.trim() ||
          "Usuario ClienteYA",
        subject:
          request.subject?.trim() ||
          String(request.intent),
        message: request.originalMessage,
        status: getInboxStatus(String(request.status)),
        priority:
          String(request.priority) === "urgent" ||
          String(request.priority) === "high"
            ? "Alta"
            : "Normal",
      };
    });

  return (
    <main className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          SIP
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-950">
          Bandeja de soporte
        </h1>

        <p className="mt-3 max-w-3xl text-sm font-semibold text-slate-600">
          Todas las solicitudes nuevas comienzan aquí. La inteligencia de SIP
          prioriza únicamente los casos que requieren una decisión.
        </p>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Solicitudes abiertas
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-600">
              Solicitudes activas priorizadas por SIP.
            </p>
          </div>

          <Link
            href="/support"
            className={primary}
          >
            Volver al Cockpit
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-semibold text-emerald-800">
            No hay solicitudes abiertas. Cuando lleguen nuevos casos aparecerán aquí.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/support/conversations/${item.id}`}
                className="block rounded-2xl border border-slate-200 p-5 hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-950">
                      {item.customer}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {item.subject}
                    </p>

                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
                      {item.message}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-blue-700">
                      {item.priority}
                    </p>

                    <p className="text-xs font-semibold text-slate-500">
                      {item.status}
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