"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function NewCoursePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const providerId = params.id;

  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [duration, setDuration] = useState("");
  const [tuitionFee, setTuitionFee] = useState("");
  const [intakeMonths, setIntakeMonths] = useState("");
  const [campus, setCampus] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!providerId) {
      setError("Provider ID is missing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId,
          name: name.trim(),
          level: level.trim(),
          duration: duration.trim(),
          tuitionFee: tuitionFee.trim(),
          intakeMonths: intakeMonths.trim(),
          campus: campus.trim(),
          description: description.trim(),
          isActive,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to create course");
        setLoading(false);
        return;
      }

      router.push(`/providers/${providerId}/courses`);
      router.refresh();
    } catch (error) {
      console.error("Create course error:", error);
      setError("Something went wrong while creating the course");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Providers / Courses / New</p>
          <h1 className="text-3xl font-bold">Add Course</h1>
        </div>

        <Link
          href={providerId ? `/providers/${providerId}/courses` : "/courses-config"}
          className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">Course Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Master of Information Technology"
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
              placeholder="Masters / Bachelor / Diploma"
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Duration</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="2 years"
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Tuition Fee</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={tuitionFee}
              onChange={(e) => setTuitionFee(e.target.value)}
              placeholder="32000"
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Campus</label>
            <input
              type="text"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              placeholder="Melbourne"
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
            placeholder="February, July, November"
            className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief course description"
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
            disabled={loading || !providerId}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create Course"}
          </button>

          <Link
            href={providerId ? `/providers/${providerId}/courses` : "/courses-config"}
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}