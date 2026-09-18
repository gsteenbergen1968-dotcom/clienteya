"use client";

import {
  RelationshipImportCard,
  type RelationshipImportSource,
} from "./RelationshipImportCard";

type RelationshipImportMode = "onboarding" | "settings";

type RelationshipImportProps = {
  mode: RelationshipImportMode;
};

type ImportSourceDefinition = {
  source: RelationshipImportSource;
  title: string;
  description: string;
  recommended?: boolean;
};

const importSources: ImportSourceDefinition[] = [
  {
    source: "whatsapp",
    title: "WhatsApp",
    description: "La forma más rápida de empezar.",
    recommended: true,
  },
  {
    source: "apple",
    title: "Apple Contacts",
    description: "Importa los contactos almacenados en tu iPhone o Mac.",
  },
  {
    source: "outlook",
    title: "Outlook",
    description: "Sincroniza tus contactos de Microsoft Outlook.",
  },
  {
    source: "spreadsheet",
    title: "Excel / CSV",
    description: "Importa una lista existente de relaciones.",
  },
];

export function RelationshipImport({ mode }: RelationshipImportProps) {
  const isOnboarding = mode === "onboarding";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="space-y-6">
          <header className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              {isOnboarding ? "Primer paso" : "Configuración"}
            </p>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Importa tus relaciones
              </h1>

              <p className="max-w-2xl text-base leading-7 text-slate-600">
                {isOnboarding
                  ? "Organiza tus relaciones para dar el primer paso hacia mejores decisiones."
                  : "Administra las fuentes desde las que importas tus relaciones en ClienteYA."}
              </p>
            </div>
          </header>

          <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
            <div className="border-b border-blue-100 bg-blue-50/70 px-5 py-5 sm:px-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-700">
                  {isOnboarding ? "Comienza con WhatsApp" : "Fuentes de importación"}
                </p>

                <h2 className="text-xl font-semibold text-slate-950">
                  Tus relaciones, en un solo lugar
                </h2>

                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Importa tus relaciones desde las aplicaciones que ya utilizas.
                  ClienteYA organizará la información para ayudarte a trabajar
                  con mayor claridad.
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
              {importSources.map((source) => (
                <RelationshipImportCard
                  key={source.source}
                  source={source.source}
                  title={source.title}
                  description={source.description}
                  recommended={source.recommended}
                />
              ))}
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
            <p className="text-sm leading-6 text-slate-600">
              Puedes importar tantas veces como quieras. ClienteYA detectará
              relaciones existentes para evitar duplicados.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}