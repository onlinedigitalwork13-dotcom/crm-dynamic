import { prisma } from "@/lib/prisma";
import {
  CourseImportCommitResult,
  CourseImportPreviewRow,
} from "@/lib/imports/types";

type ImportCourseRowsParams = {
  createdById?: string;
  sourceType: "csv" | "website" | "api";
  sourceValue?: string;
  rows: CourseImportPreviewRow[];
  forcedProviderId?: string;
};

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str ? str : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function importCourseRows(
  params: ImportCourseRowsParams
): Promise<CourseImportCommitResult> {
  const { createdById, sourceType, sourceValue, rows, forcedProviderId } = params;

  const totalRows = rows.length;
  const invalidRows = rows.filter((row) => !row.isValid).length;

  const importJob = await prisma.importJob.create({
    data: {
      type: "course_import",
      sourceType,
      sourceValue,
      status: "processing",
      totalRows,
      validRows: rows.filter((row) => row.isValid).length,
      invalidRows,
      importedRows: 0,
      skippedRows: 0,
      createdById,
    },
  });

  let importedRows = 0;
  let updatedRows = 0;
  let skippedRows = 0;

  for (const row of rows) {
    const errors = [...row.errors];
    let wasImported = false;
    let isDuplicate = row.isDuplicate;

    const providerId = forcedProviderId ?? row.matchedProviderId;

    if (!row.willImport || !providerId) {
      skippedRows += 1;

      await prisma.importJobRow.create({
        data: {
          importJobId: importJob.id,
          rawRowIndex: row.rawRowIndex,
          providerName: toNullableString(row.data.providerName),
          courseName: toNullableString(row.data.courseName),
          payloadJson: row.data,
          isValid: row.isValid,
          isDuplicate,
          wasImported: false,
          errors,
        },
      });

      continue;
    }

    try {
      const existingCourse = await prisma.course.findFirst({
        where: row.data.courseCode
          ? {
              providerId,
              OR: [
                {
                  code: {
                    equals: row.data.courseCode,
                    mode: "insensitive",
                  },
                },
                {
                  name: {
                    equals: row.data.courseName,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {
              providerId,
              name: {
                equals: row.data.courseName,
                mode: "insensitive",
              },
            },
      });

      // 🟢 UPDATE EXISTING (NEW BEHAVIOR)
      if (existingCourse) {
        await prisma.course.update({
          where: { id: existingCourse.id },
          data: {
            level: toNullableString(row.data.level),
            duration: toNullableString(row.data.duration),
            tuitionFee: toNullableNumber(row.data.tuitionFee),
            intakeMonths: toNullableString(row.data.intakeMonths),
            campus: toNullableString(row.data.campus),
            description: toNullableString(row.data.description),
            category: toNullableString(row.data.category),
            studyMode: toNullableString(row.data.studyMode),
            durationValue: toNullableNumber(row.data.durationValue),
            durationUnit: toNullableString(row.data.durationUnit),
            applicationFee: toNullableNumber(row.data.applicationFee),
            materialFee: toNullableNumber(row.data.materialFee),
            currency: toNullableString(row.data.currency),
            entryRequirements: toNullableString(row.data.entryRequirements),
            englishRequirements: toNullableString(row.data.englishRequirements),
            notes: toNullableString(row.data.notes),
            sourceType,
            syncStatus: "updated",
          },
        });

        updatedRows += 1;
        wasImported = true;

        await prisma.importJobRow.create({
          data: {
            importJobId: importJob.id,
            rawRowIndex: row.rawRowIndex,
            providerName: toNullableString(row.data.providerName),
            courseName: toNullableString(row.data.courseName),
            payloadJson: row.data,
            isValid: row.isValid,
            isDuplicate: false,
            wasImported: true,
            errors: [...errors, "Updated existing course"],
          },
        });

        continue;
      }

      // 🟢 CREATE NEW
      await prisma.course.create({
        data: {
          providerId,
          name: row.data.courseName,
          code: toNullableString(row.data.courseCode),
          level: toNullableString(row.data.level),
          duration: toNullableString(row.data.duration),
          tuitionFee: toNullableNumber(row.data.tuitionFee),
          intakeMonths: toNullableString(row.data.intakeMonths),
          campus: toNullableString(row.data.campus),
          description: toNullableString(row.data.description),
          category: toNullableString(row.data.category),
          studyMode: toNullableString(row.data.studyMode),
          durationValue: toNullableNumber(row.data.durationValue),
          durationUnit: toNullableString(row.data.durationUnit),
          applicationFee: toNullableNumber(row.data.applicationFee),
          materialFee: toNullableNumber(row.data.materialFee),
          currency: toNullableString(row.data.currency),
          entryRequirements: toNullableString(row.data.entryRequirements),
          englishRequirements: toNullableString(row.data.englishRequirements),
          notes: toNullableString(row.data.notes),
          sourceType,
          syncStatus: "imported",
          isActive: true,
        },
      });

      importedRows += 1;
      wasImported = true;

      await prisma.importJobRow.create({
        data: {
          importJobId: importJob.id,
          rawRowIndex: row.rawRowIndex,
          providerName: toNullableString(row.data.providerName),
          courseName: toNullableString(row.data.courseName),
          payloadJson: row.data,
          isValid: row.isValid,
          isDuplicate: false,
          wasImported,
          errors,
        },
      });
    } catch (error) {
      skippedRows += 1;

      const errorMessage =
        error instanceof Error ? error.message : "Unknown import error";

      errors.push(errorMessage);

      await prisma.importJobRow.create({
        data: {
          importJobId: importJob.id,
          rawRowIndex: row.rawRowIndex,
          providerName: toNullableString(row.data.providerName),
          courseName: toNullableString(row.data.courseName),
          payloadJson: row.data,
          isValid: row.isValid,
          isDuplicate,
          wasImported: false,
          errors,
        },
      });
    }
  }

  await prisma.importJob.update({
    where: { id: importJob.id },
    data: {
      status: "completed",
      importedRows,
      skippedRows,
    },
  });

  return {
    importJobId: importJob.id,
    totalRows,
    importedRows,
    skippedRows,
    invalidRows,
  };
}