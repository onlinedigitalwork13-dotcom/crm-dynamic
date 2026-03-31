"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: string;
  name: string;
};

type CourseOption = {
  id: string;
  providerId: string;
  name: string;
};

type Props = {
  application: {
    id: string;
    clientId: string;
    providerId: string;
    courseId: string;
    intake: string;
    intakeYear: string;
    status: string;
    applicationNo: string;
    notes: string;
    appliedAt: string;
  };
  clients: Option[];
  providers: Option[];
  courses: CourseOption[];
};

export default function ApplicationEditForm({
  application,
  clients,
  providers,
  courses,
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    clientId: application.clientId,
    providerId: application.providerId,
    courseId: application.courseId,
    intake: application.intake,
    intakeYear: application.intakeYear,
    status: application.status,
    applicationNo: application.applicationNo,
    notes: application.notes,
    appliedAt: application.appliedAt,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => course.providerId === form.providerId);
  }, [courses, form.providerId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: form.clientId,
          providerId: form.providerId,
          courseId: form.courseId,
          intake: form.intake.trim(),
          intakeYear: form.intakeYear.trim(),
          status: form.status.trim(),
          applicationNo: form.applicationNo.trim(),
          notes: form.notes.trim(),
          appliedAt: form.appliedAt || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update application");
      }

      router.push(`/applications/${application.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Client</label>
          <select
            value={form.clientId}
            onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2"
            required
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Provider</label>
          <select
            value={form.providerId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                providerId: e.target.value,
                courseId: "",
              }))
            }
            className="w-full rounded-lg border px-3 py-2"
            required
          >
            <option value="">Select provider</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Course</label>
          <select
            value={form.courseId}
            onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2"
            required
          >
            <option value="">Select course</option>
            {filteredCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Intake</label>
            <input
              value={form.intake}
              onChange={(e) => setForm((prev) => ({ ...prev, intake: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Intake Year</label>
            <input
              type="number"
              value={form.intakeYear}
              onChange={(e) => setForm((prev) => ({ ...prev, intakeYear: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <input
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Application No</label>
            <input
              value={form.applicationNo}
              onChange={(e) => setForm((prev) => ({ ...prev, applicationNo: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Applied At</label>
          <input
            type="date"
            value={form.appliedAt}
            onChange={(e) => setForm((prev) => ({ ...prev, appliedAt: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Application"}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/applications/${application.id}`)}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}