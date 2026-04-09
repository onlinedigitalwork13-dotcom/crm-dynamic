"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Globe2,
  GraduationCap,
  Info,
  Layers3,
  Loader2,
  MapPin,
  RefreshCcw,
  Save,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  Trash2,
  WalletCards,
} from "lucide-react";

type CourseData = {
  id: string;
  providerId: string;
  name: string;
  code: string | null;
  level: string | null;
  category: string | null;
  studyMode: string | null;
  duration: string | null;
  durationValue: number | null;
  durationUnit: string | null;
  tuitionFee: number | null;
  applicationFee: number | null;
  materialFee: number | null;
  currency: string | null;
  intakeMonths: string | null;
  campus: string | null;
  entryRequirements: string | null;
  englishRequirements: string | null;
  description: string | null;
  notes: string | null;
  isActive: boolean;
  sourceType: string | null;
  syncStatus: string | null;
};

type FormState = {
  name: string;
  code: string;
  level: string;
  category: string;
  studyMode: string;
  duration: string;
  durationValue: string;
  durationUnit: string;
  tuitionFee: string;
  applicationFee: string;
  materialFee: string;
  currency: string;
  intakeMonths: string;
  campus: string;
  entryRequirements: string;
  englishRequirements: string;
  description: string;
  notes: string;
  isActive: boolean;
  sourceType: string;
  syncStatus: string;
};

