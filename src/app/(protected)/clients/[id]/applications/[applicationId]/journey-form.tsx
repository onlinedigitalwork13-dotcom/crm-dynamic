"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type JourneyFormProps = {
  applicationId: string;
  initialJourney: {
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
  } | null;
};

async function safeJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function JourneyForm({
  applicationId,
  initialJourney,
}: JourneyFormProps) {
  const router = useRouter();

  const [initializing, setInitializing] = useState(!initialJourney);
  const [saving, setSaving] = useState(false);

  const [offerStatus, setOfferStatus] = useState(
    initialJourney?.offerStatus || "not_started"
  );
  const [offerType, setOfferType] = useState(initialJourney?.offerType || "");
  const [offerConditions, setOfferConditions] = useState(
    initialJourney?.offerConditions || ""
  );
  const [offerReceivedAt, setOfferReceivedAt] = useState(
    initialJourney?.offerReceivedAt || ""
  );
  const [offerAcceptedAt, setOfferAcceptedAt] = useState(
    initialJourney?.offerAcceptedAt || ""
  );

  const [coeStatus, setCoeStatus] = useState(
    initialJourney?.coeStatus || "not_started"
  );
  const [coeNumber, setCoeNumber] = useState(initialJourney?.coeNumber || "");
  const [coeIssuedAt, setCoeIssuedAt] = useState(
    initialJourney?.coeIssuedAt || ""
  );

  const [visaStatus, setVisaStatus] = useState(
    initialJourney?.visaStatus || "not_started"
  );
  const [visaFileNumber, setVisaFileNumber] = useState(
    initialJourney?.visaFileNumber || ""
  );
  const [visaLodgedAt, setVisaLodgedAt] = useState(
    initialJourney?.visaLodgedAt || ""
  );
  const [visaGrantedAt, setVisaGrantedAt] = useState(
    initialJourney?.visaGrantedAt || ""
  );
  const [visaRefusedAt, setVisaRefusedAt] = useState(
    initialJourney?.visaRefusedAt || ""
  );

  const [remarks, setRemarks] = useState(initialJourney?.remarks || "");

  useEffect(() => {
    async function initJourney() {
      if (initialJourney) {
        setInitializing(false);
        return;
      }

      try {
        const res = await fetch(`/api/application-journeys/${applicationId}`, {
          method: "POST",
        });

        await safeJson(res);
      } catch (error) {
        console.error("Failed to initialize journey:", error);
      } finally {
        setInitializing(false);
      }
    }

    initJourney();
  }, [applicationId, initialJourney]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/application-journeys/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offerStatus,
          offerType,
          offerConditions,
          offerReceivedAt,
          offerAcceptedAt,

          coeStatus,
          coeNumber,
          coeIssuedAt,

          visaStatus,
          visaFileNumber,
          visaLodgedAt,
          visaGrantedAt,
          visaRefusedAt,

          remarks,
        }),
      });

      const data = await safeJson<{ error?: string }>(res);

      if (!res.ok) {
        alert(data?.error || "Failed to update application journey");
        setSaving(false);
        return;
      }

      router.refresh();
      alert("Journey updated successfully");
    } catch (error) {
      console.error("Failed to update journey:", error);
      alert("Something went wrong while updating the journey");
    } finally {
      setSaving(false);
    }
  }

  if (initializing) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        Initializing journey...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Offer Tracking</h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Offer Status</label>
            <select
              value={offerStatus}
              onChange={(e) => setOfferStatus(e.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              <option value="not_started">Not Started</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Offer Type</label>
            <input
              value={offerType}
              onChange={(e) => setOfferType(e.target.value)}
              placeholder="Conditional / Unconditional"
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium">
            Offer Conditions
          </label>
          <textarea
            value={offerConditions}
            onChange={(e) => setOfferConditions(e.target.value)}
            rows={4}
            placeholder="Any pending requirements or conditions"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Offer Received At
            </label>
            <input
              type="date"
              value={offerReceivedAt}
              onChange={(e) => setOfferReceivedAt(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Offer Accepted At
            </label>
            <input
              type="date"
              value={offerAcceptedAt}
              onChange={(e) => setOfferAcceptedAt(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">COE Tracking</h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">COE Status</label>
            <select
              value={coeStatus}
              onChange={(e) => setCoeStatus(e.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              <option value="not_started">Not Started</option>
              <option value="pending">Pending</option>
              <option value="issued">Issued</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">COE Number</label>
            <input
              value={coeNumber}
              onChange={(e) => setCoeNumber(e.target.value)}
              placeholder="COE reference number"
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium">COE Issued At</label>
          <input
            type="date"
            value={coeIssuedAt}
            onChange={(e) => setCoeIssuedAt(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Visa Tracking</h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Visa Status</label>
            <select
              value={visaStatus}
              onChange={(e) => setVisaStatus(e.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              <option value="not_started">Not Started</option>
              <option value="preparing">Preparing</option>
              <option value="lodged">Lodged</option>
              <option value="granted">Granted</option>
              <option value="refused">Refused</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Visa File Number
            </label>
            <input
              value={visaFileNumber}
              onChange={(e) => setVisaFileNumber(e.target.value)}
              placeholder="Visa file number"
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Visa Lodged At
            </label>
            <input
              type="date"
              value={visaLodgedAt}
              onChange={(e) => setVisaLodgedAt(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Visa Granted At
            </label>
            <input
              type="date"
              value={visaGrantedAt}
              onChange={(e) => setVisaGrantedAt(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Visa Refused At
            </label>
            <input
              type="date"
              value={visaRefusedAt}
              onChange={(e) => setVisaRefusedAt(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Remarks</h2>

        <div className="mt-4">
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={5}
            placeholder="Internal remarks about the application journey"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Journey Updates"}
          </button>
        </div>
      </div>
    </form>
  );
}