import * as XLSX from "xlsx";

import type {
  RelationshipImportRawRow,
  RelationshipImportValue,
} from "./relationship-import-engine";

export type RelationshipFileType = "csv" | "xlsx" | "xls";

export type RelationshipFileParserInput = {
  fileName: string;
  buffer: ArrayBuffer;
};

export type RelationshipFileParserResult = {
  fileName: string;
  fileType: RelationshipFileType;
  sheetName: string | null;
  columns: string[];
  rows: RelationshipImportRawRow[];
  ignoredRows: number;
};

export type RelationshipFileParserErrorCode =
  | "unsupported-file"
  | "empty-file"
  | "missing-header"
  | "no-data"
  | "invalid-file";

export class RelationshipFileParserError extends Error {
  code: RelationshipFileParserErrorCode;

  constructor(
    code: RelationshipFileParserErrorCode,
    message: string
  ) {
    super(message);

    this.name = "RelationshipFileParserError";
    this.code = code;
  }
}

function getFileExtension(fileName: string) {
  const normalizedFileName = fileName.trim().toLowerCase();
  const lastDotIndex = normalizedFileName.lastIndexOf(".");

  if (lastDotIndex === -1) return "";

  return normalizedFileName.slice(lastDotIndex + 1);
}

function getFileType(fileName: string): RelationshipFileType {
  const extension = getFileExtension(fileName);

  if (extension === "csv") return "csv";
  if (extension === "xlsx") return "xlsx";
  if (extension === "xls") return "xls";

  throw new RelationshipFileParserError(
    "unsupported-file",
    "ClienteYA puede leer archivos CSV, XLSX y XLS."
  );
}

function normalizeCellValue(
  value: unknown
): RelationshipImportValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const normalized = String(value).trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeHeader(value: unknown, index: number) {
  const normalized = String(value ?? "").trim();

  return normalized || `Columna ${index + 1}`;
}

function makeUniqueHeaders(headers: string[]) {
  const occurrences = new Map<string, number>();

  return headers.map((header) => {
    const normalizedKey = header.trim().toLowerCase();
    const currentCount = occurrences.get(normalizedKey) || 0;

    occurrences.set(normalizedKey, currentCount + 1);

    if (currentCount === 0) {
      return header;
    }

    return `${header} ${currentCount + 1}`;
  });
}

function isEmptyRow(row: RelationshipImportRawRow) {
  return Object.values(row).every((value) => {
    if (value === null || value === undefined) return true;

    return String(value).trim().length === 0;
  });
}

function rowsFromMatrix(
  matrix: unknown[][]
): {
  columns: string[];
  rows: RelationshipImportRawRow[];
  ignoredRows: number;
} {
  if (matrix.length === 0) {
    throw new RelationshipFileParserError(
      "empty-file",
      "El archivo está vacío."
    );
  }

  const headerRow = matrix[0] || [];

  if (headerRow.length === 0) {
    throw new RelationshipFileParserError(
      "missing-header",
      "No encontramos una fila con nombres de columnas."
    );
  }

  const columns = makeUniqueHeaders(
    headerRow.map((value, index) =>
      normalizeHeader(value, index)
    )
  );

  if (columns.length === 0) {
    throw new RelationshipFileParserError(
      "missing-header",
      "No encontramos columnas que podamos organizar."
    );
  }

  const rows: RelationshipImportRawRow[] = [];
  let ignoredRows = 0;

  for (const sourceRow of matrix.slice(1)) {
    const row: RelationshipImportRawRow = {};

    columns.forEach((column, index) => {
      row[column] = normalizeCellValue(sourceRow[index]);
    });

    if (isEmptyRow(row)) {
      ignoredRows += 1;
      continue;
    }

    rows.push(row);
  }

  if (rows.length === 0) {
    throw new RelationshipFileParserError(
      "no-data",
      "No encontramos relaciones con información para revisar."
    );
  }

  return {
    columns,
    rows,
    ignoredRows,
  };
}

