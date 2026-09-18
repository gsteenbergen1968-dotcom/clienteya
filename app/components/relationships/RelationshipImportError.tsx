type RelationshipImportErrorProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

export function RelationshipImportError({
  title,
  message,
  onRetry,
}: RelationshipImportErrorProps) {
  return (
    <div className="rounded-[24px] border border-red-200 bg-red-50 px-6 py-5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-700">
        Error
      </p>

      <h2 className="mt-2 text-xl font-black text-slate-950">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {message}
      </p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700"
        >
          Intentar nuevamente
        </button>
      ) : null}
    </div>
  );
}