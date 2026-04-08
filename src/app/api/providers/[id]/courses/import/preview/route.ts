import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { previewCourseImport } from "@/lib/imports/preview-course-import";
import { parseWebsiteCourseSource } from "@/lib/imports/sources/parse-website-course-source";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const previewRequestSchema = z.object({
  sourceType: z.enum(["csv", "website", "api"]),
  sourceValue: z.string().optional(),
  rows: z.array(z.record(z.string(), z.unknown())).optional(),
  providerName: z.string().optional(),
});

function normalizeApiValueToRows(
  payload: unknown,
  fallbackProviderName?: string,
  sourceValue?: string
): Record<string, unknown>[] {
  if (!Array.isArray(payload)) {
    throw new Error("API response must be an array of course objects");
  }

  return payload.map((item, index) => {
    const row = typeof item === "object" && item !== null ? item : {};
    const record = row as Record<string, unknown>;

    const providerName =
      typeof record.providerName === "string" && record.providerName.trim()
        ? record.providerName.trim()
        : fallbackProviderName?.trim() || "";

    const courseName =
      typeof record.courseName === "string" && record.courseName.trim()
        ? record.courseName.trim()
        : typeof record.name === "string" && record.name.trim()
        ? record.name.trim()
        : typeof record.title === "string" && record.title.trim()
        ? record.title.trim()
        : "";

    return {
      providerName,
      providerCode:
        typeof record.providerCode === "string" ? record.providerCode : undefined,

      courseName,
      courseCode:
        typeof record.courseCode === "string"
          ? record.courseCode
          : typeof record.code === "string"
          ? record.code
          : undefined,

      level: typeof record.level === "string" ? record.level : undefined,
      duration: typeof record.duration === "string" ? record.duration : undefined,
      tuitionFee:
        typeof record.tuitionFee === "number" ||
        typeof record.tuitionFee === "string"
          ? record.tuitionFee
          : undefined,
      intakeMonths:
        typeof record.intakeMonths === "string" ? record.intakeMonths : undefined,
      campus: typeof record.campus === "string" ? record.campus : undefined,
      description:
        typeof record.description === "string" ? record.description : undefined,
      category: typeof record.category === "string" ? record.category : undefined,
      studyMode:
        typeof record.studyMode === "string" ? record.studyMode : undefined,

      durationValue:
        typeof record.durationValue === "number" ||
        typeof record.durationValue === "string"
          ? record.durationValue
          : undefined,
      durationUnit:
        typeof record.durationUnit === "string" ? record.durationUnit : undefined,

      applicationFee:
        typeof record.applicationFee === "number" ||
        typeof record.applicationFee === "string"
          ? record.applicationFee
          : undefined,
      materialFee:
        typeof record.materialFee === "number" ||
        typeof record.materialFee === "string"
          ? record.materialFee
          : undefined,

      currency: typeof record.currency === "string" ? record.currency : undefined,
      entryRequirements:
        typeof record.entryRequirements === "string"
          ? record.entryRequirements
          : undefined,
      englishRequirements:
        typeof record.englishRequirements === "string"
          ? record.englishRequirements
          : undefined,
      notes: typeof record.notes === "string" ? record.notes : undefined,

      sourceType: "api",
      sourceValue,
      rawRowIndex: index + 1,
    };
  });
}

async function parseApiCourseSource(params: {
  url: string;
  providerName?: string;
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

  return normalizeApiValueToRows(payload, params.providerName, params.url);
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: providerId } = await context.params;
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

    const { sourceType, sourceValue, providerName } = parsed.data;

    let rows: Record<string, unknown>[] = [];

    if (sourceType === "csv") {
      rows = parsed.data.rows ?? [];

      if (rows.length === 0) {
        return NextResponse.json(
          {
            error: "CSV rows are required for course import preview",
          },
          { status: 400 }
        );
      }
    }

    if (sourceType === "website") {
      if (!sourceValue?.trim()) {
        return NextResponse.json(
          {
            error: "Website URL is required for website course import preview",
          },
          { status: 400 }
        );
      }

      const parsedRows = await parseWebsiteCourseSource({
        url: sourceValue.trim(),
        providerName: providerName?.trim(),
      });

      if (parsedRows.length === 0) {
        return NextResponse.json(
          {
            error: "No course-like rows were detected from the website",
          },
          { status: 400 }
        );
      }

      rows = parsedRows.map((row, index) => ({
        ...row,
        providerName: "",
        rawRowIndex:
          typeof row.rawRowIndex === "number" ? row.rawRowIndex : index + 1,
      }));
    }

    if (sourceType === "api") {
      if (!sourceValue?.trim()) {
        return NextResponse.json(
          {
            error: "API endpoint URL is required for API course import preview",
          },
          { status: 400 }
        );
      }

      const parsedRows = await parseApiCourseSource({
        url: sourceValue.trim(),
        providerName: providerName?.trim(),
      });

      if (parsedRows.length === 0) {
        return NextResponse.json(
          {
            error: "No rows were returned from the API source",
          },
          { status: 400 }
        );
      }

      rows = parsedRows.map((row, index) => ({
        ...row,
        providerName: "",
        rawRowIndex:
          typeof row.rawRowIndex === "number" ? row.rawRowIndex : index + 1,
      }));
    }

    const result = await previewCourseImport({
      sourceType,
      sourceValue,
      rows,
      forcedProviderId: providerId,
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