function decodeBuffer(buffer: ArrayBuffer) {
  try {
    return new TextDecoder("utf-8", {
      fatal: false,
    }).decode(buffer);
  } catch {
    throw new RelationshipFileParserError(
      "invalid-file",
      "No pudimos leer el contenido del archivo."
    );
  }
}

function detectCsvSeparator(content: string) {
  const firstRelevantLine =
    content
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0) || "";

  const separators = [",", ";", "\t", "|"];

  const result = separators
    .map((separator) => ({
      separator,
      count: firstRelevantLine.split(separator).length - 1,
    }))
    .sort((first, second) => second.count - first.count)[0];

  return result?.count > 0 ? result.separator : ",";
}

function parseCsvLine(
  line: string,
  separator: string
): string[] {
  const values: string[] = [];

  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === separator && !insideQuotes) {
      values.push(currentValue);
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue);

  return values;
}

function parseCsvContent(content: string) {
  const normalizedContent = content
    .replace(/^\uFEFF/, "")
    .trim();

  if (!normalizedContent) {
    throw new RelationshipFileParserError(
      "empty-file",
      "El archivo está vacío."
    );
  }

  const separator = detectCsvSeparator(normalizedContent);
  const matrix: string[][] = [];

  let currentLine = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < normalizedContent.length;
    index += 1
  ) {
    const character = normalizedContent[index];
    const nextCharacter = normalizedContent[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentLine += '""';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      currentLine += character;
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !insideQuotes
    ) {
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        index += 1;
      }

      if (currentLine.trim().length > 0) {
        matrix.push(parseCsvLine(currentLine, separator));
      }

      currentLine = "";
      continue;
    }

    currentLine += character;
  }

  if (currentLine.trim().length > 0) {
    matrix.push(parseCsvLine(currentLine, separator));
  }

  return rowsFromMatrix(matrix);
}

function parseWorkbook(
  buffer: ArrayBuffer
): {
  sheetName: string;
  columns: string[];
  rows: RelationshipImportRawRow[];
  ignoredRows: number;
} {
  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: true,
      raw: false,
    });
  } catch {
    throw new RelationshipFileParserError(
      "invalid-file",
      "No pudimos abrir el archivo de Excel."
    );
  }

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new RelationshipFileParserError(
      "empty-file",
      "El archivo de Excel no contiene hojas."
    );
  }

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new RelationshipFileParserError(
      "invalid-file",
      "No pudimos leer la primera hoja del archivo."
    );
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    blankrows: true,
    raw: false,
  });

  return {
    sheetName,
    ...rowsFromMatrix(matrix),
  };
}

export function parseRelationshipFile(
  input: RelationshipFileParserInput
): RelationshipFileParserResult {
  const fileType = getFileType(input.fileName);

  if (input.buffer.byteLength === 0) {
    throw new RelationshipFileParserError(
      "empty-file",
      "El archivo está vacío."
    );
  }

  if (fileType === "csv") {
    const result = parseCsvContent(
      decodeBuffer(input.buffer)
    );

    return {
      fileName: input.fileName,
      fileType,
      sheetName: null,
      columns: result.columns,
      rows: result.rows,
      ignoredRows: result.ignoredRows,
    };
  }

  const result = parseWorkbook(input.buffer);

  return {
    fileName: input.fileName,
    fileType,
    sheetName: result.sheetName,
    columns: result.columns,
    rows: result.rows,
    ignoredRows: result.ignoredRows,
  };
}

export async function parseRelationshipBrowserFile(
  file: File
): Promise<RelationshipFileParserResult> {
  try {
    const buffer = await file.arrayBuffer();

    return parseRelationshipFile({
      fileName: file.name,
      buffer,
    });
  } catch (error) {
    if (error instanceof RelationshipFileParserError) {
      throw error;
    }

    throw new RelationshipFileParserError(
      "invalid-file",
      "No pudimos preparar el archivo para ClienteYA."
    );
  }
}

export function isSupportedRelationshipFile(
  fileName: string
) {
  const extension = getFileExtension(fileName);

  return ["csv", "xlsx", "xls"].includes(extension);
}

export function getRelationshipFileAcceptValue() {
  return [
    ".csv",
    ".xlsx",
    ".xls",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ].join(",");
}