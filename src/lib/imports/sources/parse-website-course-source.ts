import { CourseImportSourceType } from "@/lib/imports/types";

type ParseWebsiteCourseSourceParams = {
  url: string;
  providerName?: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function uniqueRows(rows: Record<string, unknown>[]) {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = `${String(row.providerName || "").trim().toLowerCase()}::${String(
      row.courseName || ""
    )
      .trim()
      .toLowerCase()}`;

    if (!row.providerName || !row.courseName) return false;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function extractLikelyCourseLines(text: string): string[] {
  const lines = text
    .split(/[\n\r]+|(?<=\.)\s+(?=[A-Z])/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.filter((line) => {
    const lower = line.toLowerCase();

    return (
      lower.includes("bachelor") ||
      lower.includes("master") ||
      lower.includes("diploma") ||
      lower.includes("certificate") ||
      lower.includes("course") ||
      lower.includes("program") ||
      lower.includes("programme")
    );
  });
}

function buildCourseRowsFromLines(params: {
  lines: string[];
  providerName: string;
  sourceType: CourseImportSourceType;
  sourceValue: string;
}) {
  const { lines, providerName, sourceType, sourceValue } = params;

  return lines.slice(0, 50).map((line, index) => {
    const cleaned = line.replace(/\s+/g, " ").trim();

    return {
      providerName,
      courseName: cleaned,
      sourceType,
      sourceValue,
      rawRowIndex: index + 1,
    };
  });
}

export async function parseWebsiteCourseSource({
  url,
  providerName,
}: ParseWebsiteCourseSourceParams): Promise<Record<string, unknown>[]> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 CRM Import Bot",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch website (${response.status})`);
  }

  const html = await response.text();

  if (!html || html.length < 50) {
    throw new Error("Website content is empty or too small to parse");
  }

  const pageTitle = extractTitle(html);
  const text = stripHtml(html);
  const lines = extractLikelyCourseLines(text);

  const resolvedProviderName =
    providerName?.trim() ||
    pageTitle ||
    new URL(url).hostname.replace(/^www\./, "");

  const rows = buildCourseRowsFromLines({
    lines,
    providerName: resolvedProviderName,
    sourceType: "website",
    sourceValue: url,
  });

  return uniqueRows(rows);
}