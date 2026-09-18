import Link from "next/link";

import {
  getWhatsAppPriorityLabel,
  type WhatsAppPriorityItem,
  type WhatsAppPriorityLevel,
} from "../../lib/whatsapp-priority-engine";

import {
  buildWhatsAppActionTemplate,
  buildWhatsAppShareUrl,
} from "../../lib/whatsapp-action-templates";

type WhatsAppPriorityCenterProps = {
  items: WhatsAppPriorityItem[];
};

function getPriorityClasses(priority: WhatsAppPriorityLevel) {
  if (priority === "critical") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (priority === "high") {
    return "border-orange-200 bg-orange-50 text-orange-900";
  }

  if (priority === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getScoreClasses(priority: WhatsAppPriorityLevel) {
  if (priority === "critical") return "bg-red-600 text-white";
  if (priority === "high") return "bg-orange-500 text-white";
  if (priority === "medium") return "bg-amber-500 text-white";

  return "bg-slate-900 text-white";
}

export default function WhatsAppPriorityCenter({
  items,
}: WhatsAppPriorityCenterProps) {
  const visibleItems = items.slice(0, 5);

  return (
    <section className="rounded-[32px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              V18 Sistema Operativo WhatsApp
            </span>

            <span className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              Prioridades de hoy
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Qué hacer hoy
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            ClienteYA revisa memoria, patrones y señales comerciales para
            mostrar las acciones más importantes del día.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/85 px-5 py-4 text-right shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Acciones
          </p>

          <p className="mt-1 text-3xl font-black text-slate-950">
            {visibleItems.length}
          </p>
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {visibleItems.map((item, index) => {
            const template = buildWhatsAppActionTemplate({
              relationshipName: item.nombre,
              pattern: item.pattern,
            });

            const whatsappHref = buildWhatsAppShareUrl({
              telefono: item.telefono,
              message: template.message,
            });

            return (
              <div
                key={item.relationshipId}
                className={`rounded-[28px] border p-4 ${getPriorityClasses(
                  item.priority
                )}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl text-xs font-black shadow-sm ${getScoreClasses(
                          item.priority
                        )}`}
                      >
                        {index + 1}
                      </span>

                      <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] shadow-sm">
                        Prioridad {getWhatsAppPriorityLabel(item.priority)}
                      </span>

                      <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] shadow-sm">
                        Puntaje {item.score}/100
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black leading-tight">
                      {item.nombre}
                    </h3>

                    <p className="mt-2 text-sm font-black leading-6">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm font-semibold leading-6 opacity-85">
                      {item.description}
                    </p>

                    <div className="mt-3 rounded-2xl border border-white/70 bg-white/75 p-3 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
                        Mensaje sugerido
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6">
                        {template.message}
                      </p>
                    </div>

                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] opacity-70">
                      Razón: {item.reason}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[320px]">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-950"
                    >
                      {template.title}
                    </a>

                    <Link
                      href={`/dashboard/relationships/${item.relationshipId}`}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm font-black shadow-sm transition hover:bg-white"
                    >
                      Ver memoria
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-5">
          <p className="text-sm font-semibold leading-6 text-slate-500">
            Todavía no hay prioridades suficientes. Agrega notas,
            recordatorios y próximos seguimientos para activar la inteligencia
            V18.
          </p>
        </div>
      )}
    </section>
  );
}