"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AgentFormState = {
  name: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  isActive: boolean;
};

const initialForm: AgentFormState = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  country: "",
  isActive: true,
};

function buildReferralPreview(name: string) {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned
    ? `crm-dynamic.com/apply/${cleaned}`
    : "crm-dynamic.com/apply/AGT-XXXX";
}

export default function NewAgentPage() {
  const router = useRouter();

  const [form, setForm] = useState<AgentFormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const referralPreview = useMemo(
    () => buildReferralPreview(form.name),
    [form.name]
  );

  const isValid = form.name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);

    if (!isValid) {
      setError("Agent name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/subagents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to create agent");
        setLoading(false);
        return;
      }

      // 🔥 redirect after success
      router.push("/subagents");
      router.refresh();
    } catch (err) {
      console.error("Create agent submit error:", err);
      setError("Something went wrong while creating the agent.");
      setLoading(false);
    }
  }

  function updateField<K extends keyof AgentFormState>(
    key: K,
    value: AgentFormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      {/* HEADER */}
      <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="border-b border-slate-200/70 px-6 py-6 sm:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
              New Partner Profile
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Add Agent
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Create a premium external agent profile with a secure referral link
              that directly feeds your CRM lead pipeline.
            </p>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="grid gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]"
        >
          {/* LEFT SIDE */}
          <div className="space-y-6">
            {/* AGENT DETAILS */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Agent Details
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  Primary information
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  This profile powers referral intake, lead attribution, and future
                  agent analytics.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Agent Name <span className="text-rose-500">*</span>
                  </label>

                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Enter agent or agency name"
                    required
                  />

                  {touched && !form.name.trim() && (
                    <p className="mt-2 text-sm text-rose-600">
                      Agent name is required.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Contact Person
                  </label>
                  <input
                    className="w-full rounded-2xl border px-4 py-3"
                    value={form.contact}
                    onChange={(e) => updateField("contact", e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Country
                  </label>
                  <input
                    className="w-full rounded-2xl border px-4 py-3"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-2xl border px-4 py-3"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Phone
                  </label>
                  <input
                    className="w-full rounded-2xl border px-4 py-3"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* STATUS */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateField("isActive", e.target.checked)}
                />
                <span className="text-sm font-semibold">Active agent</span>
              </label>
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-black px-5 py-3 text-white"
              >
                {loading ? "Saving..." : "Save Agent"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/subagents")}
                className="rounded-2xl border px-5 py-3"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">
            {/* REFERRAL SYSTEM */}
            <div className="rounded-[28px] bg-black p-6 text-white">
              <h2 className="text-xl font-bold">Referral System</h2>

              <p className="mt-2 text-sm text-gray-300">
                Each agent gets a unique secure link that sends leads directly
                into your CRM.
              </p>

              <div className="mt-5 rounded-xl bg-white/10 p-3">
                <p className="text-xs text-gray-400">Preview</p>
                <p className="text-sm">{referralPreview}</p>
              </div>
            </div>

            {/* WORKFLOW */}
            <div className="rounded-[28px] border p-6">
              <p className="text-xs text-gray-500">Workflow</p>

              <div className="mt-4 space-y-3 text-sm">
                <div>1. Agent shares link</div>
                <div>2. Student submits form</div>
                <div>3. Lead created in CRM</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}