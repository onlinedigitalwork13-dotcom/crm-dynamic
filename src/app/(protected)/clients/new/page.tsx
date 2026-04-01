"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DynamicFormRenderer from "@/components/forms/dynamic-form-renderer";
import { clientMasterSchema } from "@/components/forms/client-master-schema";
import { useDynamicForm } from "@/components/forms/use-dynamic-form";

type LeadSource = {
  id: string;
  name: string;
};

function toSafeString(value: unknown) {
  if (value == null) return "";
  return String(value);
}

export default function NewClientPage() {
  const router = useRouter();

  const [sources, setSources] = useState<LeadSource[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSources, setLoadingSources] = useState(true);
  const [error, setError] = useState("");

  const { values, setValue, resetValues } = useDynamicForm(clientMasterSchema);

  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await fetch("/api/sources");
        const data = await res.json();
        setSources(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load sources", error);
      } finally {
        setLoadingSources(false);
      }
    }

    fetchSources();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      firstName: toSafeString(values.firstName).trim(),
      lastName: toSafeString(values.surname).trim(),
      email: toSafeString(values.email).trim(),
      phone: toSafeString(values.mobile).trim(),
      passport: toSafeString(values.passportNumber).trim(),
      sourceId,
      profileData: {
        title: values.title ?? "",
        preferredName: values.preferredName ?? "",
        nationality: values.nationality ?? "",
        country: values.country ?? "",
        residentialAddress: values.residentialAddress ?? "",
        postalAddress: values.postalAddress ?? "",
        homePhone: values.homePhone ?? "",
        workPhone: values.workPhone ?? "",
        occupation: values.occupation ?? "",
        visaSubclass: values.visaSubclass ?? "",
        visaExpiry: values.visaExpiry ?? "",
        visaConditions: values.visaConditions ?? "",
        visaIssues: values.visaIssues ?? "",
        emergencyFirstName: values.emergencyFirstName ?? "",
        emergencySurname: values.emergencySurname ?? "",
        emergencyAddress: values.emergencyAddress ?? "",
        emergencyMobile: values.emergencyMobile ?? "",
        emergencyHome: values.emergencyHome ?? "",
        emergencyWork: values.emergencyWork ?? "",
        emergencyEmail: values.emergencyEmail ?? "",
      },
    };

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to save client");
        setLoading(false);
        return;
      }

      router.push("/clients");
      router.refresh();
    } catch (error) {
      console.error("Failed to save client", error);
      setError("Failed to save client");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  const firstName = toSafeString(values.firstName).trim();
  const surname = toSafeString(values.surname).trim();
  const mobile = toSafeString(values.mobile).trim();

  const canSubmit = !loading && !!firstName && !!surname && !!mobile;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)] ring-1 ring-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
              Client Onboarding
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Add New Client
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Create a new client using the shared master form with a clean,
              production-ready workflow designed for fast data entry and high
              accuracy.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/clients")}
              className="rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Back to Clients
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Client Master Form
            </h2>
            <p className="text-sm text-slate-500">
              Complete the core client details below. Required details should be
              filled before saving.
            </p>
          </div>

          <DynamicFormRenderer
            schema={clientMasterSchema}
            values={values}
            onChange={setValue}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Source & Submission
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Link the client to a lead source and confirm the record before
                  saving.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Lead Source
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  disabled={loadingSources}
                >
                  <option value="">Select source</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-base font-semibold text-slate-900">
                Save Checklist
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                  <span className="text-slate-600">First name</span>
                  <span className="font-medium text-slate-900">
                    {firstName ? "Ready" : "Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                  <span className="text-slate-600">Last name</span>
                  <span className="font-medium text-slate-900">
                    {surname ? "Ready" : "Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                  <span className="text-slate-600">Mobile</span>
                  <span className="font-medium text-slate-900">
                    {mobile ? "Ready" : "Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                  <span className="text-slate-600">Lead source</span>
                  <span className="font-medium text-slate-900">
                    {sourceId ? "Selected" : "Optional"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving Client..." : "Save Client"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetValues();
                setSourceId("");
                setError("");
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset Form
            </button>

            <button
              type="button"
              onClick={() => router.push("/clients")}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}