const initialForm: FormState = {
  name: "",
  code: "",
  level: "",
  category: "",
  studyMode: "",
  duration: "",
  durationValue: "",
  durationUnit: "",
  tuitionFee: "",
  applicationFee: "",
  materialFee: "",
  currency: "AUD",
  intakeMonths: "",
  campus: "",
  entryRequirements: "",
  englishRequirements: "",
  description: "",
  notes: "",
  isActive: true,
  sourceType: "manual",
  syncStatus: "manual",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();

  const providerId = String(params?.id ?? "");
  const courseId = String(params?.courseId ?? "");

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);

  const sourceTypeOptions = useMemo(
    () => ["manual", "csv", "sheet", "api", "website"],
    []
  );

  const syncStatusOptions = useMemo(
    () => ["manual", "idle", "pending", "success", "failed"],
    []
  );

  const completionScore = useMemo(() => {
    let score = 0;

    if (form.name.trim()) score += 15;
    if (form.code.trim()) score += 5;
    if (form.level.trim()) score += 8;
    if (form.category.trim()) score += 5;
    if (form.studyMode.trim()) score += 5;
    if (form.duration.trim()) score += 8;
    if (form.durationValue.trim()) score += 5;
    if (form.durationUnit.trim()) score += 4;
    if (form.tuitionFee.trim()) score += 8;
    if (form.applicationFee.trim()) score += 4;
    if (form.materialFee.trim()) score += 4;
    if (form.currency.trim()) score += 3;
    if (form.intakeMonths.trim()) score += 6;
    if (form.campus.trim()) score += 5;
    if (form.entryRequirements.trim()) score += 4;
    if (form.englishRequirements.trim()) score += 4;
    if (form.description.trim()) score += 4;
    if (form.notes.trim()) score += 2;

    return Math.min(score, 100);
  }, [form]);

  const completionTone =
    completionScore >= 80
      ? "green"
      : completionScore >= 50
      ? "blue"
      : "amber";

  useEffect(() => {
    async function loadCourse() {
      if (!courseId) return;

      try {
        setLoadingData(true);
        setError("");

        const res = await fetch(`/api/courses/${courseId}`, {
          cache: "no-store",
        });

        const data: CourseData | { error?: string } = await res.json();

        if (!res.ok || !("id" in data)) {
          setError(("error" in data && data.error) || "Failed to load course");
          return;
        }

        setForm({
          name: data.name || "",
          code: data.code || "",
          level: data.level || "",
          category: data.category || "",
          studyMode: data.studyMode || "",
          duration: data.duration || "",
          durationValue:
            data.durationValue !== null && data.durationValue !== undefined
              ? String(data.durationValue)
              : "",
          durationUnit: data.durationUnit || "",
          tuitionFee:
            data.tuitionFee !== null && data.tuitionFee !== undefined
              ? String(data.tuitionFee)
              : "",
          applicationFee:
            data.applicationFee !== null && data.applicationFee !== undefined
              ? String(data.applicationFee)
              : "",
          materialFee:
            data.materialFee !== null && data.materialFee !== undefined
              ? String(data.materialFee)
              : "",
          currency: data.currency || "AUD",
          intakeMonths: data.intakeMonths || "",
          campus: data.campus || "",
          entryRequirements: data.entryRequirements || "",
          englishRequirements: data.englishRequirements || "",
          description: data.description || "",
          notes: data.notes || "",
          isActive: data.isActive,
          sourceType: data.sourceType || "manual",
          syncStatus: data.syncStatus || "manual",
        });
      } catch (loadError) {
        console.error(loadError);
        setError("Something went wrong while loading the course");
      } finally {
        setLoadingData(false);
      }
    }

    loadCourse();
  }, [courseId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim(),
          level: form.level.trim(),
          category: form.category.trim(),
          studyMode: form.studyMode.trim(),
          duration: form.duration.trim(),
          durationValue: form.durationValue.trim()
            ? Number(form.durationValue)
            : null,
          durationUnit: form.durationUnit.trim(),
          tuitionFee: form.tuitionFee.trim() ? Number(form.tuitionFee) : null,
          applicationFee: form.applicationFee.trim()
            ? Number(form.applicationFee)
            : null,
          materialFee: form.materialFee.trim()
            ? Number(form.materialFee)
            : null,
          currency: form.currency.trim(),
          intakeMonths: form.intakeMonths.trim(),
          campus: form.campus.trim(),
          entryRequirements: form.entryRequirements.trim(),
          englishRequirements: form.englishRequirements.trim(),
          description: form.description.trim(),
          notes: form.notes.trim(),
          isActive: form.isActive,
          sourceType: form.sourceType.trim(),
          syncStatus: form.syncStatus.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to update course");
        return;
      }

      setSuccessMessage("Course updated successfully.");

      setTimeout(() => {
        router.push(`/providers/${providerId}/courses`);
        router.refresh();
      }, 500);
    } catch (submitError) {
      console.error(submitError);
      setError("Something went wrong while updating the course");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveCourse() {
    const confirmed = window.confirm(
      "Archive this course? It will remain in the database but become inactive."
    );

    if (!confirmed) return;

    setArchiving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: false,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to archive course");
      }

      setForm((prev) => ({ ...prev, isActive: false }));
      setSuccessMessage("Course archived successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive course");
    } finally {
      setArchiving(false);
    }
  }

  async function handleDeleteCourse() {
    const confirmed = window.prompt(
      'Type DELETE to permanently remove this course.'
    );

    if (confirmed !== "DELETE") return;

    setDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete course");
      }

      router.push(`/providers/${providerId}/courses`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
      setDeleting(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_70%,_#f8fafc)]">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.22),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_46%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
                Course Configuration
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Edit Course
              </h1>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading course data...
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_70%,_#f8fafc)]">
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.22),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_46%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  <Link
                    href="/providers"
                    className="transition hover:text-white"
                  >
                    Providers
                  </Link>
                  <span>/</span>
                  <Link
                    href={`/providers/${providerId}/courses`}
                    className="transition hover:text-white"
                  >
                    Courses
                  </Link>
                  <span>/</span>
                  <span className="font-medium text-white">Edit Course</span>
                </div>

                <div className="mt-5 flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/15">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
                      Course Configuration
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                      Edit Course
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                      Update catalog structure, pricing, requirements, delivery,
                      and sync-ready metadata with a premium future-ready
                      editing experience.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                        Provider: {providerId}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                        Course: {form.name || "Untitled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 xl:w-[340px]">
                <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                    Edit Scope
                  </p>
                  <p className="mt-1 text-sm text-white">
                    Premium course editing for commercial details, admissions,
                    sync metadata, and future AI-powered import workflows.
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

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/providers/${providerId}/courses`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Link>

                  <button
                    form="edit-course-form"
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form id="edit-course-form" onSubmit={handleSubmit} className="space-y-6">
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
                title="Course Identity"
                description="Core course information used across the CRM and provider workflows."
                icon={BookOpen}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Course Name"
                    icon={GraduationCap}
                    required
                    hint="Use the official public-facing course title."
                  >
                    <input
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className={inputClassName()}
                      placeholder="Master of Information Technology"
                    />
                  </Field>

                  <Field
                    label="Course Code"
                    icon={BadgeCheck}
                    hint="Internal or provider course code."
                  >
                    <input
                      value={form.code}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, code: e.target.value }))
                      }
                      className={inputClassName()}
                      placeholder="MIT500"
                    />
                  </Field>

                  <Field label="Level" icon={Layers3}>
                    <input
                      value={form.level}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, level: e.target.value }))
                      }
                      className={inputClassName()}
                      placeholder="Masters"
                    />
                  </Field>

                  <Field label="Category" icon={Layers3}>
                    <input
                      value={form.category}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className={inputClassName()}
                      placeholder="IT / Business / Health"
                    />
                  </Field>

                  <Field label="Study Mode" icon={Globe2}>
                    <input
                      value={form.studyMode}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          studyMode: e.target.value,
                        }))
                      }
                      className={inputClassName()}
                      placeholder="On Campus / Online / Hybrid"
                    />
                  </Field>

                  <Field label="Campus" icon={MapPin}>
                    <input
                      value={form.campus}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, campus: e.target.value }))
                      }
                      className={inputClassName()}
                      placeholder="Melbourne"
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="Duration & Intake"
                description="Planning, timeline, and academic delivery information."
                icon={CalendarDays}
              >
                <div className="grid gap-5 md:grid-cols-3">
                  <Field label="Duration Text" icon={Info}>
                    <input
                      value={form.duration}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                      className={inputClassName()}
                      placeholder="2 Years"
                    />
                  </Field>

                  <Field label="Duration Value" icon={Info}>
                    <input
                      type="number"
                      step="0.01"
                      value={form.durationValue}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          durationValue: e.target.value,
                        }))
                      }
                      className={inputClassName()}
                      placeholder="2"
                    />
                  </Field>

                  <Field label="Duration Unit" icon={Info}>
                    <input
                      value={form.durationUnit}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          durationUnit: e.target.value,
                        }))
                      }
                      className={inputClassName()}
                      placeholder="Years / Months / Weeks"
                    />
                  </Field>

                  <div className="md:col-span-3">
                    <Field
                      label="Intake Months"
                      icon={CalendarDays}
                      hint="Example: February, July, November"
                    >
                      <input
                        value={form.intakeMonths}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            intakeMonths: e.target.value,
                          }))
                        }
                        className={inputClassName()}
                        placeholder="February, July, November"
                      />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Fees & Pricing"
                description="Commercial details and financial structure for course applications."
                icon={WalletCards}
              >
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Tuition Fee" icon={CircleDollarSign}>
                    <input
                      type="number"
                      step="0.01"
                      value={form.tuitionFee}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          tuitionFee: e.target.value,
                        }))
                      }
                      className={inputClassName()}
                      placeholder="32000"
                    />
                  </Field>

                  <Field label="Application Fee" icon={CircleDollarSign}>
                    <input
                      type="number"
                      step="0.01"
                      value={form.applicationFee}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          applicationFee: e.target.value,
                        }))
                      }
                      className={inputClassName()}
                      placeholder="150"
                    />
                  </Field>

                  <Field label="Material Fee" icon={CircleDollarSign}>
                    <input
                      type="number"
                      step="0.01"
                      value={form.materialFee}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          materialFee: e.target.value,
                        }))
                      }
                      className={inputClassName()}
                      placeholder="500"
                    />
                  </Field>

                  <Field label="Currency" icon={CircleDollarSign}>
                    <input
                      value={form.currency}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          currency: e.target.value,
                        }))
                      }
                      className={inputClassName()}
                      placeholder="AUD"
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="Requirements"
                description="Entry and English language criteria for applicants."
                icon={ShieldCheck}
              >
                <div className="grid gap-5">
                  <Field
                    label="Entry Requirements"
                    icon={FileText}
                    hint="Academic prerequisites, work experience, portfolios, or related conditions."
                  >
                    <textarea
                      rows={4}
                      value={form.entryRequirements}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          entryRequirements: e.target.value,
                        }))
                      }
                      className={textareaClassName()}
                      placeholder="Academic prerequisites, work experience, portfolio requirements"
                    />
                  </Field>

                  <Field
                    label="English Requirements"
                    icon={FileText}
                    hint="IELTS, PTE, TOEFL, or equivalent language thresholds."
                  >
                    <textarea
                      rows={4}
                      value={form.englishRequirements}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          englishRequirements: e.target.value,
                        }))
                      }
                      className={textareaClassName()}
                      placeholder="IELTS / PTE / TOEFL thresholds"
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="Descriptions & Notes"
                description="Public-facing summary and internal operational notes."
                icon={FileText}
              >
                <div className="grid gap-5">
                  <Field
                    label="Description"
                    icon={Info}
                    hint="General course summary used by internal teams and future import matching."
                  >
                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className={textareaClassName()}
                      placeholder="General course summary"
                    />
                  </Field>

                  <Field
                    label="Internal Notes"
                    icon={Info}
                    hint="Internal guidance, exceptions, commercial notes, or staff-only context."
                  >
                    <textarea
                      rows={5}
                      value={form.notes}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      className={textareaClassName()}
                      placeholder="Internal guidance, exceptions, commercial notes"
                    />
                  </Field>
                </div>
              </SectionCard>
            </div>

            <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <SectionCard
                title="Operational Status"
                description="Course availability and sync metadata."
                icon={RefreshCcw}
              >
                <div className="space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Active Course
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Controls whether this course is available and visible
                          in your CRM workflows.
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

                  <Field label="Source Type" icon={BookOpen}>
                    <select
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
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Sync Status" icon={RefreshCcw}>
                    <select
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
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="Course Summary"
                description="Quick operational overview before saving."
                icon={Sparkles}
              >
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Course Name
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {form.name || "Untitled course"}
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
                        Category
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {form.category || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        Study Mode
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {form.studyMode || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        Campus
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {form.campus || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        Tuition Fee
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {form.tuitionFee
                          ? `${form.currency || "AUD"} ${form.tuitionFee}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Save Changes"
                description="Update the course safely in production."
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
                        Updating Course...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update Course
                      </>
                    )}
                  </button>

                  <Link
                    href={`/providers/${providerId}/courses`}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </Link>
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
                          Archive Course
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          This sets the course to inactive without permanently
                          removing it. Recommended for production use.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleArchiveCourse}
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
                          Archive Course
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
                          This permanently removes the course. Use only when
                          there are no linked application records.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDeleteCourse}
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
                          Delete Course
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}