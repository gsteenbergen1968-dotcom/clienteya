import { ui } from "../../../lib/ui";
import TopBarActions from "../../components/TopBarActions";

type RelationshipSearchItem = {
  id: string;
  nombre: string;
  telefono?: string | null;
  estado?: string | null;
};

type DashboardHeroProps = {
  relationships: RelationshipSearchItem[];
  urgentCount: number;
};

export default function DashboardHero({
  relationships,
  urgentCount,
}: DashboardHeroProps) {
  return (
    <section>
      <div>
        <div>Centro operativo</div>

        <h1 className={`${ui.typography.pageTitle} mt-3 max-w-xl leading-[0.95]`}>
          {ui.dashboard.title}
        </h1>

        <p className={`${ui.typography.body} mt-3 max-w-3xl leading-6`}>
          Vista diaria para seguimiento, asistente de WhatsApp, relaciones,
          ingresos y señales comerciales.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 xl:justify-end">
        <TopBarActions
          relationships={relationships}
          urgentCount={urgentCount}
        />

        <a href="/dashboard/new" className={ui.buttons.primary}>
          + Nueva relación
        </a>

        <a href="/dashboard/billing" className={ui.buttons.secondary}>
          Activar plan
        </a>
      </div>
    </section>
  );
}