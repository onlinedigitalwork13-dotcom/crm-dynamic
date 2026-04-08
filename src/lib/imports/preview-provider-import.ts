import { prisma } from "@/lib/prisma";
import {
  normalizeProviderImportRow,
  normalizeProviderNameForMatch,
  validateNormalizedProviderRow,
  type RawImportRow,
} from "@/lib/imports/provider-import-schema";

export type ProviderPreviewRow = {
  rowId: string;
  rawRowIndex?: number;
  data: ReturnType<typeof normalizeProviderImportRow>;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  matchedProviderId?: string;
  matchedProviderName?: string;
  willImport: boolean;
};

export type ProviderPreviewResult = {
  sourceType: "csv" | "website" | "api";
  sourceValue?: string;
  rows: ProviderPreviewRow[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    importableRows: number;
  };
};

export async function previewProviderImport(input: {
  sourceType: "csv" | "website" | "api";
  sourceValue?: string;
  rows: RawImportRow[];
}): Promise<ProviderPreviewResult> {
  const existingProviders = await prisma.provider.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      website: true,
    },
  });

  const existingByName = new Map(
    existingProviders.map((provider) => [
      normalizeProviderNameForMatch(provider.name),
      provider,
    ])
  );

  const existingByCode = new Map(
    existingProviders
      .filter((provider) => provider.code)
      .map((provider) => [String(provider.code).trim().toUpperCase(), provider])
  );

  const localSeenNames = new Set<string>();
  const localSeenCodes = new Set<string>();

  const previewRows: ProviderPreviewRow[] = input.rows.map((rawRow, index) => {
    const normalized = normalizeProviderImportRow(rawRow, {
      sourceType: input.sourceType,
      sourceValue: input.sourceValue,
      rawRowIndex:
        typeof rawRow.rawRowIndex === "number" ? rawRow.rawRowIndex : index + 2,
    });

    const errors = validateNormalizedProviderRow(normalized);
    const normalizedName = normalizeProviderNameForMatch(normalized.name);
    const normalizedCode = normalized.code.trim().toUpperCase();

    let isDuplicate = false;
    let duplicateReason: string | undefined;
    let matchedProviderId: string | undefined;
    let matchedProviderName: string | undefined;

    const existingNameMatch = normalized.name
      ? existingByName.get(normalizedName)
      : undefined;

    const existingCodeMatch = normalizedCode
      ? existingByCode.get(normalizedCode)
      : undefined;

    if (existingNameMatch) {
      isDuplicate = true;
      duplicateReason = `Provider already exists with the same name: ${existingNameMatch.name}`;
      matchedProviderId = existingNameMatch.id;
      matchedProviderName = existingNameMatch.name;
    } else if (existingCodeMatch) {
      isDuplicate = true;
      duplicateReason = `Provider already exists with the same code: ${existingCodeMatch.name}`;
      matchedProviderId = existingCodeMatch.id;
      matchedProviderName = existingCodeMatch.name;
    } else if (normalizedName && localSeenNames.has(normalizedName)) {
      isDuplicate = true;
      duplicateReason = "Duplicate provider name found inside this import file.";
    } else if (normalizedCode && localSeenCodes.has(normalizedCode)) {
      isDuplicate = true;
      duplicateReason = "Duplicate provider code found inside this import file.";
    }

    if (normalizedName) {
      localSeenNames.add(normalizedName);
    }

    if (normalizedCode) {
      localSeenCodes.add(normalizedCode);
    }

    const isValid = errors.length === 0;
    const willImport = isValid && !isDuplicate;

    return {
      rowId: `provider-row-${index + 1}`,
      rawRowIndex: normalized.rawRowIndex,
      data: normalized,
      isValid,
      errors,
      isDuplicate,
      duplicateReason,
      matchedProviderId,
      matchedProviderName,
      willImport,
    };
  });

  return {
    sourceType: input.sourceType,
    sourceValue: input.sourceValue,
    rows: previewRows,
    summary: {
      totalRows: previewRows.length,
      validRows: previewRows.filter((row) => row.isValid).length,
      invalidRows: previewRows.filter((row) => !row.isValid).length,
      duplicateRows: previewRows.filter((row) => row.isDuplicate).length,
      importableRows: previewRows.filter((row) => row.willImport).length,
    },
  };
}