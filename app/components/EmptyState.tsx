import Link from "next/link";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function EmptyState({
  icon = "✨",
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-3xl">
        {icon}
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>

      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}