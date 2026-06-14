import Link from "next/link";

import { ui } from "../../lib/ui";

import {
  buildAutomationReminders,
  type ClienteForAutomation,
} from "../../lib/automation-engine";

type ReminderActionType = "contactado" | "listo" | "schedule";

type TopRemindersProps = {
  clientes: ClienteForAutomation[];
  onQuickAction: (formData: FormData) => Promise<void>;
  title?: string;
  description?: string;
};

function getActionType(reminderType: string | null | undefined): ReminderActionType {
  if (reminderType === "overdue") return "contactado";
  if (reminderType === "today") return "listo";

  return "schedule";
}

function getPriorityLabel(priority: string | null | undefined) {
  if (priority === "urgent") return "Crítico";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";
  if (priority === "low") return "Normal";

  return "Normal";
}

function getPriorityClasses(priority: string | null | undefined) {
  if (priority === "urgent") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "high") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (priority === "medium") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-white text-slate-700";
}

export default function TopReminders({
  clientes,
  onQuickAction,
  title = "Seguimientos prioritarios",
  description = "ClienteYA destaca los seguimientos más importantes del momento.",
}: TopRemindersProps) {
  const safeClientes = Array.isArray(clientes) ? clientes : [];
  const reminders = buildAutomationReminders(safeClientes).slice(0, 3);

  if (reminders.length === 0) {
    return (
      <section
        className={`${ui.cards.base} ${ui.cards.padding.md} ${ui.animations.card}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className={`${ui.badges.neutral} mb-2`}>Seguimientos</div>

            <h2 className={ui.typography.sectionTitle}>{title}</h2>

            <p className={`${ui.typography.body} mt-2 leading-6`}>
              No hay seguimientos urgentes por ahora.
            </p>
          </div>

          <Link href="/dashboard/automations" className={ui.buttons.secondary}>
            Ver automatizaciones
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${ui.cards.base} ${ui.cards.padding.md} ${ui.animations.card}`}
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className={`${ui.badges.neutral} mb-2`}>
            Prioridades críticas
          </div>

          <h2 className={ui.typography.sectionTitle}>{title}</h2>

          <p className={`${ui.typography.body} mt-2 leading-6`}>
            {description}
          </p>
        </div>

        <Link href="/dashboard/automations" className={ui.buttons.secondary}>
          Ver automatizaciones
        </Link>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder, index) => {
          const actionType = getActionType(reminder.type);
          const clienteId = reminder.clienteId || "";
          const nombre = reminder.nombre || "Cliente sin nombre";
          const reminderTitle = reminder.title || "Seguimiento pendiente";
          const reminderDescription =
            reminder.description || "Este cliente necesita seguimiento.";

          return (
            <article
              key={`${reminder.type || "reminder"}-${clienteId || nombre}-${index}`}
              className={`${ui.surfaces.muted} rounded-2xl px-4 py-3`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${getPriorityClasses(
                        reminder.priority
                      )}`}
                    >
                      {getPriorityLabel(reminder.priority)}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                      Seguimiento
                    </span>
                  </div>

                  <h3 className="truncate text-sm font-black text-slate-950">
                    {reminderTitle}
                  </h3>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                    {nombre}
                  </p>

                  <p className={`${ui.typography.body} mt-2 max-w-3xl leading-6`}>
                    {reminderDescription}
                  </p>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[250px]">
                  <Link
                    href={`/dashboard/whatsapp?id=${clienteId}`}
                    className={ui.buttons.compact.success}
                  >
                    WhatsApp
                  </Link>

                  <Link
                    href={`/dashboard/editar?id=${clienteId}`}
                    className={ui.buttons.compact.secondary}
                  >
                    Abrir
                  </Link>

                  <form action={onQuickAction} className="w-full">
                    <input type="hidden" name="id" value={clienteId} />
                    <input type="hidden" name="clienteId" value={clienteId} />

                    <input
                      type="hidden"
                      name="actionType"
                      value={actionType}
                    />

                    <button
                      type="submit"
                      className={`${ui.buttons.compact.secondary} w-full`}
                    >
                      Listo
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}