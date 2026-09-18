"use client";

import Link from "next/link";

import { ui } from "../../lib/ui";

import {
  buildAutomationRemindersV2,
  type AutomationReminderV2,
} from "../../lib/automation-engine-v2";
import type { RelationshipRecord } from "../../lib/relationship-repository";

type ReminderActionType = "contactado" | "listo" | "schedule";

type TopRemindersProps = {
  relationships: RelationshipRecord[];
  onQuickAction: (formData: FormData) => Promise<void>;
  title?: string;
  description?: string;
};

function getActionType(
  reminderType: AutomationReminderV2["type"],
): ReminderActionType {
  if (reminderType === "overdue") return "contactado";
  if (reminderType === "today") return "listo";

  return "schedule";
}

function getPriorityLabel(
  priority: AutomationReminderV2["priority"],
): string {
  if (priority === "urgent") return "Crítico";
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";

  return "Normal";
}

function getPriorityClasses(
  priority: AutomationReminderV2["priority"],
): string {
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

function getRelationshipName(
  relationship: RelationshipRecord,
): string {
  return (
    relationship.name?.trim() ||
    relationship.company?.trim() ||
    "Relación sin nombre"
  );
}

export default function TopReminders({
  relationships,
  onQuickAction,
  title = "Seguimientos prioritarios",
  description = "ClienteYA destaca los seguimientos más importantes del momento.",
}: TopRemindersProps) {
  const safeRelationships = Array.isArray(relationships)
    ? relationships
    : [];

  const reminders =
    buildAutomationRemindersV2(safeRelationships).slice(0, 3);

  if (reminders.length === 0) {
    return (
      <section
        className={`${ui.cards.base} ${ui.cards.padding.md} ${ui.animations.card}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className={`${ui.badges.neutral} mb-2`}>
              Seguimientos
            </div>

            <h2 className={ui.typography.sectionTitle}>{title}</h2>

            <p className={`${ui.typography.body} mt-2 leading-6`}>
              No hay seguimientos urgentes por ahora.
            </p>
          </div>

          <Link
            href="/dashboard/automations"
            className={ui.buttons.secondary}
          >
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
        <div>
          <div className={`${ui.badges.neutral} mb-2`}>
            Prioridades críticas
          </div>

          <h2 className={ui.typography.sectionTitle}>{title}</h2>

          <p className={`${ui.typography.body} mt-2 leading-6`}>
            {description}
          </p>
        </div>

        <Link
          href="/dashboard/automations"
          className={ui.buttons.secondary}
        >
          Ver automatizaciones
        </Link>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder, index) => {
          const relationship = reminder.relationship;
          const relationshipId = relationship.id;
          const relationshipName = getRelationshipName(relationship);
          const actionType = getActionType(reminder.type);

          return (
            <article
              key={`${reminder.type}-${relationshipId}-${index}`}
              className={`${ui.surfaces.muted} rounded-2xl px-4 py-3`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${getPriorityClasses(
                        reminder.priority,
                      )}`}
                    >
                      {getPriorityLabel(reminder.priority)}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                      Seguimiento
                    </span>
                  </div>

                  <h3 className="truncate text-sm font-black text-slate-950">
                    {reminder.title || "Seguimiento pendiente"}
                  </h3>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                    {relationshipName}
                  </p>

                  <p className={`${ui.typography.body} mt-2 max-w-3xl leading-6`}>
                    {reminder.description ||
                      "Esta relación necesita seguimiento."}
                  </p>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[250px]">
                  <Link
                    href={`/dashboard/whatsapp?id=${relationshipId}`}
                    className={ui.buttons.compact.success}
                  >
                    WhatsApp
                  </Link>

                  <Link
                    href={`/dashboard/relationships/${relationshipId}`}
                    className={ui.buttons.compact.secondary}
                  >
                    Abrir
                  </Link>

                  <form action={onQuickAction} className="w-full">
                    <input
                      type="hidden"
                      name="id"
                      value={relationshipId}
                    />

                    <input
                      type="hidden"
                      name="relationshipId"
                      value={relationshipId}
                    />

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