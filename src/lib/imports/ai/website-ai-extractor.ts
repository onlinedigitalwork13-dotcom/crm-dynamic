type AiExtractionKind = "provider" | "course";

type ExtractProviderAiResult = {
  name?: string;
  legalName?: string;
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  defaultCurrency?: string;
  supportEmail?: string;
  supportPhone?: string;
  admissionEmail?: string;
  financeEmail?: string;
  applicationUrl?: string;
  portalUrl?: string;
  logoUrl?: string;
  address?: string;
  notes?: string;
};

type ExtractCourseAiResult = {
  providerName?: string;
  courseName?: string;
  courseCode?: string;
  level?: string;
  duration?: string;
  tuitionFee?: string;
  intakeMonths?: string;
  campus?: string;
  description?: string;
  category?: string;
  studyMode?: string;
  durationValue?: string | number;
  durationUnit?: string;
  applicationFee?: string;
  materialFee?: string;
  currency?: string;
  entryRequirements?: string;
  englishRequirements?: string;
  notes?: string;
};

type ExtractWebsiteWithAiParams = {
  kind: AiExtractionKind;
  url: string;
  html: string;
  fallbackProviderName?: string;
};

function stripHtmlForAi(html: string): string {
  return html
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
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function truncateText(value: string, max = 18000): string {
  if (value.length <= max) return value;
  return value.slice(0, max);
}

async function callOpenAiJsonSchema<T>(
  schemaName: string,
  schema: Record<string, unknown>,
  prompt: string
): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0,
      messages: [
        {
          role: "developer",
          content:
            "Extract structured website data. Return only valid JSON matching the supplied schema.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenAI extraction failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("OpenAI did not return structured JSON content");
  }

  return JSON.parse(content) as T;
}

export async function extractProviderWebsiteWithAi(
  params: ExtractWebsiteWithAiParams
): Promise<ExtractProviderAiResult> {
  const text = truncateText(stripHtmlForAi(params.html));

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string" },
      legalName: { type: "string" },
      country: { type: "string" },
      city: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      website: { type: "string" },
      description: { type: "string" },
      defaultCurrency: { type: "string" },
      supportEmail: { type: "string" },
      supportPhone: { type: "string" },
      admissionEmail: { type: "string" },
      financeEmail: { type: "string" },
      applicationUrl: { type: "string" },
      portalUrl: { type: "string" },
      logoUrl: { type: "string" },
      address: { type: "string" },
      notes: { type: "string" },
    },
    required: [],
  };

  return callOpenAiJsonSchema<ExtractProviderAiResult>(
    "provider_website_extraction",
    schema,
    [
      `Extract provider/institution details from this website content.`,
      `URL: ${params.url}`,
      params.fallbackProviderName
        ? `Known provider name hint: ${params.fallbackProviderName}`
        : "",
      `Only extract fields that are clearly supported by the text.`,
      `Website text:`,
      text,
    ]
      .filter(Boolean)
      .join("\n\n")
  );
}

export async function extractCourseWebsiteWithAi(
  params: ExtractWebsiteWithAiParams
): Promise<ExtractCourseAiResult[]> {
  const text = truncateText(stripHtmlForAi(params.html));

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            providerName: { type: "string" },
            courseName: { type: "string" },
            courseCode: { type: "string" },
            level: { type: "string" },
            duration: { type: "string" },
            tuitionFee: { type: "string" },
            intakeMonths: { type: "string" },
            campus: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            studyMode: { type: "string" },
            durationValue: {
              anyOf: [{ type: "string" }, { type: "number" }],
            },
            durationUnit: { type: "string" },
            applicationFee: { type: "string" },
            materialFee: { type: "string" },
            currency: { type: "string" },
            entryRequirements: { type: "string" },
            englishRequirements: { type: "string" },
            notes: { type: "string" },
          },
          required: ["courseName"],
        },
      },
    },
    required: ["rows"],
  };

  const result = await callOpenAiJsonSchema<{ rows: ExtractCourseAiResult[] }>(
    "course_website_extraction",
    schema,
    [
      `Extract course rows from this institution website content.`,
      `URL: ${params.url}`,
      params.fallbackProviderName
        ? `Known provider name hint: ${params.fallbackProviderName}`
        : "",
      `Extract course fee, scholarship, intake, campus, duration, study mode, and requirements when available.`,
      `If scholarship exists, place it in notes prefixed with "Scholarship:".`,
      `Only include real course rows supported by the text.`,
      `Website text:`,
      text,
    ]
      .filter(Boolean)
      .join("\n\n")
  );

  return result.rows;
}