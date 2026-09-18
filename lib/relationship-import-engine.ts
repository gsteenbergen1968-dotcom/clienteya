import type {
  RelationshipFirstInsight,
  RelationshipImportStatus,
  RelationshipImportSummary,
  RelationshipOnboardingReport,
  RelationshipSource,
} from "./relationship-onboarding-engine";

export type RelationshipImportField =
  | "name"
  | "firstName"
  | "lastName"
  | "company"
  | "phone"
  | "email"
  | "relationshipType"
  | "status"
  | "birthday"
  | "notes"
  | "lastContactAt"
  | "country";

export type RelationshipImportValue = string | number | boolean | null;

export type RelationshipImportRawRow = Record<
  string,
  RelationshipImportValue
>;

export type RelationshipImportColumnMatch = {
  sourceColumn: string;
  targetField: RelationshipImportField | null;
  confidence: number;
  requiresReview: boolean;
};

export type RelationshipImportCandidate = {
  sourceIndex: number;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  relationshipType: string | null;
  status: string | null;
  birthday: string | null;
  notes: string | null;
  lastContactAt: string | null;
  country: string | null;
};

export type RelationshipImportIssueType =
  | "missing-name"
  | "invalid-phone"
  | "invalid-email"
  | "possible-duplicate"
  | "empty-row";

export type RelationshipImportIssue = {
  sourceIndex: number;
  type: RelationshipImportIssueType;
  message: string;
};

export type RelationshipImportResult = {
  status: RelationshipImportStatus;
  source: RelationshipSource;
  columnMatches: RelationshipImportColumnMatch[];
  relationships: RelationshipImportCandidate[];
  issues: RelationshipImportIssue[];
  summary: RelationshipImportSummary;
  firstInsight: RelationshipFirstInsight;
};

export type RelationshipImportInput = {
  source: RelationshipSource;
  rows: RelationshipImportRawRow[];
  existingRelationships?: Array<{
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  }>;
};

const FIELD_ALIASES: Record<RelationshipImportField, string[]> = {
  name: [
    "name",
    "full name",
    "fullname",
    "nombre completo",
    "contact",
    "contacto",
  ],
  firstName: [
    "first name",
    "firstname",
    "nombre",
    "nombres",
  ],
  lastName: [
    "last name",
    "lastname",
    "apellido",
    "apellidos",
  ],
  company: [
    "company",
    "empresa",
    "business",
    "negocio",
    "organization",
    "organización",
  ],
  phone: [
    "phone",
    "telefono",
    "teléfono",
    "mobile",
    "movil",
    "móvil",
    "whatsapp",
    "celular",
  ],
  email: [
    "email",
    "e-mail",
    "correo",
    "correo electronico",
    "correo electrónico",
  ],
  relationshipType: [
    "relationship type",
    "tipo de relacion",
    "tipo de relación",
    "type",
    "tipo",
  ],
  status: [
    "status",
    "estado",
    "stage",
    "etapa",
  ],
  birthday: [
    "birthday",
    "birth date",
    "date of birth",
    "cumpleaños",
    "fecha de nacimiento",
  ],
  notes: [
    "notes",
    "note",
    "notas",
    "nota",
    "comments",
    "comentarios",
  ],
  lastContactAt: [
    "last contact",
    "last contacted",
    "ultimo contacto",
    "último contacto",
    "fecha ultimo contacto",
    "fecha último contacto",
  ],
  country: [
    "country",
    "pais",
    "país",
  ],
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeOptionalText(value: RelationshipImportValue) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizePhone(value: RelationshipImportValue) {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");

  if (!digits) return null;

  return hasPlus ? `+${digits}` : digits;
}

function normalizeEmail(value: RelationshipImportValue) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || null;
}

function normalizeDate(value: RelationshipImportValue) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(
      excelEpoch.getTime() + value * 24 * 60 * 60 * 1000
    );

    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString().slice(0, 10);
  }

  const text = String(value).trim();

  if (!text) return null;

  const directDate = new Date(text);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate.toISOString().slice(0, 10);
  }

  const parts = text.split(/[./-]/).map((part) => part.trim());

  if (parts.length === 3) {
    const [first, second, third] = parts;

    if (
      first.length <= 2 &&
      second.length <= 2 &&
      third.length === 4
    ) {
      const day = first.padStart(2, "0");
      const month = second.padStart(2, "0");

      return `${third}-${month}-${day}`;
    }
  }

  return null;
}

function isValidEmail(email: string | null) {
  if (!email) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string | null) {
  if (!phone) return true;

  return phone.replace(/\D/g, "").length >= 7;
}

