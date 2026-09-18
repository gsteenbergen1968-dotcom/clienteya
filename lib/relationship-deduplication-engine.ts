export type RelationshipDeduplicationMatchType =
  | "phone"
  | "email"
  | "name-company";

export type RelationshipDeduplicationRecord = {
  id?: string | null;
  sourceIndex?: number | null;
  name?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type RelationshipDeduplicationConfig = {
  /**
   * Country calling code without "+".
   * ClienteYA launches in Paraguay, so the default is 595.
   */
  countryCallingCode?: string;

  /**
   * Local phone lengths without trunk prefix.
   * Paraguay mobile and fixed-line normalization can use 9 digits.
   */
  localPhoneLengths?: number[];

  /**
   * Enables the conservative fallback match:
   * normalized full name + normalized company.
   */
  matchByNameAndCompany?: boolean;
};

export type RelationshipDuplicateMatch<
  TIncoming extends RelationshipDeduplicationRecord,
  TExisting extends RelationshipDeduplicationRecord,
> = {
  relationship: TIncoming;
  matchType: RelationshipDeduplicationMatchType;
  matchedExistingRelationship?: TExisting;
  matchedIncomingRelationship?: TIncoming;
};

export type RelationshipDeduplicationResult<
  TIncoming extends RelationshipDeduplicationRecord,
  TExisting extends RelationshipDeduplicationRecord,
> = {
  newRelationships: TIncoming[];
  duplicates: Array<
    RelationshipDuplicateMatch<TIncoming, TExisting>
  >;
  totalIncoming: number;
  totalNew: number;
  totalDuplicates: number;
  existingDuplicateCount: number;
  importDuplicateCount: number;
};

type RelationshipMatchKeys = {
  phone: string | null;
  email: string | null;
  nameCompany: string | null;
};

const DEFAULT_CONFIG: Required<RelationshipDeduplicationConfig> = {
  countryCallingCode: "595",
  localPhoneLengths: [9],
  matchByNameAndCompany: true,
};

function getConfig(
  config?: RelationshipDeduplicationConfig
): Required<RelationshipDeduplicationConfig> {
  return {
    countryCallingCode:
      normalizeCallingCode(config?.countryCallingCode) ||
      DEFAULT_CONFIG.countryCallingCode,
    localPhoneLengths:
      config?.localPhoneLengths?.filter(
        (length) => Number.isInteger(length) && length > 0
      ) || DEFAULT_CONFIG.localPhoneLengths,
    matchByNameAndCompany:
      config?.matchByNameAndCompany ??
      DEFAULT_CONFIG.matchByNameAndCompany,
  };
}

function normalizeCallingCode(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

/**
 * Produces a stable, language-neutral comparison value.
 *
 * Examples:
 * "García & Hijos S.A." -> "garcia hijos sa"
 * "  María López  "     -> "maria lopez"
 */
export function normalizeRelationshipText(
  value?: string | null
): string | null {
  const normalized = (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("und")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || null;
}

/**
 * Normalizes email addresses for exact comparison.
 */
export function normalizeRelationshipEmail(
  value?: string | null
): string | null {
  const normalized = (value || "").trim().toLocaleLowerCase("und");

  if (!normalized || !normalized.includes("@")) {
    return null;
  }

  return normalized;
}

/**
 * Normalizes international and local phone formats.
 *
 * With the default Paraguay configuration:
 * 0981 234 567   -> 595981234567
 * +595 981234567 -> 595981234567
 * 00595...       -> 595...
 *
 * The function remains reusable for future countries through config.
 */
export function normalizeRelationshipPhone(
  value?: string | null,
  config?: RelationshipDeduplicationConfig
): string | null {
  const resolvedConfig = getConfig(config);
  let digits = (value || "").replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith(resolvedConfig.countryCallingCode)) {
    return digits;
  }

  if (digits.startsWith("0")) {
    const localNumber = digits.replace(/^0+/, "");

    if (localNumber) {
      return `${resolvedConfig.countryCallingCode}${localNumber}`;
    }
  }

  if (resolvedConfig.localPhoneLengths.includes(digits.length)) {
    return `${resolvedConfig.countryCallingCode}${digits}`;
  }

  return digits;
}

/**
 * Conservative fallback key.
 *
 * A name by itself is never sufficient because different people can share
 * the same name. ClienteYA only uses this fallback when both full name and
 * company are available.
 */
export function buildRelationshipNameCompanyKey(
  name?: string | null,
  company?: string | null
): string | null {
  const normalizedName = normalizeRelationshipText(name);
  const normalizedCompany = normalizeRelationshipText(company);

  if (!normalizedName || !normalizedCompany) {
    return null;
  }

  return `${normalizedName}::${normalizedCompany}`;
}

export function buildRelationshipMatchKeys(
  relationship: RelationshipDeduplicationRecord,
  config?: RelationshipDeduplicationConfig
): RelationshipMatchKeys {
  const resolvedConfig = getConfig(config);

  return {
    phone: normalizeRelationshipPhone(
      relationship.phone,
      resolvedConfig
    ),
    email: normalizeRelationshipEmail(relationship.email),
    nameCompany: resolvedConfig.matchByNameAndCompany
      ? buildRelationshipNameCompanyKey(
          relationship.name,
          relationship.company
        )
      : null,
  };
}

function createExistingLookup<
  TExisting extends RelationshipDeduplicationRecord,
>(
  existingRelationships: TExisting[],
  config?: RelationshipDeduplicationConfig
) {
  const byPhone = new Map<string, TExisting>();
  const byEmail = new Map<string, TExisting>();
  const byNameCompany = new Map<string, TExisting>();

  for (const relationship of existingRelationships) {
    const keys = buildRelationshipMatchKeys(relationship, config);

    if (keys.phone && !byPhone.has(keys.phone)) {
      byPhone.set(keys.phone, relationship);
    }

    if (keys.email && !byEmail.has(keys.email)) {
      byEmail.set(keys.email, relationship);
    }

    if (
      keys.nameCompany &&
      !byNameCompany.has(keys.nameCompany)
    ) {
      byNameCompany.set(keys.nameCompany, relationship);
    }
  }

  return {
    byPhone,
    byEmail,
    byNameCompany,
  };
}

/**
 * Finds duplicates against:
 * 1. relationships already stored in ClienteYA;
 * 2. earlier rows in the same import batch.
 *
 * Matching priority:
 * phone -> email -> full name + company.
 *
 * The original incoming objects are returned unchanged, allowing every
 * importer to preserve its own additional fields.
 */
export function deduplicateRelationships<
  TIncoming extends RelationshipDeduplicationRecord,
  TExisting extends RelationshipDeduplicationRecord,
>(
  incomingRelationships: TIncoming[],
  existingRelationships: TExisting[],
  config?: RelationshipDeduplicationConfig
): RelationshipDeduplicationResult<TIncoming, TExisting> {
  const existingLookup = createExistingLookup(
    existingRelationships,
    config
  );

  const acceptedByPhone = new Map<string, TIncoming>();
  const acceptedByEmail = new Map<string, TIncoming>();
  const acceptedByNameCompany = new Map<string, TIncoming>();

  const newRelationships: TIncoming[] = [];
  const duplicates: Array<
    RelationshipDuplicateMatch<TIncoming, TExisting>
  > = [];

  let existingDuplicateCount = 0;
  let importDuplicateCount = 0;

  for (const relationship of incomingRelationships) {
    const keys = buildRelationshipMatchKeys(relationship, config);

    const existingPhoneMatch = keys.phone
      ? existingLookup.byPhone.get(keys.phone)
      : undefined;

    if (existingPhoneMatch) {
      duplicates.push({
        relationship,
        matchType: "phone",
        matchedExistingRelationship: existingPhoneMatch,
      });
      existingDuplicateCount += 1;
      continue;
    }

    const existingEmailMatch = keys.email
      ? existingLookup.byEmail.get(keys.email)
      : undefined;

    if (existingEmailMatch) {
      duplicates.push({
        relationship,
        matchType: "email",
        matchedExistingRelationship: existingEmailMatch,
      });
      existingDuplicateCount += 1;
      continue;
    }

    const existingNameCompanyMatch = keys.nameCompany
      ? existingLookup.byNameCompany.get(keys.nameCompany)
      : undefined;

    if (existingNameCompanyMatch) {
      duplicates.push({
        relationship,
        matchType: "name-company",
        matchedExistingRelationship: existingNameCompanyMatch,
      });
      existingDuplicateCount += 1;
      continue;
    }

    const incomingPhoneMatch = keys.phone
      ? acceptedByPhone.get(keys.phone)
      : undefined;

    if (incomingPhoneMatch) {
      duplicates.push({
        relationship,
        matchType: "phone",
        matchedIncomingRelationship: incomingPhoneMatch,
      });
      importDuplicateCount += 1;
      continue;
    }

    const incomingEmailMatch = keys.email
      ? acceptedByEmail.get(keys.email)
      : undefined;

    if (incomingEmailMatch) {
      duplicates.push({
        relationship,
        matchType: "email",
        matchedIncomingRelationship: incomingEmailMatch,
      });
      importDuplicateCount += 1;
      continue;
    }

    const incomingNameCompanyMatch = keys.nameCompany
      ? acceptedByNameCompany.get(keys.nameCompany)
      : undefined;

    if (incomingNameCompanyMatch) {
      duplicates.push({
        relationship,
        matchType: "name-company",
        matchedIncomingRelationship: incomingNameCompanyMatch,
      });
      importDuplicateCount += 1;
      continue;
    }

    newRelationships.push(relationship);

    if (keys.phone) {
      acceptedByPhone.set(keys.phone, relationship);
    }

    if (keys.email) {
      acceptedByEmail.set(keys.email, relationship);
    }

    if (keys.nameCompany) {
      acceptedByNameCompany.set(keys.nameCompany, relationship);
    }
  }

  return {
    newRelationships,
    duplicates,
    totalIncoming: incomingRelationships.length,
    totalNew: newRelationships.length,
    totalDuplicates: duplicates.length,
    existingDuplicateCount,
    importDuplicateCount,
  };
}