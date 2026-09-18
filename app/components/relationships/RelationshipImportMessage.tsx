type RelationshipImportMessageProps = {
  title: string;
  message: string;
};

export function RelationshipImportMessage({
  title,
  message,
}: RelationshipImportMessageProps) {
  return (
    <div className="rounded-[24px] border border-blue-200 bg-blue-50 px-6 py-5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
        Información
      </p>

      <h2 className="mt-2 text-xl font-black text-slate-950">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {message}
      </p>
    </div>
  );
}