type RelationshipWhatsAppWelcomeProps = {
  onContinue: () => void;
  disabled?: boolean;
};

const assurances = [
  "Tus contactos permanecen seguros.",
  "No modificamos tu WhatsApp.",
  "Solo mostramos la información útil.",
];

export function RelationshipWhatsAppWelcome({
  onContinue,
  disabled = false,
}: RelationshipWhatsAppWelcomeProps) {
  return (
    <section className="rounded-[28px] border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
          WhatsApp
        </span>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
          Primer paso
        </p>

        <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
          Tu negocio ya tiene relaciones.
          <span className="mt-1 block text-blue-700">
            Ahora vamos a organizarlas.
          </span>
        </h1>

        <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
          ClienteYA analizará tus contactos de WhatsApp y preparará tus
          relaciones para que puedas empezar con una base organizada.
        </p>

        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
          No modificaremos tu WhatsApp. Solo utilizaremos la información
          necesaria para ayudarte a tomar mejores decisiones.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {assurances.map((assurance) => (
          <div
            key={assurance}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
              ✓
            </div>

            <p className="pt-0.5 text-sm font-bold leading-5 text-slate-800">
              {assurance}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-7">
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          className="w-full rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          Continuar
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-slate-400">
          Este proceso solo toma unos minutos.
        </p>
      </div>
    </section>
  );
}