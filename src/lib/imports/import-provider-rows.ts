import { prisma } from "@/lib/prisma";

export type ImportProviderRowData = {
  name: string;
  code?: string;
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  legalName?: string;
  defaultCurrency?: string;
  supportEmail?: string;
  supportPhone?: string;
  admissionEmail?: string;
  financeEmail?: string;
  applicationUrl?: string;
  portalUrl?: string;
  logoUrl?: string;
  address?: string;
  notes?: string;
  sourceType: "csv" | "website" | "api";
  sourceValue?: string;
  rawRowIndex?: number;
};

export type ImportProviderPreviewRow = {
  rowId: string;
  rawRowIndex?: number;
  data: ImportProviderRowData;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  matchedProviderId?: string;
  matchedProviderName?: string;
  willImport: boolean;
};

export type ImportProviderRowsInput = {
  rows: ImportProviderPreviewRow[];
  sourceType: "csv" | "website" | "api";
  sourceValue?: string;
};

export type ImportProviderRowsResult = {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  message: string;
};

function cleanOptional(value: string | undefined): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

export async function importProviderRows(
  input: ImportProviderRowsInput
): Promise<ImportProviderRowsResult> {
  const importableRows = input.rows.filter((row) => row.willImport);

  if (input.rows.length === 0) {
    return {
      totalRows: 0,
      importedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      message: "No rows received for provider import.",
    };
  }

  if (importableRows.length === 0) {
    return {
      totalRows: input.rows.length,
      importedCount: 0,
      skippedCount: input.rows.length,
      failedCount: 0,
      message: "No valid provider rows were ready to import.",
    };
  }

  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const row of input.rows) {
    if (!row.willImport) {
      skippedCount += 1;
      continue;
    }

    try {
      const data = row.data;

      await prisma.provider.create({
        data: {
          name: data.name.trim(),
          code: cleanOptional(data.code),
          country: cleanOptional(data.country),
          city: cleanOptional(data.city),
          email: cleanOptional(data.email),
          phone: cleanOptional(data.phone),
          website: cleanOptional(data.website),
          description: cleanOptional(data.description),
          legalName: cleanOptional(data.legalName),
          defaultCurrency: cleanOptional(data.defaultCurrency),
          supportEmail: cleanOptional(data.supportEmail),
          supportPhone: cleanOptional(data.supportPhone),
          admissionEmail: cleanOptional(data.admissionEmail),
          financeEmail: cleanOptional(data.financeEmail),
          applicationUrl: cleanOptional(data.applicationUrl),
          portalUrl: cleanOptional(data.portalUrl),
          logoUrl: cleanOptional(data.logoUrl),
          address: cleanOptional(data.address),
          notes: cleanOptional(data.notes),

          // Keep only fields that actually exist in your Prisma Provider model
          sourceType: data.sourceType,

          // optional known fields from your Prisma hints
          isActive: true,
        },
      });

      importedCount += 1;
    } catch (error) {
      failedCount += 1;

      console.error("Provider import row failed:", {
        rowId: row.rowId,
        rawRowIndex: row.rawRowIndex,
        providerName: row.data.name,
        error,
      });
    }
  }

  return {
    totalRows: input.rows.length,
    importedCount,
    skippedCount,
    failedCount,
    message: `Provider import completed. Imported ${importedCount}, skipped ${skippedCount}, failed ${failedCount}.`,
  };
}