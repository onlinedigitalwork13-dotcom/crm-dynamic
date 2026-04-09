"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  FileText,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Save,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  Trash2,
  WalletCards,
} from "lucide-react";

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

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="p-6 sm:p-7">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  hint,
  icon: Icon,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
        {Icon ? <Icon className="h-4 w-4 text-slate-400" /> : null}
        <span>
          {label}
          {required ? <span className="ml-1 text-rose-500">*</span> : null}
        </span>
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function inputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
}

function textareaClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
}

function selectClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
}

function StatBadge({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "green" | "blue" | "amber" | "slate";
}) {
  const toneClasses = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
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
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const syncStatusOptions = useMemo(
    () => ["", "idle", "pending", "success", "failed", "manual"],
    []
  );

  const sourceTypeOptions = useMemo(
    () => ["", "manual", "csv", "sheet", "api", "website"],
    []
  );

  const completionScore = useMemo(() => {
    let score = 0;

    if (form.name.trim()) score += 10;
    if (form.code.trim()) score += 4;
    if (form.legalName.trim()) score += 6;
    if (form.defaultCurrency.trim()) score += 4;
    if (form.country.trim()) score += 5;
    if (form.city.trim()) score += 5;
    if (form.address.trim()) score += 5;
    if (form.email.trim()) score += 5;
    if (form.phone.trim()) score += 4;
    if (form.supportEmail.trim()) score += 4;
    if (form.supportPhone.trim()) score += 3;
    if (form.admissionEmail.trim()) score += 4;
    if (form.financeEmail.trim()) score += 4;
    if (form.website.trim()) score += 5;
    if (form.applicationUrl.trim()) score += 4;
    if (form.portalUrl.trim()) score += 4;
    if (form.logoUrl.trim()) score += 3;
    if (form.description.trim()) score += 5;
    if (form.notes.trim()) score += 3;
    if (form.sourceType.trim()) score += 3;
    if (form.syncStatus.trim()) score += 3;
    if (form.lastSyncMessage.trim()) score += 2;
    if (form.autoSyncEnabled) score += 3;

    return Math.min(score, 100);
  }, [form]);

  const completionTone =
    completionScore >= 80
      ? "green"
      : completionScore >= 50
      ? "blue"
      : "amber";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

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

      setSuccessMessage("Provider updated successfully.");

      setTimeout(() => {
        router.push(`/providers/${provider.id}`);
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveProvider() {
    const confirmed = window.confirm(
      "Archive this provider? It will remain in the database but become inactive."
    );

    if (!confirmed) return;

    setArchiving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/providers/${provider.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: false,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to archive provider");
      }

      setForm((prev) => ({ ...prev, isActive: false }));
      setSuccessMessage("Provider archived successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive provider");
    } finally {
      setArchiving(false);
    }
  }

  async function handleDeleteProvider() {
    const confirmed = window.prompt(
      'Type DELETE to permanently remove this provider.'
    );

    if (confirmed !== "DELETE") return;

    setDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/providers/${provider.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete provider");
      }

      router.push("/providers");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete provider");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className="space-y-6">
          <SectionCard
            title="Core Identity"
            description="Primary provider information used across the CRM."
            icon={Building2}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Provider Name" icon={Building2} required>
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

              <Field label="Code" icon={BadgeCheck}>
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

              <Field label="Legal Name" icon={ShieldCheck}>
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

              <Field label="Default Currency" icon={WalletCards}>
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

              <Field label="Country" icon={MapPin}>
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

              <Field label="City" icon={MapPin}>
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
                <Field label="Address" icon={MapPin}>
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
            icon={Mail}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Primary Email" icon={Mail}>
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

              <Field label="Primary Phone" icon={Phone}>
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

              <Field label="Support Email" icon={Mail}>
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

              <Field label="Support Phone" icon={Phone}>
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

              <Field label="Admission Email" icon={Mail}>
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

              <Field label="Finance Email" icon={Mail}>
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
            description="Operational links for websites, applications, portals, and brand assets."
            icon={Globe2}
          >
            <div className="grid gap-5">
              <Field label="Website" icon={Globe2}>
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

              <Field label="Application URL" icon={Globe2}>
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

              <Field label="Partner Portal URL" icon={Globe2}>
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

              <Field label="Logo URL" icon={Globe2}>
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
            description="Long-form provider context for operations and internal teams."
            icon={FileText}
          >
            <div className="grid gap-5">
              <Field label="Description" icon={FileText}>
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

              <Field label="Internal Notes" icon={FileText}>
                <textarea
                  name="notes"
                  rows={6}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className={textareaClassName()}
                  placeholder="Internal notes, commission details, escalation context, account instructions"
                />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <SectionCard
            title="Operational Status"
            description="Live provider visibility and sync controls."
            icon={ToggleLeft}
          >
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Active Provider
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Controls whether this provider is active in the CRM.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: !prev.isActive,
                      }))
                    }
                    className={cn(
                      "relative inline-flex h-11 w-20 items-center rounded-full border px-1 transition-all",
                      form.isActive
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-8 w-8 rounded-full shadow-sm transition-all",
                        form.isActive
                          ? "translate-x-9 bg-emerald-600"
                          : "translate-x-0 bg-slate-300"
                      )}
                    />
                  </button>
                </div>

                <div className="mt-4">
                  <StatBadge
                    label="Current"
                    value={form.isActive ? "Active" : "Inactive"}
                    tone={form.isActive ? "green" : "amber"}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Auto Sync Enabled
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Marks this provider as ready for future automated sync.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        autoSyncEnabled: !prev.autoSyncEnabled,
                      }))
                    }
                    className={cn(
                      "relative inline-flex h-11 w-20 items-center rounded-full border px-1 transition-all",
                      form.autoSyncEnabled
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-8 w-8 rounded-full shadow-sm transition-all",
                        form.autoSyncEnabled
                          ? "translate-x-9 bg-blue-600"
                          : "translate-x-0 bg-slate-300"
                      )}
                    />
                  </button>
                </div>

                <div className="mt-4">
                  <StatBadge
                    label="Sync"
                    value={form.autoSyncEnabled ? "Enabled" : "Disabled"}
                    tone={form.autoSyncEnabled ? "blue" : "slate"}
                  />
                </div>
              </div>

              <Field label="Source Type" icon={Sparkles}>
                <select
                  name="sourceType"
                  value={form.sourceType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sourceType: e.target.value,
                    }))
                  }
                  className={selectClassName()}
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

              <Field label="Sync Status" icon={RefreshCcw}>
                <select
                  name="syncStatus"
                  value={form.syncStatus}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      syncStatus: e.target.value,
                    }))
                  }
                  className={selectClassName()}
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
                icon={RefreshCcw}
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

              <Field label="Last Sync Message" icon={RefreshCcw}>
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
            title="Provider Snapshot"
            description="Quick overview before saving changes."
            icon={Sparkles}
          >
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  Provider Name
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {form.name || "Untitled provider"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatBadge
                  label="Status"
                  value={form.isActive ? "Active" : "Inactive"}
                  tone={form.isActive ? "green" : "amber"}
                />
                <StatBadge
                  label="Completion"
                  value={`${completionScore}%`}
                  tone={completionTone}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                    Country / City
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {[form.country, form.city].filter(Boolean).join(" / ") || "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                    Website
                  </p>
                  <p className="mt-2 truncate text-sm font-medium text-slate-800">
                    {form.website || "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                    Source Type
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {form.sourceType || "—"}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Save Changes"
            description="Update the provider safely in production."
            icon={Save}
          >
            <div className="space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Provider...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Update Provider
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/providers/${provider.id}`)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Danger Zone"
            description="Sensitive actions for archive and permanent deletion."
            icon={AlertTriangle}
          >
            <div className="space-y-4">
              <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Archive Provider
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      This sets the provider to inactive without permanently
                      removing it. Recommended for production use.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleArchiveProvider}
                  disabled={archiving}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {archiving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4" />
                      Archive Provider
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="mt-0.5 h-5 w-5 text-rose-600" />
                  <div>
                    <p className="text-sm font-semibold text-rose-900">
                      Delete Permanently
                    </p>
                    <p className="mt-1 text-xs leading-5 text-rose-800">
                      This permanently removes the provider. Use only when there
                      are no dependent courses or application records.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteProvider}
                  disabled={deleting}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Provider
                    </>
                  )}
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </form>
  );
}