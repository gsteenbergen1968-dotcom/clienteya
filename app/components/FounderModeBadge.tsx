type FounderModeBadgeProps = {
  enabled: boolean;
};

export default function FounderModeBadge({
  enabled,
}: FounderModeBadgeProps) {
  if (!enabled) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-700 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-amber-500" />

      Founder Mode
    </div>
  );
}