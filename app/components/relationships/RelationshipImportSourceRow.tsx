export type RelationshipOnboardingSource =
  | "whatsapp"
  | "apple-contacts"
  | "google-contacts"
  | "outlook"
  | "excel"
  | "csv"
  | "manual";

export type RelationshipImportSourceOption = {
  key: RelationshipOnboardingSource;
  title: string;
  description?: string;
  symbol: string;
  status: "available" | "soon" | "manual";
  primary?: boolean;
};

type RelationshipImportSourceRowProps = {
  option: RelationshipImportSourceOption;
  selected: boolean;
  onSelect: () => void;
};

export function RelationshipImportSourceRow({
  option,
  selected,
  onSelect,
}: RelationshipImportSourceRowProps) {
  const isAvailable = option.status === "available";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex min-h-16 w-full items-center gap-4 rounded-[24px] border px-4 py-3.5 text-left shadow-sm transition hover:shadow-md sm:px-5 ${
        selected
          ? "border-blue-300 bg-blue-50"
          : option.primary
            ? "border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${
          selected || option.primary
            ? "bg-blue-700 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {option.symbol}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-black text-slate-950">
          {option.title}
        </h2>

        {option.description ? (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {option.description}
          </p>
        ) : null}
      </div>

      <div
        className={`shrink-0 text-lg font-black ${
          isAvailable ? "text-blue-700" : "text-slate-300"
        }`}
        aria-hidden="true"
      >
        →
      </div>
    </button>
  );
}