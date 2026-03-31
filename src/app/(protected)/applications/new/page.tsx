"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
};

type Provider = {
  id: string;
  name: string;
  isActive?: boolean;
};

type Course = {
  id: string;
  providerId: string;
  name: string;
};

export default function NewApplicationPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [clientId, setClientId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [intake, setIntake] = useState("");
  const [intakeYear, setIntakeYear] = useState("");
  const [status, setStatus] = useState("applied");
  const [applicationNo, setApplicationNo] = useState("");
  const [notes, setNotes] = useState("");
  const [appliedAt, setAppliedAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setPageLoading(true);
        setError("");

        const [clientsRes, providersRes, coursesRes] = await Promise.all([
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/providers", { cache: "no-store" }),
          fetch("/api/courses", { cache: "no-store" }),
        ]);

        const [clientsData, providersData, coursesData] = await Promise.all([
          clientsRes.json(),
          providersRes.json(),
          coursesRes.json(),
        ]);

        if (!clientsRes.ok) {
          throw new Error(clientsData?.error || "Failed to load clients");
        }

        if (!providersRes.ok) {
          throw new Error(providersData?.error || "Failed to load providers");
        }

        if (!coursesRes.ok) {
          throw new Error(coursesData?.error || "Failed to load courses");
        }

        setClients(Array.isArray(clientsData) ? clientsData : []);
        setProviders(
          Array.isArray(providersData)
            ? providersData.filter((provider: Provider) => provider.isActive !== false)
            : []
        );
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load form data");
      } finally {
        setPageLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => course.providerId === providerId);
  }, [courses, providerId]);

  useEffect(() => {
    setCourseId("");
  }, [providerId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!clientId || !providerId || !courseId || !intake.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

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
          intake: intake.trim(),
          intakeYear: intakeYear.trim() || null,
          status: status.trim(),
          applicationNo: applicationNo.trim() || null,
          notes: notes.trim() || null,
          appliedAt: appliedAt || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to create application");
        setLoading(false);
        return;
      }

      router.push(`/applications/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong while creating the application");
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Loading application form...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">Applications / New</p>
            <h1 className="text-3xl font-bold">Add Application</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create a new student application and connect it to client, provider,
              course, and intake.
            </p>
          </div>

          <Link
            href="/applications"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back
          </Link>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-lg border bg-gray-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Application Setup
          </h2>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Client *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
                required
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                    {client.email ? ` (${client.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Provider *
              </label>
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
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

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Course *
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black disabled:bg-gray-100"
                required
                disabled={!providerId}
              >
                <option value="">
                  {providerId ? "Select course" : "Select provider first"}
                </option>
                {filteredCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-gray-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Intake & Status
          </h2>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Intake *
              </label>
              <input
                type="text"
                value={intake}
                onChange={(e) => setIntake(e.target.value)}
                placeholder="February"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Intake Year
              </label>
              <input
                type="number"
                value={intakeYear}
                onChange={(e) => setIntakeYear(e.target.value)}
                placeholder="2026"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              >
                <option value="applied">applied</option>
                <option value="submitted">submitted</option>
                <option value="offer_received">offer_received</option>
                <option value="offer_accepted">offer_accepted</option>
                <option value="coe_issued">coe_issued</option>
                <option value="visa_lodged">visa_lodged</option>
                <option value="visa_granted">visa_granted</option>
                <option value="rejected">rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Application No
              </label>
              <input
                type="text"
                value={applicationNo}
                onChange={(e) => setApplicationNo(e.target.value)}
                placeholder="APP-001"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Applied At
              </label>
              <input
                type="date"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-gray-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Notes
          </h2>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Internal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Optional application notes"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create Application"}
          </button>

          <Link
            href="/applications"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}