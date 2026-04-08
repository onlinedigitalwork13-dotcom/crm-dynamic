import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { previewCourseImport } from "@/lib/imports/preview-course-import";

type Context = {
  params: Promise<{ id: string }>;
};

const previewRequestSchema = z.object({
  sourceType: z.enum(["csv", "website", "api"]),
  sourceValue: z.string().optional(),
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, "At least one row is required"),
});

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const parsed = previewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid provider course import preview request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await previewCourseImport({
      sourceType: parsed.data.sourceType,
      sourceValue: parsed.data.sourceValue,
      rows: parsed.data.rows,
      forcedProviderId: id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Provider course import preview error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to preview provider course import",
      },
      { status: 500 }
    );
  }
}