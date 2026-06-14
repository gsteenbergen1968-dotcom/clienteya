import { ui } from "../../../lib/ui";

import KpiCard from "../../components/KpiCard";
import SectionCard from "../../components/SectionCard";

type Cliente = {
  id: string;
  nombre: string;
  estado?: string | null;
  telefono?: string | null;
  proximo_contacto?: string | null;
  monto?: number | null;
};

type DailyFocusPanelProps = {
  clientes: Cliente[];
};

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function formatGs(value: number) {
  return `Gs.\u00A0${Number(value || 0).toLocaleString("es-PY")}`;
}

function getPriorityData(clientes: Cliente[]) {
  const safeClientes = Array.isArray(clientes) ? clientes : [];

  const estadosCriticos = safeClientes.filter((cliente) =>
    normalizeText(cliente.estado).includes("sin")
  );

  const altaPrioridad = safeClientes.filter((cliente) =>
    normalizeText(cliente.estado).includes("interes")
  );

  const oportunidades = safeClientes.filter((cliente) =>
    normalizeText(cliente.estado).includes("pag")
  );

  const riesgo = safeClientes.filter((cliente) =>
    normalizeText(cliente.estado).includes("cerr")
  );

  const pipeline = safeClientes.reduce(
    (sum, cliente) => sum + Number(cliente.monto || 0),
    0
  );

  return {
    estadosCriticos,
    altaPrioridad,
    oportunidades,
    riesgo,
    pipeline,
  };
}

export default function DailyFocusPanel({ clientes }: DailyFocusPanelProps) {
  const data = getPriorityData(clientes);

  return (
    <SectionCard
      badge="Prioridades del día"
      title="Hoy debes enfocarte en esto"
      description="La operación está estable. Mantener ritmo de seguimiento."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Crítico"
            value={data.estadosCriticos.length}
            tone="red"
          />

          <KpiCard
            label="Alta prioridad"
            value={data.altaPrioridad.length}
            tone="amber"
          />

          <KpiCard
            label="Oportunidades"
            value={data.oportunidades.length}
            tone="sky"
          />

          <KpiCard
            label="Contacto en riesgo"
            value={data.riesgo.length}
            tone="amber"
          />

          <KpiCard
            label="Pipeline comercial"
            value={formatGs(data.pipeline)}
            tone="emerald"
          />
        </div>

        <div className={`${ui.surfaces.muted} rounded-2xl px-4 py-3`}>
          <p className={ui.typography.label}>Recomendación operativa</p>

          <p className={`${ui.typography.body} mt-2 leading-6 text-slate-700`}>
            Prioriza clientes con mayor intención comercial antes de buscar
            nuevos contactos.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}