import { z } from "zod";
import {
  CourseImportSourceType,
  RawNormalizedCourseImportRow,
} from "@/lib/imports/types";

/**
 * Raw input schema (before normalization)
 * This is flexible because CSV / website data can be messy
 */
export const rawCourseImportRowSchema = z.object({
  providerName: z.any(),
  courseName: z.any(),
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

  courseName: z.string().trim().min(1, "Course name is required"),

  courseCode: z.string().optional(),
  level: z.string().optional(),
  duration: z.string().optional(),

  tuitionFee: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = parseFloat(val);
      return Number.isNaN(num) ? undefined : num;
    }),

  intakeMonths: z.string().optional(),
  campus: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  studyMode: z.string().optional(),

  durationValue: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = parseFloat(val);
      return Number.isNaN(num) ? undefined : num;
    }),

  durationUnit: z.string().optional(),

  applicationFee: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = parseFloat(val);
      return Number.isNaN(num) ? undefined : num;
    }),

  materialFee: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = parseFloat(val);
      return Number.isNaN(num) ? undefined : num;
    }),

  currency: z.string().optional(),
  entryRequirements: z.string().optional(),
  englishRequirements: z.string().optional(),
  notes: z.string().optional(),

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
    providerName: normalizeString(row.providerName) ?? "",
    courseName: normalizeString(row.courseName) ?? "",
    courseCode: normalizeString(row.courseCode),
    level: normalizeString(row.level),
    duration: normalizeString(row.duration),
    tuitionFee: normalizeString(row.tuitionFee),
    intakeMonths: normalizeString(row.intakeMonths),
    campus: normalizeString(row.campus),
    description: normalizeString(row.description),
    category: normalizeString(row.category),
    studyMode: normalizeString(row.studyMode),
    durationValue: normalizeString(row.durationValue),
    durationUnit: normalizeString(row.durationUnit),
    applicationFee: normalizeString(row.applicationFee),
    materialFee: normalizeString(row.materialFee),
    currency: normalizeString(row.currency),
    entryRequirements: normalizeString(row.entryRequirements),
    englishRequirements: normalizeString(row.englishRequirements),
    notes: normalizeString(row.notes),

    sourceType,
    sourceValue,
    rawRowIndex: index,
  };
}