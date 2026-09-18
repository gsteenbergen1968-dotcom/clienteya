export type RelationshipSource =
  | "whatsapp"
  | "excel"
  | "csv"
  | "google-contacts"
  | "outlook"
  | "manual";

export type RelationshipImportStatus =
  | "ready"
  | "review"
  | "completed";

export type RelationshipSourceOption = {
  key: RelationshipSource;
  title: string;
  description: string;
  priority: number;
};

export type RelationshipImportSummary = {
  source: RelationshipSource;

  detectedRelationships: number;

  readyRelationships: number;

  duplicateRelationships: number;

  reviewRelationships: number;

  ignoredRelationships: number;
};

export type RelationshipFirstInsight = {
  conclusion: string;

  evidence: string[];

  action: string;
};

export type RelationshipOnboardingReport = {
  status: RelationshipImportStatus;

  title: string;

  description: string;

  availableSources: RelationshipSourceOption[];

  summary?: RelationshipImportSummary;

  firstInsight?: RelationshipFirstInsight;
};

const SOURCES: RelationshipSourceOption[] = [
  {
    key: "whatsapp",
    title: "WhatsApp",
    description: "Tus relaciones ya viven aquí.",
    priority: 1,
  },
  {
    key: "excel",
    title: "Excel",
    description: "Importa tu archivo de Excel.",
    priority: 2,
  },
  {
    key: "csv",
    title: "CSV",
    description: "Importa un archivo CSV.",
    priority: 3,
  },
  {
    key: "google-contacts",
    title: "Google Contacts",
    description: "Importa tus contactos.",
    priority: 4,
  },
  {
    key: "outlook",
    title: "Outlook",
    description: "Importa tus contactos.",
    priority: 5,
  },
  {
    key: "manual",
    title: "Agregar manualmente",
    description: "Comienza con una relación.",
    priority: 6,
  },
];

export function buildRelationshipOnboardingReport(): RelationshipOnboardingReport {
  return {
    status: "ready",

    title: "¿Dónde viven hoy tus relaciones comerciales?",

    description:
      "ClienteYA puede ayudarte a comenzar utilizando la información que ya tienes.",

    availableSources: SOURCES,
  };
}