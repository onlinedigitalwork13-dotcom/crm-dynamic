import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseWebsiteCourseSource } from "@/lib/imports/sources/parse-website-course-source";
import { previewCourseImport } from "@/lib/imports/preview-course-import";

const websiteRequestSchema = z.object({
  url: z.string().url("A valid website URL is required"),
  providerName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = websiteRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid website preview request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const rows = await parseWebsiteCourseSource({
      url: parsed.data.url,
      providerName: parsed.data.providerName,
    });

    if (!rows.length) {
      return NextResponse.json({
        sourceType: "website",
        sourceValue: parsed.data.url,
        rows: [],
        summary: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          duplicateRows: 0,
          importableRows: 0,
          unmatchedProviders: 0,
        },
      });
    }

    const preview = await previewCourseImport({
      sourceType: "website",
      sourceValue: parsed.data.url,
      rows,
    });

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Website import preview error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to preview website import",
      },
      { status: 500 }
    );
  }
}