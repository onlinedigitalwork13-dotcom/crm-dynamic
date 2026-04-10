"use client";

import { useMemo, useState } from "react";

type AgentPublicInfo = {
  id: string;
  name: string;
  contact: string | null;
  country: string | null;
  referralCode: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
};

const initialFormState = (defaultCountry: string): FormState => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: defaultCountry,
  notes: "",
});

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AgentPublicForm({
  agent,
}: {
  agent: AgentPublicInfo;
}) {
  const [form, setForm] = useState<FormState>(
    initialFormState(agent.country || "")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successLeadId, setSuccessLeadId] = useState<string | null>(null);

  const referralLabel = useMemo(() => {
    return `/apply/${agent.referralCode}`;
  }, [agent.referralCode]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setError("First name, last name, and phone are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/agent-apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referralCode: agent.referralCode,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          notes: form.notes,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Failed to submit your application.");
        setLoading(false);
        return;
      }

      setSuccessLeadId(data?.leadId || "created");
      setLoading(false);
    } catch (submitError) {
      console.error("Agent referral form submit error:", submitError);
      setError("Something went wrong while submitting the form.");
      setLoading(false);
    }
  }

  if (successLeadId) {
    return (
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/60 bg-white p-8 text-center shadow-[0_10px_40px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-2xl text-emerald-600">
          ✓
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-950 sm:text-3xl">
          Application submitted successfully
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          Thank you. Your details have been received and entered into our CRM as
          a new lead. A team member will review your submission and contact you
          soon.
        </p>

        <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          Referral Source: {agent.name}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[32px] border border-white/60 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)] sm:p-8"
      >
        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Applicant Details
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
            Tell us about yourself
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            This form follows the same premium intake experience as your CRM
            onboarding style, while creating a real lead directly in the system.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="Enter first name"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="Enter last name"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Phone <span className="text-rose-500">*</span>
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Country
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              placeholder="Enter country"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Notes
            </label>
            <textarea
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Add any extra details about your enquiry"
            />
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>

          <div className="text-xs text-slate-500">
            Your enquiry will be saved directly into the Leads pipeline.
          </div>
        </div>
      </form>

      <div className="space-y-6">
        <div className="rounded-[32px] border border-white/60 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
              {getInitials(agent.name || "A")}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Referred By
              </p>
              <h3 className="mt-2 text-xl font-bold text-slate-950">
                {agent.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This application is linked to the agent referral network and will
                be tracked inside CRM.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            What happens next
          </p>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              1. Your details are submitted as a new lead.
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              2. The lead is tagged with this agent referral source.
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              3. A staff member will review and follow up with you.
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Referral Link
          </p>
          <p className="mt-3 break-all text-sm font-medium text-slate-800">
            {referralLabel}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            This public link can be shared by the agent and is tied to the
            referral code configured in CRM.
          </p>
        </div>
      </div>
    </div>
  );
}