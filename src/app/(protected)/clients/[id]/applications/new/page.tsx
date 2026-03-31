"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Provider = {
  id: string;
  name: string;
};

type Course = {
  id: string;
  name: string;
  providerId: string;
};

async function safeJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function NewClientApplicationPage({ params }: PageProps) {
  const router = useRouter();

  const [clientId, setClientId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [intake, setIntake] = useState("");
  const [intakeYear, setIntakeYear] = useState("");
  const [status, setStatus] = useState("applied");
  const [applicationNo, setApplicationNo] = useState("");
  const [notes, setNotes] = useState("");
  const [appliedAt, setAppliedAt] = useState("");
  const [offerDate, setOfferDate] = useState("");

  const [providers, setProviders] = useState<Provider[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    async function init() {
      const resolved = await params;
      setClientId(resolved.id);

      try {
        const res = await fetch("/api/providers", {
          method: "GET",
          cache: "no-store",
        });

        const data = await safeJson<Provider[] | { error?: string }>(res);

        if (!res.ok) {
          const errorMessage =
            data && !Array.isArray(data) ? data.error : undefined;
          alert(errorMessage || "Failed to load providers");
          return;
        }

        if (!Array.isArray(data)) {
          alert("Providers API returned invalid data");
          return;
        }

        setProviders(data);
      } catch (error) {
        console.error("Failed to load providers:", error);
        alert("Failed to load providers");
      } finally {
        setLoadingProviders(false);
      }
    }

    init();
  }, [params]);

  useEffect(() => {
    async function loadCourses() {
      if (!providerId) {
        setCourses([]);
        setCourseId("");
        return;
      }

      setLoadingCourses(true);

      try {
        const res = await fetch(`/api/courses?providerId=${providerId}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await safeJson<Course[] | { error?: string }>(res);

        if (!res.ok) {
          const errorMessage =
            data && !Array.isArray(data) ? data.error : undefined;
          alert(errorMessage || "Failed to load courses");
          setCourses([]);
          return;
        }

        if (!Array.isArray(data)) {
          alert("Courses API returned invalid data");
          setCourses([]);
          return;
        }

        setCourses(data);
        setCourseId("");
      } catch (error) {
        console.error("Failed to load courses:", error);
        alert("Failed to load courses");
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    }

    loadCourses();
  }, [providerId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          providerId,
          courseId,
          intake,
          intakeYear,
          status,
          applicationNo,
          notes,
          appliedAt,
          offerDate,
        }),
      });

      const data = await safeJson<{ error?: string }>(res);

      if (!res.ok) {
        alert(data?.error || "Failed to create application");
        setLoading(false);
        return;
      }

      router.push(`/clients/${clientId}/applications`);
      router.refresh();
    } catch (error) {
      console.error("Failed to create application:", error);
      alert("Something went wrong while creating the application");
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Clients / Applications / New</p>
            <h1 className="text-3xl font-bold">Add Application</h1>
          </div>

          <Link
            href={`/clients/${clientId}/applications`}
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Provider *</label>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              required
              disabled={loadingProviders}
            >
              <option value="">
                {loadingProviders ? "Loading providers..." : "Select provider"}
              </option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Course *</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              required
              disabled={!providerId || loadingCourses}
            >
              <option value="">
                {loadingCourses
                  ? "Loading courses..."
                  : providerId
                  ? "Select course"
                  : "Select provider first"}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Intake *</label>
              <input
                type="text"
                value={intake}
                onChange={(e) => setIntake(e.target.value)}
                placeholder="February"
                className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Intake Year</label>
              <input
                type="number"
                value={intakeYear}
                onChange={(e) => setIntakeYear(e.target.value)}
                placeholder="2026"
                className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              >
                <option value="applied">Applied</option>
                <option value="in_review">In Review</option>
                <option value="offer_received">Offer Received</option>
                <option value="offer_accepted">Offer Accepted</option>
                <option value="coe_issued">COE Issued</option>
                <option value="visa_lodged">Visa Lodged</option>
                <option value="visa_granted">Visa Granted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Application No
              </label>
              <input
                type="text"
                value={applicationNo}
                onChange={(e) => setApplicationNo(e.target.value)}
                placeholder="APP-1001"
                className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Applied At</label>
              <input
                type="date"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
                className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Offer Date</label>
              <input
                type="date"
                value={offerDate}
                onChange={(e) => setOfferDate(e.target.value)}
                className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Internal notes about the application"
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Application"}
            </button>

            <Link
              href={`/clients/${clientId}/applications`}
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