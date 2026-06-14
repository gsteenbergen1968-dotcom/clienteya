import { getClientStatusLabel, getPriorityLabel } from "../../lib/ui-format";

type BadgeTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

type StatusBadgeProps = {
  label?: string | null;
  type?: "status" | "priority" | "custom";
  tone?: BadgeTone;
};

function getToneClasses(tone: BadgeTone) {
  const tones: Record<BadgeTone, string> = {
    default: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
    muted: "border-slate-200 bg-slate-100 text-slate-500",
  };

  return tones[tone];
}

function inferStatusTone(label?: string | null): BadgeTone {
  const normalized = label?.toLowerCase().trim();

  if (!normalized) return "muted";

  if (
    ["active", "activo", "completed", "completado", "done", "won", "ganado"].includes(
      normalized
    )
  ) {
    return "success";
  }

  if (
    ["pending", "pendiente", "medium", "media", "prospect", "prospecto", "lead"].includes(
      normalized
    )
  ) {
    return "warning";
  }

  if (
    ["urgent", "urgente", "high", "alta", "overdue", "vencido", "lost", "perdido"].includes(
      normalized
    )
  ) {
    return "danger";
  }

  if (["inactive", "inactivo", "low", "baja"].includes(normalized)) {
    return "muted";
  }

  return "default";
}

export default function StatusBadge({
  label,
  type = "custom",
  tone,
}: StatusBadgeProps) {
  const displayLabel =
    type === "status"
      ? getClientStatusLabel(label)
      : type === "priority"
        ? getPriorityLabel(label)
        : label || "Sin estado";

  const badgeTone = tone ?? inferStatusTone(label);

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getToneClasses(
        badgeTone
      )}`}
    >
      {displayLabel}
    </span>
  );
}