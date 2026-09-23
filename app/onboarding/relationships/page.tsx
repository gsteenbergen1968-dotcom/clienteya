"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  RelationshipImportSourceRow,
  type RelationshipImportSourceOption,
  type RelationshipOnboardingSource,
} from "../../components/relationships/RelationshipImportSourceRow";

import { RelationshipImportError } from "../../components/relationships/RelationshipImportError";
import { RelationshipImportLoading } from "../../components/relationships/RelationshipImportLoading";
import { RelationshipImportMessage } from "../../components/relationships/RelationshipImportMessage";
import { RelationshipImportReview } from "../../components/relationships/RelationshipImportReview";
import { RelationshipImportAnalysis } from "../../components/relationships/RelationshipImportAnalysis";
import { RelationshipWhatsAppWelcome } from "../../components/relationships/RelationshipWhatsAppWelcome";
import { RelationshipWelcome } from "../../components/relationships/RelationshipWelcome";

import {
  getRelationshipFileAcceptValue,
  isSupportedRelationshipFile,
  parseRelationshipBrowserFile,
  RelationshipFileParserError,
} from "../../../lib/relationship-file-parser";
import {
  buildRelationshipImportResult,
  type RelationshipImportResult,
} from "../../../lib/relationship-import-engine";
import {
  buildImportAnalysisResult,
  type ImportAnalysisDecision,
  type ImportAnalysisResult,
} from "../../../lib/import-analysis-engine";
import type {
  RelationshipSource,
} from "../../../lib/relationship-onboarding-engine";
import {
  buildRelationshipReviewReport,
  type RelationshipReviewReport,
} from "../../../lib/relationship-review-engine";
import {
  deduplicateRelationships,
  type RelationshipDeduplicationRecord,
} from "../../../lib/relationship-deduplication-engine";
import { createBrowserSupabaseClient } from "../../../lib/supabase/browser";

type RelationshipOnboardingStep =
  | "intro"
  | "welcome"
  | "source"
  | "analysis";

type RelationshipImportRow = Record<string, string | null>;

const SOURCE_OPTIONS: RelationshipImportSourceOption[] = [
  {
    key: "whatsapp",
    title: "WhatsApp",
    description: "Tus relaciones ya viven aquí.",
    symbol: "◉",
    status: "soon",
    primary: true,
  },
  {
    key: "apple-contacts",
    title: "Apple Contacts",
    description: "Importa tus contactos desde un archivo vCard (.vcf).",
    symbol: "●",
    status: "available",
  },
  {
    key: "google-contacts",
    title: "Google Contacts",
    description: "",
    symbol: "◎",
    status: "soon",
  },
  {
    key: "outlook",
    title: "Outlook",
    description: "Importa tus contactos exportados desde Outlook (.csv).",
    symbol: "✉",
    status: "available",
  },
  {
    key: "excel",
    title: "Excel",
    description: "",
    symbol: "▦",
    status: "available",
  },
  {
    key: "csv",
    title: "CSV",
    description: "",
    symbol: "▤",
    status: "available",
  },
  {
    key: "manual",
    title: "Comenzar manualmente",
    description: "Empieza hoy con una sola relación.",
    symbol: "+",
    status: "manual",
  },
];

function ParaguayBadge() {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="h-2.5 w-8 bg-red-500" />

        <div className="flex h-2.5 w-8 items-center justify-center bg-white text-[8px] font-black text-slate-900">
          PY
        </div>

        <div className="h-2.5 w-8 bg-blue-600" />
      </div>
    </div>
  );
}

function decodeVCardValue(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function unfoldVCardLines(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n");
}

function getVCardField(
  lines: string[],
  field: string,
): string | null {
  const prefix = field.toUpperCase();

  for (const line of lines) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex < 0) continue;

    const left = line
      .slice(0, separatorIndex)
      .toUpperCase();

    const key = left.split(";")[0];

    if (key !== prefix) continue;

    const value = decodeVCardValue(
      line.slice(separatorIndex + 1),
    );

    return value || null;
  }

  return null;
}

