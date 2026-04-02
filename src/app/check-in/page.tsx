"use client";

import { useMemo, useState } from "react";
import DynamicFormRenderer from "@/components/forms/dynamic-form-renderer";
import { clientMasterSchema } from "@/components/forms/client-master-schema";
import { useDynamicForm } from "@/components/forms/use-dynamic-form";

type LookupResult =
  | {
      success: true;
      mode: "existing_client";
      client: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        passport: string | null;
        branchId: string | null;
      };
    }
  | {
      success: true;
      mode: "existing_intake_submission";
      intakeSubmission: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        passportNumber: string | null;
        branchId: string | null;
        clientId: string | null;
      };
    }
  | {
      success: true;
      mode: "new";
    }
  | null;

type UploadedDocument = {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
};

const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;

function toSafeString(value: unknown) {
  if (value == null) return "";
  return String(value);
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-gray-900">
        {value && value.trim() ? value : "-"}
      </p>
    </div>
  );
}

function DocumentUploadCard({
  documents,
  setDocuments,
  uploadedDocuments,
  uploading,
  uploadError,
}: {
  documents: File[];
  setDocuments: React.Dispatch<React.SetStateAction<File[]>>;
  uploadedDocuments: UploadedDocument[];
  uploading: boolean;
  uploadError: string;
}) {
  function handleFileChange(fileList: FileList | null) {
    if (!fileList) return;

    const nextFiles = Array.from(fileList);

    const tooLarge = nextFiles.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (tooLarge) {
      alert(
        `${tooLarge.name} is larger than 4.5 MB. Please upload a smaller file.`
      );
      return;
    }

    setDocuments((prev) => {
      const existingKeys = new Set(
        prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
      );

      const deduped = nextFiles.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        return !existingKeys.has(key);
      });

      return [...prev, ...deduped];
    });
  }

  function removePendingFile(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            Documents
          </p>
          <h3 className="mt-2 text-xl font-bold text-gray-900">
            Upload supporting files
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Add passport copies, offer letters, ID, or other supporting documents
            during check-in. Files are uploaded after the check-in is completed.
          </p>
        </div>

        <div className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700">
          Optional
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Select one or more files
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Recommended for documents under 4.5 MB each.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            Choose Files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFileChange(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {documents.length > 0 ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            Pending uploads
          </p>

          {documents.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {file.type || "Unknown file type"} • {formatFileSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removePendingFile(index)}
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {uploading ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Uploading documents...
        </div>
      ) : null}

      {uploadError ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {uploadError}
        </div>
      ) : null}

      {uploadedDocuments.length > 0 ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            Uploaded documents
          </p>

          {uploadedDocuments.map((document) => (
            <a
              key={document.id}
              href={document.filePath}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 transition hover:bg-green-100 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-green-900">
                  {document.title}
                </p>
                <p className="mt-1 text-xs text-green-700">
                  {document.fileName}
                  {typeof document.fileSize === "number"
                    ? ` • ${formatFileSize(document.fileSize)}`
                    : ""}
                </p>
              </div>

              <span className="text-sm font-semibold text-green-800">
                View
              </span>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CheckInPage() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [passportNumber, setPassportNumber] = useState("");

  const [result, setResult] = useState<LookupResult>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [visitReason, setVisitReason] = useState("");
  const [notes, setNotes] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>(
    []
  );

  const {
    values: dynamicValues,
    setValue: setDynamicValue,
    resetValues: resetDynamicValues,
  } = useDynamicForm(clientMasterSchema);

  const FALLBACK_BRANCH_ID = "cmmx2b8bx0005fhgskyb9dj1c";
  const FALLBACK_INTAKE_FORM_REQUEST_ID = "cmmx2lic8000yfhmovxoszssx";

  const canLookup = useMemo(() => {
    return (
      phone.trim().length > 0 ||
      email.trim().length > 0 ||
      passportNumber.trim().length > 0
    );
  }, [phone, email, passportNumber]);

  const firstName = toSafeString(dynamicValues.firstName).trim();
  const surname = toSafeString(dynamicValues.surname).trim();
  const mobile = toSafeString(dynamicValues.mobile).trim();

  async function uploadDocumentsForClient(clientId: string) {
    if (!documents.length) return;

    setUploading(true);
    setUploadError("");

    const uploaded: UploadedDocument[] = [];

    try {
      for (const file of documents) {
        const formData = new FormData();
        formData.append("title", file.name);
        formData.append("file", file);

        const response = await fetch(`/api/clients/${clientId}/documents`, {
          method: "POST",
          body: formData,
        });

        const rawText = await response.text();

        let data: any = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            `Document upload returned non-JSON response. Status: ${response.status}`
          );
        }

        if (!response.ok) {
          throw new Error(data?.error || `Failed to upload ${file.name}`);
        }

        if (data?.document) {
          uploaded.push(data.document as UploadedDocument);
        }
      }

      setUploadedDocuments(uploaded);
      setDocuments([]);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Document upload failed after check-in"
      );
      throw err;
    } finally {
      setUploading(false);
    }
  }

  const handleLookup = async () => {
    try {
      setLoading(true);
      setError("");
      setUploadError("");
      setSuccessMessage("");
      setResult(null);

      const res = await fetch("/api/check-in/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          email,
          passportNumber,
        }),
      });

      const rawText = await res.text();

      let data: LookupResult = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        setError(`Server returned non-JSON response. Status: ${res.status}`);
        return;
      }

      if (!res.ok) {
        const errorData = data as { error?: string } | null;
        setError(errorData?.error || "Lookup failed");
        return;
      }

      setResult(data);

      if (data?.mode === "new") {
        resetDynamicValues();
      }

      if (data?.mode === "existing_client") {
        setPhone(data.client.phone ?? phone);
        setEmail(data.client.email ?? email);
        setPassportNumber(data.client.passport ?? passportNumber);
      }

      if (data?.mode === "existing_intake_submission") {
        setPhone(data.intakeSubmission.phone ?? phone);
        setEmail(data.intakeSubmission.email ?? email);
        setPassportNumber(
          data.intakeSubmission.passportNumber ?? passportNumber
        );
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError("Something went wrong while looking up check-in");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");
      setUploadError("");
      setSuccessMessage("");

      const payload = {
        phone:
          result?.mode === "new"
            ? toSafeString(dynamicValues.mobile) || phone
            : phone,
        firstName:
          result?.mode === "existing_client"
            ? result.client.firstName
            : result?.mode === "existing_intake_submission"
            ? result.intakeSubmission.firstName
            : toSafeString(dynamicValues.firstName),
        lastName:
          result?.mode === "existing_client"
            ? result.client.lastName
            : result?.mode === "existing_intake_submission"
            ? result.intakeSubmission.lastName
            : toSafeString(dynamicValues.surname),
        email:
          result?.mode === "new"
            ? toSafeString(dynamicValues.email)
            : email,
        passportNumber:
          result?.mode === "new"
            ? toSafeString(dynamicValues.passportNumber)
            : passportNumber,
        country:
          result?.mode === "new"
            ? toSafeString(dynamicValues.country)
            : "",
        city: "",
        address:
          result?.mode === "new"
            ? toSafeString(dynamicValues.residentialAddress)
            : "",
        nationality:
          result?.mode === "new"
            ? toSafeString(dynamicValues.nationality)
            : "",
        dateOfBirth: null,
        visitReason,
        notes,
        branchId:
          result?.mode === "existing_client"
            ? result.client.branchId || FALLBACK_BRANCH_ID
            : result?.mode === "existing_intake_submission"
            ? result.intakeSubmission.branchId || FALLBACK_BRANCH_ID
            : FALLBACK_BRANCH_ID,
        intakeFormRequestId: FALLBACK_INTAKE_FORM_REQUEST_ID,
      };

      const res = await fetch("/api/check-in/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        setError(`Submit returned non-JSON response. Status: ${res.status}`);
        return;
      }

      if (!res.ok) {
        setError(data?.error || "Check-in failed");
        return;
      }

      const resolvedClientId =
        data?.client?.id ||
        data?.checkIn?.clientId ||
        (result?.mode === "existing_client" ? result.client.id : null) ||
        (result?.mode === "existing_intake_submission"
          ? result.intakeSubmission.clientId
          : null);

      if (documents.length > 0) {
        if (!resolvedClientId) {
          setUploadError(
            "Check-in completed, but documents could not be attached because no client ID was returned."
          );
        } else {
          await uploadDocumentsForClient(resolvedClientId);
        }
      }

      setSuccessMessage(
        documents.length > 0
          ? "Checked in successfully and documents uploaded ✅"
          : "Checked in successfully ✅"
      );
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong while submitting check-in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setPhone("");
    setEmail("");
    setPassportNumber("");
    setVisitReason("");
    setNotes("");
    setDocuments([]);
    setUploadedDocuments([]);
    setResult(null);
    setError("");
    setUploadError("");
    setSuccessMessage("");
    resetDynamicValues();
  };

  const sharedActionDisabled =
    submitting || uploading || (result?.mode === "new" && (!firstName || !surname || !mobile));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-900 to-black px-6 py-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-300">
                Reception Desk
              </p>
              <h1 className="mt-2 text-2xl font-bold">Client Check-In</h1>
              <p className="mt-2 text-sm text-gray-300">
                Search by phone, email, or passport number to find an existing
                client before creating a new check-in.
              </p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input
                  type="text"
                  placeholder="e.g. 0412345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div>
                <FieldLabel>Email</FieldLabel>
                <input
                  type="email"
                  placeholder="e.g. student@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div>
                <FieldLabel>Passport Number</FieldLabel>
                <input
                  type="text"
                  placeholder="Enter passport number"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={loading || !canLookup}
                  className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Checking..." : "Find Existing Record"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              ) : null}

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Search guidance
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Use any one identifier, or combine multiple identifiers for a
                  more accurate live lookup.
                </p>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            {!result && !successMessage && (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Ready to search
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    Find an existing client before creating a new record
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    This page is optimized for front-desk and staff check-in
                    workflows. Search first. If no match is found, the new
                    client form will open automatically.
                  </p>
                </div>
              </div>
            )}

            {result?.mode === "existing_client" && !successMessage && (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                      Existing client found
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      {result.client.firstName} {result.client.lastName}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Existing CRM record matched successfully. Review the
                      details below, upload any supporting documents, and
                      complete the live check-in.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    Match confirmed
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <DetailItem label="First Name" value={result.client.firstName} />
                  <DetailItem label="Last Name" value={result.client.lastName} />
                  <DetailItem label="Phone" value={result.client.phone} />
                  <DetailItem label="Email" value={result.client.email} />
                  <DetailItem label="Passport" value={result.client.passport} />
                  <DetailItem label="Branch ID" value={result.client.branchId} />
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  <div>
                    <FieldLabel>Visit Reason</FieldLabel>
                    <input
                      type="text"
                      placeholder="e.g. walk-in consultation"
                      value={visitReason}
                      onChange={(e) => setVisitReason(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                    />
                  </div>

                  <div>
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                      placeholder="Add any notes for reception or staff"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[120px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <DocumentUploadCard
                    documents={documents}
                    setDocuments={setDocuments}
                    uploadedDocuments={uploadedDocuments}
                    uploading={uploading}
                    uploadError={uploadError}
                  />
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={sharedActionDisabled}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting || uploading
                      ? "Processing..."
                      : "Complete Check-In"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {result?.mode === "existing_intake_submission" && !successMessage && (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                      Existing intake found
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      {result.intakeSubmission.firstName}{" "}
                      {result.intakeSubmission.lastName}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      An existing intake submission was found. Review details,
                      upload any supporting documents, and complete the live
                      check-in.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                    Intake matched
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <DetailItem
                    label="First Name"
                    value={result.intakeSubmission.firstName}
                  />
                  <DetailItem
                    label="Last Name"
                    value={result.intakeSubmission.lastName}
                  />
                  <DetailItem label="Phone" value={result.intakeSubmission.phone} />
                  <DetailItem label="Email" value={result.intakeSubmission.email} />
                  <DetailItem
                    label="Passport"
                    value={result.intakeSubmission.passportNumber}
                  />
                  <DetailItem
                    label="Linked Client ID"
                    value={result.intakeSubmission.clientId}
                  />
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  <div>
                    <FieldLabel>Visit Reason</FieldLabel>
                    <input
                      type="text"
                      placeholder="e.g. follow-up visit"
                      value={visitReason}
                      onChange={(e) => setVisitReason(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                    />
                  </div>

                  <div>
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                      placeholder="Add any notes for reception or staff"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[120px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <DocumentUploadCard
                    documents={documents}
                    setDocuments={setDocuments}
                    uploadedDocuments={uploadedDocuments}
                    uploading={uploading}
                    uploadError={uploadError}
                  />
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={sharedActionDisabled}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting || uploading
                      ? "Processing..."
                      : "Complete Check-In"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {result?.mode === "new" && !successMessage && (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="border-b border-gray-100 pb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                    New client
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    No existing record found
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Complete the form below, attach supporting documents if
                    needed, and continue the check-in process.
                  </p>
                </div>

                <div className="mt-8">
                  <DynamicFormRenderer
                    schema={clientMasterSchema}
                    values={dynamicValues}
                    onChange={setDynamicValue}
                  />
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  <div>
                    <FieldLabel>Visit Reason</FieldLabel>
                    <input
                      type="text"
                      placeholder="e.g. new inquiry"
                      value={visitReason}
                      onChange={(e) => setVisitReason(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                    />
                  </div>

                  <div>
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                      placeholder="Add notes for the visit"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[120px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <DocumentUploadCard
                    documents={documents}
                    setDocuments={setDocuments}
                    uploadedDocuments={uploadedDocuments}
                    uploading={uploading}
                    uploadError={uploadError}
                  />
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={sharedActionDisabled}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting || uploading ? "Processing..." : "Submit Check-In"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {successMessage ? (
              <div className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
                  Success
                </p>
                <h2 className="mt-2 text-2xl font-bold text-green-900">
                  Check-in completed
                </h2>
                <p className="mt-3 text-sm text-green-800">{successMessage}</p>

                {uploadedDocuments.length > 0 ? (
                  <div className="mt-6 rounded-2xl border border-green-200 bg-white p-4">
                    <p className="text-sm font-semibold text-green-900">
                      Uploaded documents
                    </p>
                    <div className="mt-3 space-y-3">
                      {uploadedDocuments.map((document) => (
                        <a
                          key={document.id}
                          href={document.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 transition hover:bg-green-100"
                        >
                          <span className="truncate pr-4">{document.title}</span>
                          <span className="shrink-0 font-semibold">View</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {uploadError ? (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {uploadError}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Start New Check-In
                </button>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}