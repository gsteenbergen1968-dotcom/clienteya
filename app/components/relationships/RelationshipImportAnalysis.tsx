"use client";

import { useMemo, useState } from "react";

import {
  ImportConclusionCard,
  type ImportConclusionStatus,
} from "@/app/components/relationships/ImportConclusionCard";

import type {
  ImportAnalysisDecision,
  ImportAnalysisGroups,
  ImportAnalysisRelationship,
  ImportAnalysisResult,
} from "@/lib/import-analysis-engine";

type RelationshipImportAnalysisProps = {
  analysis: ImportAnalysisResult;
  onConfirm: (decision: ImportAnalysisDecision) => void;
  isSubmitting?: boolean;
};

type VisibleGroupKey =
  | "commercial"
  | "private"
  | "unknown"
  | "duplicates"
  | "missingName";

type DecisionOption = {
  key: keyof ImportAnalysisDecision;
  groupKey: VisibleGroupKey;
  label: string;
  description: string;
  count: number;
};

export function RelationshipImportAnalysis({
  analysis,
  onConfirm,
  isSubmitting = false,
}: RelationshipImportAnalysisProps) {
  const [decision, setDecision] = useState<ImportAnalysisDecision>(
    analysis.recommendedDecision,
  );

  const [openGroup, setOpenGroup] =
    useState<VisibleGroupKey | null>(null);

  const [showAttention, setShowAttention] =
    useState(false);

  const attentionRelationships = useMemo(() => {
    const relationshipsBySourceIndex = new Map<
      number,
      ImportAnalysisRelationship
    >();

    [
      ...analysis.groups.duplicates,
      ...analysis.groups.missingName,
      ...analysis.groups.invalidPhone,
      ...analysis.groups.invalidEmail,
    ].forEach((relationship) => {
      relationshipsBySourceIndex.set(
        relationship.sourceIndex,
        relationship,
      );
    });

    return Array.from(
      relationshipsBySourceIndex.values(),
    );
  }, [analysis.groups]);

  const attentionPercentage =
    analysis.summary.total > 0
      ? Math.round(
          (
            attentionRelationships.length /
            analysis.summary.total
          ) * 100,
        )
      : 0;

  const conclusionStatus: ImportConclusionStatus =
    attentionRelationships.length === 0
      ? "excellent"
      : attentionPercentage <= 5
        ? "good"
        : attentionPercentage <= 20
          ? "review"
          : "attention";

  const conclusionTitle =
    getConclusionTitle(
      conclusionStatus,
    );

  const conclusionSubtitle =
    getConclusionSubtitle(
      attentionRelationships.length,
      analysis.summary.total,
    );

  const decisionOptions = useMemo<DecisionOption[]>(
    () => [
      {
        key: "includeCommercial",
        groupKey: "commercial",
        label: "🏢 Relaciones comerciales",
        description:
          "Contactos identificados como relaciones comerciales, prospectos o empresas.",
        count: analysis.summary.commercial,
      },
      {
        key: "includePrivate",
        groupKey: "private",
        label: "👤 Relaciones personales",
        description:
          "Contactos identificados como familiares, amigos o privados.",
        count: analysis.summary.private,
      },
      {
        key: "includeUnknown",
        groupKey: "unknown",
        label: "❓ Sin clasificar",
        description:
          "Contactos que todavía no tienen una categoría clara.",
        count: analysis.summary.unknown,
      },
      {
        key: "includeDuplicates",
        groupKey: "duplicates",
        label: "🔄 Posibles duplicados",
        description:
          "Contactos que pueden aparecer más de una vez.",
        count: analysis.summary.duplicates,
      },
      {
        key: "includeMissingName",
        groupKey: "missingName",
        label: "⚠️ Sin nombre",
        description:
          "Contactos que no tienen un nombre disponible.",
        count: analysis.summary.missingName,
      },
    ],
    [analysis],
  );

  function toggleDecision(
    key: keyof ImportAnalysisDecision,
  ) {
    setDecision((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleGroup(
    groupKey: VisibleGroupKey,
  ) {
    setOpenGroup((current) =>
      current === groupKey
        ? null
        : groupKey,
    );
  }

  function openSpecificGroup(
    groupKey: VisibleGroupKey,
  ) {
    setOpenGroup(
      groupKey,
    );

    window.requestAnimationFrame(() => {
      const target =
        document.getElementById(
          `import-group-${groupKey}`,
        );

      if (!target) {
        return;
      }

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      target.focus({
        preventScroll: true,
      });
    });
  }

  function handleConfirm() {
    onConfirm(
      decision,
    );
  }

  function openAttentionOverview() {
    if (
      attentionRelationships.length === 0
    ) {
      return;
    }

    setShowAttention(
      true,
    );

    window.requestAnimationFrame(() => {
      const target =
        document.getElementById(
          "import-attention-overview",
        );

      if (!target) {
        return;
      }

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      target.focus({
        preventScroll: true,
      });
    });
  }

  return (
    <section className="space-y-5">
      <ImportConclusionCard
        status={
          conclusionStatus
        }
        title={
          conclusionTitle
        }
        subtitle={
          conclusionSubtitle
        }
        actions={[
          ...(analysis.summary.duplicates > 0
            ? [
                {
                  id: "duplicates",
                  label:
                    "Posibles duplicados",
                  count:
                    analysis.summary.duplicates,
                  onClick: () =>
                    openSpecificGroup(
                      "duplicates",
                    ),
                },
              ]
            : []),
          ...(analysis.summary.missingName > 0
            ? [
                {
                  id: "missing-name",
                  label:
                    "Sin nombre",
                  count:
                    analysis.summary.missingName,
                  onClick: () =>
                    openSpecificGroup(
                      "missingName",
                    ),
                },
              ]
            : []),
          ...(analysis.summary.invalidPhone > 0
            ? [
                {
                  id: "invalid-phone",
                  label:
                    "Teléfono inválido",
                  count:
                    analysis.summary.invalidPhone,
                  onClick:
                    openAttentionOverview,
                },
              ]
            : []),
          ...(analysis.summary.invalidEmail > 0
            ? [
                {
                  id: "invalid-email",
                  label:
                    "Correo inválido",
                  count:
                    analysis.summary.invalidEmail,
                  onClick:
                    openAttentionOverview,
                },
              ]
            : []),
        ]}
        onClick={
          attentionRelationships.length > 0
            ? openAttentionOverview
            : undefined
        }
      />

      {showAttention &&
      attentionRelationships.length > 0 ? (
        <div
          id="import-attention-overview"
          tabIndex={-1}
          className="scroll-mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm outline-none sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-700">
                Requieren atención
              </p>

              <h2 className="mt-1 text-xl font-semibold text-red-950">
                {
                  attentionRelationships.length
                }{" "}
                relaciones para revisar
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowAttention(
                  false,
                )
              }
              className="shrink-0 text-sm font-semibold text-red-800 hover:text-red-950"
            >
              Ocultar
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {attentionRelationships.map(
              (relationship) => (
                <RelationshipDetailRow
                  key={`attention-${relationship.sourceIndex}`}
                  relationship={
                    relationship
                  }
                  groupKey={
                    getPrimaryGroupKey(
                      relationship,
                    )
                  }
                />
              ),
            )}
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-blue-700">
            Análisis de relaciones
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            ClienteYA analizó tus datos
          </h2>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Antes de importar, revisa lo que encontramos. ClienteYA no cambia
            nada sin tu confirmación.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryMetric
            label="👥 Encontradas"
            value={
              analysis.summary.total
            }
            emphasis
          />

          <SummaryMetric
            label="🏢 Comerciales"
            value={
              analysis.summary.commercial
            }
            onClick={() =>
              openSpecificGroup(
                "commercial",
              )
            }
          />

          <SummaryMetric
            label="👤 Personales"
            value={
              analysis.summary.private
            }
            onClick={() =>
              openSpecificGroup(
                "private",
              )
            }
          />

          <SummaryMetric
            label="❓ Sin clasificar"
            value={
              analysis.summary.unknown
            }
            onClick={() =>
              openSpecificGroup(
                "unknown",
              )
            }
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryMetric
            label="🔄 Posibles duplicados"
            value={
              analysis.summary.duplicates
            }
            onClick={() =>
              openSpecificGroup(
                "duplicates",
              )
            }
          />

          <SummaryMetric
            label="⚠️ Sin nombre"
            value={
              analysis.summary.missingName
            }
            onClick={() =>
              openSpecificGroup(
                "missingName",
              )
            }
          />

          <SummaryMetric
            label="📱 Teléfono inválido"
            value={
              analysis.summary.invalidPhone
            }
            onClick={
              openAttentionOverview
            }
          />

          <SummaryMetric
            label="✉️ Correo inválido"
            value={
              analysis.summary.invalidEmail
            }
            onClick={
              openAttentionOverview
            }
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-blue-700">
            Tu decisión
          </p>

          <h3 className="text-xl font-semibold text-slate-950">
            Elige qué relaciones entran en ClienteYA
          </h3>

          <p className="text-sm leading-6 text-slate-600">
            Puedes cambiar esta selección y abrir una categoría para revisar
            sus relaciones antes de continuar.
          </p>
        </div>

        <div className="mt-5 divide-y divide-slate-100">
          {decisionOptions.map(
            (option) => {
              const checked =
                decision[
                  option.key
                ];

              const isOpen =
                openGroup ===
                option.groupKey;

              const relationships =
                analysis.groups[
                  option.groupKey
                ];

              return (
                <div
                  key={
                    option.key
                  }
                  id={`import-group-${option.groupKey}`}
                  tabIndex={-1}
                  className="scroll-mt-6 py-4 outline-none"
                >
                  <div className="flex items-start gap-4">
                    <input
                      id={
                        option.key
                      }
                      type="checkbox"
                      checked={
                        checked
                      }
                      onChange={() =>
                        toggleDecision(
                          option.key,
                        )
                      }
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />

                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={
                          option.key
                        }
                        className="block cursor-pointer"
                      >
                        <span className="flex items-center justify-between gap-4">
                          <span className="font-medium text-slate-950">
                            {
                              option.label
                            }
                          </span>

                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {
                              option.count
                            }
                          </span>
                        </span>

                        <span className="mt-1 block text-sm leading-5 text-slate-600">
                          {
                            option.description
                          }
                        </span>
                      </label>

                      {option.count > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            toggleGroup(
                              option.groupKey,
                            )
                          }
                          aria-expanded={
                            isOpen
                          }
                          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                        >
                          {isOpen
                            ? "Ocultar detalles"
                            : "Ver detalles"}

                          <span aria-hidden="true">
                            {isOpen
                              ? "−"
                              : "+"}
                          </span>
                        </button>
                      ) : null}

                      {isOpen ? (
                        <RelationshipGroupDetails
                          relationships={
                            relationships
                          }
                          groupKey={
                            option.groupKey
                          }
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-950">
            Tú mantienes el control
          </p>

          <p className="mt-1 text-sm leading-5 text-blue-900/80">
            ClienteYA analiza y organiza la información. La decisión final
            siempre es tuya.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleConfirm
          }
          disabled={
            isSubmitting
          }
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Preparando importación..."
            : "Confirmar selección"}
        </button>
      </div>
    </section>
  );
}

type SummaryMetricProps = {
  label: string;
  value: number;
  emphasis?: boolean;
  onClick?: () => void;
};

function SummaryMetric({
  label,
  value,
  emphasis = false,
  onClick,
}: SummaryMetricProps) {
  const className =
    emphasis
      ? "rounded-2xl border border-blue-200 bg-blue-50 p-4"
      : "rounded-2xl border border-slate-200 bg-slate-50 p-4";

  const content = (
    <>
      <p
        className={
          emphasis
            ? "text-2xl font-semibold text-blue-950"
            : "text-2xl font-semibold text-slate-950"
        }
      >
        {value}
      </p>

      <p
        className={
          emphasis
            ? "mt-1 text-xs font-medium text-blue-800"
            : "mt-1 text-xs font-medium text-slate-600"
        }
      >
        {label}
      </p>
    </>
  );

  if (
    !onClick ||
    value === 0
  ) {
    return (
      <div className={className}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`${className} w-full text-left transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      aria-label={`${label}: ${value}. Ver detalles`}
    >
      {content}
    </button>
  );
}

type RelationshipGroupDetailsProps = {
  relationships:
    ImportAnalysisGroups[
      VisibleGroupKey
    ];
  groupKey:
    VisibleGroupKey;
};

function RelationshipGroupDetails({
  relationships,
  groupKey,
}: RelationshipGroupDetailsProps) {
  return (
    <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      {relationships.map(
        (relationship) => (
          <RelationshipDetailRow
            key={`${groupKey}-${relationship.sourceIndex}`}
            relationship={
              relationship
            }
            groupKey={
              groupKey
            }
          />
        ),
      )}
    </div>
  );
}

type RelationshipDetailRowProps = {
  relationship:
    ImportAnalysisRelationship;
  groupKey:
    VisibleGroupKey;
};

function RelationshipDetailRow({
  relationship,
  groupKey,
}: RelationshipDetailRowProps) {
  const visibleName =
    relationship.name.trim() ||
    "Sin nombre";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {visibleName}
          </p>

          {relationship.phone ? (
            <p className="mt-1 truncate text-xs text-slate-600">
              📱{" "}
              {
                relationship.phone
              }
            </p>
          ) : null}

          {relationship.email ? (
            <p className="mt-1 truncate text-xs text-slate-600">
              ✉️{" "}
              {
                relationship.email
              }
            </p>
          ) : null}
        </div>

        <RelationshipSignalBadges
          relationship={
            relationship
          }
          groupKey={
            groupKey
          }
        />
      </div>
    </div>
  );
}

type RelationshipSignalBadgesProps = {
  relationship:
    ImportAnalysisRelationship;
  groupKey:
    VisibleGroupKey;
};

function RelationshipSignalBadges({
  relationship,
  groupKey,
}: RelationshipSignalBadgesProps) {
  const badges =
    getRelationshipSignalBadges(
      relationship,
      groupKey,
    );

  return (
    <div className="flex max-w-[55%] shrink-0 flex-wrap justify-end gap-1.5">
      {badges.map(
        (badge) => (
          <span
            key={badge}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
          >
            {badge}
          </span>
        ),
      )}
    </div>
  );
}

function getRelationshipSignalBadges(
  relationship:
    ImportAnalysisRelationship,
  groupKey:
    VisibleGroupKey,
) {
  const badges:
    string[] = [];

  if (
    relationship.category ===
    "commercial"
  ) {
    badges.push(
      "🏢 Comercial",
    );
  }

  if (
    relationship.category ===
    "private"
  ) {
    badges.push(
      "👤 Personal",
    );
  }

  if (
    relationship.category ===
    "unknown"
  ) {
    badges.push(
      "❓ Sin clasificar",
    );
  }

  if (
    relationship.issueTypes.includes(
      "possible-duplicate",
    )
  ) {
    badges.push(
      "🔄 Posible duplicado",
    );
  }

  if (
    relationship.issueTypes.includes(
      "missing-name",
    )
  ) {
    badges.push(
      "⚠️ Sin nombre",
    );
  }

  if (
    relationship.issueTypes.includes(
      "invalid-phone",
    )
  ) {
    badges.push(
      "📱 Teléfono inválido",
    );
  }

  if (
    relationship.issueTypes.includes(
      "invalid-email",
    )
  ) {
    badges.push(
      "✉️ Correo inválido",
    );
  }

  if (
    badges.length === 0
  ) {
    const fallbackLabels: Record<
      VisibleGroupKey,
      string
    > = {
      commercial:
        "🏢 Comercial",
      private:
        "👤 Personal",
      unknown:
        "❓ Sin clasificar",
      duplicates:
        "🔄 Posible duplicado",
      missingName:
        "⚠️ Sin nombre",
    };

    badges.push(
      fallbackLabels[
        groupKey
      ],
    );
  }

  return badges;
}

function getConclusionTitle(
  status:
    ImportConclusionStatus,
) {
  const titles: Record<
    ImportConclusionStatus,
    string
  > = {
    excellent:
      "Excelente",
    good:
      "Muy bueno",
    review:
      "Requiere revisión",
    attention:
      "Necesita atención",
  };

  return titles[
    status
  ];
}

function getConclusionSubtitle(
  attentionCount:
    number,
  totalCount:
    number,
) {
  if (
    totalCount === 0
  ) {
    return "No se encontraron relaciones para importar.";
  }

  if (
    attentionCount === 0
  ) {
    return `${totalCount} relaciones están listas para importar.`;
  }

  if (
    attentionCount === 1
  ) {
    return "1 relación necesita tu atención antes de continuar.";
  }

  return `${attentionCount} relaciones necesitan tu atención antes de continuar.`;
}

function getPrimaryGroupKey(
  relationship:
    ImportAnalysisRelationship,
): VisibleGroupKey {
  if (
    relationship.issueTypes.includes(
      "possible-duplicate",
    )
  ) {
    return "duplicates";
  }

  if (
    relationship.issueTypes.includes(
      "missing-name",
    )
  ) {
    return "missingName";
  }

  if (
    relationship.category ===
    "commercial"
  ) {
    return "commercial";
  }

  if (
    relationship.category ===
    "private"
  ) {
    return "private";
  }

  return "unknown";
}