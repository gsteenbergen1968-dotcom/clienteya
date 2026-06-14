type ExecutiveGridProps = {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
};

function getGridClasses(columns: ExecutiveGridProps["columns"]) {
  if (columns === 1) return "grid-cols-1";
  if (columns === 2) return "grid-cols-1 lg:grid-cols-2";
  if (columns === 3) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
  if (columns === 4) return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

  return "grid-cols-1 lg:grid-cols-2";
}

export default function ExecutiveGrid({
  children,
  columns = 2,
  className = "",
}: ExecutiveGridProps) {
  return (
    <div className={`grid gap-4 ${getGridClasses(columns)} ${className}`}>
      {children}
    </div>
  );
}