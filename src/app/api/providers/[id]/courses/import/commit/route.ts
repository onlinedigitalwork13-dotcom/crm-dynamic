import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { importCourseRows } from "@/lib/imports/import-course-rows";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const commitRowSchema = z.object({
  rowId: z.string(),
  rawRowIndex: z.number().optional(),
  data: z.object({
    providerName: z.string(),
    providerCode: z.string().optional(),

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

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: providerId } = await context.params;
    const body = await request.json();

    const parsed = commitRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid provider course import commit request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (!providerId) {
      return NextResponse.json(
        {
          error: "Provider ID is required",
        },
        { status: 400 }
      );
    }

    const importableRows = parsed.data.rows.filter(
      (row) => row.isValid && row.willImport && !row.isDuplicate
    );

    if (importableRows.length === 0) {
      return NextResponse.json(
        {
          error: "There are no valid importable rows to commit",
        },
        { status: 400 }
      );
    }

    const result = await importCourseRows({
      createdById: undefined,
      sourceType: parsed.data.sourceType,
      sourceValue: parsed.data.sourceValue,
      rows: importableRows,
      forcedProviderId: providerId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Provider course import commit error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to commit provider course import",
      },
      { status: 500 }
    );
  }
}