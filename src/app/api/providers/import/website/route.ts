import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseWebsiteProviderSource } from "@/lib/imports/sources/parse-website-provider-source";
import { previewProviderImport } from "@/lib/imports/preview-provider-import";

const requestSchema = z.object({
  url: z.string().min(1, "Website URL is required"),
  providerName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid provider website import request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const rows = await parseWebsiteProviderSource({
      url: parsed.data.url,
      providerName: parsed.data.providerName,
    });

    const result = await previewProviderImport({
      sourceType: "website",
      sourceValue: parsed.data.url,
      rows,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Provider website import preview error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to preview provider website import",
      },
      { status: 500 }
    );
  }
}