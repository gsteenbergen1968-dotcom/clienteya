import { ui } from "../../../lib/ui";

import KpiCard from "../../components/KpiCard";
import SectionCard from "../../components/SectionCard";

type Relationship = {
  id: string;
  name: string;
  status?: string | null;
  phone?: string | null;
  next_contact_at?: string | null;
  amount?: number | null;
};

type DailyFocusPanelProps = {
  relationships: Relationship[];
};

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function formatGs(value: number) {
  return `Gs.\u00A0${Number(value || 0).toLocaleString("es-PY")}`;
}

function getPriorityData(relationships: Relationship[]) {
  const safeRelationships = Array.isArray(relationships)
    ? relationships
    : [];

  const criticalStatuses = safeRelationships.filter((relationship) =>
    normalizeText(relationship.status).includes("sin"),
  );

  const highPriority = safeRelationships.filter((relationship) =>
    normalizeText(relationship.status).includes("interes"),
  );

  const opportunities = safeRelationships.filter((relationship) =>
    normalizeText(relationship.status).includes("pag"),
  );

  const risk = safeRelationships.filter((relationship) =>
    normalizeText(relationship.status).includes("cerr"),
  );

  const pipeline = safeRelationships.reduce(
    (sum, relationship) => sum + Number(relationship.amount || 0),
    0,
  );

  return {
    criticalStatuses,
    highPriority,
    opportunities,
    risk,
    pipeline,
  };
}

export default function DailyFocusPanel({
  relationships,
}: DailyFocusPanelProps) {
  const data = getPriorityData(relationships);

  return (
    <SectionCard
      badge="Foco diario"
      title="Prioridades comerciales"
      description="Una lectura rápida de las relaciones que requieren atención."
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Estado crítico"
            value={data.criticalStatuses.length}
            tone="red"
          />

          <KpiCard
            label="Alta prioridad"
            value={data.highPriority.length}
            tone="amber"
          />

          <KpiCard
            label="Oportunidades"
            value={data.opportunities.length}
            tone="sky"
          />

          <KpiCard
            label="Relación en riesgo"
            value={data.risk.length}
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
            Prioriza relaciones con mayor intención comercial antes de buscar
            nuevos contactos.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}