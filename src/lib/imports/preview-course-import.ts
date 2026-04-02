import { prisma } from "@/lib/prisma";
import {
  CourseDuplicateCheckResult,
  CourseImportPreviewResult,
  CourseImportPreviewRow,
  CourseImportPreviewSummary,
  CourseImportSourceType,
  NormalizedCourseImportRow,
  ProviderMatchResult,
} from "@/lib/imports/types";
import {
  normalizeCourseRow,
  normalizedCourseImportSchema,
} from "@/lib/imports/course-import-schema";

function makeRowId(index: number) {
  return `row-${index + 1}`;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function resolveProvider(providerName: string): Promise<ProviderMatchResult> {
  const normalized = normalizeName(providerName);

  const providers = await prisma.provider.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const exactMatch = providers.find(
    (provider) => normalizeName(provider.name) === normalized
  );

  if (!exactMatch) {
    return {
      matched: false,
    };
  }

  return {
    matched: true,
    providerId: exactMatch.id,
    providerName: exactMatch.name,
  };
}

async function detectDuplicate(
  row: NormalizedCourseImportRow,
  providerId?: string
): Promise<CourseDuplicateCheckResult> {
  if (!providerId) {
    return {
      isDuplicate: false,
    };
  }

  const normalizedCourseName = normalizeName(row.courseName);

  if (row.courseCode) {
    const existingByCode = await prisma.course.findFirst({
      where: {
        providerId,
        code: row.courseCode,
      },
      select: {
        id: true,
      },
    });

    if (existingByCode) {
      return {
        isDuplicate: true,
        reason: "Duplicate course code for this provider",
      };
    }
  }

  const existingByName = await prisma.course.findFirst({
    where: {
      providerId,
      name: {
        equals: row.courseName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (existingByName || normalizedCourseName) {
    const sameName = existingByName
      ? normalizeName(existingByName.name) === normalizedCourseName
      : false;

    if (sameName) {
      return {
        isDuplicate: true,
        reason: "Duplicate course name for this provider",
      };
    }
  }

  return {
    isDuplicate: false,
  };
}

export async function previewCourseImport(params: {
  sourceType: CourseImportSourceType;
  sourceValue?: string;
  rows: Record<string, unknown>[];
}): Promise<CourseImportPreviewResult> {
  const { sourceType, sourceValue, rows } = params;

  const previewRows: CourseImportPreviewRow[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rawRow = rows[index];

    const normalizedRow = normalizeCourseRow(
      rawRow,
      sourceType,
      sourceValue,
      index + 1
    );

    const parsed = normalizedCourseImportSchema.safeParse(normalizedRow);

    const errors: string[] = [];
    let providerMatch: ProviderMatchResult = { matched: false };
    let duplicateResult: CourseDuplicateCheckResult = { isDuplicate: false };

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(issue.message);
      }
    } else {
      providerMatch = await resolveProvider(parsed.data.providerName);

      if (!providerMatch.matched) {
        errors.push("Provider not found");
      }

      duplicateResult = await detectDuplicate(
        parsed.data,
        providerMatch.providerId
      );
    }

    const isValid = parsed.success && errors.length === 0;
    const willImport = isValid && !duplicateResult.isDuplicate;

    previewRows.push({
      rowId: makeRowId(index),
      rawRowIndex: index + 1,
      data: parsed.success ? parsed.data : normalizedRow,
      isValid,
      errors,
      matchedProviderId: providerMatch.providerId,
      matchedProviderName: providerMatch.providerName,
      isDuplicate: duplicateResult.isDuplicate,
      duplicateReason: duplicateResult.reason,
      willImport,
    });
  }

  const summary: CourseImportPreviewSummary = {
    totalRows: previewRows.length,
    validRows: previewRows.filter((row) => row.isValid).length,
    invalidRows: previewRows.filter((row) => !row.isValid).length,
    duplicateRows: previewRows.filter((row) => row.isDuplicate).length,
    importableRows: previewRows.filter((row) => row.willImport).length,
    unmatchedProviders: previewRows.filter(
      (row) => !row.matchedProviderId
    ).length,
  };

  return {
    sourceType,
    sourceValue,
    rows: previewRows,
    summary,
  };
}