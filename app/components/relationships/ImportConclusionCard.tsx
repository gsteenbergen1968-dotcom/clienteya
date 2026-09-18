"use client";

import type { ReactNode } from "react";

export type ImportConclusionStatus =
  | "excellent"
  | "good"
  | "review"
  | "attention";

export type ImportConclusionAction = {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  onClick: () => void;
};

export type ImportConclusionCardProps = {
  status: ImportConclusionStatus;
  title: string;
  subtitle: string;
  targetId?: string;
  actionLabel?: string;
  actions?: ImportConclusionAction[];
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
};

const statusStyles: Record<
  ImportConclusionStatus,
  {
    shell: string;
    icon: string;
    title: string;
    subtitle: string;
    action: string;
    actionBorder: string;
    actionHover: string;
    defaultIcon: string;
  }
> = {
  excellent: {
    shell: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-700",
    title: "text-emerald-950",
    subtitle: "text-emerald-900/75",
    action: "text-emerald-800",
    actionBorder: "border-emerald-200",
    actionHover: "hover:bg-emerald-100/70",
    defaultIcon: "✓",
  },
  good: {
    shell: "border-blue-200 bg-blue-50",
    icon: "bg-blue-100 text-blue-700",
    title: "text-blue-950",
    subtitle: "text-blue-900/75",
    action: "text-blue-800",
    actionBorder: "border-blue-200",
    actionHover: "hover:bg-blue-100/70",
    defaultIcon: "●",
  },
  review: {
    shell: "border-amber-200 bg-amber-50",
    icon: "bg-amber-100 text-amber-700",
    title: "text-amber-950",
    subtitle: "text-amber-900/75",
    action: "text-amber-800",
    actionBorder: "border-amber-200",
    actionHover: "hover:bg-amber-100/70",
    defaultIcon: "!",
  },
  attention: {
    shell: "border-red-200 bg-red-50",
    icon: "bg-red-100 text-red-700",
    title: "text-red-950",
    subtitle: "text-red-900/75",
    action: "text-red-800",
    actionBorder: "border-red-200",
    actionHover: "hover:bg-red-100/70",
    defaultIcon: "!",
  },
};

export function ImportConclusionCard({
  status,
  title,
  subtitle,
  targetId,
  actionLabel = "Ver detalles",
  actions = [],
  icon,
  onClick,
  className = "",
}: ImportConclusionCardProps) {
  const styles = statusStyles[status];
  const isInteractive = Boolean(onClick || targetId);

  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }

    if (!targetId) {
      return;
    }

    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    target.focus({
      preventScroll: true,
    });
  }

  const content = (
    <div className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold",
          styles.icon,
        ].join(" ")}
      >
        {icon ?? styles.defaultIcon}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={[
            "block text-lg font-semibold tracking-tight sm:text-xl",
            styles.title,
          ].join(" ")}
        >
          {title}
        </span>

        <span
          className={[
            "mt-1 block text-sm leading-6",
            styles.subtitle,
          ].join(" ")}
        >
          {subtitle}
        </span>

        {isInteractive && actions.length === 0 ? (
          <span
            className={[
              "mt-4 inline-flex items-center gap-2 text-sm font-semibold",
              styles.action,
            ].join(" ")}
          >
            {actionLabel}
            <span aria-hidden="true">→</span>
          </span>
        ) : null}
      </span>
    </div>
  );

  return (
    <section
      className={[
        "w-full overflow-hidden rounded-3xl border text-left shadow-sm",
        styles.shell,
        className,
      ].join(" ")}
    >
      {isInteractive ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label={`${title}. ${actionLabel}`}
          className="w-full p-5 text-left transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:p-6"
        >
          {content}
        </button>
      ) : (
        <div className="p-5 sm:p-6">{content}</div>
      )}

      {actions.length > 0 ? (
        <div
          className={[
            "border-t",
            styles.actionBorder,
          ].join(" ")}
        >
          {actions.map((action, index) => (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={[
                "flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:px-6",
                styles.action,
                styles.actionHover,
                index > 0 ? `border-t ${styles.actionBorder}` : "",
              ].join(" ")}
            >
              {action.icon ? (
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/60"
                >
                  {action.icon}
                </span>
              ) : null}

              <span className="min-w-0 flex-1">
                {typeof action.count === "number"
                  ? `${action.count} ${action.label}`
                  : action.label}
              </span>

              <span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}