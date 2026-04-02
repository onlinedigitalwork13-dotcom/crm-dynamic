import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { importCourseRows } from "@/lib/imports/import-course-rows";

const commitRowSchema = z.object({
  rowId: z.string(),
  rawRowIndex: z.number().optional(),
  data: z.object({
    providerName: z.string(),
    courseName: z.string(),
    courseCode: z.string().optional(),
    level: z.string().optional(),
    duration: z.string().optional(),
    tuitionFee: z.union([z.number(), z.string()]).optional(),
    intakeMonths: z.string().optional(),
    campus: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    studyMode: z.string().optional(),
    durationValue: z.union([z.number(), z.string()]).optional(),
    durationUnit: z.string().optional(),
    applicationFee: z.union([z.number(), z.string()]).optional(),
    materialFee: z.union([z.number(), z.string()]).optional(),
    currency: z.string().optional(),
    entryRequirements: z.string().optional(),
    englishRequirements: z.string().optional(),
    notes: z.string().optional(),
    sourceType: z.enum(["csv", "website", "api"]),
    sourceValue: z.string().optional(),
    rawRowIndex: z.number().optional(),
  }),
  isValid: z.boolean(),
  errors: z.array(z.string()),
  matchedProviderId: z.string().optional(),
  matchedProviderName: z.string().optional(),
  isDuplicate: z.boolean(),
  duplicateReason: z.string().optional(),
  willImport: z.boolean(),
});

const commitRequestSchema = z.object({
  sourceType: z.enum(["csv", "website", "api"]),
  sourceValue: z.string().optional(),
  rows: z.array(commitRowSchema).min(1, "At least one row is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = commitRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid commit request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await importCourseRows({
      createdById: undefined,
      sourceType: parsed.data.sourceType,
      sourceValue: parsed.data.sourceValue,
      rows: parsed.data.rows,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Course import commit error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to commit import",
      },
      { status: 500 }
    );
  }
}