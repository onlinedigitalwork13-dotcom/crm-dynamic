"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Coins,
  FileText,
  GraduationCap,
  MapPin,
  Save,
  ShieldCheck,
} from "lucide-react";

type CourseFormState = {
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
  campus: string;
  intakeMonths: string;
  entryRequirements: string;
  englishRequirements: string;
  description: string;
  isActive: boolean;
};

const levelOptions = [
  "Certificate I",
  "Certificate II",
  "Certificate III",
  "Certificate IV",
  "Diploma",
  "Advanced Diploma",
  "Associate Degree",
  "Bachelor",
  "Graduate Certificate",
  "Graduate Diploma",
  "Master",
  "Doctorate",
  "Other",
];

const categoryOptions = [
  "Business",
  "Information Technology",
  "Engineering",
  "Health",
  "Nursing",
  "Community Services",
  "Hospitality",
  "Automotive",
  "Construction",
  "Early Childhood Education",
  "English",
  "Accounting",
  "Marketing",
  "Design",
  "Other",
];

const studyModeOptions = [
  "On Campus",
  "Online",
  "Blended",
  "Full Time",
  "Part Time",
  "Flexible",
];

const durationUnitOptions = ["Weeks", "Months", "Years"];
const currencyOptions = ["AUD", "USD", "GBP", "EUR", "NZD", "CAD"];

function inputClassName(error?: boolean) {
  return [
    "w-full rounded-2xl border bg-white px-4 py-3.5 text-sm outline-none transition",
    "placeholder:text-slate-400",
    "focus:ring-4",
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
      : "border-slate-200 focus:border-slate-900 focus:ring-slate-100",
  ].join(" ");
}

function textAreaClassName(error?: boolean) {
  return [
    "min-h-[120px] w-full rounded-2xl border bg-white px-4 py-3.5 text-sm outline-none transition resize-y",
    "placeholder:text-slate-400",
    "focus:ring-4",
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
      : "border-slate-200 focus:border-slate-900 focus:ring-slate-100",
  ].join(" ");
}

function selectClassName(error?: boolean) {
  return [
    "w-full rounded-2xl border bg-white px-4 py-3.5 text-sm outline-none transition",
    "focus:ring-4",
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
      : "border-slate-200 focus:border-slate-900 focus:ring-slate-100",
  ].join(" ");
}

function sectionCardClassName() {
  return "rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur";
}

function sectionHeaderIconWrapClassName() {
  return "flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm";
}

function labelClassName() {
  return "mb-2 block text-sm font-medium text-slate-700";
}

