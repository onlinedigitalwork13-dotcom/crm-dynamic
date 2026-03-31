"use client";

import { useState } from "react";

type JourneyFormProps = {
  applicationId: string;
  initialData: {
    offerStatus: string;
    offerType: string;
    offerConditions: string;
    offerReceivedAt: string;
    offerAcceptedAt: string;
    coeStatus: string;
    coeNumber: string;
    coeIssuedAt: string;
    visaStatus: string;
    visaFileNumber: string;
    visaLodgedAt: string;
    visaGrantedAt: string;
    visaRefusedAt: string;
    remarks: string;
  };
};

export default function JourneyForm({
  applicationId,
  initialData,
}: JourneyFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateField(
    key: keyof JourneyFormProps["initialData"],
    value: string
  ) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/journey`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offerStatus: emptyToUndefined(formData.offerStatus),
          offerType: emptyToNull(formData.offerType),
          offerConditions: emptyToNull(formData.offerConditions),
          offerReceivedAt: emptyDateToNull(formData.offerReceivedAt),
          offerAcceptedAt: emptyDateToNull(formData.offerAcceptedAt),

          coeStatus: emptyToUndefined(formData.coeStatus),
          coeNumber: emptyToNull(formData.coeNumber),
          coeIssuedAt: emptyDateToNull(formData.coeIssuedAt),

          visaStatus: emptyToUndefined(formData.visaStatus),
          visaFileNumber: emptyToNull(formData.visaFileNumber),
          visaLodgedAt: emptyDateToNull(formData.visaLodgedAt),
          visaGrantedAt: emptyDateToNull(formData.visaGrantedAt),
          visaRefusedAt: emptyDateToNull(formData.visaRefusedAt),

          remarks: emptyToNull(formData.remarks),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update journey");
      }

      setMessage("Journey updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update journey"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold">Update Journey</h3>
        <p className="mt-1 text-sm text-gray-500">
          Keep education and visa progress updated from one place.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border bg-gray-50 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Education Workflow
          </h4>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField
              label="Offer Status"
              value={formData.offerStatus}
              onChange={(value) => updateField("offerStatus", value)}
              options={[
                "",
                "not_started",
                "applied",
                "offered",
                "conditional_offer",
                "unconditional_offer",
                "accepted",
              ]}
            />

            <InputField
              label="Offer Type"
              value={formData.offerType}
              onChange={(value) => updateField("offerType", value)}
            />

            <TextareaField
              label="Offer Conditions"
              value={formData.offerConditions}
              onChange={(value) => updateField("offerConditions", value)}
            />

            <InputField
              label="Offer Received At"
              type="date"
              value={formData.offerReceivedAt}
              onChange={(value) => updateField("offerReceivedAt", value)}
            />

            <InputField
              label="Offer Accepted At"
              type="date"
              value={formData.offerAcceptedAt}
              onChange={(value) => updateField("offerAcceptedAt", value)}
            />

            <SelectField
              label="COE Status"
              value={formData.coeStatus}
              onChange={(value) => updateField("coeStatus", value)}
              options={["", "not_started", "pending", "issued"]}
            />

            <InputField
              label="COE Number"
              value={formData.coeNumber}
              onChange={(value) => updateField("coeNumber", value)}
            />

            <InputField
              label="COE Issued At"
              type="date"
              value={formData.coeIssuedAt}
              onChange={(value) => updateField("coeIssuedAt", value)}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-gray-50 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Visa Workflow
          </h4>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField
              label="Visa Status"
              value={formData.visaStatus}
              onChange={(value) => updateField("visaStatus", value)}
              options={["", "not_started", "preparing", "lodged", "granted", "refused"]}
            />

            <InputField
              label="Visa File Number"
              value={formData.visaFileNumber}
              onChange={(value) => updateField("visaFileNumber", value)}
            />

            <InputField
              label="Visa Lodged At"
              type="date"
              value={formData.visaLodgedAt}
              onChange={(value) => updateField("visaLodgedAt", value)}
            />

            <InputField
              label="Visa Granted At"
              type="date"
              value={formData.visaGrantedAt}
              onChange={(value) => updateField("visaGrantedAt", value)}
            />

            <InputField
              label="Visa Refused At"
              type="date"
              value={formData.visaRefusedAt}
              onChange={(value) => updateField("visaRefusedAt", value)}
            />
          </div>

          <div className="mt-4">
            <TextareaField
              label="Remarks"
              value={formData.remarks}
              onChange={(value) => updateField("remarks", value)}
            />
          </div>
        </div>

        {message ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {message}
          </div>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Journey"}
          </button>
        </div>
      </div>
    </form>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="md:col-span-2">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "" ? "Select status" : option}
          </option>
        ))}
      </select>
    </div>
  );
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function emptyToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function emptyDateToNull(value: string) {
  if (!value) return null;
  return value;
}