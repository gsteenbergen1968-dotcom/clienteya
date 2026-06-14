type ExecutiveSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function ExecutiveSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: ExecutiveSectionHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="text-lg font-bold tracking-tight text-slate-950">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}