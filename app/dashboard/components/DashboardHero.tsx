import { ui } from "../../../lib/ui";
import TopBarActions from "../../components/TopBarActions";

type ClientSearchItem = {
  id: string;
  nombre: string;
  telefono?: string | null;
  estado?: string | null;
};

type DashboardHeroProps = {
  clientes: ClientSearchItem[];
  urgentCount: number;
};

export default function DashboardHero({
  clientes,
  urgentCount,
}: DashboardHeroProps) {
  return (
    <section className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="max-w-4xl">
        <div className={ui.badges.neutral}>Centro operativo</div>

        <h1 className={`${ui.typography.pageTitle} mt-3 max-w-xl leading-[0.95]`}>
          {ui.dashboard.title}
        </h1>

        <p className={`${ui.typography.body} mt-3 max-w-3xl leading-6`}>
          Vista diaria para seguimiento, asistente de WhatsApp, clientes,
          ingresos y señales comerciales.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 xl:justify-end">
        <TopBarActions clientes={clientes} urgentCount={urgentCount} />

        <a href="/dashboard/nuevo" className={ui.buttons.primary}>
          + {ui.clients.newClient}
        </a>

        <a href="/billing" className={ui.buttons.secondary}>
          Activar plan
        </a>
      </div>
    </section>
  );
}