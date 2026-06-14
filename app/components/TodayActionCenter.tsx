import Link from "next/link";

import { ui } from "../../lib/ui";
import {
  getActionCenterSummary,
  type ActionCenterItem,
} from "../../lib/action-center";

type TodayActionCenterProps = {
  items: ActionCenterItem[];
  founderMode?: boolean;
};

function getPriorityLabel(priority: ActionCenterItem["priority"]) {
  if (priority === "urgent") return "Urgente";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";

  return "Baja";
}

function getPriorityClasses(priority: ActionCenterItem["priority"]) {
  if (priority === "urgent") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "high") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (priority === "medium") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getTypeIcon(type: ActionCenterItem["type"]) {
  if (type === "whatsapp") return "💬";
  if (type === "followup") return "⏰";
  if (type === "payment") return "💳";
  if (type === "risk") return "⚠️";
  if (type === "opportunity") return "🔥";

  return "👤";
}

function isExternalHref(href: string) {
  return href.startsWith("http") || href.startsWith("https");
}

function ActionButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 md:w-auto";

  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function TodayActionCenter({
  items,
  founderMode = false,
}: TodayActionCenterProps) {
  const summary = getActionCenterSummary(items);

  return (
    <section className={`${ui.cards.base} ${ui.cards.padding.lg}`}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className={`${ui.badges.neutral} mb-3 w-fit`}>
            Hoy en ClienteYA
          </div>

          <h2 className={ui.typography.sectionTitle}>
            Centro de acciones inteligentes
          </h2>

          <p className={`${ui.typography.body} mt-2 max-w-2xl`}>
            ClienteYA prioriza automáticamente qué cliente necesita atención
            ahora, con foco en WhatsApp, seguimiento y oportunidades reales.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 text-center">
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
            <div className="text-lg font-black text-slate-950">
              {summary.total}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Acciones
            </div>
          </div>

          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
            <div className="text-lg font-black text-red-600">
              {summary.urgent}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Urgente
            </div>
          </div>

          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
            <div className="text-lg font-black text-amber-600">
              {summary.opportunities}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Oportunidad
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6">
          <div className="text-sm font-black text-slate-900">
            No hay acciones críticas ahora
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Todo parece bajo control. Cuando ClienteYA detecte un seguimiento,
            riesgo u oportunidad, aparecerá aquí automáticamente.
          </p>

          <Link
            href="/dashboard/nuevo"
            className="mt-4 inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Agregar cliente
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg">
                    {getTypeIcon(item.type)}
                  </div>

                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${getPriorityClasses(
                          item.priority
                        )}`}
                      >
                        {getPriorityLabel(item.priority)}
                      </span>

                      {founderMode ? (
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700">
                          Founder signal
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-sm font-black text-slate-950 md:text-base">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[220px]">
                  <ActionButton href={item.actionHref}>
                    {item.actionLabel}
                  </ActionButton>

                  {item.secondaryHref && item.secondaryLabel ? (
                    <Link
                      href={item.secondaryHref}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 md:w-auto"
                    >
                      {item.secondaryLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}