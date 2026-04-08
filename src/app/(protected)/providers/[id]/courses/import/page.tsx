"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";

type SourceType = "csv" | "website" | "api";

type CourseImportRowData = {
  providerName?: string;
  providerCode?: string;
  courseName?: string;
  courseCode?: string;
  level?: string;
  duration?: string;
  tuitionFee?: string | number;
  intakeMonths?: string;
  campus?: string;
  description?: string;
  category?: string;
  studyMode?: string;
  durationValue?: string | number;
  durationUnit?: string;
  applicationFee?: string | number;
  materialFee?: string | number;
  currency?: string;
  entryRequirements?: string;
  englishRequirements?: string;
  notes?: string;
  sourceType: SourceType;
  sourceValue?: string;
  rawRowIndex?: number;
};

type PreviewRow = {
  rowId: string;
  rawRowIndex?: number;
  data: CourseImportRowData;
  isValid: boolean;
  errors: string[];
  matchedProviderId?: string;
  matchedProviderName?: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  willImport: boolean;
};

type PreviewSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importableRows: number;
  unmatchedProviders: number;
};

type PreviewResponse = {
  sourceType: SourceType;
  sourceValue?: string;
  rows: PreviewRow[];
  summary: PreviewSummary;
};

type CommitResponse = {
  importJobId: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  invalidRows: number;
};

type CsvRow = Record<string, string>;

const SAMPLE_CSV_HEADERS = [
  "providerName",
  "courseName",
  "courseCode",
  "level",
  "duration",
  "tuitionFee",
  "intakeMonths",
  "campus",
  "description",
  "category",
  "studyMode",
  "durationValue",
  "durationUnit",
  "applicationFee",
  "materialFee",
  "currency",
  "entryRequirements",
  "englishRequirements",
  "notes",
];

const SAMPLE_CSV_ROWS = [
  [
    "Example Provider",
    "Bachelor of Information Technology",
    "BIT-001",
    "Bachelor",
    "3 Years",
    "24500",
    "February, July",
    "Sydney",
    "Industry-focused undergraduate IT degree",
    "Information Technology",
    "On Campus",
    "3",
    "Years",
    "150",
    "300",
    "AUD",
    "Year 12 or equivalent",
    "IELTS 6.0 overall",
    "Scholarship: 20% international scholarship",
  ],
  [
    "Example Provider",
    "Master of Professional Accounting",
    "MPA-001",
    "Master",
    "2 Years",
    "28500",
    "March, August",
    "Melbourne",
    "Postgraduate accounting program for international students",
    "Accounting",
    "On Campus",
    "2",
    "Years",
    "150",
    "250",
    "AUD",
    "Bachelor degree",
    "IELTS 6.5 overall",
    "",
  ],
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "");
}

