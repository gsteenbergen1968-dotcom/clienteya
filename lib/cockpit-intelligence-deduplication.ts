export type CockpitUnifiedSignalCategory =
  | "risk"
  | "opportunity"
  | "followup"
  | "payment"
  | "memory"
  | "revenue"
  | "relationship";

export type CockpitUnifiedSignalPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type CockpitUnifiedSignalTone =
  | "red"
  | "amber"
  | "emerald"
  | "sky"
  | "slate";

export type CockpitSignalSource = {
  id: string;
  relationshipId?: string | null;
  relationshipName?: string | null;
  title: string;
  description?: string | null;
  category: CockpitUnifiedSignalCategory;
  priority?: CockpitUnifiedSignalPriority | null;
  score?: number | null;
  amount?: number | null;
  actionLabel?: string | null;
  actionHref?: string | null;
};

export type CockpitUnifiedSignal = {
  id: string;
  relationshipId: string;
  relationshipName: string;
  title: string;
  summary: string;
  score: number;
  priority: CockpitUnifiedSignalPriority;
  tone: CockpitUnifiedSignalTone;
  categories: CockpitUnifiedSignalCategory[];
  reasons: string[];
  protectedAmount: number;
  actionLabel: string;
  actionHref: string;
};

export type CockpitDeduplicationResult = {
  totalSources: number;
  totalUnifiedSignals: number;
  duplicatesRemoved: number;
  criticalCount: number;
  highCount: number;
  topSignals: CockpitUnifiedSignal[];
  summary: string;
  recommendation: string;
};