export default function NewCoursePage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.id as string;

  const [form, setForm] = useState<CourseFormState>({
    name: "",
    code: "",
    level: "",
    category: "",
    studyMode: "",
    duration: "",
    durationValue: "",
    durationUnit: "Weeks",
    tuitionFee: "",
    applicationFee: "",
    materialFee: "",
    currency: "AUD",
    campus: "",
    intakeMonths: "",
    entryRequirements: "",
    englishRequirements: "",
    description: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CourseFormState, string>>
  >({});

  const intakePreview = useMemo(() => {
    return form.intakeMonths
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [form.intakeMonths]);

  function updateField<K extends keyof CourseFormState>(
    key: K,
    value: CourseFormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (submitError) {
      setSubmitError("");
    }
  }

  function validateForm() {
    const errors: Partial<Record<keyof CourseFormState, string>> = {};

    if (!form.name.trim()) {
      errors.name = "Course name is required.";
    }

    if (!form.level.trim()) {
      errors.level = "Please select a course level.";
    }

    if (!form.studyMode.trim()) {
      errors.studyMode = "Please select a study mode.";
    }

    if (form.durationValue && Number.isNaN(Number(form.durationValue))) {
      errors.durationValue = "Duration value must be a valid number.";
    }

    if (form.tuitionFee && Number.isNaN(Number(form.tuitionFee))) {
      errors.tuitionFee = "Tuition fee must be a valid number.";
    }

    if (form.applicationFee && Number.isNaN(Number(form.applicationFee))) {
      errors.applicationFee = "Application fee must be a valid number.";
    }

    if (form.materialFee && Number.isNaN(Number(form.materialFee))) {
      errors.materialFee = "Material fee must be a valid number.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/providers/${providerId}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          code: form.code.trim(),
          level: form.level.trim(),
          category: form.category.trim(),
          studyMode: form.studyMode.trim(),
          duration: form.duration.trim(),
          durationValue: form.durationValue ? Number(form.durationValue) : null,
          durationUnit: form.durationUnit.trim(),
          tuitionFee: form.tuitionFee ? Number(form.tuitionFee) : null,
          applicationFee: form.applicationFee ? Number(form.applicationFee) : null,
          materialFee: form.materialFee ? Number(form.materialFee) : null,
          currency: form.currency.trim(),
          campus: form.campus.trim(),
          intakeMonths: form.intakeMonths.trim(),
          entryRequirements: form.entryRequirements.trim(),
          englishRequirements: form.englishRequirements.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
        }),
      });

      if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message || "Failed to create course");
      }

      router.push(`/providers/${providerId}/courses`);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create course";
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-700 px-6 py-8 text-white sm:px-8 sm:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_25%)]" />
              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                    <GraduationCap className="h-4 w-4" />
                    Provider Course Workspace
                  </div>

                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Add New Course
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Create a premium course profile for this provider with structured
                    academic, commercial, intake, and admission details.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[460px]">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                      Provider ID
                    </div>
                    <div className="mt-2 truncate text-sm font-medium text-white">
                      {providerId}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                      Status
                    </div>
                    <div className="mt-2 text-sm font-medium text-emerald-300">
                      New Course Draft
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                      Workspace
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                      Provider Linked
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <section className={sectionCardClassName()}>
                <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                  <div className="flex items-start gap-4">
                    <div className={sectionHeaderIconWrapClassName()}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Course Basics
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Enter the main identity and academic classification for this
                        course.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 px-6 py-6 sm:px-7 md:grid-cols-2">
                  <div>
                    <label className={labelClassName()}>Course Name *</label>
                    <input
                      className={inputClassName(!!fieldErrors.name)}
                      placeholder="e.g. Bachelor of Information Technology"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                    />
                    {fieldErrors.name && (
                      <p className="mt-2 text-xs text-red-600">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClassName()}>Course Code</label>
                    <input
                      className={inputClassName()}
                      placeholder="e.g. BIT-2026"
                      value={form.code}
                      onChange={(e) => updateField("code", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClassName()}>Level *</label>
                    <select
                      className={selectClassName(!!fieldErrors.level)}
                      value={form.level}
                      onChange={(e) => updateField("level", e.target.value)}
                    >
                      <option value="">Select level</option>
                      {levelOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.level && (
                      <p className="mt-2 text-xs text-red-600">{fieldErrors.level}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClassName()}>Category</label>
                    <select
                      className={selectClassName()}
                      value={form.category}
                      onChange={(e) => updateField("category", e.target.value)}
                    >
                      <option value="">Select category</option>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClassName()}>Study Mode *</label>
                    <select
                      className={selectClassName(!!fieldErrors.studyMode)}
                      value={form.studyMode}
                      onChange={(e) => updateField("studyMode", e.target.value)}
                    >
                      <option value="">Select study mode</option>
                      {studyModeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.studyMode && (
                      <p className="mt-2 text-xs text-red-600">
                        {fieldErrors.studyMode}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className={sectionCardClassName()}>
                <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                  <div className="flex items-start gap-4">
                    <div className={sectionHeaderIconWrapClassName()}>
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Duration & Intake
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Add both formatted duration text and structured intake details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 px-6 py-6 sm:px-7 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <label className={labelClassName()}>Duration (Display Text)</label>
                    <input
                      className={inputClassName()}
                      placeholder="e.g. 2 Years Full Time"
                      value={form.duration}
                      onChange={(e) => updateField("duration", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClassName()}>Duration Value</label>
                    <input
                      className={inputClassName(!!fieldErrors.durationValue)}
                      placeholder="e.g. 104"
                      value={form.durationValue}
                      onChange={(e) => updateField("durationValue", e.target.value)}
                    />
                    {fieldErrors.durationValue && (
                      <p className="mt-2 text-xs text-red-600">
                        {fieldErrors.durationValue}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClassName()}>Duration Unit</label>
                    <select
                      className={selectClassName()}
                      value={form.durationUnit}
                      onChange={(e) => updateField("durationUnit", e.target.value)}
                    >
                      {durationUnitOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 xl:col-span-3">
                    <label className={labelClassName()}>
                      Intake Months
                    </label>
                    <input
                      className={inputClassName()}
                      placeholder="e.g. February, July, November"
                      value={form.intakeMonths}
                      onChange={(e) => updateField("intakeMonths", e.target.value)}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Separate multiple intakes using commas.
                    </p>

                    {intakePreview.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {intakePreview.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className={sectionCardClassName()}>
                <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                  <div className="flex items-start gap-4">
                    <div className={sectionHeaderIconWrapClassName()}>
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Fees & Commercials
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Define financial details clearly for internal teams and future
                        integrations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 px-6 py-6 sm:px-7 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className={labelClassName()}>Tuition Fee</label>
                    <input
                      className={inputClassName(!!fieldErrors.tuitionFee)}
                      placeholder="e.g. 24500"
                      value={form.tuitionFee}
                      onChange={(e) => updateField("tuitionFee", e.target.value)}
                    />
                    {fieldErrors.tuitionFee && (
                      <p className="mt-2 text-xs text-red-600">
                        {fieldErrors.tuitionFee}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClassName()}>Application Fee</label>
                    <input
                      className={inputClassName(!!fieldErrors.applicationFee)}
                      placeholder="e.g. 250"
                      value={form.applicationFee}
                      onChange={(e) => updateField("applicationFee", e.target.value)}
                    />
                    {fieldErrors.applicationFee && (
                      <p className="mt-2 text-xs text-red-600">
                        {fieldErrors.applicationFee}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClassName()}>Material Fee</label>
                    <input
                      className={inputClassName(!!fieldErrors.materialFee)}
                      placeholder="e.g. 500"
                      value={form.materialFee}
                      onChange={(e) => updateField("materialFee", e.target.value)}
                    />
                    {fieldErrors.materialFee && (
                      <p className="mt-2 text-xs text-red-600">
                        {fieldErrors.materialFee}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClassName()}>Currency</label>
                    <select
                      className={selectClassName()}
                      value={form.currency}
                      onChange={(e) => updateField("currency", e.target.value)}
                    >
                      {currencyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className={sectionCardClassName()}>
                <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                  <div className="flex items-start gap-4">
                    <div className={sectionHeaderIconWrapClassName()}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Campus & Delivery
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Capture delivery location and provider-facing campus data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 px-6 py-6 sm:px-7 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelClassName()}>Campus</label>
                    <input
                      className={inputClassName()}
                      placeholder="e.g. Melbourne City Campus"
                      value={form.campus}
                      onChange={(e) => updateField("campus", e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className={sectionCardClassName()}>
                <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                  <div className="flex items-start gap-4">
                    <div className={sectionHeaderIconWrapClassName()}>
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Admissions & Requirements
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Define academic, English, and supporting entry conditions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 px-6 py-6 sm:px-7">
                  <div>
                    <label className={labelClassName()}>Entry Requirements</label>
                    <textarea
                      className={textAreaClassName()}
                      placeholder="e.g. Completion of Year 12 or equivalent qualification."
                      value={form.entryRequirements}
                      onChange={(e) =>
                        updateField("entryRequirements", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClassName()}>English Requirements</label>
                    <textarea
                      className={textAreaClassName()}
                      placeholder="e.g. IELTS overall 6.0 with no band less than 5.5."
                      value={form.englishRequirements}
                      onChange={(e) =>
                        updateField("englishRequirements", e.target.value)
                      }
                    />
                  </div>
                </div>
              </section>

              <section className={sectionCardClassName()}>
                <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                  <div className="flex items-start gap-4">
                    <div className={sectionHeaderIconWrapClassName()}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Description
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Add a clear internal or public-facing summary for the course.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6 sm:px-7">
                  <label className={labelClassName()}>Course Description</label>
                  <textarea
                    className={textAreaClassName()}
                    placeholder="Describe the course structure, outcomes, and student suitability."
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                </div>
              </section>

              <section className={sectionCardClassName()}>
                <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                  <div className="flex items-start gap-4">
                    <div className={sectionHeaderIconWrapClassName()}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Status
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Control whether this course is active and visible in the CRM.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6 sm:px-7">
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Active Course
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Inactive courses can be retained without being used in live
                        operations.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateField("isActive", !form.isActive)}
                      className={[
                        "relative inline-flex h-7 w-14 items-center rounded-full transition",
                        form.isActive ? "bg-emerald-500" : "bg-slate-300",
                      ].join(" ")}
                      aria-pressed={form.isActive}
                    >
                      <span
                        className={[
                          "inline-block h-5 w-5 transform rounded-full bg-white transition",
                          form.isActive ? "translate-x-8" : "translate-x-1",
                        ].join(" ")}
                      />
                    </button>
                  </label>
                </div>
              </section>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Quick Summary
                </h3>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Course Name
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {form.name.trim() || "Not set yet"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Level
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {form.level || "Not selected"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Study Mode
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {form.studyMode || "Not selected"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Tuition
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {form.tuitionFee
                        ? `${form.currency} ${form.tuitionFee}`
                        : "Not set"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Status
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          form.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700",
                        ].join(" ")}
                      >
                        {form.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Publishing Notes
                </h3>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>
                    Use a clear course title and consistent provider-aligned naming.
                  </p>
                  <p>
                    Keep fees numeric so your import, reporting, and future sync
                    flows stay clean.
                  </p>
                  <p>
                    Add comma-separated intakes to support structured parsing later.
                  </p>
                </div>
              </div>
            </aside>

            <div className="xl:col-span-2">
              {submitError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="sticky bottom-4 z-20 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    Save this course into the provider workspace and return to the
                    courses directory.
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Creating Course..." : "Create Course"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}