function getColumnMatch(column: string): RelationshipImportColumnMatch {
  const normalizedColumn = normalizeText(column);

  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as Array<
    [RelationshipImportField, string[]]
  >) {
    const normalizedAliases = aliases.map(normalizeText);

    if (normalizedAliases.includes(normalizedColumn)) {
      return {
        sourceColumn: column,
        targetField: field,
        confidence: 1,
        requiresReview: false,
      };
    }

    const partialMatch = normalizedAliases.some(
      (alias) =>
        normalizedColumn.includes(alias) ||
        alias.includes(normalizedColumn)
    );

    if (partialMatch) {
      return {
        sourceColumn: column,
        targetField: field,
        confidence: 0.7,
        requiresReview: true,
      };
    }
  }

  return {
    sourceColumn: column,
    targetField: null,
    confidence: 0,
    requiresReview: true,
  };
}

function buildColumnMatches(
  rows: RelationshipImportRawRow[]
): RelationshipImportColumnMatch[] {
  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );

  return columns.map(getColumnMatch);
}

function getMappedValue(
  row: RelationshipImportRawRow,
  matches: RelationshipImportColumnMatch[],
  field: RelationshipImportField
) {
  const match = matches.find(
    (columnMatch) => columnMatch.targetField === field
  );

  return match ? row[match.sourceColumn] : null;
}

function isEmptyRow(row: RelationshipImportRawRow) {
  return Object.values(row).every(
    (value) => String(value ?? "").trim().length === 0
  );
}

function buildCandidate(
  row: RelationshipImportRawRow,
  sourceIndex: number,
  matches: RelationshipImportColumnMatch[]
): RelationshipImportCandidate {
  const fullName = normalizeOptionalText(
    getMappedValue(row, matches, "name")
  );

  const firstName = normalizeOptionalText(
    getMappedValue(row, matches, "firstName")
  );

  const lastName = normalizeOptionalText(
    getMappedValue(row, matches, "lastName")
  );

  const composedName = [firstName, lastName]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .trim();

  return {
    sourceIndex,
    name: fullName || composedName,
    company: normalizeOptionalText(
      getMappedValue(row, matches, "company")
    ),
    phone: normalizePhone(getMappedValue(row, matches, "phone")),
    email: normalizeEmail(getMappedValue(row, matches, "email")),
    relationshipType: normalizeOptionalText(
      getMappedValue(row, matches, "relationshipType")
    ),
    status: normalizeOptionalText(
      getMappedValue(row, matches, "status")
    ),
    birthday: normalizeDate(
      getMappedValue(row, matches, "birthday")
    ),
    notes: normalizeOptionalText(
      getMappedValue(row, matches, "notes")
    ),
    lastContactAt: normalizeDate(
      getMappedValue(row, matches, "lastContactAt")
    ),
    country: normalizeOptionalText(
      getMappedValue(row, matches, "country")
    ),
  };
}

function buildDuplicateKey(
  relationship: Pick<
    RelationshipImportCandidate,
    "name" | "phone" | "email"
  >
) {
  const phone = normalizePhone(relationship.phone);
  const email = normalizeEmail(relationship.email);
  const name = normalizeText(relationship.name);

  if (phone) return `phone:${phone}`;
  if (email) return `email:${email}`;
  if (name) return `name:${name}`;

  return "";
}

function buildIssues(
  rows: RelationshipImportRawRow[],
  relationships: RelationshipImportCandidate[],
  existingRelationships: RelationshipImportInput["existingRelationships"]
): RelationshipImportIssue[] {
  const issues: RelationshipImportIssue[] = [];
  const seenKeys = new Set<string>();

  const existingKeys = new Set(
    (existingRelationships || [])
      .map((relationship) =>
        buildDuplicateKey({
          name: relationship.name || "",
          phone: relationship.phone || null,
          email: relationship.email || null,
        })
      )
      .filter(Boolean)
  );

  rows.forEach((row, index) => {
    if (isEmptyRow(row)) {
      issues.push({
        sourceIndex: index,
        type: "empty-row",
        message: "La fila está vacía y no será importada.",
      });
    }
  });

  relationships.forEach((relationship) => {
    if (!relationship.name) {
      issues.push({
        sourceIndex: relationship.sourceIndex,
        type: "missing-name",
        message: "Falta el nombre de la relación.",
      });
    }

    if (!isValidPhone(relationship.phone)) {
      issues.push({
        sourceIndex: relationship.sourceIndex,
        type: "invalid-phone",
        message: "El número de teléfono necesita revisión.",
      });
    }

    if (!isValidEmail(relationship.email)) {
      issues.push({
        sourceIndex: relationship.sourceIndex,
        type: "invalid-email",
        message: "El correo electrónico necesita revisión.",
      });
    }

    const duplicateKey = buildDuplicateKey(relationship);

    if (
      duplicateKey &&
      (seenKeys.has(duplicateKey) || existingKeys.has(duplicateKey))
    ) {
      issues.push({
        sourceIndex: relationship.sourceIndex,
        type: "possible-duplicate",
        message: "Esta relación podría estar duplicada.",
      });
    }

    if (duplicateKey) {
      seenKeys.add(duplicateKey);
    }
  });

  return issues;
}

