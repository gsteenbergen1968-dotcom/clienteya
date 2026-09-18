import type { RelationshipImportResult } from "../../../lib/relationship-import-engine";
import type { RelationshipReviewReport } from "../../../lib/relationship-review-engine";

import { RelationshipImportSummaryCard } from "./RelationshipImportSummaryCard";

type RelationshipImportReviewProps = {
  fileName: string;
  importResult: RelationshipImportResult;
  reviewReport: RelationshipReviewReport;
  saving: boolean;
  onContinue: () => void;
  onChooseAnotherFile: () => void;
};

export function RelationshipImportReview({
  fileName,
  importResult,
  reviewReport,
  saving,
  onContinue,
  onChooseAnotherFile,
}: RelationshipImportReviewProps) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
            Primer paso hacia mejores decisiones.
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            {importResult.firstInsight.conclusion}
          </h2>

          <p className="mt-2 break-all text-xs text-slate-400">
            Archivo: {fileName}
          </p>
        </div>

        <button
          type="button"
          onClick={onChooseAnotherFile}
          className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50 sm:w-auto"
        >
          Elegir otro archivo
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <RelationshipImportSummaryCard
          label="Encontradas"
          value={importResult.summary.detectedRelationships}
        />

        <RelationshipImportSummaryCard
          label="Listas"
          value={importResult.summary.readyRelationships}
        />

        <RelationshipImportSummaryCard
          label="Para revisar"
          value={reviewReport.summary.review}
        />

        <RelationshipImportSummaryCard
          label="Duplicados"
          value={importResult.summary.duplicateRelationships}
        />
      </div>

      <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-5 sm:px-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
          Siguiente paso
        </p>

        <p className="mt-2 font-black leading-6 text-emerald-950">
          Continúa y deja que ClienteYA prepare tu primera organización
          automática.
        </p>

        <p className="mt-2 text-sm leading-6 text-emerald-800">
          Tu información quedará organizada para ayudarte a tomar mejores
          decisiones desde el primer día.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onContinue}
          disabled={saving}
          className="w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
        >
          {saving ? "Guardando relaciones..." : "Continuar"}
        </button>

        <button
          type="button"
          onClick={onChooseAnotherFile}
          className="w-full rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50 sm:w-auto"
        >
          Elegir otro archivo
        </button>
      </div>
    </div>
  );
}