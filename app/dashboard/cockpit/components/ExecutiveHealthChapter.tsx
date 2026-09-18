import ExecutiveChapter from "./ExecutiveChapter";
import ExecutiveDecisionCard from "./ExecutiveDecisionCard";
import ExecutiveEvidenceGrid from "./ExecutiveEvidenceGrid";
import ExecutiveSummaryCard, {
  type ExecutiveSummaryTone,
  type ExecutiveSummaryTrend,
} from "./ExecutiveSummaryCard";

export type ExecutiveHealthChapterProps = {
  healthScore: number;
  founderScore: number;
  revenueMomentum: number;
  operationalPressure: number;
  executionQuality: number;
  pipelineVelocity: number;
  confirmedRevenue: number;
  openRevenue: number;
  confirmedRevenueUsd?: number;
  openRevenueUsd?: number;
  overdueFollowups: number;
  dueSoonFollowups: number;
  paidRelationships: number;
  unpaidRelationships: number;
};

type HealthTone =
  | "critical"
  | "warning"
  | "stable"
  | "positive";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeNumber(
  value: number | null | undefined,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(0, value);
}

function formatGs(value: number) {
  return `Gs. ${new Intl.NumberFormat("es-PY").format(
    Math.round(safeNumber(value)),
  )}`;
}

function formatUsd(value: number) {
  return `USD ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(safeNumber(value)))}`;
}

function formatRevenueValue(
  pygValue: number,
  usdValue: number,
) {
  const parts: string[] = [];

  if (pygValue > 0) {
    parts.push(formatGs(pygValue));
  }

  if (usdValue > 0) {
    parts.push(formatUsd(usdValue));
  }

  if (parts.length === 0) {
    return formatGs(0);
  }

  return parts.join(" · ");
}

function hasOpenRevenue(
  openRevenue: number,
  openRevenueUsd: number,
) {
  return (
    safeNumber(openRevenue) > 0 ||
    safeNumber(openRevenueUsd) > 0
  );
}

function getHealthTone(score: number): HealthTone {
  if (score < 45) return "critical";
  if (score < 65) return "warning";
  if (score < 78) return "stable";
  return "positive";
}

function getChapterStatus(tone: HealthTone) {
  if (tone === "critical") return "critical" as const;
  if (tone === "warning") return "warning" as const;
  if (tone === "stable") return "attention" as const;
  return "stable" as const;
}

function getChapterTone(tone: HealthTone) {
  if (tone === "critical") return "red" as const;
  if (tone === "warning") return "amber" as const;
  return "blue" as const;
}

function getSummaryTone(
  tone: HealthTone,
): ExecutiveSummaryTone {
  if (tone === "critical") return "critical";
  if (tone === "warning") return "warning";
  if (tone === "stable") return "stable";
  return "positive";
}

function getSummaryTrend(
  revenueMomentum: number,
  operationalPressure: number,
): ExecutiveSummaryTrend {
  if (
    revenueMomentum >= 70 &&
    operationalPressure < 40
  ) {
    return "up";
  }

  if (operationalPressure >= 65) {
    return "down";
  }

  return "stable";
}

function getStatusLabel(tone: HealthTone) {
  if (tone === "critical") return "Crítico";
  if (tone === "warning") return "Vigilancia";
  if (tone === "stable") return "Atención";
  return "Saludable";
}

function getTitle(tone: HealthTone) {
  if (tone === "critical") {
    return "La empresa requiere atención inmediata";
  }

  if (tone === "warning") {
    return "La empresa muestra presión visible";
  }

  if (tone === "stable") {
    return "La empresa está estable";
  }

  return "La empresa está saludable";
}

function getSummary(
  tone: HealthTone,
  overdueFollowups: number,
  openRevenue: number,
  openRevenueUsd: number,
) {
  if (tone === "critical") {
    return "La operación acumula presión suficiente para afectar ingresos, seguimiento y continuidad comercial.";
  }

  if (tone === "warning") {
    return "La empresa sigue operativa, pero necesita reducir fricción antes de acelerar el crecimiento.";
  }

  if (overdueFollowups > 0) {
    return "La base es estable, aunque algunos seguimientos vencidos requieren atención para proteger relaciones e ingresos.";
  }

  if (
    hasOpenRevenue(
      openRevenue,
      openRevenueUsd,
    )
  ) {
    return "La empresa está bajo control y cuenta con valor comercial abierto que puede convertirse con disciplina.";
  }

  return "La empresa está bajo control y no muestra presión ejecutiva dominante.";
}

function getDecision(
  tone: HealthTone,
  overdueFollowups: number,
  openRevenue: number,
  openRevenueUsd: number,
) {
  if (tone === "critical") {
    return {
      title: "Estabilizar la operación",
      description:
        "Reduce la presión comercial antes de abrir nuevas oportunidades.",
      decision:
        "Resuelve primero los seguimientos vencidos y protege los ingresos existentes.",
      cardTone: "critical" as const,
    };
  }

  if (overdueFollowups > 0) {
    return {
      title: "Recuperar seguimientos",
      description:
        "Las relaciones atrasadas son la principal amenaza para la salud comercial.",
      decision:
        "Contacta primero a las relaciones vencidas y restablece continuidad.",
      cardTone: "medium" as const,
    };
  }

  if (
    hasOpenRevenue(
      openRevenue,
      openRevenueUsd,
    )
  ) {
    return {
      title: "Convertir valor abierto",
      description:
        "La empresa tiene espacio para crecer sin perder control operativo.",
      decision:
        "Prioriza las oportunidades abiertas con mayor valor y siguiente paso claro.",
      cardTone: "growth" as const,
    };
  }

  return {
    title: "Mantener disciplina comercial",
    description:
      "No existe presión crítica dominante en este momento.",
    decision:
      "Conserva el ritmo de seguimiento y vigila cualquier señal de enfriamiento.",
    cardTone: "stable" as const,
  };
}

