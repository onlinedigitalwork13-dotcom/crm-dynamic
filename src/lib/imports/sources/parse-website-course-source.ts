import { CourseImportSourceType } from "@/lib/imports/types";
import { extractCourseWebsiteWithAi } from "@/lib/imports/ai/website-ai-extractor";

type ParseWebsiteCourseSourceParams = {
  url: string;
  providerName?: string;
};

type ExtractedCourseBlock = {
  courseName: string;
  description?: string;
  tuitionFee?: string;
  scholarship?: string;
  intakeMonths?: string;
  campus?: string;
  level?: string;
  duration?: string;
  studyMode?: string;
};

const BAD_COURSE_TITLES = [
  "course type",
  "find a course",
  "new courses",
  "our courses",
  "search courses",
  "course search",
  "apply now",
  "study with us",
  "browse courses",
  "all courses",
  "undergraduate",
  "postgraduate",
  "research",
  "home",
];

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Website URL is required");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).toString();
  } catch {
    throw new Error("Please enter a valid website URL");
  }
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<img[^>]*>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/section>/gi, "\n")
      .replace(/<\/article>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim()
  );
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]
    ? normalizeWhitespace(decodeHtmlEntities(match[1]))
    : undefined;
}

function isPlaceholderText(value: string) {
  return /{{.*}}/.test(value) || /\[\[.*\]\]/.test(value);
}

function isBadCourseTitle(value: string) {
  const lower = value.trim().toLowerCase();

  if (!lower) return true;
  if (isPlaceholderText(value)) return true;
  if (BAD_COURSE_TITLES.includes(lower)) return true;
  if (lower.includes("{{")) return true;
  if (lower.includes("}}")) return true;
  if (lower.includes("find a course")) return true;
  if (lower.includes("course search")) return true;
  if (lower.includes("new courses")) return true;
  if (lower.includes("course type")) return true;
  if (lower.includes("study business")) return true;
  if (lower.length < 10) return true;

  return false;
}

function uniqueRows(rows: Record<string, unknown>[]) {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const provider = String(row.providerName || "").trim().toLowerCase();
    const course = String(row.courseName || "").trim().toLowerCase();
    const key = `${provider}::${course}`;

    if (!provider || !course) return false;
    if (isBadCourseTitle(String(row.courseName || ""))) return false;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function splitIntoLines(text: string): string[] {
  return text.split(/\n+/).map((line) => normalizeWhitespace(line)).filter(Boolean);
}

function looksLikeCourseTitle(line: string): boolean {
  const lower = line.toLowerCase().trim();

  // ❌ kill junk immediately
  if (isBadCourseTitle(line)) return false;
  if (line.length < 15 || line.length > 140) return false;

  // ❌ reject UI text patterns
  if (
    lower.includes("find a course") ||
    lower.includes("course search") ||
    lower.includes("new courses") ||
    lower.includes("browse") ||
    lower.includes("explore") ||
    lower.includes("apply") ||
    lower.includes("learn more") ||
    lower.includes("study at") ||
    lower.includes("home") ||
    lower.includes("menu")
  ) {
    return false;
  }

  // ❌ reject weird pipe/SEO titles
  if (line.includes("|")) return false;

  // ❌ reject placeholder templates
  if (/{{.*}}/.test(line)) return false;

  // ✅ MUST contain strong academic keyword
  const strongKeywords = [
    "bachelor",
    "master",
    "diploma",
    "certificate",
    "graduate",
    "degree",
    "phd",
    "doctor",
  ];

  const hasKeyword = strongKeywords.some((k) => lower.includes(k));

  // ❌ reject generic headings like "course type"
  if (!hasKeyword) return false;

  return true;
}
function extractLikelyCourseTitles(lines: string[]): string[] {
  return lines.filter(looksLikeCourseTitle);
}

function findFirstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeWhitespace(match[1]);
    }
  }

  return undefined;
}

function extractFee(text: string): string | undefined {
  return findFirstMatch(text, [
    /(?:tuition fee|annual fee|course fee|fees|fee)\s*[:\-]?\s*([A-Z]{0,3}\s?\$?\s?[\d,]+(?:\.\d{1,2})?(?:\s*(?:per year|annually|\/year))?)/i,
    /([A-Z]{2,3}\s?\$?\s?[\d,]{4,}(?:\.\d{1,2})?)/i,
  ]);
}

