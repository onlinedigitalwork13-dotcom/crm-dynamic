import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { previewProviderImport } from "@/lib/imports/preview-provider-import";
import { parseWebsiteProviderSource } from "@/lib/imports/sources/parse-website-provider-source";

const previewRequestSchema = z.object({
  sourceType: z.enum(["csv", "website", "api"]),
  sourceValue: z.string().optional(),
  rows: z.array(z.record(z.string(), z.unknown())).optional(),
  providerName: z.string().optional(),
});

function normalizeApiProviderRows(
  payload: unknown,
  sourceValue?: string
): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.map((item, index) => {
      const record =
        typeof item === "object" && item !== null
          ? (item as Record<string, unknown>)
          : {};

      return {
        name:
          typeof record.name === "string"
            ? record.name
            : typeof record.providerName === "string"
            ? record.providerName
            : "",
        code: typeof record.code === "string" ? record.code : undefined,
        country: typeof record.country === "string" ? record.country : undefined,
        city: typeof record.city === "string" ? record.city : undefined,
        email: typeof record.email === "string" ? record.email : undefined,
        phone: typeof record.phone === "string" ? record.phone : undefined,
        website:
          typeof record.website === "string"
            ? record.website
            : sourceValue,
        description:
          typeof record.description === "string"
            ? record.description
            : undefined,
        legalName:
          typeof record.legalName === "string" ? record.legalName : undefined,
        defaultCurrency:
          typeof record.defaultCurrency === "string"
            ? record.defaultCurrency
            : undefined,
        supportEmail:
          typeof record.supportEmail === "string"
            ? record.supportEmail
            : undefined,
        supportPhone:
          typeof record.supportPhone === "string"
            ? record.supportPhone
            : undefined,
        admissionEmail:
          typeof record.admissionEmail === "string"
            ? record.admissionEmail
            : undefined,
        financeEmail:
          typeof record.financeEmail === "string"
            ? record.financeEmail
            : undefined,
        applicationUrl:
          typeof record.applicationUrl === "string"
            ? record.applicationUrl
            : undefined,
        portalUrl:
          typeof record.portalUrl === "string" ? record.portalUrl : undefined,
        logoUrl:
          typeof record.logoUrl === "string" ? record.logoUrl : undefined,
        address:
          typeof record.address === "string" ? record.address : undefined,
        notes: typeof record.notes === "string" ? record.notes : undefined,
        sourceType: "api",
        sourceValue,
        rawRowIndex: index + 1,
      };
    });
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;

    return [
      {
        name:
          typeof record.name === "string"
            ? record.name
            : typeof record.providerName === "string"
            ? record.providerName
            : "",
        code: typeof record.code === "string" ? record.code : undefined,
        country: typeof record.country === "string" ? record.country : undefined,
        city: typeof record.city === "string" ? record.city : undefined,
        email: typeof record.email === "string" ? record.email : undefined,
        phone: typeof record.phone === "string" ? record.phone : undefined,
        website:
          typeof record.website === "string"
            ? record.website
            : sourceValue,
        description:
          typeof record.description === "string"
            ? record.description
            : undefined,
        legalName:
          typeof record.legalName === "string" ? record.legalName : undefined,
        defaultCurrency:
          typeof record.defaultCurrency === "string"
            ? record.defaultCurrency
            : undefined,
        supportEmail:
          typeof record.supportEmail === "string"
            ? record.supportEmail
            : undefined,
        supportPhone:
          typeof record.supportPhone === "string"
            ? record.supportPhone
            : undefined,
        admissionEmail:
          typeof record.admissionEmail === "string"
            ? record.admissionEmail
            : undefined,
        financeEmail:
          typeof record.financeEmail === "string"
            ? record.financeEmail
            : undefined,
        applicationUrl:
          typeof record.applicationUrl === "string"
            ? record.applicationUrl
            : undefined,
        portalUrl:
          typeof record.portalUrl === "string" ? record.portalUrl : undefined,
        logoUrl:
          typeof record.logoUrl === "string" ? record.logoUrl : undefined,
        address:
          typeof record.address === "string" ? record.address : undefined,
        notes: typeof record.notes === "string" ? record.notes : undefined,
        sourceType: "api",
        sourceValue,
        rawRowIndex: 1,
      },
    ];
  }

  throw new Error("API response must be an object or array of objects");
}

async function parseApiProviderSource(params: {
  url: string;
}): Promise<Record<string, unknown>[]> {
  const response = await fetch(params.url, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 CRM Import Bot",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch API (${response.status})`);
  }

  const payload = await response.json();
  return normalizeApiProviderRows(payload, params.url);
}

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

    const { sourceType, sourceValue, providerName } = parsed.data;

    let rows: Record<string, unknown>[] = [];

    if (sourceType === "csv") {
      rows = parsed.data.rows ?? [];

      if (rows.length === 0) {
        return NextResponse.json(
          { error: "CSV rows are required for provider import preview" },
          { status: 400 }
        );
      }
    }

    if (sourceType === "website") {
      if (!sourceValue?.trim()) {
        return NextResponse.json(
          { error: "Website URL is required for provider website import preview" },
          { status: 400 }
        );
      }

      rows = await parseWebsiteProviderSource({
        url: sourceValue.trim(),
        providerName: providerName?.trim(),
      });
    }

    if (sourceType === "api") {
      if (!sourceValue?.trim()) {
        return NextResponse.json(
          { error: "API endpoint URL is required for provider API import preview" },
          { status: 400 }
        );
      }

      rows = await parseApiProviderSource({
        url: sourceValue.trim(),
      });
    }

    const result = await previewProviderImport({
      sourceType,
      sourceValue,
      rows,
    });

    return NextResponse.json(result, { status: 200 });
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