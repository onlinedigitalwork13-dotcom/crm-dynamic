import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { importProviderRows } from "@/lib/imports/import-provider-rows";

const providerPreviewRowSchema = z.object({
  rowId: z.string(),
  rawRowIndex: z.number().optional(),
  data: z.object({
    name: z.string(),
    code: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    description: z.string().optional(),
    legalName: z.string().optional(),
    defaultCurrency: z.string().optional(),
    supportEmail: z.string().optional(),
    supportPhone: z.string().optional(),
    admissionEmail: z.string().optional(),
    financeEmail: z.string().optional(),
    applicationUrl: z.string().optional(),
    portalUrl: z.string().optional(),
    logoUrl: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    sourceType: z.enum(["csv", "website", "api"]),
    sourceValue: z.string().optional(),
    rawRowIndex: z.number().optional(),
  }),
  isValid: z.boolean(),
  errors: z.array(z.string()),
  isDuplicate: z.boolean(),
  duplicateReason: z.string().optional(),
  matchedProviderId: z.string().optional(),
  matchedProviderName: z.string().optional(),
  willImport: z.boolean(),
});

const commitRequestSchema = z.object({
  sourceType: z.enum(["csv", "website", "api"]),
  sourceValue: z.string().optional(),
  rows: z.array(providerPreviewRowSchema).min(1, "At least one row is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = commitRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid provider import commit request.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await importProviderRows({
      sourceType: parsed.data.sourceType,
      sourceValue: parsed.data.sourceValue,
      rows: parsed.data.rows,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Provider import commit route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to commit provider import.",
      },
      { status: 500 }
    );
  }
}