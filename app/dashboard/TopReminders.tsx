import Link from "next/link";
import {
  buildAutomationReminders,
  type ClienteForAutomation,
} from "../../lib/automation-engine";

type ReminderActionType = "contactado" | "listo" | "schedule";

function getActionType(reminderType: string): ReminderActionType {
  if (reminderType === "overdue") return "contactado";
  if (reminderType === "today") return "listo";
  return "schedule";
}

export default function TopReminders({
  clientes,
  onQuickAction,
}: {
  clientes: ClienteForAutomation[];
  onQuickAction: (formData: FormData) => Promise<void>;
}) {
  const reminders = buildAutomationReminders(clientes).slice(0, 3);

  if (reminders.length === 0) {
    return (
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Top reminders
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              No hay seguimientos urgentes por ahora.
            </p>
          </div>

          <Link
            href="/dashboard/automations"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Ver automations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Top reminders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            ClienteYA destaca los seguimientos más urgentes del momento.
          </p>
        </div>

        <Link
          href="/dashboard/automations"
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Ver automations
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reminders.map((reminder, index) => {
          const actionType = getActionType(reminder.type);

          return (
            <div
              key={`${reminder.type ?? "reminder"}-${
                reminder.clienteId ?? reminder.nombre ?? index
              }`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {reminder.nombre}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {reminder.title}
                  </p>
                </div>

                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  {reminder.priority}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {reminder.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/whatsapp?id=${reminder.clienteId}`}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  {reminder.actionLabel}
                </Link>

                <form action={onQuickAction}>
                  <input
                    type="hidden"
                    name="clienteId"
                    value={reminder.clienteId ?? ""}
                  />
                  <input
                    type="hidden"
                    name="actionType"
                    value={actionType}
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    Acción rápida
                  </button>
                </form>

                <Link
                  href={`/dashboard/editar?id=${reminder.clienteId}`}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Editar
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}