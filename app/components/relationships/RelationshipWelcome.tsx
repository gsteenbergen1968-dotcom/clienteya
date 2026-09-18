type RelationshipWelcomeProps = {
  onContinue: () => void;
};

export function RelationshipWelcome({
  onContinue,
}: RelationshipWelcomeProps) {
  return (
    <section className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
          Bienvenido
        </span>
      </div>

      <div className="mt-6">
        <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
          Tu negocio genera información todos los días.
        </h1>

        <h2 className="mt-3 text-2xl font-black leading-tight text-blue-700 sm:text-3xl">
          ClienteYA organiza esa información para ayudarte a tomar mejores
          decisiones.
        </h2>

        <p className="mt-6 text-base leading-8 text-slate-600">
          No necesitas cambiar la forma en que trabajas.
        </p>

        <p className="mt-3 text-base leading-8 text-slate-600">
          ClienteYA organiza tus relaciones para darte más claridad desde el
          primer día.
        </p>
      </div>

      <div className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">
            ✓
          </div>

          <p className="font-semibold text-slate-800">
            Organiza tus relaciones automáticamente.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">
            ✓
          </div>

          <p className="font-semibold text-slate-800">
            Conserva toda tu información en un solo lugar.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">
            ✓
          </div>

          <p className="font-semibold text-slate-800">
            Toma mejores decisiones desde el primer día.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 w-full rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
      >
        Comenzar
      </button>
    </section>
  );
}