function extractScholarship(text: string): string | undefined {
  return findFirstMatch(text, [
    /(?:scholarship|scholarships|grant|bursary)\s*[:\-]?\s*([^.;\n]{6,160})/i,
  ]);
}

function extractIntake(text: string): string | undefined {
  return findFirstMatch(text, [
    /(?:intake|intakes|start date|commencement|available intakes)\s*[:\-]?\s*([^.;\n]{3,120})/i,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s*,\s*(?:january|february|march|april|may|june|july|august|september|october|november|december))*\b/i,
  ]);
}

function extractCampus(text: string): string | undefined {
  return findFirstMatch(text, [
    /(?:campus|campuses|location|locations|study location)\s*[:\-]?\s*([^.;\n]{3,120})/i,
  ]);
}

function extractDuration(text: string): string | undefined {
  return findFirstMatch(text, [
    /(?:duration|length)\s*[:\-]?\s*([^.;\n]{2,80})/i,
    /(\d+(?:\.\d+)?\s*(?:year|years|month|months|week|weeks))/i,
  ]);
}

function extractStudyMode(text: string): string | undefined {
  return findFirstMatch(text, [
    /(?:study mode|delivery mode|mode)\s*[:\-]?\s*([^.;\n]{2,80})/i,
    /\b(full[- ]time|part[- ]time|online|on campus|blended|hybrid)\b/i,
  ]);
}

function extractLevel(text: string): string | undefined {
  return findFirstMatch(text, [
    /\b(bachelor(?:'s)?|master(?:'s)?|diploma|certificate(?:\s+[ivx]+)?|graduate certificate|graduate diploma|associate degree|doctorate|phd)\b/i,
  ]);
}

function extractDescription(text: string, courseName: string): string | undefined {
  const cleaned = normalizeWhitespace(text.replace(courseName, "").trim());

  if (!cleaned) return undefined;

  return cleaned.length > 240 ? `${cleaned.slice(0, 237)}...` : cleaned;
}

function buildContextWindow(lines: string[], index: number, radius = 4): string {
  const start = Math.max(0, index - 1);
  const end = Math.min(lines.length, index + radius + 1);

  return normalizeWhitespace(lines.slice(start, end).join(" | "));
}

function extractCourseBlocksFromLines(lines: string[]): ExtractedCourseBlock[] {
  const courseBlocks: ExtractedCourseBlock[] = [];
  const titleIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => looksLikeCourseTitle(line));

  for (const { line, index } of titleIndexes.slice(0, 80)) {
    const context = buildContextWindow(lines, index, 5);

    courseBlocks.push({
      courseName: line,
      tuitionFee: extractFee(context),
      scholarship: extractScholarship(context),
      intakeMonths: extractIntake(context),
      campus: extractCampus(context),
      level: extractLevel(context) ?? extractLevel(line),
      duration: extractDuration(context),
      studyMode: extractStudyMode(context),
      description: extractDescription(context, line),
    });
  }

  return courseBlocks;
}

function extractCourseBlocksFromHtml(html: string): ExtractedCourseBlock[] {
  const headingRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  const headings: string[] = [];

  for (const match of html.matchAll(headingRegex)) {
    const headingText = normalizeWhitespace(stripHtml(match[1] || ""));
    if (headingText && looksLikeCourseTitle(headingText)) {
      headings.push(headingText);
    }
  }

  const uniqueHeadings = Array.from(new Set(headings));

  return uniqueHeadings.slice(0, 80).map((heading) => {
    const headingIndex = html.toLowerCase().indexOf(heading.toLowerCase());
    const slice =
      headingIndex >= 0
        ? html.slice(headingIndex, headingIndex + 3000)
        : heading;

    const text = stripHtml(slice);

    return {
      courseName: heading,
      tuitionFee: extractFee(text),
      scholarship: extractScholarship(text),
      intakeMonths: extractIntake(text),
      campus: extractCampus(text),
      level: extractLevel(text) ?? extractLevel(heading),
      duration: extractDuration(text),
      studyMode: extractStudyMode(text),
      description: extractDescription(text, heading),
    };
  });
}

