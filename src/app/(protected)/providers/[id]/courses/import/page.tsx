"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

type SourceType = "csv" | "website" | "api";

type PreviewRow = {
  rowId: string;
  rawRowIndex?: number;
  data: {
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

type CsvRow = Record<string, unknown>;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "");
}

function parseCsvLine(line: string) {
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

function mapCsvRow(headers: string[], values: string[]): CsvRow {
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
  };
}

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return mapCsvRow(headers, values);
  });
}

function formatMoney(value?: string | number, currency?: string) {
  if (value === undefined || value === null || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `${currency || "AUD"} ${numeric.toLocaleString()}`;
}

export default function ProviderCourseImportPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.id as string;

  const [sourceType, setSourceType] = useState<SourceType>("csv");
  const [sourceValue, setSourceValue] = useState("");
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<CsvRow[]>([]);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const summary = preview?.summary;
  const previewRows = preview?.rows ?? [];

  const topRawHeaders = useMemo(() => {
    const first = rawRows[0];
    return first ? Object.keys(first) : [];
  }, [rawRows]);

  async function handleFileChange(file: File | null) {
    setErrorMessage("");
    setSuccessMessage("");
    setPreview(null);

    if (!file) {
      setFileName("");
      setRawRows([]);
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (!rows.length) {
        setFileName(file.name);
        setRawRows([]);
        setErrorMessage(
          "No importable rows were found in the CSV. Please check the header row and file content."
        );
        return;
      }

      setFileName(file.name);
      setRawRows(rows);
    } catch (error) {
      setFileName(file.name);
      setRawRows([]);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to read CSV file."
      );
    }
  }

  async function handlePreviewImport() {
    if (!rawRows.length) {
      setErrorMessage("Please upload a CSV file before previewing.");
      return;
    }

    setPreviewLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setPreview(null);

    try {
      const res = await fetch(`/api/providers/${providerId}/courses/import/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceType,
          sourceValue: sourceValue.trim() || undefined,
          rows: rawRows,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to preview import.");
      }

      setPreview(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to preview import."
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCommitImport() {
    if (!preview || !preview.rows.length) {
      setErrorMessage("Please generate a preview before committing import.");
      return;
    }

    setCommitLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/providers/${providerId}/courses/import/commit`, {
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
      setCommitLoading(false);
    }
  }

  const readyCount = summary?.importableRows ?? 0;
  const invalidCount = summary?.invalidRows ?? 0;
  const duplicateCount = summary?.duplicateRows ?? 0;
  const totalRows = summary?.totalRows ?? rawRows.length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/providers/${providerId}/courses`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white ring-1 ring-white/10 transition hover:bg-white/15"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Courses
                </Link>

                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white ring-1 ring-white/10">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Provider Course Import Hub
                </span>
              </div>

              <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-5xl">
                Import Courses into Provider
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Upload course records from CSV now and preview validation,
                duplicates, and import readiness in a controlled provider-linked
                workflow before committing clean rows into your live CRM.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/10">
                  <ShieldCheck className="h-4 w-4" />
                  Preview before commit
                </span>

                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/10">
                  <CheckCircle2 className="h-4 w-4" />
                  Provider-linked import
                </span>

                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/10">
                  <RefreshCw className="h-4 w-4" />
                  Duplicate-aware pipeline
                </span>
              </div>
            </div>

            <div className="grid w-full gap-4 xl:max-w-[580px] xl:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/95 p-5 text-slate-950">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Parsed Rows
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-tight">
                  {totalRows}
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-5 text-slate-950">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700/70">
                  Ready to Import
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-emerald-700">
                  {readyCount}
                </p>
              </div>

              <div className="rounded-3xl border border-red-200 bg-red-50/90 p-5 text-slate-950">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-red-700/70">
                  Invalid Rows
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-red-700">
                  {invalidCount}
                </p>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-5 text-slate-950">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700/70">
                  Duplicates
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-amber-700">
                  {duplicateCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 p-6">
            <div className="rounded-[24px] border border-slate-200 bg-[#0b1534] p-5 text-white shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <Upload className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">CSV Upload</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Upload a course spreadsheet and generate a safe preview before
                    database commit.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-700">
                  <Globe className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Website URL
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Website-based course ingestion can be added later using the same
                    preview and validation pipeline.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                Upload Course CSV
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Use a structured CSV export to import provider-linked courses in
                bulk. Preview will validate rows and detect duplicates before any
                commit action.
              </p>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Source Type
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as SourceType)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                >
                  <option value="csv">CSV</option>
                  <option value="website">Website</option>
                  <option value="api">API</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Source Value
                </label>
                <input
                  value={sourceValue}
                  onChange={(e) => setSourceValue(e.target.value)}
                  placeholder="Optional source reference"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/samples/course-import-template.csv"
                  download
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Download Sample CSV
                </a>
              </div>

              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-100">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-sm">
                  <Upload className="h-7 w-7" />
                </div>

                <h4 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
                  Choose course CSV file
                </h4>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                  Upload a clean .csv file for preview. The system will parse rows,
                  validate structure, detect duplicates, and prepare safe import
                  results.
                </p>

                <div className="mt-5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                  {fileName || "No file selected"}
                </div>

                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
              </label>

              {rawRows.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">
                    File ready for preview
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {rawRows.length} parsed row(s) detected from {fileName}.
                  </p>
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Total Rows
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {totalRows}
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700/70">
                Importable
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-emerald-700">
                {readyCount}
              </p>
            </div>

            <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-red-700/70">
                Invalid
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-red-700">
                {invalidCount}
              </p>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700/70">
                Duplicates
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-amber-700">
                {duplicateCount}
              </p>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Import Controls
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Preview validation first, then commit only the clean course rows.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handlePreviewImport}
                  disabled={previewLoading || rawRows.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {previewLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Previewing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Preview Import
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={commitLoading || !preview || readyCount === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {commitLoading ? (
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
                  onClick={() => router.back()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[90px_220px_160px_130px_130px_140px_130px_1fr] border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <div>Row</div>
                  <div>Course</div>
                  <div>Provider</div>
                  <div>Code</div>
                  <div>Fee</div>
                  <div>Campus</div>
                  <div>Status</div>
                  <div>Notes</div>
                </div>

                {previewRows.length === 0 ? (
                  <div className="px-6 py-16 text-center text-sm text-slate-500">
                    No preview yet. Upload a course CSV and click Preview Import to
                    validate rows before commit.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {previewRows.map((row) => {
                      const issues = [
                        ...row.errors,
                        row.isDuplicate ? row.duplicateReason ?? "Duplicate row" : null,
                      ].filter(Boolean) as string[];

                      return (
                        <div
                          key={row.rowId}
                          className="grid grid-cols-[90px_220px_160px_130px_130px_140px_130px_1fr] px-6 py-4 text-sm"
                        >
                          <div className="font-medium text-slate-900">
                            #{row.rawRowIndex ?? "-"}
                          </div>

                          <div>
                            <div className="font-semibold text-slate-900">
                              {row.data.courseName || "Untitled course"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.data.level || "No level"}
                            </div>
                          </div>

                          <div>
                            <div className="font-medium text-slate-900">
                              {row.matchedProviderName ||
                                row.data.providerName ||
                                "Not matched"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.matchedProviderId || "No provider id"}
                            </div>
                          </div>

                          <div className="text-slate-700">
                            {row.data.courseCode || "—"}
                          </div>

                          <div className="text-slate-700">
                            {formatMoney(row.data.tuitionFee, row.data.currency)}
                          </div>

                          <div className="text-slate-700">
                            {row.data.campus || "—"}
                          </div>

                          <div>
                            {row.willImport ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Ready
                              </span>
                            ) : row.isDuplicate ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                <AlertCircle className="h-4 w-4" />
                                Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                <XCircle className="h-4 w-4" />
                                Invalid
                              </span>
                            )}
                          </div>

                          <div>
                            {issues.length > 0 ? (
                              <ul className="space-y-1 text-xs text-slate-600">
                                {issues.map((issue, index) => (
                                  <li key={`${row.rowId}-${index}`}>• {issue}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Clean row
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {topRawHeaders.length > 0 ? (
            <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                  Parsed CSV Snapshot
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  First rows parsed from your uploaded CSV before preview validation.
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
                    {rawRows.slice(0, 6).map((row, rowIndex) => (
                      <tr key={rowIndex} className="rounded-2xl bg-slate-50">
                        {topRawHeaders.map((header) => (
                          <td
                            key={header}
                            className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                          >
                            {String(row[header] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {rawRows.length > 6 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    Showing first 6 parsed rows only.
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="grid gap-5 xl:grid-cols-3">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <Upload className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-950">
                  Step 1: Upload Course CSV
                </h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Start with a clean course dataset so validation can parse fields,
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
                Commit only clean rows into the provider workspace and redirect
                back to the course catalog automatically.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}