export function RelationshipImportLoading() {
  return (
    <div className="rounded-[24px] border border-blue-200 bg-blue-50 px-6 py-8 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
        Procesando
      </p>

      <h2 className="mt-3 text-2xl font-black text-slate-950">
        ClienteYA está preparando tus relaciones
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Estamos analizando el archivo, detectando relaciones y organizando la
        información para que puedas comenzar con una base limpia.
      </p>

      <div className="mt-6 flex justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700" />
      </div>
    </div>
  );
}