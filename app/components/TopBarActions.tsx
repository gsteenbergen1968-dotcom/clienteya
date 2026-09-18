type RelationshipSearchItem = {
  id: string;
  nombre: string;
  telefono?: string | null;
  estado?: string | null;
};

type TopBarActionsProps = {
  relationships: RelationshipSearchItem[];
  urgentCount?: number;
};

export default function TopBarActions({
  urgentCount = 0,
}: TopBarActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {urgentCount > 0 ? (
        <a
          href="#alertas"
          className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100"
        >
          🚨 Atención rápida
          <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs">
            {urgentCount}
          </span>
        </a>
      ) : (
        <span className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
          ✅ Sin alertas críticas
        </span>
      )}
    </div>
  );
}