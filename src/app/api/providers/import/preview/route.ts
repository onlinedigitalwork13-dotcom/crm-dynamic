import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { previewProviderImport } from "@/lib/imports/preview-provider-import";

const previewRequestSchema = z.object({
  sourceType: z.enum(["csv", "website", "api"]),
  sourceValue: z.string().optional(),
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, "At least one row is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = previewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid provider preview request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await previewProviderImport({
      sourceType: parsed.data.sourceType,
      sourceValue: parsed.data.sourceValue,
      rows: parsed.data.rows,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Provider import preview error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to preview provider import",
      },
      { status: 500 }
    );
  }
}