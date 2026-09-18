type RelationshipImportSummaryCardProps = {
  label: string;
  value: number;
};

export function RelationshipImportSummaryCard({
  label,
  value,
}: RelationshipImportSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}