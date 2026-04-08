import { extractProviderWebsiteWithAi } from "@/lib/imports/ai/website-ai-extractor";

type ParseWebsiteProviderSourceParams = {
  url: string;
  providerName?: string;
};

const KNOWN_CITIES = [
  "Sydney",
  "Melbourne",
  "Brisbane",
  "Perth",
  "Adelaide",
  "Canberra",
  "Gold Coast",
  "Newcastle",
  "Geelong",
  "Hobart",
  "Darwin",
  "Parramatta",
  "Liverpool",
  "Penrith",
  "Campbelltown",
  "Bankstown",
  "Bundoora",
  "Burwood",
  "Footscray",
  "Fremantle",
  "Townsville",
  "Cairns",
  "Wollongong",
  "Ballarat",
  "Bendigo",
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

function safeAbsoluteUrl(value: unknown, baseUrl: string): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith("#") ||
    /^javascript:/i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed)
  ) {
    return undefined;
  }

  try {
    const url = new URL(trimmed, baseUrl);

    if (!/^https?:$/i.test(url.protocol)) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
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

function findMetaContent(html: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const regex = new RegExp(
      `<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    );
    const match = html.match(regex);
    if (match?.[1]) {
      return normalizeWhitespace(decodeHtmlEntities(match[1]));
    }
  }

  return undefined;
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

function extractEmail(text: string): string | undefined {
  return text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
}

function extractPhone(text: string): string | undefined {
  return text.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[1]?.trim();
}

function extractCountry(text: string): string | undefined {
  return findFirstMatch(text, [
    /\b(Australia|New Zealand|Canada|United Kingdom|UK|USA|United States|Ireland|Singapore|Malaysia|Dubai|UAE|India)\b/i,
  ]);
}

function cleanupProviderName(value: string): string {
  return normalizeWhitespace(
    value
      .replace(/^home\s*\|\s*/i, "")
      .replace(/\|\s*home$/i, "")
      .replace(/\s*-\s*home$/i, "")
      .replace(/\s*\|\s*western sydney university$/i, " Western Sydney University")
      .trim()
  );
}

function isBadCity(value: string): boolean {
  const lower = value.toLowerCase();

  return (
    lower.includes("campus") ||
    lower.includes("campuses") ||
    lower.includes("service") ||
    lower.includes("services") ||
    lower.includes("student") ||
    lower.includes("our ") ||
    lower.includes("home") ||
    lower.length < 3
  );
}

function extractCity(text: string): string | undefined {
  for (const city of KNOWN_CITIES) {
    const regex = new RegExp(`\\b${city}\\b`, "i");
    if (regex.test(text)) {
      return city;
    }
  }

  const candidates = [
    findFirstMatch(text, [
      /(?:city)\s*[:\-]?\s*([A-Za-z\s]{3,40})/i,
    ]),
    findFirstMatch(text, [
      /(?:location)\s*[:\-]?\s*([A-Za-z\s]{3,40})/i,
    ]),
    findFirstMatch(text, [
      /(?:campus)\s*[:\-]?\s*([A-Za-z\s]{3,40})/i,
    ]),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const cleaned = normalizeWhitespace(candidate);
    if (!isBadCity(cleaned)) {
      return cleaned;
    }
  }

  return undefined;
}

function extractAddress(text: string): string | undefined {
  return findFirstMatch(text, [
    /(?:address)\s*[:\-]?\s*([^.\n]{8,180})/i,
  ]);
}

function extractDescription(text: string): string | undefined {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) return undefined;
  return cleaned.length > 320 ? `${cleaned.slice(0, 317)}...` : cleaned;
}

function extractSupportEmail(text: string): string | undefined {
  return findFirstMatch(text, [
    /(?:support email|student support|support)\s*[:\-]?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
  ]);
}

function extractAdmissionEmail(text: string): string | undefined {
  return findFirstMatch(text, [
    /(?:admission email|admissions email|admissions)\s*[:\-]?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
  ]);
}

function extractFinanceEmail(text: string): string | undefined {
  return findFirstMatch(text, [
    /(?:finance email|accounts email|finance|accounts)\s*[:\-]?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
  ]);
}

function extractApplicationUrl(html: string, baseUrl: string): string | undefined {
  const match = html.match(
    /<a[^>]+href=["']([^"']+)["'][^>]*>(?:[\s\S]*?)(apply now|apply online|application portal)(?:[\s\S]*?)<\/a>/i
  );
  return safeAbsoluteUrl(match?.[1], baseUrl);
}

function extractPortalUrl(html: string, baseUrl: string): string | undefined {
  const match = html.match(
    /<a[^>]+href=["']([^"']+)["'][^>]*>(?:[\s\S]*?)(portal|student portal|agent portal)(?:[\s\S]*?)<\/a>/i
  );
  return safeAbsoluteUrl(match?.[1], baseUrl);
}

function extractLogoUrl(html: string, baseUrl: string): string | undefined {
  const ogImage = findMetaContent(html, ["og:image"]);
  const fromMeta = safeAbsoluteUrl(ogImage, baseUrl);
  if (fromMeta) return fromMeta;

  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*(?:logo|brand)/i);
  return safeAbsoluteUrl(imgMatch?.[1], baseUrl);
}

function extractProviderName(params: {
  html: string;
  text: string;
  url: string;
  providedName?: string;
}) {
  const { html, text, url, providedName } = params;

  if (providedName?.trim()) return cleanupProviderName(providedName.trim());

  const ogSiteName = findMetaContent(html, ["og:site_name"]);
  if (ogSiteName) return cleanupProviderName(ogSiteName);

  const title = extractTitle(html);
  if (title) {
    const cleaned = cleanupProviderName(
      title
        .split("|")[0]
        .split(" - ")[0]
        .trim()
    );
    if (cleaned.length >= 3) return cleaned;
  }

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) {
    const heading = cleanupProviderName(normalizeWhitespace(stripHtml(h1)));
    if (heading.length >= 3 && heading.length <= 120) return heading;
  }

  const fallback = findFirstMatch(text, [
    /(?:welcome to|about)\s+([A-Z][A-Za-z0-9&,'().\-\s]{3,100})/i,
  ]);
  if (fallback) return cleanupProviderName(fallback);

  return cleanupProviderName(new URL(url).hostname.replace(/^www\./, ""));
}

function sanitizeAiProviderResult(
  ai: Record<string, unknown>,
  normalizedUrl: string
): Record<string, unknown> {
  const name =
    typeof ai.name === "string" ? cleanupProviderName(ai.name) : ai.name;
  const legalName =
    typeof ai.legalName === "string"
      ? cleanupProviderName(ai.legalName)
      : ai.legalName;
  const city =
    typeof ai.city === "string" && !isBadCity(ai.city)
      ? normalizeWhitespace(ai.city)
      : undefined;

  return {
    ...ai,
    name,
    legalName,
    city,
    website: safeAbsoluteUrl(ai.website, normalizedUrl) || normalizedUrl,
    applicationUrl: safeAbsoluteUrl(ai.applicationUrl, normalizedUrl),
    portalUrl: safeAbsoluteUrl(ai.portalUrl, normalizedUrl),
    logoUrl: safeAbsoluteUrl(ai.logoUrl, normalizedUrl),
  };
}

export async function parseWebsiteProviderSource({
  url,
  providerName,
}: ParseWebsiteProviderSourceParams): Promise<Record<string, unknown>[]> {
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

  const text = stripHtml(html);
  const resolvedName = extractProviderName({
    html,
    text,
    url: normalizedUrl,
    providedName: providerName,
  });

  const baseRow: Record<string, unknown> = {
    name: resolvedName,
    legalName: resolvedName,
    country: extractCountry(text),
    city: extractCity(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    website: normalizedUrl,
    description:
      findMetaContent(html, ["description", "og:description"]) ||
      extractDescription(text),
    supportEmail: extractSupportEmail(text),
    supportPhone: extractPhone(text),
    admissionEmail: extractAdmissionEmail(text),
    financeEmail: extractFinanceEmail(text),
    applicationUrl: extractApplicationUrl(html, normalizedUrl),
    portalUrl: extractPortalUrl(html, normalizedUrl),
    logoUrl: extractLogoUrl(html, normalizedUrl),
    address: extractAddress(text),
    notes: `Imported from website: ${normalizedUrl}`,
    sourceType: "website",
    sourceValue: normalizedUrl,
    rawRowIndex: 1,
  };

  try {
    const ai = await extractProviderWebsiteWithAi({
      kind: "provider",
      url: normalizedUrl,
      html,
      fallbackProviderName: providerName || resolvedName,
    });

    const sanitizedAi = sanitizeAiProviderResult(
      ai as Record<string, unknown>,
      normalizedUrl
    );

    return [
      {
        ...baseRow,
        ...Object.fromEntries(
          Object.entries(sanitizedAi).filter(([, value]) => value !== undefined && value !== "")
        ),
        city:
          typeof sanitizedAi.city === "string" && sanitizedAi.city.trim()
            ? sanitizedAi.city
            : baseRow.city,
        website:
          typeof sanitizedAi.website === "string"
            ? sanitizedAi.website
            : normalizedUrl,
        sourceType: "website",
        sourceValue: normalizedUrl,
        rawRowIndex: 1,
      },
    ];
  } catch {
    return [baseRow];
  }
}