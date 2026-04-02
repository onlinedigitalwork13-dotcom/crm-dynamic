"use client";

import { useMemo, useState } from "react";

type PreviewRow = {
  rowId: string;
  rawRowIndex?: number;
  data: {
    providerName: string;
    courseName: string;
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
    sourceType: "csv" | "website" | "api";
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

type PreviewResult = {
  sourceType: "csv" | "website" | "api";
  sourceValue?: string;
  rows: PreviewRow[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    importableRows: number;
    unmatchedProviders: number;
  };
};

type CommitResult = {
  importJobId: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  invalidRows: number;
};

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

function parseCsv(text: string): Record<string, unknown>[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

function getStatusLabel(row: PreviewRow) {
  if (row.isDuplicate) return "Duplicate";
  if (!row.isValid) return "Invalid";
  if (row.willImport) return "Ready";
  return "Review";
}

export default function ProviderCourseImportPage() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCommitLoading, setIsCommitLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasRows = rows.length > 0;

  const readyRows = useMemo(
    () => preview?.rows.filter((row) => row.willImport).length ?? 0,
    [preview]
  );

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
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
      return;
    }

    setFileName(file.name);
    setIsParsing(true);

    try {
      const text = await file.text();
      const parsedRows = parseCsv(text);

      if (!parsedRows.length) {
        setError("No valid rows found in the CSV.");
        return;
      }

      setRows(parsedRows);
    } catch (err) {
      console.error(err);
      setError("Failed to read the CSV file.");
    } finally {
      setIsParsing(false);
    }
  }

  async function handlePreview() {
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
      const response = await fetch("/api/courses/import/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceType: "csv",
          sourceValue: fileName || "courses.csv",
          rows,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to preview import.");
        return;
      }

      setPreview(data);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while previewing the import.");
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
      const response = await fetch("/api/courses/import/commit", {
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

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to import rows.");
        return;
      }

      setCommitResult(data);
      setSuccessMessage(
        `Import completed. ${data.importedRows} row(s) imported and ${data.skippedRows} row(s) skipped.`
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong while committing the import.");
    } finally {
      setIsCommitLoading(false);
    }
  }

  function handleReset() {
    setFileName("");
    setRows([]);
    setPreview(null);
    setCommitResult(null);
    setError("");
    setSuccessMessage("");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Provider Operations
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                Course Import
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600">
                Upload provider course data via CSV and preview everything before it
                touches live records.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Suggested columns</p>
              <p className="mt-1">
                providerName, courseName, courseCode, level, duration,
                tuitionFee, intakeMonths, campus, studyMode, currency
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Upload CSV</h2>
              <p className="mt-2 text-sm text-gray-600">
                Import courses from a spreadsheet export. Preview runs server-side
                validation, provider matching, and duplicate detection.
              </p>

              <div className="mt-6">
                <label
                  htmlFor="csv-upload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:bg-gray-100"
                >
                  <span className="text-sm font-medium text-gray-900">
                    Choose CSV file
                  </span>
                  <span className="mt-1 text-sm text-gray-500">
                    Upload a .csv file with course rows
                  </span>
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-gray-500">Selected file</span>
                  <span className="font-medium text-gray-900">
                    {fileName || "None"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-gray-500">Parsed rows</span>
                  <span className="font-medium text-gray-900">{rows.length}</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-gray-500">Ready to import</span>
                  <span className="font-medium text-gray-900">{readyRows}</span>
                </div>
              </div>

              {error ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              ) : null}

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={
                    !hasRows || isParsing || isPreviewLoading || isCommitLoading
                  }
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isParsing
                    ? "Reading CSV..."
                    : isPreviewLoading
                    ? "Generating Preview..."
                    : "Preview Import"}
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
                  className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCommitLoading ? "Importing..." : "Import Ready Rows"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isPreviewLoading || isCommitLoading}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset
                </button>
              </div>

              {commitResult ? (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Import Result
                  </h3>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Import Job ID</span>
                      <span className="font-medium text-gray-900">
                        {commitResult.importJobId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Rows</span>
                      <span className="font-medium text-gray-900">
                        {commitResult.totalRows}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Imported</span>
                      <span className="font-medium text-gray-900">
                        {commitResult.importedRows}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Skipped</span>
                      <span className="font-medium text-gray-900">
                        {commitResult.skippedRows}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Invalid</span>
                      <span className="font-medium text-gray-900">
                        {commitResult.invalidRows}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Rows</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {preview?.summary.totalRows ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Importable Rows</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {preview?.summary.importableRows ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Invalid Rows</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {preview?.summary.invalidRows ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Duplicates</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {preview?.summary.duplicateRows ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Unmatched Providers</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {preview?.summary.unmatchedProviders ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Valid Rows</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {preview?.summary.validRows ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Preview Results
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Review provider matching, duplicates, and row-level validation
                  before import.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">
                        Row
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">
                        Provider
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">
                        Course
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">
                        Intake
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">
                        Matched Provider
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">
                        Notes
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {!preview?.rows.length ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-gray-500"
                        >
                          No preview yet. Upload a CSV and click Preview Import.
                        </td>
                      </tr>
                    ) : (
                      preview.rows.map((row) => (
                        <tr key={row.rowId} className="align-top">
                          <td className="px-4 py-4 text-gray-900">
                            {row.rawRowIndex ?? "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-900">
                            {row.data.providerName || "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-900">
                            {row.data.courseName || "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {row.data.courseCode || "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {row.data.intakeMonths || "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {row.matchedProviderName || "Not matched"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={[
                                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                                row.willImport
                                  ? "bg-green-100 text-green-700"
                                  : row.isDuplicate
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700",
                              ].join(" ")}
                            >
                              {getStatusLabel(row)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            <div className="space-y-1">
                              {row.duplicateReason ? (
                                <p>{row.duplicateReason}</p>
                              ) : null}
                              {row.errors.map((item, errorIndex) => (
                                <p key={`${row.rowId}-${errorIndex}`}>{item}</p>
                              ))}
                              {!row.duplicateReason &&
                              row.errors.length === 0 ? (
                                <p className="text-gray-500">
                                  Ready for import
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
          </div>
        </div>
      </div>
    </div>
  );
}