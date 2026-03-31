"use client";

import { useState } from "react";
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

export default function CheckInPage() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<LookupResult>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [email, setEmail] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [notes, setNotes] = useState("");

  const {
    values: dynamicValues,
    setValue: setDynamicValue,
    resetValues: resetDynamicValues,
  } = useDynamicForm(clientMasterSchema);

  const FALLBACK_BRANCH_ID = "cmmx2b8bx0005fhgskyb9dj1c";
  const FALLBACK_INTAKE_FORM_REQUEST_ID = "cmmx2lic8000yfhmovxoszssx";

  const handleLookup = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      setResult(null);

      const res = await fetch("/api/check-in/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
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
        setEmail("");
        setPassportNumber("");
        setVisitReason("");
        setNotes("");
      }

      if (data?.mode === "existing_client") {
        setEmail(data.client.email ?? "");
        setPassportNumber(data.client.passport ?? "");
      }

      if (data?.mode === "existing_intake_submission") {
        setEmail(data.intakeSubmission.email ?? "");
        setPassportNumber(data.intakeSubmission.passportNumber ?? "");
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
      setSuccessMessage("");

      const payload = {
        phone:
          result?.mode === "new"
            ? dynamicValues.mobile || phone
            : phone,
        firstName:
          result?.mode === "existing_client"
            ? result.client.firstName
            : result?.mode === "existing_intake_submission"
            ? result.intakeSubmission.firstName
            : dynamicValues.firstName,
        lastName:
          result?.mode === "existing_client"
            ? result.client.lastName
            : result?.mode === "existing_intake_submission"
            ? result.intakeSubmission.lastName
            : dynamicValues.surname,
        email:
          result?.mode === "new"
            ? dynamicValues.email
            : email,
        passportNumber:
          result?.mode === "new"
            ? dynamicValues.passportNumber
            : passportNumber,
        country:
          result?.mode === "new"
            ? dynamicValues.country
            : "",
        city: "",
        address:
          result?.mode === "new"
            ? dynamicValues.residentialAddress
            : "",
        nationality:
          result?.mode === "new"
            ? dynamicValues.nationality
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

      setSuccessMessage("Checked in successfully ✅");
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong while submitting check-in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setPhone("");
    setResult(null);
    setError("");
    setSuccessMessage("");
    setEmail("");
    setPassportNumber("");
    setVisitReason("");
    setNotes("");
    resetDynamicValues();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Check In</h1>

      {!result && (
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Enter phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-2 w-full mb-3 rounded-lg"
          />

          <button
            type="button"
            onClick={handleLookup}
            disabled={loading || !phone.trim()}
            className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Checking..." : "Continue"}
          </button>
        </div>
      )}

      {error ? <p className="mt-4 text-red-600">{error}</p> : null}

      {successMessage ? (
        <div className="mt-4 rounded border border-green-300 bg-green-50 p-3 max-w-md">
          <p className="text-green-700">{successMessage}</p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-3 bg-black text-white px-4 py-2 rounded-lg"
          >
            New Check-In
          </button>
        </div>
      ) : null}

      {result?.mode === "existing_client" && !successMessage && (
        <div className="mt-6 max-w-md">
          <h2 className="text-lg font-semibold">
            Welcome back {result.client.firstName} 👋
          </h2>

          <p className="text-sm text-gray-600 mt-2">
            Phone: {result.client.phone || "N/A"}
          </p>

          {result.client.email ? (
            <p className="text-sm text-gray-600">Email: {result.client.email}</p>
          ) : null}

          <div className="mt-4">
            <label className="block text-sm mb-1">Visit Reason</label>
            <input
              type="text"
              value={visitReason}
              onChange={(e) => setVisitReason(e.target.value)}
              className="border p-2 w-full rounded-lg"
              placeholder="Reason for visit"
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border p-2 w-full rounded-lg"
              placeholder="Optional notes"
              rows={3}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Confirm Check-In"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="mt-4 ml-3 border px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>
      )}

      {result?.mode === "existing_intake_submission" && !successMessage && (
        <div className="mt-6 max-w-md">
          <h2 className="text-lg font-semibold">
            Welcome back {result.intakeSubmission.firstName} 👋
          </h2>

          <p className="text-sm text-gray-600 mt-2">
            Phone: {result.intakeSubmission.phone || "N/A"}
          </p>

          {result.intakeSubmission.email ? (
            <p className="text-sm text-gray-600">
              Email: {result.intakeSubmission.email}
            </p>
          ) : null}

          <div className="mt-4">
            <label className="block text-sm mb-1">Visit Reason</label>
            <input
              type="text"
              value={visitReason}
              onChange={(e) => setVisitReason(e.target.value)}
              className="border p-2 w-full rounded-lg"
              placeholder="Reason for visit"
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border p-2 w-full rounded-lg"
              placeholder="Optional notes"
              rows={3}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Confirm Check-In"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="mt-4 ml-3 border px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>
      )}

      {result?.mode === "new" && !successMessage && (
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">New Visitor</h2>
            <p className="mt-1 text-sm text-gray-600">
              Please complete the form below to continue check-in.
            </p>
          </div>

          <DynamicFormRenderer
            schema={clientMasterSchema}
            values={dynamicValues}
            onChange={setDynamicValue}
          />

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Reason
                </label>
                <input
                  type="text"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Reason for visit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Optional notes"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting ||
                !dynamicValues.firstName?.trim() ||
                !dynamicValues.surname?.trim() ||
                !dynamicValues.mobile?.trim()
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Check-In"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-gray-300 px-4 py-2"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}