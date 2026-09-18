export type RelationshipImportSource =
  | "whatsapp"
  | "apple"
  | "outlook"
  | "spreadsheet";

type RelationshipImportCardProps = {
  source: RelationshipImportSource;
  title: string;
  description: string;
  recommended?: boolean;
  onImport?: (source: RelationshipImportSource) => void;
};

export function RelationshipImportCard({
  source,
  title,
  description,
  recommended = false,
  onImport,
}: RelationshipImportCardProps) {
  return (
    <article
      className={[
        "relative flex min-h-52 flex-col rounded-2xl border bg-white p-5 transition",
        recommended
          ? "border-blue-200 shadow-sm"
          : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      {recommended ? (
        <span className="absolute right-4 top-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Recomendado
        </span>
      ) : null}

      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
        {title.slice(0, 1).toUpperCase()}
      </div>

      <div className="mt-5 flex-1 space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>

        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <button
        type="button"
        onClick={() => onImport?.(source)}
        className={[
          "mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
          recommended
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
        ].join(" ")}
      >
        Importar
      </button>
    </article>
  );
}