function buildSummary(
  source: RelationshipSource,
  relationships: RelationshipImportCandidate[],
  issues: RelationshipImportIssue[],
  ignoredRelationships: number
): RelationshipImportSummary {
  const rowsWithReviewIssues = new Set(
    issues
      .filter((issue) => issue.type !== "empty-row")
      .map((issue) => issue.sourceIndex)
  );

  const duplicateRelationships = new Set(
    issues
      .filter((issue) => issue.type === "possible-duplicate")
      .map((issue) => issue.sourceIndex)
  ).size;

  const reviewRelationships = rowsWithReviewIssues.size;
  const readyRelationships = Math.max(
    0,
    relationships.length - reviewRelationships
  );

  return {
    source,
    detectedRelationships: relationships.length,
    readyRelationships,
    duplicateRelationships,
    reviewRelationships,
    ignoredRelationships,
  };
}

function buildFirstInsight(
  summary: RelationshipImportSummary
): RelationshipFirstInsight {
  if (summary.detectedRelationships === 0) {
    return {
      conclusion:
        "No encontramos relaciones listas para comenzar.",
      evidence: [
        "No se detectaron filas con información suficiente.",
        "Puedes revisar el archivo o elegir otra fuente.",
      ],
      action:
        "Revisa la fuente seleccionada antes de continuar.",
    };
  }

  if (summary.reviewRelationships > 0) {
    return {
      conclusion:
        "Tus relaciones están casi listas para comenzar en ClienteYA.",
      evidence: [
        `${summary.detectedRelationships} relaciones encontradas.`,
        `${summary.readyRelationships} relaciones listas.`,
        `${summary.reviewRelationships} relaciones necesitan revisión.`,
        `${summary.duplicateRelationships} posibles duplicados detectados.`,
      ],
      action:
        "Revisa únicamente las relaciones señaladas y continúa.",
    };
  }

  return {
    conclusion:
      "Tus relaciones están listas para comenzar en ClienteYA.",
    evidence: [
      `${summary.detectedRelationships} relaciones encontradas.`,
      `${summary.readyRelationships} relaciones listas.`,
      "No encontramos incidencias que requieran revisión.",
    ],
    action:
      "Confirma la importación y deja que ClienteYA haga el primer trabajo por ti.",
  };
}

function getImportStatus(
  summary: RelationshipImportSummary
): RelationshipImportStatus {
  if (summary.detectedRelationships === 0) return "review";
  if (summary.reviewRelationships > 0) return "review";

  return "ready";
}

export function buildRelationshipImportResult(
  input: RelationshipImportInput
): RelationshipImportResult {
  const columnMatches = buildColumnMatches(input.rows);

  const validRows = input.rows
    .map((row, sourceIndex) => ({
      row,
      sourceIndex,
    }))
    .filter(({ row }) => !isEmptyRow(row));

  const detectedRelationships = validRows.map(({ row, sourceIndex }) =>
    buildCandidate(row, sourceIndex, columnMatches)
  );

  const detectedIssues = buildIssues(
    input.rows,
    detectedRelationships,
    input.existingRelationships
  );

  const duplicateSourceIndexes = new Set(
    detectedIssues
      .filter((issue) => issue.type === "possible-duplicate")
      .map((issue) => issue.sourceIndex)
  );

  const relationships = detectedRelationships.filter(
    (relationship) =>
      !duplicateSourceIndexes.has(relationship.sourceIndex)
  );

  const issues = detectedIssues.filter(
    (issue) => issue.type !== "possible-duplicate"
  );

  const ignoredRelationships = input.rows.length - validRows.length;

  const summary = buildSummary(
    input.source,
    relationships,
    issues,
    ignoredRelationships
  );

  summary.duplicateRelationships = duplicateSourceIndexes.size;

  return {
    status: getImportStatus(summary),
    source: input.source,
    columnMatches,
    relationships,
    issues,
    summary,
    firstInsight: buildFirstInsight(summary),
  };
}

export function buildRelationshipImportOnboardingReport(
  input: RelationshipImportInput,
  baseReport: RelationshipOnboardingReport
): RelationshipOnboardingReport {
  const result = buildRelationshipImportResult(input);

  return {
    ...baseReport,
    status: result.status,
    summary: result.summary,
    firstInsight: result.firstInsight,
  };
}