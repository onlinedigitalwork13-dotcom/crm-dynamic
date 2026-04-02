"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProviderFormData = {
  id: string;
  name: string;
  code: string;
  country: string;
  city: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  isActive: boolean;

  legalName: string;
  defaultCurrency: string;
  supportEmail: string;
  supportPhone: string;
  admissionEmail: string;
  financeEmail: string;
  applicationUrl: string;
  portalUrl: string;
  logoUrl: string;
  address: string;
  notes: string;
  syncStatus: string;
  lastSyncAt: string;
  lastSyncMessage: string;
  autoSyncEnabled: boolean;
  sourceType: string;
};

type Props = {
  provider: ProviderFormData;
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-800">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function inputClassName() {
  return "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500";
}

function textareaClassName() {
  return "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500";
}

export default function EditProviderForm({ provider }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: provider.name,
    code: provider.code,
    country: provider.country,
    city: provider.city,
    email: provider.email,
    phone: provider.phone,
    website: provider.website,
    description: provider.description,
    isActive: provider.isActive,

    legalName: provider.legalName,
    defaultCurrency: provider.defaultCurrency,
    supportEmail: provider.supportEmail,
    supportPhone: provider.supportPhone,
    admissionEmail: provider.admissionEmail,
    financeEmail: provider.financeEmail,
    applicationUrl: provider.applicationUrl,
    portalUrl: provider.portalUrl,
    logoUrl: provider.logoUrl,
    address: provider.address,
    notes: provider.notes,
    syncStatus: provider.syncStatus,
    lastSyncAt: provider.lastSyncAt,
    lastSyncMessage: provider.lastSyncMessage,
    autoSyncEnabled: provider.autoSyncEnabled,
    sourceType: provider.sourceType,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const syncStatusOptions = useMemo(
    () => ["", "idle", "pending", "success", "failed", "manual"],
    []
  );

  const sourceTypeOptions = useMemo(
    () => ["", "manual", "csv", "sheet", "api"],
    []
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/providers/${provider.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim(),
          country: form.country.trim(),
          city: form.city.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          website: form.website.trim(),
          description: form.description.trim(),
          isActive: form.isActive,

          legalName: form.legalName.trim(),
          defaultCurrency: form.defaultCurrency.trim(),
          supportEmail: form.supportEmail.trim(),
          supportPhone: form.supportPhone.trim(),
          admissionEmail: form.admissionEmail.trim(),
          financeEmail: form.financeEmail.trim(),
          applicationUrl: form.applicationUrl.trim(),
          portalUrl: form.portalUrl.trim(),
          logoUrl: form.logoUrl.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
          syncStatus: form.syncStatus.trim(),
          lastSyncAt: form.lastSyncAt.trim(),
          lastSyncMessage: form.lastSyncMessage.trim(),
          autoSyncEnabled: form.autoSyncEnabled,
          sourceType: form.sourceType.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update provider");
      }

      router.push(`/providers/${provider.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <div className="space-y-6">
          <SectionCard
            title="Core Identity"
            description="Primary provider information used across the CRM."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Provider Name">
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="Deakin University"
                />
              </Field>

              <Field label="Code">
                <input
                  name="code"
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="DEAKIN"
                />
              </Field>

              <Field label="Legal Name">
                <input
                  name="legalName"
                  value={form.legalName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, legalName: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="Deakin University Pty Ltd"
                />
              </Field>

              <Field label="Default Currency">
                <input
                  name="defaultCurrency"
                  value={form.defaultCurrency}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      defaultCurrency: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                  placeholder="AUD"
                />
              </Field>

              <Field label="Country">
                <input
                  name="country"
                  value={form.country}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, country: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="Australia"
                />
              </Field>

              <Field label="City">
                <input
                  name="city"
                  value={form.city}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="Melbourne"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Address">
                  <textarea
                    name="address"
                    rows={3}
                    value={form.address}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                    className={textareaClassName()}
                    placeholder="Full provider address"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Contact Channels"
            description="Public and internal provider communication channels."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Primary Email">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="admissions@example.edu"
                />
              </Field>

              <Field label="Primary Phone">
                <input
                  name="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="+61 3 0000 0000"
                />
              </Field>

              <Field label="Support Email">
                <input
                  type="email"
                  name="supportEmail"
                  value={form.supportEmail}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      supportEmail: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                  placeholder="support@example.edu"
                />
              </Field>

              <Field label="Support Phone">
                <input
                  name="supportPhone"
                  value={form.supportPhone}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      supportPhone: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                  placeholder="+61 3 1111 1111"
                />
              </Field>

              <Field label="Admission Email">
                <input
                  type="email"
                  name="admissionEmail"
                  value={form.admissionEmail}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      admissionEmail: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                  placeholder="admissions@example.edu"
                />
              </Field>

              <Field label="Finance Email">
                <input
                  type="email"
                  name="financeEmail"
                  value={form.financeEmail}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      financeEmail: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                  placeholder="finance@example.edu"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Web & Portal Links"
            description="Operational links for websites, applications, portals, and assets."
          >
            <div className="grid gap-5">
              <Field label="Website">
                <input
                  name="website"
                  value={form.website}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, website: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="https://www.example.edu"
                />
              </Field>

              <Field label="Application URL">
                <input
                  name="applicationUrl"
                  value={form.applicationUrl}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      applicationUrl: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                  placeholder="https://apply.example.edu"
                />
              </Field>

              <Field label="Partner Portal URL">
                <input
                  name="portalUrl"
                  value={form.portalUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, portalUrl: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="https://portal.example.edu"
                />
              </Field>

              <Field label="Logo URL">
                <input
                  name="logoUrl"
                  value={form.logoUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, logoUrl: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="https://cdn.example.edu/logo.png"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Descriptions & Internal Notes"
            description="Long-form provider context for your team."
          >
            <div className="grid gap-5">
              <Field label="Description">
                <textarea
                  name="description"
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={textareaClassName()}
                  placeholder="Public or general provider summary"
                />
              </Field>

              <Field label="Internal Notes">
                <textarea
                  name="notes"
                  rows={6}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className={textareaClassName()}
                  placeholder="Internal notes, commission details, account instructions, escalation context"
                />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <SectionCard
            title="Operational Status"
            description="Live provider visibility and activation controls."
          >
            <div className="space-y-5">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Active Provider
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Controls whether this provider is active in the CRM.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Auto Sync Enabled
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Marks this provider as ready for future automated sync.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.autoSyncEnabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      autoSyncEnabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </label>

              <Field label="Source Type">
                <select
                  name="sourceType"
                  value={form.sourceType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sourceType: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                >
                  {sourceTypeOptions.map((option) => (
                    <option key={option || "blank"} value={option}>
                      {option === ""
                        ? "Not set"
                        : option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Sync Status">
                <select
                  name="syncStatus"
                  value={form.syncStatus}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      syncStatus: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                >
                  {syncStatusOptions.map((option) => (
                    <option key={option || "blank"} value={option}>
                      {option === ""
                        ? "Not set"
                        : option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Last Sync At"
                hint="Use ISO datetime or leave blank if not tracked."
              >
                <input
                  name="lastSyncAt"
                  value={form.lastSyncAt}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      lastSyncAt: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                  placeholder="2026-04-02T10:15:00.000Z"
                />
              </Field>

              <Field label="Last Sync Message">
                <textarea
                  name="lastSyncMessage"
                  rows={4}
                  value={form.lastSyncMessage}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      lastSyncMessage: e.target.value,
                    }))
                  }
                  className={textareaClassName()}
                  placeholder="Latest sync result or operational note"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Save Changes"
            description="Update the provider safely in production."
          >
            <div className="space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Updating Provider..." : "Update Provider"}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/providers/${provider.id}`)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </form>
  );
}