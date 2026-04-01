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

function toSafeString(value: unknown) {
  if (value == null) return "";
  return String(value);
}

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

  const firstName = toSafeString(dynamicValues.firstName).trim();
  const surname = toSafeString(dynamicValues.surname).trim();
  const mobile = toSafeString(dynamicValues.mobile).trim();

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

      {result?.mode === "new" && !successMessage && (
        <div className="mt-6 space-y-6">
          <DynamicFormRenderer
            schema={clientMasterSchema}
            values={dynamicValues}
            onChange={setDynamicValue}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting || !firstName || !surname || !mobile
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