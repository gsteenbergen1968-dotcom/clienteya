type ExecutiveCardProps = {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export default function ExecutiveCard({
  children,
  className = "",
  compact = false,
}: ExecutiveCardProps) {
  return (
    <section
      className={`rounded-[28px] border border-slate-200 bg-white shadow-sm ${
        compact ? "p-4" : "p-5"
      } ${className}`}
    >
      {children}
    </section>
  );
}