function mergeCourseBlocks(
  primary: ExtractedCourseBlock[],
  fallback: ExtractedCourseBlock[]
): ExtractedCourseBlock[] {
  const merged = new Map<string, ExtractedCourseBlock>();

  for (const item of [...primary, ...fallback]) {
    const key = item.courseName.trim().toLowerCase();

    if (!key || isBadCourseTitle(item.courseName)) continue;

    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, item);
      continue;
    }

    merged.set(key, {
      courseName: existing.courseName || item.courseName,
      description: existing.description || item.description,
      tuitionFee: existing.tuitionFee || item.tuitionFee,
      scholarship: existing.scholarship || item.scholarship,
      intakeMonths: existing.intakeMonths || item.intakeMonths,
      campus: existing.campus || item.campus,
      level: existing.level || item.level,
      duration: existing.duration || item.duration,
      studyMode: existing.studyMode || item.studyMode,
    });
  }

  return Array.from(merged.values());
}

function buildCourseRowsFromBlocks(params: {
  blocks: ExtractedCourseBlock[];
  providerName: string;
  sourceType: CourseImportSourceType;
  sourceValue: string;
}) {
  const { blocks, providerName, sourceType, sourceValue } = params;

  return blocks
  .filter(
    (block) =>
      block.courseName &&
      !isBadCourseTitle(block.courseName) &&
      looksLikeCourseTitle(block.courseName)
  )
    .slice(0, 100)
    .map((block, index) => {
      const notesParts = [
        block.scholarship ? `Scholarship: ${block.scholarship}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      return {
        providerName,
        courseName: normalizeWhitespace(block.courseName),
        tuitionFee: block.tuitionFee,
        intakeMonths: block.intakeMonths,
        campus: block.campus,
        description: block.description,
        level: block.level,
        duration: block.duration,
        studyMode: block.studyMode,
        notes: notesParts || undefined,
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
  const normalizedUrl = normalizeWebsiteUrl(url);

  const response = await fetch(normalizedUrl, {
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
  const lines = splitIntoLines(text);

  const blocksFromHtml = extractCourseBlocksFromHtml(html);
  const fallbackTitles = extractLikelyCourseTitles(lines).map((title) => ({
    courseName: title,
  }));
  const blocksFromLines = extractCourseBlocksFromLines(lines);

  const mergedBlocks = mergeCourseBlocks(blocksFromHtml, [
    ...blocksFromLines,
    ...fallbackTitles,
  ]);

  const resolvedProviderName =
    providerName?.trim() ||
    pageTitle ||
    new URL(normalizedUrl).hostname.replace(/^www\./, "");

  const ruleRows = buildCourseRowsFromBlocks({
    blocks: mergedBlocks,
    providerName: resolvedProviderName,
    sourceType: "website",
    sourceValue: normalizedUrl,
  });

  try {
    const aiRows = await extractCourseWebsiteWithAi({
      kind: "course",
      url: normalizedUrl,
      html,
      fallbackProviderName: resolvedProviderName,
    });

    const normalizedAiRows = aiRows
      .filter((row) => row.courseName && !isBadCourseTitle(row.courseName))
      .map((row, index) => ({
        providerName: row.providerName || resolvedProviderName,
        courseName: row.courseName || "",
        courseCode: row.courseCode,
        level: row.level,
        duration: row.duration,
        tuitionFee: row.tuitionFee,
        intakeMonths: row.intakeMonths,
        campus: row.campus,
        description: row.description,
        category: row.category,
        studyMode: row.studyMode,
        durationValue: row.durationValue,
        durationUnit: row.durationUnit,
        applicationFee: row.applicationFee,
        materialFee: row.materialFee,
        currency: row.currency,
        entryRequirements: row.entryRequirements,
        englishRequirements: row.englishRequirements,
        notes: row.notes,
        sourceType: "website" as const,
        sourceValue: normalizedUrl,
        rawRowIndex: index + 1,
      }));

    return uniqueRows([...normalizedAiRows, ...ruleRows]);
  } catch {
    return ruleRows;
  }
}