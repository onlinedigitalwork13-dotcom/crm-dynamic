"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
    courseId: string;
  }>;
};

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

export default function EditCoursePage({ params }: Props) {
  const router = useRouter();

  const [providerId, setProviderId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
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
  });

  const sourceTypeOptions = useMemo(
    () => ["manual", "csv", "sheet", "api"],
    []
  );

  const syncStatusOptions = useMemo(
    () => ["manual", "idle", "pending", "success", "failed"],
    []
  );

  useEffect(() => {
    async function loadCourse() {
      const resolved = await params;
      setProviderId(resolved.id);
      setCourseId(resolved.courseId);

      try {
        const res = await fetch(`/api/courses/${resolved.courseId}`);
        const data: CourseData | { error?: string } = await res.json();

        if (!res.ok || !("id" in data)) {
          setError(("error" in data && data.error) || "Failed to load course");
          setLoadingData(false);
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
  }, [params]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

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
        setSaving(false);
        return;
      }

      router.push(`/providers/${providerId}/courses`);
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError("Something went wrong while updating the course");
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
              Course Configuration
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Edit Course
            </h1>
            <p className="mt-3 text-sm text-slate-300">Loading course data...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
                Course Configuration
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Edit Course
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                Update catalog structure, pricing, requirements, and sync-ready
                metadata for this provider course.
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

            <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10 xl:w-[320px]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                Edit Scope
              </p>
              <p className="mt-1 text-sm text-white">
                Premium course editing for fees, requirements, categorisation,
                and future provider sync workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <div className="space-y-6">
            <SectionCard
              title="Course Identity"
              description="Core course information used across the CRM."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Course Name">
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

                <Field label="Course Code">
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, code: e.target.value }))
                    }
                    className={inputClassName()}
                    placeholder="MIT500"
                  />
                </Field>

                <Field label="Level">
                  <input
                    value={form.level}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, level: e.target.value }))
                    }
                    className={inputClassName()}
                    placeholder="Masters"
                  />
                </Field>

                <Field label="Category">
                  <input
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className={inputClassName()}
                    placeholder="IT / Business / Health"
                  />
                </Field>

                <Field label="Study Mode">
                  <input
                    value={form.studyMode}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, studyMode: e.target.value }))
                    }
                    className={inputClassName()}
                    placeholder="On Campus / Online / Hybrid"
                  />
                </Field>

                <Field label="Campus">
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
              description="Planning and academic timing information."
            >
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Duration Text">
                  <input
                    value={form.duration}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, duration: e.target.value }))
                    }
                    className={inputClassName()}
                    placeholder="2 Years"
                  />
                </Field>

                <Field label="Duration Value">
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

                <Field label="Duration Unit">
                  <input
                    value={form.durationUnit}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        durationUnit: e.target.value,
                      }))
                    }
                    className={inputClassName()}
                    placeholder="Years / Months"
                  />
                </Field>

                <div className="md:col-span-3">
                  <Field label="Intake Months">
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
              description="Commercial details and financial structure."
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Tuition Fee">
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

                <Field label="Application Fee">
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

                <Field label="Material Fee">
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

                <Field label="Currency">
                  <input
                    value={form.currency}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, currency: e.target.value }))
                    }
                    className={inputClassName()}
                    placeholder="AUD"
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              title="Requirements"
              description="Entry and language criteria for applicants."
            >
              <div className="grid gap-5">
                <Field label="Entry Requirements">
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

                <Field label="English Requirements">
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
              description="Internal and external course context."
            >
              <div className="grid gap-5">
                <Field label="Description">
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

                <Field label="Internal Notes">
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
            >
              <div className="space-y-5">
                <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Active Course
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Controls whether this course is active in the CRM.
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

                <Field label="Source Type">
                  <select
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
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Sync Status">
                  <select
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
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              title="Save Changes"
              description="Update the course safely in production."
            >
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Updating Course..." : "Update Course"}
                </button>

                <Link
                  href={`/providers/${providerId}/courses`}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      </form>
    </div>
  );
}