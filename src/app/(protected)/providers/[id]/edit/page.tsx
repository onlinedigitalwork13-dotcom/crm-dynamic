"use client";

import { FormEvent, useEffect, useState } from "react";
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
  level: string | null;
  duration: string | null;
  tuitionFee: number | null;
  intakeMonths: string | null;
  campus: string | null;
  description: string | null;
  isActive: boolean;
};

export default function EditCoursePage({ params }: Props) {
  const router = useRouter();

  const [providerId, setProviderId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [duration, setDuration] = useState("");
  const [tuitionFee, setTuitionFee] = useState("");
  const [intakeMonths, setIntakeMonths] = useState("");
  const [campus, setCampus] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function loadCourse() {
      const resolved = await params;
      setProviderId(resolved.id);
      setCourseId(resolved.courseId);

      try {
        const res = await fetch(`/api/courses/${resolved.courseId}`);
        const data: CourseData | { error?: string } = await res.json();

        if (!res.ok || !("id" in data)) {
          alert(("error" in data && data.error) || "Failed to load course");
          setLoadingData(false);
          return;
        }

        setName(data.name || "");
        setLevel(data.level || "");
        setDuration(data.duration || "");
        setTuitionFee(
          data.tuitionFee !== null && data.tuitionFee !== undefined
            ? String(data.tuitionFee)
            : ""
        );
        setIntakeMonths(data.intakeMonths || "");
        setCampus(data.campus || "");
        setDescription(data.description || "");
        setIsActive(data.isActive);
      } catch (error) {
        console.error(error);
        alert("Something went wrong while loading the course");
      } finally {
        setLoadingData(false);
      }
    }

    loadCourse();
  }, [params]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          level,
          duration,
          tuitionFee,
          intakeMonths,
          campus,
          description,
          isActive,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Failed to update course");
        setSaving(false);
        return;
      }

      router.push(`/providers/${providerId}/courses`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while updating the course");
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl rounded-lg border bg-white p-6">
          Loading course...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Providers / Courses / Edit</p>
            <h1 className="text-3xl font-bold">Edit Course</h1>
          </div>

          <Link
            href={`/providers/${providerId}/courses`}
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Course Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Level</label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Tuition Fee</label>
              <input
                type="number"
                value={tuitionFee}
                onChange={(e) => setTuitionFee(e.target.value)}
                className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Campus</label>
              <input
                type="text"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Intake Months</label>
            <input
              type="text"
              value={intakeMonths}
              onChange={(e) => setIntakeMonths(e.target.value)}
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active Course
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Course"}
            </button>

            <Link
              href={`/providers/${providerId}/courses`}
              className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}