function cleanCell(value: unknown) {
  return String(value ?? "").trim();
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

function mapCsvRow(headers: string[], values: string[]): CourseImportRowData {
  const raw: Record<string, string> = {};

  headers.forEach((header, index) => {
    raw[header] = values[index] ?? "";
  });

  const headerMap = new Map<string, string>();
  headers.forEach((header) => {
    headerMap.set(normalizeHeader(header), header);
  });

  function getValue(possibleHeaders: string[]) {
    for (const key of possibleHeaders) {
      const sourceHeader = headerMap.get(normalizeHeader(key));
      if (sourceHeader && raw[sourceHeader] !== undefined) {
        return raw[sourceHeader];
      }
    }
    return "";
  }

  return {
    providerName: getValue(["providerName", "provider", "provider_name"]),
    providerCode: getValue(["providerCode", "provider_code"]),
    courseName: getValue(["courseName", "course", "course_name", "name"]),
    courseCode: getValue(["courseCode", "course_code", "code"]),
    level: getValue(["level"]),
    duration: getValue(["duration"]),
    tuitionFee: getValue(["tuitionFee", "tuition_fee", "fee"]),
    intakeMonths: getValue(["intakeMonths", "intakes", "intake_months"]),
    campus: getValue(["campus", "location"]),
    description: getValue(["description"]),
    category: getValue(["category"]),
    studyMode: getValue(["studyMode", "study_mode"]),
    durationValue: getValue(["durationValue", "duration_value"]),
    durationUnit: getValue(["durationUnit", "duration_unit"]),
    applicationFee: getValue(["applicationFee", "application_fee"]),
    materialFee: getValue(["materialFee", "material_fee"]),
    currency: getValue(["currency"]),
    entryRequirements: getValue([
      "entryRequirements",
      "entry_requirements",
      "requirements",
    ]),
    englishRequirements: getValue([
      "englishRequirements",
      "english_requirements",
    ]),
    notes: getValue(["notes"]),
    sourceType: "csv",
    sourceValue: undefined,
  };
}

function normalizeCsvRows(rows: CsvRow[], fileName: string): CourseImportRowData[] {
  if (!rows.length) return [];

  const headers = Object.keys(rows[0] ?? {});

  return rows.map((row, index) => {
    const values = headers.map((header) => row[header] ?? "");
    const mapped = mapCsvRow(headers, values);

    return {
      ...mapped,
      sourceType: "csv",
      sourceValue: fileName || "courses.csv",
      rawRowIndex: index + 2,
    };
  });
}

function downloadSampleCsv() {
  const csvLines = [
    SAMPLE_CSV_HEADERS.join(","),
    ...SAMPLE_CSV_ROWS.map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
    ),
  ];

  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "course-import-sample.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function normalizeWebsiteUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatMoney(value?: string | number, currency?: string) {
  if (value === undefined || value === null || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `${currency || "AUD"} ${numeric.toLocaleString()}`;
}

function getStatusLabel(row: PreviewRow) {
  if (row.isDuplicate) return "Duplicate";
  if (!row.isValid) return "Invalid";
  if (row.willImport) return "Ready";
  return "Review";
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50/70"
      : tone === "danger"
      ? "border-rose-200 bg-rose-50/70"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50/70"
      : "border-slate-200 bg-white";

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm", classes)}>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SourceModeCard({
  active,
  title,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"
          )}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p
            className={cn(
              "mt-1 text-sm leading-6",
              active ? "text-slate-300" : "text-slate-600"
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function ProviderCourseImportPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.id as string;

  const [sourceType, setSourceType] = useState<SourceType>("csv");
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<CourseImportRowData[]>([]);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>("");

  const [isParsing, setIsParsing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCommitLoading, setIsCommitLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [fileInputKey, setFileInputKey] = useState(0);

  const previewRows = preview?.rows ?? [];
  const summary = preview?.summary;

  const totalRows =
    summary?.totalRows ?? (sourceType === "csv" ? rows.length : 0);
  const readyCount = summary?.importableRows ?? 0;
  const invalidCount = summary?.invalidRows ?? 0;
  const duplicateCount = summary?.duplicateRows ?? 0;

  const topRawHeaders = useMemo(() => {
    const first = rows[0];
    return first ? Object.keys(first) : [];
  }, [rows]);

  function resetState() {
    setRows([]);
    setPreview(null);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleSourceChange(next: SourceType) {
    setSourceType(next);
    setFileName("");
    setWebsiteUrl("");
    setApiUrl("");
    setFileInputKey((prev) => prev + 1);
    resetState();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setErrorMessage("");
    setSuccessMessage("");
    setPreview(null);
    setRows([]);

    if (!file) {
      setFileName("");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("Please upload a CSV file.");
      setFileName("");
      setFileInputKey((prev) => prev + 1);
      return;
    }

    setFileName(file.name);
    setIsParsing(true);

    try {
      const text = await file.text();
      const parsedRows = parseCsv(text);

      if (!parsedRows.length) {
        setErrorMessage("No valid rows found in the CSV.");
        setFileInputKey((prev) => prev + 1);
        return;
      }

      const normalizedRows = normalizeCsvRows(parsedRows, file.name);
      setRows(normalizedRows);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to read the CSV file.");
      setFileInputKey((prev) => prev + 1);
    } finally {
      setIsParsing(false);
    }
  }

  async function handlePreviewImport() {
    setErrorMessage("");
    setSuccessMessage("");
    setPreview(null);
    setIsPreviewLoading(true);

    try {
      let payload: Record<string, unknown>;

      if (sourceType === "csv") {
        if (!rows.length) {
          throw new Error("Please upload a CSV file before previewing.");
        }

        payload = {
          sourceType: "csv",
          sourceValue: fileName || "courses.csv",
          rows,
        };
      } else if (sourceType === "website") {
        const normalizedUrl = normalizeWebsiteUrl(websiteUrl);

        if (!normalizedUrl) {
          throw new Error("Please enter a website URL.");
        }

        payload = {
          sourceType: "website",
          sourceValue: normalizedUrl,
        };
      } else {
        const normalizedUrl = normalizeWebsiteUrl(apiUrl);

        if (!normalizedUrl) {
          throw new Error("Please enter an API endpoint URL.");
        }

        payload = {
          sourceType: "api",
          sourceValue: normalizedUrl,
        };
      }

      const res = await fetch(
        `/api/providers/${providerId}/courses/import/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to preview import.");
      }

      setPreview(data as PreviewResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to preview import."
      );
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function handleCommitImport() {
    if (!preview || !preview.rows.length) {
      setErrorMessage("Please generate a preview before committing import.");
      return;
    }

    setIsCommitLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `/api/providers/${providerId}/courses/import/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceType: preview.sourceType,
            sourceValue: preview.sourceValue,
            rows: preview.rows,
          }),
        }
      );

      const data: CommitResponse | { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(
          "error" in data && data.error ? data.error : "Failed to commit import."
        );
      }

      const result = data as CommitResponse;

      setSuccessMessage(
        `Import completed. Imported ${result.importedRows} row(s), skipped ${result.skippedRows}, invalid ${result.invalidRows}. Redirecting to course catalog...`
      );

      setTimeout(() => {
        router.push(`/providers/${providerId}/courses`);
        router.refresh();
      }, 900);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to commit import."
      );
    } finally {
      setIsCommitLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-[0_14px_40px_rgba(15,23,42,0.12)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_24%)]" />
        <div className="relative px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <Link
                href={`/providers/${providerId}/courses`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 backdrop-blur-sm transition hover:bg-white/15"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Courses
              </Link>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                Provider Course Import Hub
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl xl:text-[2.6rem]">
                Import Courses into Provider
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Import provider-linked course records from CSV, website, or API.
                Preview validation, duplicates, and import readiness before
                committing clean rows into your live CRM.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-slate-100">
                  <ShieldCheck className="h-4 w-4" />
                  Preview before commit
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-slate-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Provider-linked import
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-slate-100">
                  <RefreshCw className="h-4 w-4" />
                  Duplicate-aware pipeline
                </div>
              </div>
            </div>

            <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
              <StatCard label="Parsed Rows" value={totalRows} />
              <StatCard label="Ready to Import" value={readyCount} tone="success" />
              <StatCard label="Invalid Rows" value={invalidCount} tone="danger" />
              <StatCard label="Duplicates" value={duplicateCount} tone="warning" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="xl:col-span-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <SourceModeCard
                active={sourceType === "csv"}
                title="CSV Upload"
                description="Upload a course spreadsheet and generate a safe preview before database commit."
                icon={<Upload className="h-5 w-5" />}
                onClick={() => handleSourceChange("csv")}
              />
              <SourceModeCard
                active={sourceType === "website"}
                title="Website URL"
                description="Preview course details from an institution website before allowing any import action."
                icon={<Globe className="h-5 w-5" />}
                onClick={() => handleSourceChange("website")}
              />
              <SourceModeCard
                active={sourceType === "api"}
                title="API Endpoint"
                description="Fetch course data from external API and preview before import."
                icon={<FileSpreadsheet className="h-5 w-5" />}
                onClick={() => handleSourceChange("api")}
              />
            </div>

            {sourceType === "csv" ? (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Upload Course CSV
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use a structured CSV export to import provider-linked courses in
                  bulk. Preview will validate rows and duplicate detection first.
                </p>

                <div className="mt-6">
                  <label
                    htmlFor="course-csv-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:bg-slate-100"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                      {isParsing ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Upload className="h-6 w-6" />
                      )}
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-900">
                      {isParsing ? "Reading CSV..." : "Choose course CSV file"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Upload a clean .csv file for preview
                    </p>
                  </label>

                  <input
                    key={fileInputKey}
                    id="course-csv-upload"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    disabled={isPreviewLoading || isCommitLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Download Sample CSV
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Selected file
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {fileName || "None"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Parsed rows
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {rows.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Recommended columns
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      providerName, courseName, courseCode, level, duration,
                      tuitionFee, intakeMonths, campus, studyMode, entryRequirements
                    </p>
                  </div>
                </div>
              </div>
            ) : sourceType === "website" ? (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Website Import Preview
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Paste an institution course page URL and preview extracted course
                  data before anything is committed to production.
                </p>

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Course Website URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://www.example.edu.au/courses"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Safe import mode
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Website mode always previews first. This protects live course
                    records and keeps the pipeline production-safe.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  API Import Preview
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter an API endpoint and preview normalized course rows before
                  importing to this provider.
                </p>

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    API Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.example.edu.au/courses"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Safe import mode
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    API mode previews normalized rows before commit so only clean,
                    provider-linked course rows move forward.
                  </p>
                </div>
              </div>
            )}

            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handlePreviewImport}
                disabled={
                  isParsing ||
                  isPreviewLoading ||
                  isCommitLoading ||
                  (sourceType === "csv"
                    ? rows.length === 0
                    : sourceType === "website"
                    ? !websiteUrl.trim()
                    : !apiUrl.trim())
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPreviewLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Preview Import
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCommitImport}
                disabled={
                  !preview ||
                  readyCount === 0 ||
                  isPreviewLoading ||
                  isCommitLoading
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCommitLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Commit Import
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/providers/${providerId}/courses`)}
                disabled={isPreviewLoading || isCommitLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Courses
              </button>
            </div>
          </div>
        </section>

        <section className="xl:col-span-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Rows" value={totalRows} />
            <StatCard label="Importable" value={readyCount} tone="success" />
            <StatCard label="Invalid" value={invalidCount} tone="danger" />
            <StatCard label="Duplicates" value={duplicateCount} tone="warning" />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Preview Results
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Review validation, duplicate detection, and row-level course
                details before import.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Course
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Fee
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Campus
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {!previewRows.length ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        No preview yet. Upload a course CSV, paste a website URL,
                        or enter an API endpoint to begin.
                      </td>
                    </tr>
                  ) : (
                    previewRows.map((row) => {
                      const issues = [
                        ...row.errors,
                        row.isDuplicate ? row.duplicateReason ?? "Duplicate row" : null,
                      ].filter(Boolean) as string[];

                      return (
                        <tr key={row.rowId} className="align-top">
                          <td className="px-4 py-4 text-slate-900">
                            {row.rawRowIndex ?? "-"}
                          </td>

                          <td className="px-4 py-4 text-slate-900">
                            <div className="font-semibold">
                              {row.data.courseName || "-"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.data.level || "No level"}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {row.matchedProviderName ||
                              row.data.providerName ||
                              "Provider linked"}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {row.data.courseCode || "-"}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {formatMoney(row.data.tuitionFee, row.data.currency)}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {row.data.campus || "-"}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                row.willImport
                                  ? "bg-emerald-100 text-emerald-700"
                                  : row.isDuplicate
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-rose-100 text-rose-700"
                              )}
                            >
                              {getStatusLabel(row)}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {issues.length ? (
                              <ul className="space-y-1 text-xs">
                                {issues.map((issue, index) => (
                                  <li key={`${row.rowId}-${index}`}>• {issue}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-xs text-emerald-700">
                                Ready for import
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {sourceType === "csv" && topRawHeaders.length > 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Parsed CSV Snapshot
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  First rows parsed from your uploaded CSV before preview
                  validation.
                </p>
              </div>

              <div className="overflow-x-auto px-6 py-6">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      {topRawHeaders.map((header) => (
                        <th
                          key={header}
                          className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 6).map((row, rowIndex) => (
                      <tr key={rowIndex} className="rounded-2xl bg-slate-50">
                        {topRawHeaders.map((header) => (
                          <td
                            key={header}
                            className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                          >
                            {String(
                              (row as Record<string, unknown>)[header] ?? ""
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {rows.length > 6 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    Showing first 6 parsed rows only.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <section className="grid gap-5 xl:grid-cols-3">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <Upload className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-950">
                  Step 1: Upload or Fetch Courses
                </h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Start from CSV, website, or API so validation can parse fields,
                normalize values, and prepare a reliable preview.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <ShieldCheck className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-950">
                  Step 2: Validate & Deduplicate
                </h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Detect invalid rows and duplicate course records before import so
                only safe provider-linked rows move forward.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <FileSpreadsheet className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-950">
                  Step 3: Import Courses
                </h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Commit only clean rows into the provider workspace and stay in the
                provider course flow.
              </p>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}