function getEvidenceTone(
  value: number,
  direction:
    | "higher-is-better"
    | "lower-is-better",
) {
  const healthy =
    direction === "higher-is-better"
      ? value >= 70
      : value < 40;

  const warning =
    direction === "higher-is-better"
      ? value >= 50
      : value < 65;

  if (healthy) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (warning) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function HealthEvidenceCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  tone: string;
}) {
  return (
    <div
      className={`rounded-[26px] border p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${tone}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">
        {label}
      </p>

      <p className="mt-3 text-2xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-3 text-sm font-semibold leading-6 opacity-90">
        {description}
      </p>
    </div>
  );
}

export default function ExecutiveHealthChapter({
  healthScore,
  founderScore,
  revenueMomentum,
  operationalPressure,
  executionQuality,
  pipelineVelocity,
  confirmedRevenue,
  openRevenue,
  confirmedRevenueUsd = 0,
  openRevenueUsd = 0,
  overdueFollowups,
  dueSoonFollowups,
  paidRelationships,
  unpaidRelationships,
}: ExecutiveHealthChapterProps) {
  const score = clamp(healthScore);
  const tone = getHealthTone(score);
  const decision = getDecision(
    tone,
    overdueFollowups,
    openRevenue,
    openRevenueUsd,
  );

  return (
    <ExecutiveChapter
      index={1}
      title="Salud del Negocio"
      question="¿Qué tan saludable está mi empresa?"
      status={getChapterStatus(tone)}
      statusLabel={getStatusLabel(tone)}
      tone={getChapterTone(tone)}
      metrics={[
        {
          label: "Salud ejecutiva",
          value: `${score}/100`,
        },
        {
          label: "PUNTUACIÓN DEL FOUNDER",
          value: `${clamp(founderScore)}/100`,
        },
        {
          label: "Ingresos confirmados",
          value: formatRevenueValue(
            confirmedRevenue,
            confirmedRevenueUsd,
          ),
        },
        {
          label: "Valor abierto",
          value: formatRevenueValue(
            openRevenue,
            openRevenueUsd,
          ),
        },
      ]}
    >
      <ExecutiveSummaryCard
        eyebrow="Conclusión"
        title={getTitle(tone)}
        question="¿La empresa puede avanzar sin perder control?"
        summary={getSummary(
          tone,
          overdueFollowups,
          openRevenue,
          openRevenueUsd,
        )}
        statusLabel={getStatusLabel(tone)}
        tone={getSummaryTone(tone)}
        trend={getSummaryTrend(
          revenueMomentum,
          operationalPressure,
        )}
        trendLabel="Tendencia ejecutiva"
        primaryMetric={`${score}/100`}
        primaryMetricLabel="Salud ejecutiva"
        secondaryMetric={String(overdueFollowups)}
        secondaryMetricLabel="Seguimientos vencidos"
        decision={decision.description}
      />

      <ExecutiveEvidenceGrid
        title="Evidencia"
        description="Esta evidencia explica por qué ClienteYA llega a esta conclusión."
        columns="two"
      >
        <HealthEvidenceCard
          label="Momentum de ingresos"
          value={`${clamp(revenueMomentum)}/100`}
          description="Mide si los ingresos mantienen suficiente ritmo comercial."
          tone={getEvidenceTone(
            revenueMomentum,
            "higher-is-better",
          )}
        />

        <HealthEvidenceCard
          label="Presión operativa"
          value={`${clamp(operationalPressure)}/100`}
          description="Mide cuánta presión abierta afecta la continuidad comercial."
          tone={getEvidenceTone(
            operationalPressure,
            "lower-is-better",
          )}
        />

        <HealthEvidenceCard
          label="Calidad de ejecución"
          value={`${clamp(executionQuality)}/100`}
          description="Indica si el seguimiento y la disciplina sostienen el negocio."
          tone={getEvidenceTone(
            executionQuality,
            "higher-is-better",
          )}
        />

        <HealthEvidenceCard
          label="Velocidad del pipeline"
          value={`${clamp(pipelineVelocity)}/100`}
          description="Mide si las oportunidades avanzan con suficiente velocidad."
          tone={getEvidenceTone(
            pipelineVelocity,
            "higher-is-better",
          )}
        />

        <HealthEvidenceCard
          label="Acciones próximas"
          value={String(dueSoonFollowups)}
          description="Relaciones que necesitan contacto dentro de los próximos días."
          tone={
            dueSoonFollowups === 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }
        />

        <HealthEvidenceCard
          label="Relaciones convertidas"
          value={`${paidRelationships} / ${
            paidRelationships + unpaidRelationships
          }`}
          description="Parte de la cartera que ya generó ingreso confirmado."
          tone={
            paidRelationships >= unpaidRelationships
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }
        />
      </ExecutiveEvidenceGrid>

      <ExecutiveDecisionCard
        title={decision.title}
        description={decision.description}
        decision={decision.decision}
        tone={decision.cardTone}
      />
    </ExecutiveChapter>
  );
}