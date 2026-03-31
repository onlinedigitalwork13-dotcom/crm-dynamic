"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
    applicationId: string;
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

type ApplicationData = {
  id: string;
  providerId: string;
  courseId: string;
  intake: string;
  intakeYear: number | null;
  status: string;
  applicationNo: string | null;
  notes: string | null;
  appliedAt: string | null;
  offerDate: string | null;
};

export default function EditClientApplicationPage({ params }: PageProps) {
  const router = useRouter();

  const [clientId, setClientId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    async function loadData() {
      const resolved = await params;
      setClientId(resolved.id);
      setApplicationId(resolved.applicationId);

      try {
        const [providersRes, applicationRes] = await Promise.all([
          fetch("/api/providers"),
          fetch(`/api/applications/${resolved.applicationId}`),
        ]);

        const providersData = await providersRes.json().catch(() => []);
        const applicationData = await applicationRes.json().catch(() => null);

        if (!providersRes.ok) {
          alert(providersData?.error || "Failed to load providers");
          setLoadingData(false);
          return;
        }

        if (!applicationRes.ok || !applicationData?.id) {
          alert(applicationData?.error || "Failed to load application");
          setLoadingData(false);
          return;
        }

        setProviders(providersData);
        setProviderId(applicationData.providerId);
        setCourseId(applicationData.courseId);
        setIntake(applicationData.intake || "");
        setIntakeYear(
          applicationData.intakeYear !== null &&
            applicationData.intakeYear !== undefined
            ? String(applicationData.intakeYear)
            : ""
        );
        setStatus(applicationData.status || "applied");
        setApplicationNo(applicationData.applicationNo || "");
        setNotes(applicationData.notes || "");
        setAppliedAt(
          applicationData.appliedAt
            ? new Date(applicationData.appliedAt).toISOString().split("T")[0]
            : ""
        );
        setOfferDate(
          applicationData.offerDate
            ? new Date(applicationData.offerDate).toISOString().split("T")[0]
            : ""
        );

        if (applicationData.providerId) {
          const coursesRes = await fetch(
            `/api/courses?providerId=${applicationData.providerId}`
          );
          const coursesData = await coursesRes.json().catch(() => []);

          if (coursesRes.ok) {
            setCourses(coursesData);
          }
        }
      } catch (error) {
        console.error(error);
        alert("Something went wrong while loading application data");
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
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
        const res = await fetch(`/api/courses?providerId=${providerId}`);
        const data = await res.json();

        if (!res.ok) {
          alert(data?.error || "Failed to load courses");
          return;
        }

        setCourses(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    }

    loadCourses();
  }, [providerId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Failed to update application");
        setSaving(false);
        return;
      }

      router.push(`/clients/${clientId}/applications`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while updating the application");
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl rounded-xl border bg-white p-6">
          Loading application...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Clients / Applications / Edit</p>
            <h1 className="text-3xl font-bold">Edit Application</h1>
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
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Application"}
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