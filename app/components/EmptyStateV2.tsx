type EmptyStateV2Props = {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
};

export default function EmptyStateV2({
  title,
  description,
  icon = "📭",
  action,
}: EmptyStateV2Props) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
        {icon}
      </div>

      <h3 className="text-sm font-bold text-slate-950">{title}</h3>

      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}