import { z } from "zod";
import {
  CourseImportSourceType,
  RawNormalizedCourseImportRow,
} from "@/lib/imports/types";

/**
 * Raw input schema (before normalization)
 * Flexible because CSV / website data can be inconsistent
 */
export const rawCourseImportRowSchema = z.object({
  providerName: z.any().optional(),
  providerCode: z.any().optional(),

  courseName: z.any().optional(),
  courseCode: z.any().optional(),
  level: z.any().optional(),
  duration: z.any().optional(),
  tuitionFee: z.any().optional(),
  intakeMonths: z.any().optional(),
  campus: z.any().optional(),
  description: z.any().optional(),
  category: z.any().optional(),
  studyMode: z.any().optional(),
  durationValue: z.any().optional(),
  durationUnit: z.any().optional(),
  applicationFee: z.any().optional(),
  materialFee: z.any().optional(),
  currency: z.any().optional(),
  entryRequirements: z.any().optional(),
  englishRequirements: z.any().optional(),
  notes: z.any().optional(),
});

/**
 * Normalized schema (strict + clean)
 */
export const normalizedCourseImportSchema = z.object({
  providerName: z.string().trim().min(1, "Provider name is required"),
  providerCode: z.string().trim().optional(),

  courseName: z.string().trim().min(1, "Course name is required"),

  courseCode: z.string().trim().optional(),
  level: z.string().trim().optional(),
  duration: z.string().trim().optional(),

  tuitionFee: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return Number.isNaN(num) ? undefined : num;
    }),

  intakeMonths: z.string().trim().optional(),
  campus: z.string().trim().optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  studyMode: z.string().trim().optional(),

  durationValue: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return Number.isNaN(num) ? undefined : num;
    }),

  durationUnit: z.string().trim().optional(),

  applicationFee: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return Number.isNaN(num) ? undefined : num;
    }),

  materialFee: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return Number.isNaN(num) ? undefined : num;
    }),

  currency: z.string().trim().optional(),
  entryRequirements: z.string().trim().optional(),
  englishRequirements: z.string().trim().optional(),
  notes: z.string().trim().optional(),

  sourceType: z.enum(["csv", "website", "api"]),
  sourceValue: z.string().optional(),
  rawRowIndex: z.number().optional(),
});

/**
 * Helper: normalize string safely
 */
export function normalizeString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;

  const str = String(value).trim();
  if (!str) return undefined;

  return str;
}

function normalizeUpperString(value: unknown): string | undefined {
  const str = normalizeString(value);
  return str ? str.toUpperCase() : undefined;
}

function pickFirst(
  row: Record<string, unknown>,
  keys: string[]
): unknown {
  for (const key of keys) {
    if (key in row && row[key] != null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }

  return undefined;
}

/**
 * Normalize raw row → clean structure
 */
export function normalizeCourseRow(
  row: Record<string, unknown>,
  sourceType: CourseImportSourceType,
  sourceValue?: string,
  index?: number
): RawNormalizedCourseImportRow {
  return {
    providerName:
      normalizeString(
        pickFirst(row, [
          "providerName",
          "provider",
          "institutionName",
          "university",
        ])
      ) ?? "",

    providerCode: normalizeUpperString(
      pickFirst(row, ["providerCode", "provider_code", "institutionCode"])
    ),

    courseName:
      normalizeString(
        pickFirst(row, ["courseName", "name", "course", "programName"])
      ) ?? "",

    courseCode: normalizeString(
      pickFirst(row, ["courseCode", "code", "programCode"])
    ),

    level: normalizeString(pickFirst(row, ["level"])),
    duration: normalizeString(pickFirst(row, ["duration"])),
    tuitionFee: normalizeString(
      pickFirst(row, ["tuitionFee", "tuition", "fees"])
    ),
    intakeMonths: normalizeString(
      pickFirst(row, ["intakeMonths", "intakes", "intake"])
    ),
    campus: normalizeString(pickFirst(row, ["campus"])),
    description: normalizeString(pickFirst(row, ["description"])),
    category: normalizeString(pickFirst(row, ["category"])),
    studyMode: normalizeString(
      pickFirst(row, ["studyMode", "mode", "deliveryMode"])
    ),
    durationValue: normalizeString(pickFirst(row, ["durationValue"])),
    durationUnit: normalizeString(pickFirst(row, ["durationUnit"])),
    applicationFee: normalizeString(pickFirst(row, ["applicationFee"])),
    materialFee: normalizeString(pickFirst(row, ["materialFee"])),
    currency: normalizeUpperString(pickFirst(row, ["currency"])),
    entryRequirements: normalizeString(
      pickFirst(row, ["entryRequirements"])
    ),
    englishRequirements: normalizeString(
      pickFirst(row, ["englishRequirements"])
    ),
    notes: normalizeString(pickFirst(row, ["notes"])),

    sourceType,
    sourceValue,
    rawRowIndex: index,
  };
}