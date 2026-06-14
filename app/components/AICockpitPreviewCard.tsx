import { ui } from "../../lib/ui";

export default function AICockpitPreviewCard() {
  return (
    <section
      className={`${ui.cards.base} ${ui.cards.padding.md} ${ui.animations.card}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className={`${ui.badges.neutral} mb-2`}>
            Centro de inteligencia
          </div>

          <h2 className={ui.typography.sectionTitle}>
            Inteligencia ejecutiva centralizada
          </h2>

          <p className={`${ui.typography.body} mt-2 max-w-3xl leading-6`}>
            Briefing, forecast, riesgo y recomendaciones estratégicas en una
            vista ejecutiva separada.
          </p>
        </div>

        <a
          href="/dashboard/ai-cockpit"
          className={`${ui.buttons.primary} shrink-0`}
        >
          Abrir centro
        </a>
      </div>
    </section>
  );
}