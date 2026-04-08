"use client";

import Link from "next/link";
import { type ChangeEvent, type ReactNode, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Globe2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";

type SourceType = "csv" | "website" | "api";

type ProviderImportRowData = {
  name: string;
  code?: string;
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  legalName?: string;
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
  sourceType: "csv" | "website" | "api";
  sourceValue?: string;
  rawRowIndex?: number;
};

type ProviderPreviewRow = {
  rowId: string;
  rawRowIndex?: number;
  data: ProviderImportRowData;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  matchedProviderId?: string;
  matchedProviderName?: string;
  willImport: boolean;
};

type ProviderPreviewResult = {
  sourceType: "csv" | "website" | "api";
  sourceValue?: string;
  rows: ProviderPreviewRow[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    importableRows: number;
  };
};

type ProviderCommitResult = {
  importJobId?: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  message?: string;
};

type CsvRow = Record<string, string>;

const SAMPLE_CSV_HEADERS = [
  "name",
  "code",
  "country",
  "city",
  "email",
  "phone",
  "website",
  "description",
  "legalName",
  "defaultCurrency",
  "supportEmail",
  "supportPhone",
  "admissionEmail",
  "financeEmail",
  "applicationUrl",
  "portalUrl",
  "logoUrl",
  "address",
  "notes",
];

const SAMPLE_CSV_ROWS = [
  [
    "Deakin University",
    "DEAKIN",
    "Australia",
    "Melbourne",
    "info@deakin.edu.au",
    "+61 3 9244 6100",
    "https://www.deakin.edu.au",
    "Public university with strong international student pathways",
    "Deakin University",
    "AUD",
    "support@deakin.edu.au",
    "+61 3 9244 6100",
    "admissions@deakin.edu.au",
    "finance@deakin.edu.au",
    "https://www.deakin.edu.au/study/apply",
    "https://www.deakin.edu.au/students",
    "https://www.deakin.edu.au/logo.png",
    "221 Burwood Highway, Burwood VIC 3125",
    "Priority provider for postgraduate programs",
  ],
  [
    "La Trobe University",
    "LATROBE",
    "Australia",
    "Melbourne",
    "info@latrobe.edu.au",
    "+61 3 9479 1111",
    "https://www.latrobe.edu.au",
    "Multi-campus institution with broad academic pathways",
    "La Trobe University",
    "AUD",
    "support@latrobe.edu.au",
    "+61 3 9479 1111",
    "admissions@latrobe.edu.au",
    "finance@latrobe.edu.au",
    "https://www.latrobe.edu.au/study/apply",
    "https://www.latrobe.edu.au/students",
    "https://www.latrobe.edu.au/logo.png",
    "Plenty Road, Bundoora VIC 3086",
    "Strong fit for business and IT recruitment",
  ],
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function cleanCell(value: unknown) {
  return String(value ?? "").trim();
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
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

function normalizeCsvRows(
  rows: CsvRow[],
  fileName: string
): ProviderImportRowData[] {
  return rows.map((row, index) => ({
    name: cleanCell(row.name || row.providerName),
    code: cleanCell(row.code),
    country: cleanCell(row.country),
    city: cleanCell(row.city),
    email: cleanCell(row.email),
    phone: cleanCell(row.phone),
    website: cleanCell(row.website),
    description: cleanCell(row.description),
    legalName: cleanCell(row.legalName),
    defaultCurrency: cleanCell(row.defaultCurrency),
    supportEmail: cleanCell(row.supportEmail),
    supportPhone: cleanCell(row.supportPhone),
    admissionEmail: cleanCell(row.admissionEmail),
    financeEmail: cleanCell(row.financeEmail),
    applicationUrl: cleanCell(row.applicationUrl),
    portalUrl: cleanCell(row.portalUrl),
    logoUrl: cleanCell(row.logoUrl),
    address: cleanCell(row.address),
    notes: cleanCell(row.notes),
    sourceType: "csv",
    sourceValue: fileName || "providers.csv",
    rawRowIndex: index + 2,
  }));
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
  link.setAttribute("download", "provider-import-sample.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getStatusLabel(row: ProviderPreviewRow) {
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

export default function ProviderImportPage() {
  const [sourceType, setSourceType] = useState<SourceType>("csv");
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<ProviderImportRowData[]>([]);
  const [preview, setPreview] = useState<ProviderPreviewResult | null>(null);
  const [commitResult, setCommitResult] =
    useState<ProviderCommitResult | null>(null);

  const [websiteUrl, setWebsiteUrl] = useState<string>("");

  const [isParsing, setIsParsing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCommitLoading, setIsCommitLoading] = useState(false);

  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [fileInputKey, setFileInputKey] = useState(0);

  const hasRows = rows.length > 0;

  const readyRows = useMemo(
    () => preview?.rows.filter((row) => row.willImport).length ?? 0,
    [preview]
  );

  function resetState() {
    setRows([]);
    setPreview(null);
    setCommitResult(null);
    setError("");
    setSuccessMessage("");
  }

  function handleSourceChange(next: SourceType) {
    setSourceType(next);
    setFileName("");
    setWebsiteUrl("");
    setFileInputKey((prev) => prev + 1);
    resetState();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setError("");
    setSuccessMessage("");
    setCommitResult(null);
    setPreview(null);
    setRows([]);

    if (!file) {
      setFileName("");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file.");
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
        setError("No valid rows found in the CSV.");
        setFileInputKey((prev) => prev + 1);
        return;
      }

      const normalizedRows = normalizeCsvRows(parsedRows, file.name);
      setRows(normalizedRows);
    } catch (err) {
      console.error(err);
      setError("Failed to read the CSV file.");
      setFileInputKey((prev) => prev + 1);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleCsvPreview() {
    if (!rows.length) {
      setError("Please upload a CSV with at least one row.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setCommitResult(null);
    setIsPreviewLoading(true);
    setPreview(null);

    try {
      const response = await fetch("/api/providers/import/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceType: "csv",
          sourceValue: fileName || "providers.csv",
          rows,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to preview provider import.");
        return;
      }

      setPreview(data as ProviderPreviewResult);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while previewing the CSV import.");
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function handleWebsitePreview() {
  const rawUrl = (websiteUrl || "").trim();

  if (!rawUrl) {
    setError("Please enter a website URL.");
    return;
  }

  const normalizedWebsiteUrl = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : `https://${rawUrl}`;

  setError("");
  setSuccessMessage("");
  setCommitResult(null);
  setIsPreviewLoading(true);
  setPreview(null);

  try {
    const response = await fetch("/api/providers/import/website", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: normalizedWebsiteUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Failed to preview website import.");
      return;
    }

    setPreview(data as ProviderPreviewResult);
  } catch (err) {
    console.error(err);
    setError("Something went wrong while previewing the website import.");
  } finally {
    setIsPreviewLoading(false);
  }
}

  async function handleImport() {
    if (!preview) {
      setError("Please generate a preview first.");
      return;
    }

    if (!preview.rows.some((row) => row.willImport)) {
      setError("There are no importable rows to commit.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setCommitResult(null);
    setIsCommitLoading(true);

    try {
      const response = await fetch("/api/providers/import/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceType: preview.sourceType,
          sourceValue: preview.sourceValue,
          rows: preview.rows,
        }),
      });

      const rawText = await response.text();

      let data: unknown = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        console.error("Non-JSON commit response:", rawText);
        throw new Error(
          "Commit API returned a non-JSON response. Check the server route or server error."
        );
      }

      if (!response.ok) {
        const errorMessage =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to import provider rows.";

        setError(errorMessage);
        return;
      }

      const result = data as ProviderCommitResult;

      setCommitResult(result);
      setSuccessMessage(
        result.message ||
          `Import completed. ${result.importedCount} provider(s) imported, ${result.skippedCount} skipped, ${result.failedCount} failed.`
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while committing the provider import."
      );
    } finally {
      setIsCommitLoading(false);
    }
  }

  function handleReset() {
    setFileName("");
    setWebsiteUrl("");
    setFileInputKey((prev) => prev + 1);
    resetState();
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-[0_14px_40px_rgba(15,23,42,0.12)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_24%)]" />
        <div className="relative px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <Link
                href="/providers"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 backdrop-blur-sm transition hover:bg-white/15"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Providers
              </Link>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                Provider Import Hub
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl xl:text-[2.6rem]">
                Import Education Providers
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Import provider records from CSV now, and preview website-based
                ingestion in a controlled workflow. Review validation, detect
                duplicates, and commit only clean rows into your live CRM.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-slate-100">
                  <ShieldCheck className="h-4 w-4" />
                  Preview before commit
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-slate-100">
                  <Building2 className="h-4 w-4" />
                  Provider-first architecture
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-slate-100">
                  <FileSpreadsheet className="h-4 w-4" />
                  Sync-ready data pipeline
                </div>
              </div>
            </div>

            <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
              <StatCard label="Parsed Rows" value={rows.length} />
              <StatCard
                label="Ready to Import"
                value={readyRows}
                tone="success"
              />
              <StatCard
                label="Invalid Rows"
                value={preview?.summary.invalidRows ?? 0}
                tone="danger"
              />
              <StatCard
                label="Duplicates"
                value={preview?.summary.duplicateRows ?? 0}
                tone="warning"
              />
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
                description="Upload a provider spreadsheet and generate a safe preview before database commit."
                icon={<Upload className="h-5 w-5" />}
                onClick={() => handleSourceChange("csv")}
              />
              <SourceModeCard
                active={sourceType === "website"}
                title="Website URL"
                description="Preview provider details from a website source before you allow any import action."
                icon={<Globe2 className="h-5 w-5" />}
                onClick={() => handleSourceChange("website")}
              />
              <SourceModeCard
  active={sourceType === "api"}
  title="API Endpoint"
  description="Fetch provider data from external API and preview before import."
  icon={<Globe2 className="h-5 w-5" />}
  onClick={() => handleSourceChange("api")}
/>
            </div>

            {sourceType === "csv" ? (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Upload Provider CSV
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use a structured CSV export to import providers in bulk.
                  Preview will run validation and duplicate detection first.
                </p>

                <div className="mt-6">
                  <label
                    htmlFor="provider-csv-upload"
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
                      {isParsing ? "Reading CSV..." : "Choose provider CSV file"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Upload a clean .csv file for preview
                    </p>
                  </label>

                  <input
                    key={fileInputKey}
                    id="provider-csv-upload"
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
                      name, code, country, city, email, website, legalName,
                      defaultCurrency, supportEmail, applicationUrl
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Website Import Preview
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Paste a provider website URL and preview extracted data before
                  anything is committed to production.
                </p>

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Provider Website URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl || ""}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://www.example.edu.au"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Safe import mode
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Website mode should always preview first. This protects live
                    provider records and keeps the pipeline production-safe.
                  </p>
                </div>
              </div>
            )}

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
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
                onClick={
                  sourceType === "csv" ? handleCsvPreview : handleWebsitePreview
                }
                disabled={
                  isParsing ||
                  isPreviewLoading ||
                  isCommitLoading ||
                  (sourceType === "csv" ? !hasRows : !(websiteUrl || "").trim())
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
                onClick={handleImport}
                disabled={
                  !preview ||
                  readyRows === 0 ||
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
                    <Building2 className="h-4 w-4" />
                    Import Ready Providers
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isPreviewLoading || isCommitLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>

            {commitResult ? (
              <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Import Result
                </h3>

                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4">
                    <span>Import Job ID</span>
                    <span className="font-medium text-slate-900">
                      {commitResult.importJobId || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Total Rows</span>
                    <span className="font-medium text-slate-900">
                      {commitResult.totalRows}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Imported</span>
                    <span className="font-medium text-slate-900">
                      {commitResult.importedCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Skipped</span>
                    <span className="font-medium text-slate-900">
                      {commitResult.skippedCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Failed</span>
                    <span className="font-medium text-slate-900">
                      {commitResult.failedCount}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="xl:col-span-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Rows"
              value={preview?.summary.totalRows ?? 0}
            />
            <StatCard
              label="Importable"
              value={preview?.summary.importableRows ?? 0}
              tone="success"
            />
            <StatCard
              label="Invalid"
              value={preview?.summary.invalidRows ?? 0}
              tone="danger"
            />
            <StatCard
              label="Duplicates"
              value={preview?.summary.duplicateRows ?? 0}
              tone="warning"
            />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Preview Results
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Review validation, duplicate detection, and row-level provider
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
                      Provider
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Country
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      City
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      Website
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
                  {!preview?.rows.length ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        No preview yet. Upload a provider CSV or paste a website
                        URL to begin.
                      </td>
                    </tr>
                  ) : (
                    preview.rows.map((row) => (
                      <tr key={row.rowId} className="align-top">
                        <td className="px-4 py-4 text-slate-900">
                          {row.rawRowIndex ?? "-"}
                        </td>

                        <td className="px-4 py-4 text-slate-900">
                          {row.data.name || "-"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {row.data.code || "-"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {row.data.country || "-"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {row.data.city || "-"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          <span className="break-all">
                            {row.data.website || "-"}
                          </span>
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
                          <div className="space-y-1">
                            {row.duplicateReason ? (
                              <p>{row.duplicateReason}</p>
                            ) : null}

                            {row.errors.map((item, errorIndex) => (
                              <p key={`${row.rowId}-${errorIndex}`}>{item}</p>
                            ))}

                            {!row.duplicateReason && row.errors.length === 0 ? (
                              <p className="inline-flex items-center gap-1 text-emerald-700">
                                {row.willImport ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Ready for import
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    Review row
                                  </>
                                )}
                              </p>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Step 1: Provider Import
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Build a clean parent dataset first so all downstream modules can
                rely on stable provider records.
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Step 2: Validate & Deduplicate
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Prevent duplicate provider records and maintain a premium,
                production-safe CRM dataset.
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Step 3: Import Courses
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Once providers are stable, course import becomes cleaner,
                faster, and safer to scale.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}