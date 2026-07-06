import Link from "next/link";

import { ui } from "../../lib/ui";

import {
  type AINotification,
  getAINotificationBadge,
  getAINotificationClasses,
} from "../../lib/ai-notifications";

type NotificationCenterProps = {
  notifications: AINotification[];
  title?: string;
  description?: string;
};

function getPriorityIcon(
  priority: AINotification["priority"] | null | undefined,
) {
  if (priority === "urgent") return "🚨";
  if (priority === "high") return "🔥";
  if (priority === "medium") return "⚡";

  return "📌";
}

function getSafePriority(
  priority: AINotification["priority"] | null | undefined,
): AINotification["priority"] {
  if (
    priority === "urgent" ||
    priority === "high" ||
    priority === "medium" ||
    priority === "low"
  ) {
    return priority;
  }

  return "low";
}

function getSafeTone(
  priority: AINotification["priority"] | null | undefined,
): AINotification["priority"] {
  return getSafePriority(priority);
}

export default function NotificationCenter({
  notifications,
  title = "Centro de atención AI",
  description = "ClienteYA detecta automáticamente qué necesita atención ahora.",
}: NotificationCenterProps) {
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <section
      className={`${ui.cards.base} ${ui.cards.padding.md} ${ui.animations.card}`}
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className={`${ui.badges.danger} mb-2`}>
            Atención inteligente
          </div>

          <h2 className={ui.typography.sectionTitle}>{title}</h2>

          <p className={`${ui.typography.body} mt-2 max-w-3xl leading-6`}>
            {description}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
          <p className={ui.typography.label}>Alertas</p>

          <p className="text-2xl font-black text-slate-950">
            {safeNotifications.length}
          </p>
        </div>
      </div>

      {safeNotifications.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
          ✅ No hay alertas críticas en este momento.
        </div>
      ) : (
        <div className="space-y-3">
          {safeNotifications.map((notification, index) => {
            const priority = getSafePriority(notification.priority);
            const tone = getSafeTone(notification.priority);

            const id = notification.id || `notification-${index}`;
            const category = notification.category || "AI";
            const notificationTitle =
              notification.title || "Notificación inteligente";
            const message =
              notification.message ||
              "ClienteYA detectó una señal que puede requerir atención.";

            return (
              <div
                key={id}
                className={`rounded-2xl border px-4 py-3 ${getAINotificationClasses(
                  tone,
                )}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-lg shadow-sm">
                      {getPriorityIcon(priority)}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">
                          {getAINotificationBadge(priority)}
                        </span>

                        <span className="text-[10px] font-black uppercase tracking-wide opacity-70">
                          {category}
                        </span>
                      </div>

                      <h3 className="text-sm font-black">
                        {notificationTitle}
                      </h3>

                      <p className="mt-1 text-sm leading-6 opacity-80">
                        {message}
                      </p>
                    </div>
                  </div>

                  {notification.href ? (
                    <Link
                      href={notification.href}
                      className={`${ui.buttons.secondary} shrink-0`}
                    >
                      Abrir
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}