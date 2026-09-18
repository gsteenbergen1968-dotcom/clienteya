"use client";

import { useRouter } from "next/navigation";

type RelationshipSourceId =
  | "whatsapp"
  | "apple"
  | "outlook"
  | "excel"
  | "csv";

type RelationshipSource = {
  id: RelationshipSourceId;
  title: string;
  description: string;
  available: boolean;
};

const RELATIONSHIP_SOURCES: RelationshipSource[] = [
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "Importa conversaciones y contactos.",
    available: true,
  },
  {
    id: "apple",
    title: "Apple Contacts",
    description: "Importa los contactos de Apple.",
    available: true,
  },
  {
    id: "outlook",
    title: "Outlook",
    description: "Importa los contactos de Outlook.",
    available: true,
  },
  {
    id: "excel",
    title: "Excel",
    description: "Importa relaciones desde un archivo Excel.",
    available: true,
  },
  {
    id: "csv",
    title: "CSV",
    description: "Importa relaciones desde un archivo CSV.",
    available: true,
  },
];

export function RelationshipSourcesCard() {
  const router = useRouter();

  function handleImport(sourceId: RelationshipSourceId) {
    router.push(
      `/onboarding/relationships?entry=settings&source=${sourceId}`,
    );
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Importar relaciones
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Agrega relaciones desde tus aplicaciones y archivos.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {RELATIONSHIP_SOURCES.map((source) => (
          <div
            key={source.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-bold text-slate-900">
                {source.title}
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {source.description}
              </p>
            </div>

            {source.available ? (
              <button
                type="button"
                onClick={() => handleImport(source.id)}
                className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 sm:w-auto"
              >
                Importar
              </button>
            ) : (
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                Próximamente
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}