function clamp(
  value: number,
  min = 0,
  max = 100,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function normalizeText(
  value?: string | null,
) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function unique<T>(
  items: T[],
) {
  return Array.from(
    new Set(items),
  );
}

function getPriorityScore(
  priority?: CockpitUnifiedSignalPriority | null,
) {
  if (
    priority === "critical"
  ) {
    return 95;
  }

  if (
    priority === "high"
  ) {
    return 78;
  }

  if (
    priority === "medium"
  ) {
    return 58;
  }

  return 38;
}

function getPriority(
  score: number,
): CockpitUnifiedSignalPriority {
  if (
    score >= 85
  ) {
    return "critical";
  }

  if (
    score >= 68
  ) {
    return "high";
  }

  if (
    score >= 45
  ) {
    return "medium";
  }

  return "low";
}

function getTone(
  priority: CockpitUnifiedSignalPriority,
): CockpitUnifiedSignalTone {
  if (
    priority === "critical"
  ) {
    return "red";
  }

  if (
    priority === "high"
  ) {
    return "amber";
  }

  if (
    priority === "medium"
  ) {
    return "sky";
  }

  return "emerald";
}

function getCategoryWeight(
  category: CockpitUnifiedSignalCategory,
) {
  if (
    category === "payment"
  ) {
    return 16;
  }

  if (
    category === "risk"
  ) {
    return 14;
  }

  if (
    category === "followup"
  ) {
    return 12;
  }

  if (
    category === "opportunity"
  ) {
    return 11;
  }

  if (
    category === "revenue"
  ) {
    return 10;
  }

  if (
    category === "memory"
  ) {
    return 8;
  }

  if (
    category === "relationship"
  ) {
    return 7;
  }

  return 5;
}

function getDefaultActionLabel(
  categories: CockpitUnifiedSignalCategory[],
) {
  if (
    categories.includes(
      "payment",
    )
  ) {
    return "Revisar pago";
  }

  if (
    categories.includes(
      "followup",
    )
  ) {
    return "Hacer seguimiento";
  }

  if (
    categories.includes(
      "opportunity",
    )
  ) {
    return "Avanzar oportunidad";
  }

  if (
    categories.includes(
      "risk",
    )
  ) {
    return "Revisar riesgo";
  }

  if (
    categories.includes(
      "relationship",
    )
  ) {
    return "Reactivar relación";
  }

  return "Abrir relación";
}

function getDefaultTitle(
  categories: CockpitUnifiedSignalCategory[],
  name: string,
) {
  if (
    categories.includes(
      "payment",
    )
  ) {
    return `${name}: pago pendiente`;
  }

  if (
    categories.includes(
      "followup",
    )
  ) {
    return `${name}: seguimiento pendiente`;
  }

  if (
    categories.includes(
      "opportunity",
    )
  ) {
    return `${name}: oportunidad activa`;
  }

  if (
    categories.includes(
      "risk",
    )
  ) {
    return `${name}: riesgo comercial`;
  }

  if (
    categories.includes(
      "relationship",
    )
  ) {
    return `${name}: relación requiere atención`;
  }

  return `${name}: señal comercial`;
}

function getRelationshipKey(
  signal: CockpitSignalSource,
) {
  if (
    signal.relationshipId
  ) {
    return `id:${signal.relationshipId}`;
  }

  const name =
    normalizeText(
      signal.relationshipName ||
        signal.title,
    );

  return `name:${
    name ||
    signal.id
  }`;
}

function buildSignalScore(
  input: {
    sources: CockpitSignalSource[];
    categories: CockpitUnifiedSignalCategory[];
    protectedAmount: number;
  },
) {
  const base =
    Math.max(
      ...input.sources.map(
        (source) =>
          typeof source.score ===
          "number"
            ? clamp(
                source.score,
              )
            : getPriorityScore(
                source.priority,
              ),
      ),
      0,
    );

  const categoryBoost =
    input.categories.reduce(
      (
        total,
        category,
      ) =>
        total +
        getCategoryWeight(
          category,
        ),
      0,
    );

  const sourceBoost =
    Math.min(
      14,
      Math.max(
        0,
        input.sources.length -
          1,
      ) * 5,
    );

  const amountBoost =
    input.protectedAmount > 0
      ? Math.min(
          18,
          Math.round(
            input.protectedAmount /
              1000000,
          ),
        )
      : 0;

  return clamp(
    Math.round(
      base * 0.72 +
        categoryBoost +
        sourceBoost +
        amountBoost,
    ),
  );
}

function buildReasons(
  sources: CockpitSignalSource[],
) {
  return unique(
    sources
      .map(
        (source) =>
          source.description ||
          source.title,
      )
      .filter(Boolean)
      .map(
        (value) =>
          String(
            value,
          ).trim(),
      ),
  ).slice(
    0,
    4,
  );
}

function buildSummary(
  input: {
    totalSources: number;
    totalUnifiedSignals: number;
    duplicatesRemoved: number;
    criticalCount: number;
    highCount: number;
  },
) {
  if (
    input.totalSources === 0
  ) {
    return "ClienteYA no detectó señales duplicadas en la Cockpit.";
  }

  if (
    input.duplicatesRemoved <= 0
  ) {
    return "ClienteYA consolidó las señales de la Cockpit sin detectar duplicación relevante.";
  }

  return `ClienteYA consolidó ${input.totalSources} señales en ${input.totalUnifiedSignals} prioridades visibles y eliminó ${input.duplicatesRemoved} duplicación(es).`;
}

function buildRecommendation(
  input: {
    topSignals: CockpitUnifiedSignal[];
    duplicatesRemoved: number;
  },
) {
  if (
    input.topSignals.length === 0
  ) {
    return "Mantener la Cockpit limpia: mostrar solo inteligencia que ayude a decidir.";
  }

  const first =
    input.topSignals[0];

  if (
    input.duplicatesRemoved > 0
  ) {
    return `Mostrar primero ${first.relationshipName}. La Cockpit debe enseñar una sola prioridad por relación, aunque existan varias señales internas.`;
  }

  return `Mantener ${first.relationshipName} como primera prioridad visible y evitar listas repetidas con la misma relación.`;
}

export function buildCockpitIntelligenceDeduplication(
  sources: CockpitSignalSource[],
): CockpitDeduplicationResult {
  const groups =
    new Map<
      string,
      CockpitSignalSource[]
    >();

  for (
    const source of sources
  ) {
    const key =
      getRelationshipKey(
        source,
      );

    const current =
      groups.get(
        key,
      ) || [];

    current.push(
      source,
    );

    groups.set(
      key,
      current,
    );
  }

  const unifiedSignals:
    CockpitUnifiedSignal[] =
    Array.from(
      groups.entries(),
    )
      .map(
        (
          [
            key,
            group,
          ],
        ) => {
          const first =
            group[0];

          const relationshipId =
            first.relationshipId ||
            key;

          const relationshipName =
            first.relationshipName ||
            group.find(
              (
                source,
              ) =>
                source.relationshipName,
            )
              ?.relationshipName ||
            first.title ||
            "Relación sin nombre";

          const categories =
            unique(
              group.map(
                (
                  source,
                ) =>
                  source.category,
              ),
            );

          const protectedAmount =
            group.reduce(
              (
                total,
                source,
              ) =>
                total +
                Number(
                  source.amount ||
                    0,
                ),
              0,
            );

          const score =
            buildSignalScore({
              sources:
                group,
              categories,
              protectedAmount,
            });

          const priority =
            getPriority(
              score,
            );

          const tone =
            getTone(
              priority,
            );

          const actionHref =
            group.find(
              (
                source,
              ) =>
                source.actionHref,
            )
              ?.actionHref ||
            (
              first.relationshipId
                ? `/dashboard/relationships/${first.relationshipId}`
                : "/dashboard/relationships"
            );

          const actionLabel =
            group.find(
              (
                source,
              ) =>
                source.actionLabel,
            )
              ?.actionLabel ||
            getDefaultActionLabel(
              categories,
            );

          const title =
            group.find(
              (
                source,
              ) =>
                source.title,
            )
              ?.title ||
            getDefaultTitle(
              categories,
              relationshipName,
            );

          const reasons =
            buildReasons(
              group,
            );

          return {
            id:
              `unified-${relationshipId}`,

            relationshipId,
            relationshipName,

            title,

            summary:
              reasons[0] ||
              "ClienteYA detectó señales comerciales que requieren atención.",

            score,
            priority,
            tone,

            categories,
            reasons,

            protectedAmount,

            actionLabel,
            actionHref,
          };
        },
      )
      .sort(
        (
          a,
          b,
        ) =>
          b.score -
          a.score,
      );

  const topSignals =
    unifiedSignals.slice(
      0,
      5,
    );

  const duplicatesRemoved =
    Math.max(
      0,
      sources.length -
        unifiedSignals.length,
    );

  const criticalCount =
    unifiedSignals.filter(
      (
        signal,
      ) =>
        signal.priority ===
        "critical",
    ).length;

  const highCount =
    unifiedSignals.filter(
      (
        signal,
      ) =>
        signal.priority ===
        "high",
    ).length;

  const summary =
    buildSummary({
      totalSources:
        sources.length,

      totalUnifiedSignals:
        unifiedSignals.length,

      duplicatesRemoved,

      criticalCount,

      highCount,
    });

  const recommendation =
    buildRecommendation({
      topSignals,
      duplicatesRemoved,
    });

  return {
    totalSources:
      sources.length,

    totalUnifiedSignals:
      unifiedSignals.length,

    duplicatesRemoved,

    criticalCount,
    highCount,

    topSignals,

    summary,
    recommendation,
  };
}

export function getCockpitUnifiedSignalPriorityLabel(
  priority: CockpitUnifiedSignalPriority,
) {
  if (
    priority === "critical"
  ) {
    return "Crítica";
  }

  if (
    priority === "high"
  ) {
    return "Alta";
  }

  if (
    priority === "medium"
  ) {
    return "Media";
  }

  return "Baja";
}

export function getCockpitUnifiedSignalCategoryLabel(
  category: CockpitUnifiedSignalCategory,
) {
  if (
    category === "risk"
  ) {
    return "Riesgo";
  }

  if (
    category === "opportunity"
  ) {
    return "Oportunidad";
  }

  if (
    category === "followup"
  ) {
    return "Seguimiento";
  }

  if (
    category === "payment"
  ) {
    return "Pago";
  }

  if (
    category === "memory"
  ) {
    return "Memoria";
  }

  if (
    category === "revenue"
  ) {
    return "Revenue";
  }

  if (
    category === "relationship"
  ) {
    return "Relación";
  }

  return "Señal";
}

export function getCockpitUnifiedSignalToneClasses(
  tone: CockpitUnifiedSignalTone,
) {
  if (
    tone === "red"
  ) {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (
    tone === "amber"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (
    tone === "emerald"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (
    tone === "sky"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}