function getVCardPhone(lines: string[]): string | null {
  const phoneLines = lines.filter((line) =>
    line.toUpperCase().startsWith("TEL"),
  );

  if (phoneLines.length === 0) {
    return null;
  }

  const preferred =
    phoneLines.find((line) =>
      /TYPE=.*(CELL|MOBILE)/i.test(line),
    ) || phoneLines[0];

  const separatorIndex =
    preferred.indexOf(":");

  if (separatorIndex < 0) {
    return null;
  }

  const value = decodeVCardValue(
    preferred.slice(separatorIndex + 1),
  );

  return value || null;
}

function getVCardName(lines: string[]): string | null {
  const fullName =
    getVCardField(lines, "FN");

  if (fullName) {
    return fullName;
  }

  const structuredName =
    getVCardField(lines, "N");

  if (!structuredName) {
    return null;
  }

  const parts =
    structuredName.split(";");

  const lastName =
    parts[0]?.trim() || "";

  const firstName =
    parts[1]?.trim() || "";

  const middleName =
    parts[2]?.trim() || "";

  const name =
    [firstName, middleName, lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

  return name || null;
}

function getVCardCompany(lines: string[]): string | null {
  const organization =
    getVCardField(lines, "ORG");

  if (!organization) {
    return null;
  }

  return (
    organization
      .split(";")
      .filter(Boolean)
      .join(" ")
      .trim() || null
  );
}

function getVCardBirthday(lines: string[]): string | null {
  const birthday =
    getVCardField(lines, "BDAY");

  if (!birthday) {
    return null;
  }

  const normalized =
    birthday.slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? normalized
    : birthday;
}

function parseAppleVCard(
  content: string,
): RelationshipImportRow[] {
  const cards =
    content.match(
      /BEGIN:VCARD[\s\S]*?END:VCARD/gi,
    ) || [];

  return cards.map((card) => {
    const lines =
      unfoldVCardLines(card);

    const name =
      getVCardName(lines);

    const company =
      getVCardCompany(lines);

    const phone =
      getVCardPhone(lines);

    const email =
      getVCardField(lines, "EMAIL");

    const birthday =
      getVCardBirthday(lines);

    const note =
      getVCardField(lines, "NOTE");

    return {
      name,
      nombre: name,
      full_name: name,
      company,
      empresa: company,
      company_name: company,
      phone,
      telefono: phone,
      teléfono: phone,
      email,
      correo: email,
      birthday,
      cumpleaños: birthday,
      notes: note,
      notas: note,
      relationship_type: "Contacto",
      status: "Nuevo",
    };
  });
}

function normalizeOutlookKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

function getOutlookValue(
  row: RelationshipImportRow,
  aliases: string[],
): string | null {
  const normalizedAliases =
    aliases.map(normalizeOutlookKey);

  for (const [key, rawValue] of Object.entries(row)) {
    if (
      !normalizedAliases.includes(
        normalizeOutlookKey(key),
      )
    ) {
      continue;
    }

    const value =
      typeof rawValue === "string"
        ? rawValue.trim()
        : "";

    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeOutlookRows(
  rows: RelationshipImportRow[],
): RelationshipImportRow[] {
  return rows.map((row) => {
    const firstName = getOutlookValue(row, [
      "First Name",
      "Given Name",
      "Nombre",
    ]);

    const middleName = getOutlookValue(row, [
      "Middle Name",
      "Segundo nombre",
    ]);

    const lastName = getOutlookValue(row, [
      "Last Name",
      "Surname",
      "Apellidos",
      "Apellido",
    ]);

    const displayName = getOutlookValue(row, [
      "Display Name",
      "Full Name",
      "Name",
      "Nombre completo",
    ]);

    const combinedName = [
      firstName,
      middleName,
      lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const name =
      displayName ||
      combinedName ||
      null;

    const company = getOutlookValue(row, [
      "Company",
      "Company Name",
      "Organization",
      "Empresa",
    ]);

    const mobilePhone = getOutlookValue(row, [
      "Mobile Phone",
      "Mobile Phone 1",
      "Mobile",
      "Cell Phone",
      "Teléfono móvil",
      "Telefono movil",
    ]);

    const businessPhone = getOutlookValue(row, [
      "Business Phone",
      "Business Phone 1",
      "Primary Phone",
      "Phone",
      "Teléfono profesional",
      "Telefono profesional",
    ]);

    const homePhone = getOutlookValue(row, [
      "Home Phone",
      "Home Phone 1",
      "Teléfono particular",
      "Telefono particular",
    ]);

    const phone =
      mobilePhone ||
      businessPhone ||
      homePhone ||
      null;

    const email = getOutlookValue(row, [
      "E-mail Address",
      "Email Address",
      "Email",
      "E-mail",
      "Primary Email",
      "Correo electrónico",
      "Correo electronico",
    ]);

    const notes = getOutlookValue(row, [
      "Notes",
      "Note",
      "Comentarios",
      "Notas",
    ]);

    const birthday = getOutlookValue(row, [
      "Birthday",
      "Fecha de nacimiento",
      "Cumpleaños",
      "Cumpleanos",
    ]);

    const country = getOutlookValue(row, [
      "Business Country/Region",
      "Home Country/Region",
      "Country/Region",
      "Country",
      "País",
      "Pais",
    ]);

    return {
      name,
      nombre: name,
      full_name: name,
      company,
      empresa: company,
      company_name: company,
      phone,
      telefono: phone,
      teléfono: phone,
      email,
      correo: email,
      notes,
      notas: notes,
      birthday,
      cumpleaños: birthday,
      country,
      relationship_type: "Contacto",
      status: "Nuevo",
    };
  });
}

function getRequestedSource(
  requestedSource: string | null,
): RelationshipOnboardingSource | null {
  if (requestedSource === "apple") {
    return "apple-contacts";
  }

  if (
    requestedSource === "apple-contacts" ||
    requestedSource === "excel" ||
    requestedSource === "csv" ||
    requestedSource === "outlook" ||
    requestedSource === "whatsapp" ||
    requestedSource === "google-contacts"
  ) {
    return requestedSource;
  }

  return null;
}

function getFileAcceptValue(
  selectedSource: RelationshipOnboardingSource | null,
  requestedSource: string | null,
): string {
  const source =
    selectedSource ||
    getRequestedSource(requestedSource);

  if (source === "apple-contacts") {
    return ".vcf,text/vcard,text/x-vcard";
  }

  if (source === "outlook") {
    return ".csv,text/csv";
  }

  if (source === "excel") {
    return ".xlsx,.xls";
  }

  if (source === "csv") {
    return ".csv";
  }

  return getRelationshipFileAcceptValue();
}

function RelationshipOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);
  const hasOpenedSourcePickerRef =
    useRef(false);

  const isSettingsEntry =
    searchParams.get("entry") === "settings";

  const requestedSource =
    searchParams.get("source");

  const [
    checkingOnboarding,
    setCheckingOnboarding,
  ] = useState(true);

  const [step, setStep] =
    useState<RelationshipOnboardingStep>("intro");

  const [
    selectedSource,
    setSelectedSource,
  ] =
    useState<RelationshipOnboardingSource | null>(
      null,
    );

  const [fileName, setFileName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [importResult, setImportResult] =
    useState<RelationshipImportResult | null>(
      null,
    );

  const [reviewReport, setReviewReport] =
    useState<RelationshipReviewReport | null>(
      null,
    );

  const [analysisResult, setAnalysisResult] =
    useState<ImportAnalysisResult | null>(
      null,
    );

  useEffect(() => {
    if (isSettingsEntry) {
      setStep("source");
      setCheckingOnboarding(false);

      const source =
        getRequestedSource(
          requestedSource,
        );

      if (
        !hasOpenedSourcePickerRef.current &&
        (
          source === "apple-contacts" ||
          source === "outlook" ||
          source === "excel" ||
          source === "csv"
        )
      ) {
        hasOpenedSourcePickerRef.current = true;
        setSelectedSource(source);

        window.setTimeout(() => {
          fileInputRef.current?.click();
        }, 0);
      }

      return;
    }

    let cancelled = false;

    async function checkOnboarding() {
      const supabase =
        createBrowserSupabaseClient();

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (
        userError ||
        !user
      ) {
        router.replace("/login");
        return;
      }

      const {
        data: businessSettings,
        error: settingsError,
      } =
        await supabase
          .from("business_settings")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();

      if (cancelled) {
        return;
      }

      if (settingsError) {
  setError(
    `Supabase error: ${settingsError.message} | code: ${settingsError.code}`,
  );
  setCheckingOnboarding(false);
  return;
}

      if (
        businessSettings?.onboarding_completed ===
        true
      ) {
        router.replace("/dashboard");
        return;
      }

      setCheckingOnboarding(false);
    }

    void checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [
    isSettingsEntry,
    requestedSource,
    router,
  ]);

  const selectedOption = useMemo(
    () =>
      SOURCE_OPTIONS.find(
        (option) =>
          option.key === selectedSource,
      ) || null,
    [selectedSource],
  );

  function resetResult() {
    setFileName("");
    setMessage("");
    setError("");
    setImportResult(null);
    setReviewReport(null);
    setAnalysisResult(null);
    setStep("source");
  }

  function chooseSource(
    option: RelationshipImportSourceOption,
  ) {
    setSelectedSource(option.key);
    resetResult();

    if (option.status === "manual") {
      return;
    }

    if (option.status === "available") {
      window.setTimeout(
        () =>
          fileInputRef.current?.click(),
        0,
      );

      return;
    }

    setMessage(
      `${option.title} estará disponible en una próxima actualización. Hoy ya puedes comenzar con Apple Contacts, Outlook, Excel, CSV o una relación manual.`,
    );
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setImportResult(null);
    setReviewReport(null);
    setAnalysisResult(null);
    setStep("source");

    try {
      const currentSource =
        selectedSource ||
        getRequestedSource(
          requestedSource,
        );

      const isAppleFile =
        currentSource ===
          "apple-contacts" ||
        file.name
          .toLowerCase()
          .endsWith(".vcf");

      const isOutlookFile =
        currentSource === "outlook";

      if (
        isOutlookFile &&
        !file.name
          .toLowerCase()
          .endsWith(".csv")
      ) {
        throw new RelationshipFileParserError(
          "unsupported-file",
          "Outlook debe exportarse como archivo CSV.",
        );
      }

      if (
        !isAppleFile &&
        !isSupportedRelationshipFile(
          file.name,
        )
      ) {
        throw new RelationshipFileParserError(
          "unsupported-file",
          "ClienteYA puede leer archivos VCF, CSV, XLSX y XLS.",
        );
      }

      let source: RelationshipSource;
      let rows: RelationshipImportRow[];

      if (isAppleFile) {
        const text =
          await file.text();

        rows =
          parseAppleVCard(text);

        if (rows.length === 0) {
          throw new RelationshipFileParserError(
            "unsupported-file",
            "No encontramos contactos válidos dentro del archivo vCard.",
          );
        }

        source =
          "apple-contacts" as RelationshipSource;

        setSelectedSource(
          "apple-contacts",
        );
      } else {
        const parsedFile =
          await parseRelationshipBrowserFile(
            file,
          );

        const parsedRows =
          parsedFile.rows as RelationshipImportRow[];

        if (isOutlookFile) {
          rows =
            normalizeOutlookRows(
              parsedRows,
            );

          source =
            "outlook" as RelationshipSource;

          setSelectedSource(
            "outlook",
          );
        } else {
          rows =
            parsedRows;

          source =
            file.name
              .toLowerCase()
              .endsWith(".csv")
              ? ("csv" as RelationshipSource)
              : ("excel" as RelationshipSource);

          setSelectedSource(
            file.name
              .toLowerCase()
              .endsWith(".csv")
              ? "csv"
              : "excel",
          );
        }
      }

      const parserSource =
        source ===
          ("apple-contacts" as RelationshipSource) ||
        source ===
          ("outlook" as RelationshipSource)
          ? ("csv" as RelationshipSource)
          : source;

      const baseResult =
        buildRelationshipImportResult({
          source: parserSource,
          rows,
          existingRelationships: [],
        });

      const result = {
        ...baseResult,
        source,
      } as RelationshipImportResult;

      const review =
        buildRelationshipReviewReport(
          result,
        );

      const analysis =
        buildImportAnalysisResult(
          result,
        );

      setFileName(file.name);
      setImportResult(result);
      setReviewReport(review);
      setAnalysisResult(analysis);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos preparar el archivo para ClienteYA.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReviewContinue() {
    if (
      !importResult ||
      !analysisResult
    ) {
      setError(
        "No pudimos preparar el análisis de tus relaciones.",
      );
      return;
    }

    if (
      importResult.status !== "ready"
    ) {
      setError(
        "Revisa las relaciones señaladas antes de continuar con el análisis.",
      );
      return;
    }

    setError("");
    setStep("analysis");
  }

  async function handleConfirmImport(
    decision: ImportAnalysisDecision,
  ) {
    if (
      !importResult ||
      !analysisResult
    ) {
      setError(
        "No encontramos relaciones listas para guardar.",
      );
      return;
    }

    const selectedSourceIndexes =
      new Set(
        analysisResult.relationships
          .filter((relationship) => {
            if (
              relationship.category ===
                "commercial" &&
              !decision.includeCommercial
            ) {
              return false;
            }

            if (
              relationship.category ===
                "private" &&
              !decision.includePrivate
            ) {
              return false;
            }

            if (
              relationship.category ===
                "unknown" &&
              !decision.includeUnknown
            ) {
              return false;
            }

            if (
              relationship.issueTypes.includes(
                "possible-duplicate",
              ) &&
              !decision.includeDuplicates
            ) {
              return false;
            }

            if (
              relationship.issueTypes.includes(
                "missing-name",
              ) &&
              !decision.includeMissingName
            ) {
              return false;
            }

            return true;
          })
          .map(
            (relationship) =>
              relationship.sourceIndex,
          ),
      );

    const selectedRelationships =
      importResult.relationships.filter(
        (relationship) =>
          selectedSourceIndexes.has(
            relationship.sourceIndex,
          ),
      );

    if (
      selectedRelationships.length === 0
    ) {
      setError(
        "Selecciona al menos un grupo de relaciones antes de continuar.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const supabase =
        createBrowserSupabaseClient();

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        throw new Error(
          "Tu sesión no está disponible. Inicia sesión nuevamente para continuar.",
        );
      }

      const {
        data:
          existingRelationshipsData,
        error: existingError,
      } =
        await supabase
          .from("relationships")
          .select(
            "id,name,company,phone,email",
          )
          .eq(
            "owner_id",
            user.id,
          );

      if (existingError) {
        throw existingError;
      }

      const existingRelationships:
        RelationshipDeduplicationRecord[] =
          existingRelationshipsData || [];

      const deduplicationResult =
        deduplicateRelationships(
          selectedRelationships.map(
            (relationship) => ({
              ...relationship,
              name:
                relationship.name,
              company:
                relationship.company,
              phone:
                relationship.phone,
              email:
                relationship.email,
            }),
          ),
          existingRelationships,
          {
            countryCallingCode:
              "595",
            localPhoneLengths: [
              9,
            ],
            matchByNameAndCompany:
              true,
          },
        );

      const importBatchId =
        crypto.randomUUID();

      const rows =
        deduplicationResult.newRelationships.map(
          (relationship) => ({
            owner_id: user.id,
            name:
              relationship.name,
            company:
              relationship.company,
            phone:
              relationship.phone,
            email:
              relationship.email,
            relationship_type:
              relationship.relationshipType,
            status:
              relationship.status,
            birthday:
              relationship.birthday,
            notes:
              relationship.notes,
            last_contact_at:
              relationship.lastContactAt,
            country:
              relationship.country,
            source:
              importResult.source,
            import_batch_id:
              importBatchId,
          }),
        );

      if (rows.length > 0) {
        const {
          error: insertError,
        } =
          await supabase
            .from("relationships")
            .insert(rows);

        if (insertError) {
          throw insertError;
        }
      }

      if (!isSettingsEntry) {
        const {
          error: onboardingError,
        } =
          await supabase
            .from("business_settings")
            .update({
              onboarding_completed:
                true,
            })
            .eq(
              "user_id",
              user.id,
            );

        if (onboardingError) {
          throw onboardingError;
        }
      }

      const dashboardParams =
        new URLSearchParams({
          imported: String(
            rows.length,
          ),
          duplicates: String(
            deduplicationResult.totalDuplicates,
          ),
          batch:
            importBatchId,
        });

      router.push(
        `/dashboard/relationships?${dashboardParams.toString()}`,
      );

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos guardar tus relaciones. Inténtalo nuevamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (checkingOnboarding) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <RelationshipImportLoading />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/70 via-slate-50 to-slate-50 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <input
        ref={fileInputRef}
        type="file"
        accept={getFileAcceptValue(
          selectedSource,
          requestedSource,
        )}
        onChange={
          handleFileChange
        }
        className="hidden"
      />

      <div className="mx-auto max-w-5xl">
        <header>
          {isSettingsEntry && (
            <div className="mb-4">
              <Link
                href="/dashboard/settings/relationships"
                className="inline-flex items-center text-sm font-bold text-blue-700 transition hover:text-blue-800"
              >
                ← Volver a relaciones
              </Link>
            </div>
          )}

          <div className="flex items-center justify-center py-2 lg:-mt-3">
            <div className="flex min-w-0 items-center gap-3">
              <ParaguayBadge />

              <div className="min-w-0">
                <h2 className="truncate text-base font-black tracking-tight text-slate-950">
                  Cliente
                  <span className="text-red-600">
                    YA
                  </span>
                </h2>

                <p className="mt-0.5 truncate text-sm text-slate-500">
                  Hecho para emprendedores.
                </p>
              </div>
            </div>
          </div>
        </header>

        {step === "intro" && (
          <div className="mx-auto mt-8 max-w-2xl sm:mt-10 lg:mt-12">
            <RelationshipWelcome
              onContinue={() =>
                setStep("welcome")
              }
            />
          </div>
        )}

        {step === "welcome" && (
          <div className="mx-auto mt-8 max-w-2xl sm:mt-10 lg:mt-12">
            <RelationshipWhatsAppWelcome
              onContinue={() =>
                setStep("source")
              }
            />
          </div>
        )}

        {step === "source" && (
          <>
            <header>
              <div className="mx-auto mt-10 max-w-xl text-center sm:mt-12 lg:mt-14 lg:max-w-[760px]">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-[44px] lg:leading-[1.08]">
                  Comencemos organizando tus relaciones comerciales.
                </h1>

                <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-600 lg:max-w-2xl lg:text-lg lg:leading-8">
                  Nosotros organizamos tus relaciones para que puedas empezar más rápido.
                </p>
              </div>
            </header>

            <section className="mt-9 sm:mt-11 lg:mt-12">
              <div className="mb-4 text-left lg:mb-6 lg:text-center">
                <h2 className="text-lg font-black text-slate-950 sm:text-xl lg:text-2xl">
                  ¿Dónde viven hoy tus relaciones?
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500 lg:mt-2">
                  Empieza con una fuente. Más adelante podrás añadir otras desde Configuración.
                </p>
              </div>

              <div className="space-y-7 lg:space-y-8">
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Aplicaciones
                  </p>

                  <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                    {SOURCE_OPTIONS.filter(
                      (option) =>
                        [
                          "whatsapp",
                          "apple-contacts",
                          "google-contacts",
                          "outlook",
                        ].includes(
                          option.key,
                        ),
                    ).map(
                      (option) => (
                        <RelationshipImportSourceRow
                          key={
                            option.key
                          }
                          option={
                            option
                          }
                          selected={
                            selectedSource ===
                            option.key
                          }
                          onSelect={() =>
                            chooseSource(
                              option,
                            )
                          }
                        />
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Archivos
                  </p>

                  <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                    {SOURCE_OPTIONS.filter(
                      (option) =>
                        [
                          "excel",
                          "csv",
                        ].includes(
                          option.key,
                        ),
                    ).map(
                      (option) => (
                        <RelationshipImportSourceRow
                          key={
                            option.key
                          }
                          option={
                            option
                          }
                          selected={
                            selectedSource ===
                            option.key
                          }
                          onSelect={() =>
                            chooseSource(
                              option,
                            )
                          }
                        />
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Manual
                  </p>

                  {SOURCE_OPTIONS.filter(
                    (option) =>
                      option.status ===
                      "manual",
                  ).map(
                    (option) => (
                      <Link
                        key={
                          option.key
                        }
                        href="/dashboard/new"
                        className="group flex min-h-16 w-full items-center gap-4 rounded-[24px] border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50 hover:shadow-md sm:px-5"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-700">
                          {
                            option.symbol
                          }
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-black text-slate-950">
                            {
                              option.title
                            }
                          </h2>

                          {option.description && (
                            <p className="mt-1 text-sm leading-5 text-slate-500">
                              {
                                option.description
                              }
                            </p>
                          )}
                        </div>

                        <div
                          className="shrink-0 text-lg font-black text-blue-700"
                          aria-hidden="true"
                        >
                          →
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              </div>
            </section>

            {(loading ||
              message ||
              error ||
              importResult) && (
              <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                {loading && (
                  <RelationshipImportLoading />
                )}

                {!loading &&
                  message && (
                    <RelationshipImportMessage
                      title={
                        selectedOption?.title ??
                        "Importación de relaciones"
                      }
                      message={
                        message
                      }
                    />
                  )}

                {!loading &&
                  error && (
                    <RelationshipImportError
                      title="Necesitamos revisar el archivo"
                      message={
                        error
                      }
                      onRetry={() =>
                        fileInputRef.current?.click()
                      }
                    />
                  )}

                {!loading &&
                  importResult &&
                  reviewReport && (
                    <RelationshipImportReview
                      fileName={
                        fileName
                      }
                      importResult={
                        importResult
                      }
                      reviewReport={
                        reviewReport
                      }
                      saving={
                        saving
                      }
                      onContinue={
                        handleReviewContinue
                      }
                      onChooseAnotherFile={() =>
                        fileInputRef.current?.click()
                      }
                    />
                  )}
              </section>
            )}

            <footer className="mx-auto mt-8 max-w-xl text-center text-[11px] leading-5 text-slate-400 lg:mt-10">
              ClienteYA organiza la información y solo te pide revisar lo que realmente necesita una decisión.
            </footer>
          </>
        )}

        {step === "analysis" &&
          analysisResult && (
            <div className="mx-auto mt-8 max-w-3xl sm:mt-10 lg:mt-12">
              <RelationshipImportAnalysis
                analysis={
                  analysisResult
                }
                onConfirm={
                  handleConfirmImport
                }
                isSubmitting={
                  saving
                }
              />

              {error && (
                <div className="mt-5">
                  <RelationshipImportError
                    title="Necesitamos revisar tu selección"
                    message={
                      error
                    }
                    onRetry={() =>
                      setError("")
                    }
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(
                    "source",
                  );
                }}
                className="mx-auto mt-5 block text-sm font-semibold text-slate-600 transition hover:text-slate-950"
              >
                Volver al resumen
              </button>
            </div>
          )}
      </div>
    </main>
  );
}

export default function RelationshipOnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <RelationshipImportLoading />
        </main>
      }
    >
      <RelationshipOnboardingContent />
    </Suspense>
  );
}