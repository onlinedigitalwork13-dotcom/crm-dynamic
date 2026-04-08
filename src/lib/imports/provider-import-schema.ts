export type RawImportRow = Record<string, unknown>;

export type NormalizedProviderImportRow = {
  name: string;
  code: string;
  country: string;
  city: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  legalName: string;
  defaultCurrency: string;
  supportEmail: string;
  supportPhone: string;
  admissionEmail: string;
  financeEmail: string;
  applicationUrl: string;
  portalUrl: string;
  logoUrl: string;
  address: string;
  notes: string;
  sourceType: "csv" | "website" | "api";
  sourceValue?: string;
  rawRowIndex?: number;
};

function cleanString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value).trim();
  return "";
}

function normalizeUpperCode(value: unknown): string {
  return cleanString(value).toUpperCase();
}

function normalizeWebsite(value: unknown): string {
  const raw = cleanString(value);
  if (!raw) return "";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return `https://${raw}`;
}

function pickFirst(row: RawImportRow, keys: string[]): unknown {
  for (const key of keys) {
    if (key in row && row[key] != null) {
      return row[key];
    }
  }
  return "";
}

export function normalizeProviderImportRow(
  row: RawImportRow,
  options?: {
    sourceType?: "csv" | "website" | "api";
    sourceValue?: string;
    rawRowIndex?: number;
  }
): NormalizedProviderImportRow {
  return {
    name: cleanString(
      pickFirst(row, ["name", "providerName", "provider", "institutionName"])
    ),
    code: normalizeUpperCode(pickFirst(row, ["code", "providerCode"])),
    country: cleanString(pickFirst(row, ["country"])),
    city: cleanString(pickFirst(row, ["city"])),
    email: cleanString(pickFirst(row, ["email", "providerEmail"])),
    phone: cleanString(pickFirst(row, ["phone", "providerPhone"])),
    website: normalizeWebsite(pickFirst(row, ["website", "url", "providerWebsite"])),
    description: cleanString(pickFirst(row, ["description"])),
    legalName: cleanString(pickFirst(row, ["legalName"])),
    defaultCurrency: cleanString(pickFirst(row, ["defaultCurrency", "currency"])).toUpperCase(),
    supportEmail: cleanString(pickFirst(row, ["supportEmail"])),
    supportPhone: cleanString(pickFirst(row, ["supportPhone"])),
    admissionEmail: cleanString(pickFirst(row, ["admissionEmail"])),
    financeEmail: cleanString(pickFirst(row, ["financeEmail"])),
    applicationUrl: normalizeWebsite(pickFirst(row, ["applicationUrl"])),
    portalUrl: normalizeWebsite(pickFirst(row, ["portalUrl"])),
    logoUrl: normalizeWebsite(pickFirst(row, ["logoUrl"])),
    address: cleanString(pickFirst(row, ["address"])),
    notes: cleanString(pickFirst(row, ["notes"])),
    sourceType: options?.sourceType ?? "csv",
    sourceValue: options?.sourceValue,
    rawRowIndex: options?.rawRowIndex,
  };
}

export function normalizeProviderNameForMatch(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function validateNormalizedProviderRow(
  row: NormalizedProviderImportRow
): string[] {
  const errors: string[] = [];

  if (!row.name) {
    errors.push("Provider name is required.");
  }

  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push("Provider email is invalid.");
  }

  if (row.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.supportEmail)) {
    errors.push("Support email is invalid.");
  }

  if (row.admissionEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.admissionEmail)) {
    errors.push("Admission email is invalid.");
  }

  if (row.financeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.financeEmail)) {
    errors.push("Finance email is invalid.");
  }

  if (row.website) {
    try {
      new URL(row.website);
    } catch {
      errors.push("Website URL is invalid.");
    }
  }

  if (row.applicationUrl) {
    try {
      new URL(row.applicationUrl);
    } catch {
      errors.push("Application URL is invalid.");
    }
  }

  if (row.portalUrl) {
    try {
      new URL(row.portalUrl);
    } catch {
      errors.push("Portal URL is invalid.");
    }
  }

  if (row.logoUrl) {
    try {
      new URL(row.logoUrl);
    } catch {
      errors.push("Logo URL is invalid.");
    }
  }

  return errors;
}