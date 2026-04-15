"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ClientOption = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  passport?: string | null;
};

type ProviderOption = {
  id: string;
  name: string;
  country?: string | null;
  city?: string | null;
};

type CourseOption = {
  id: string;
  name: string;
  level?: string | null;
  campus?: string | null;
  intakeMonths?: string | null;
  duration?: string | null;
};

type LeadPrefillPayload = {
  success?: boolean;
  data?: {
    lead: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      country?: string | null;
      source?: string | null;
      status?: string | null;
      notes?: string | null;
      createdAt?: string | null;
    };
    client: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
      passport?: string | null;
    } | null;
    intakeSubmission: {
      id: string;
      status?: string | null;
      submittedAt?: string | null;
    } | null;
    subagent: {
      id?: string | null;
      name?: string | null;
      referralCode?: string | null;
      email?: string | null;
      phone?: string | null;
      agencyName?: string | null;
    };
    applicationPrefill: {
      providerId?: string;
      providerName?: string;
      courseId?: string;
      courseName?: string;
      intake?: string;
      studyLevel?: string;
      preferredCampus?: string;
      subjectArea?: string;
      duration?: string;
      destinationCountry?: string;
      notes?: string;
    };
    canCreateApplication: boolean;
    blockingReason?: string | null;
  };
  error?: string;
};

type ApiListResponse<T> =
  | T[]
  | {
      data?: T[];
      error?: string;
      message?: string;
      success?: boolean;
    };

function extractList<T>(payload: ApiListResponse<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getClientLabel(client: ClientOption) {
  const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ");
  return fullName || "Unnamed client";
}

export default function NewApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(Boolean(leadId));

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [intake, setIntake] = useState("");
  const [intakeYear, setIntakeYear] = useState("");
  const [status, setStatus] = useState("applied");
  const [applicationNo, setApplicationNo] = useState("");
  const [notes, setNotes] = useState("");
  const [appliedAt, setAppliedAt] = useState("");
  const [offerDate, setOfferDate] = useState("");

  const [leadPrefill, setLeadPrefill] = useState<LeadPrefillPayload["data"] | null>(null);

  const [pageError, setPageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;

    return clients.filter((client) => {
      const fullName = `${client.firstName || ""} ${client.lastName || ""}`.toLowerCase();
      const email = (client.email || "").toLowerCase();
      const phone = (client.phone || "").toLowerCase();
      const passport = (client.passport || "").toLowerCase();

      return (
        fullName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        passport.includes(q)
      );
    });
  }, [clients, clientSearch]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId) || null,
    [providers, selectedProviderId]
  );

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  useEffect(() => {
    let active = true;

    async function loadClients() {
      setLoadingClients(true);

      try {
        const response = await fetch("/api/clients");
        const payload = (await response.json()) as ApiListResponse<ClientOption>;

        if (!response.ok) {
          throw new Error(
            !Array.isArray(payload) && payload?.error
              ? payload.error
              : "Failed to load clients"
          );
        }

        if (!active) return;
        setClients(extractList(payload));
      } catch (error) {
        if (!active) return;
        setPageError(
          error instanceof Error ? error.message : "Failed to load clients"
        );
      } finally {
        if (active) {
          setLoadingClients(false);
        }
      }
    }

    loadClients();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProviders() {
      setLoadingProviders(true);

      try {
        const response = await fetch("/api/public/providers");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load providers");
        }

        if (!active) return;
        setProviders(Array.isArray(payload?.items) ? payload.items : []);
      } catch (error) {
        if (!active) return;
        setPageError(
          error instanceof Error ? error.message : "Failed to load providers"
        );
      } finally {
        if (active) {
          setLoadingProviders(false);
        }
      }
    }

    loadProviders();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      if (!selectedProviderId) {
        setCourses([]);
        setSelectedCourseId("");
        return;
      }

      setLoadingCourses(true);

      try {
        const response = await fetch(
          `/api/public/providers/${selectedProviderId}/courses`
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load courses");
        }

        if (!active) return;
        const nextCourses = Array.isArray(payload?.items) ? payload.items : [];
        setCourses(nextCourses);
      } catch (error) {
        if (!active) return;
        setPageError(
          error instanceof Error ? error.message : "Failed to load courses"
        );
      } finally {
        if (active) {
          setLoadingCourses(false);
        }
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, [selectedProviderId]);

  useEffect(() => {
    let active = true;

    async function loadLeadPrefill() {
      if (!leadId) return;

      setLoadingPrefill(true);

      try {
        const response = await fetch(`/api/leads/${leadId}/prefill`);
        const payload = (await response.json()) as LeadPrefillPayload;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error || "Failed to load lead prefill");
        }

        if (!active) return;

        const data = payload.data;
        setLeadPrefill(data);

        if (data.client?.id) {
          setSelectedClientId(data.client.id);
        }

        if (data.applicationPrefill?.providerId) {
          setSelectedProviderId(data.applicationPrefill.providerId);
        }

        if (data.applicationPrefill?.intake) {
          setIntake(data.applicationPrefill.intake);
        }

        if (data.applicationPrefill?.notes) {
          setNotes(data.applicationPrefill.notes);
        }
      } catch (error) {
        if (!active) return;
        setPageError(
          error instanceof Error ? error.message : "Failed to load lead prefill"
        );
      } finally {
        if (active) {
          setLoadingPrefill(false);
        }
      }
    }

    loadLeadPrefill();

    return () => {
      active = false;
    };
  }, [leadId]);

  useEffect(() => {
    if (!leadPrefill?.applicationPrefill?.courseId || courses.length === 0) {
      return;
    }

    const match = courses.find(
      (course) => course.id === leadPrefill.applicationPrefill.courseId
    );

    if (match) {
      setSelectedCourseId(match.id);
    }
  }, [courses, leadPrefill]);

  function handleProviderChange(providerId: string) {
    setSelectedProviderId(providerId);
    setSelectedCourseId("");
  }

  function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId);

    const course = courses.find((item) => item.id === courseId);
    if (!course) return;

    if (!intake && course.intakeMonths) {
      setIntake(course.intakeMonths);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!selectedClientId) {
      setSubmitError("Client is required.");
      return;
    }

    if (!selectedProviderId) {
      setSubmitError("Provider is required.");
      return;
    }

    if (!selectedCourseId) {
      setSubmitError("Course is required.");
      return;
    }

    if (!intake.trim()) {
      setSubmitError("Intake is required.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          providerId: selectedProviderId,
          courseId: selectedCourseId,
          intake: intake.trim(),
          intakeYear: intakeYear.trim() ? Number(intakeYear) : null,
          status: status.trim() || "applied",
          applicationNo: applicationNo.trim() || null,
          notes: notes.trim() || null,
          appliedAt: appliedAt || null,
          offerDate: offerDate || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create application");
      }

      const applicationId =
        payload?.data?.id || payload?.id || payload?.application?.id;

      if (!applicationId) {
        router.push("/applications");
        return;
      }

      router.push(`/applications/${applicationId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create application"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isInitialLoading =
    loadingClients || loadingProviders || loadingPrefill;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                Applications
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                New Application
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Create a real application manually with staff review, while
                reusing provider, course, client, and referral data already
                captured during intake.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {leadId ? `Prefill source: lead ${leadId}` : "Manual application mode"}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-6">
          {pageError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {pageError}
            </div>
          ) : null}

          {isInitialLoading ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm text-slate-600">Loading application setup...</p>
            </div>
          ) : leadPrefill && !leadPrefill.canCreateApplication ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Action required
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Client profile required before application creation
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                  {leadPrefill.blockingReason ||
                    "This lead is not linked to a client yet."}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {leadPrefill.intakeSubmission?.id ? (
                    <Link
                      href={`/intake-submissions/${leadPrefill.intakeSubmission.id}/convert`}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Convert / Link Student First
                    </Link>
                  ) : (
                    <Link
                      href="/leads"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Back to Leads
                    </Link>
                  )}

                  <Link
                    href="/applications"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Back to Applications
                  </Link>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-950">
                    Lead snapshot
                  </h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold">Lead:</span>{" "}
                      {[leadPrefill.lead.firstName, leadPrefill.lead.lastName]
                        .filter(Boolean)
                        .join(" ") || "Unnamed lead"}
                    </p>
                    <p>
                      <span className="font-semibold">Source:</span>{" "}
                      {leadPrefill.lead.source || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Provider:</span>{" "}
                      {leadPrefill.applicationPrefill.providerName || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Course:</span>{" "}
                      {leadPrefill.applicationPrefill.courseName || "—"}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
            >
              <div className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Client
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Client selection
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Search and confirm the correct client profile before creating
                    the application.
                  </p>

                  <div className="mt-5 grid gap-4">
                    <input
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search by name, email, phone, or passport"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />

                    <div className="max-h-[320px] overflow-auto rounded-2xl border border-slate-200">
                      {loadingClients ? (
                        <div className="px-4 py-6 text-sm text-slate-500">
                          Loading clients...
                        </div>
                      ) : filteredClients.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-slate-500">
                          No clients found.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {filteredClients.map((client) => {
                            const active = client.id === selectedClientId;

                            return (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => setSelectedClientId(client.id)}
                                className={`w-full px-4 py-4 text-left transition ${
                                  active
                                    ? "bg-slate-50"
                                    : "bg-white hover:bg-slate-50"
                                }`}
                              >
                                <p className="text-sm font-semibold text-slate-950">
                                  {getClientLabel(client)}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {client.email || "No email"}
                                  {client.phone ? ` • ${client.phone}` : ""}
                                  {client.passport ? ` • ${client.passport}` : ""}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Application
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Application details
                  </h2>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Provider <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedProviderId}
                        onChange={(e) => handleProviderChange(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        required
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
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Course <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        disabled={!selectedProviderId || loadingCourses}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        required
                      >
                        <option value="">
                          {!selectedProviderId
                            ? "Select provider first"
                            : loadingCourses
                            ? "Loading courses..."
                            : "Select course"}
                        </option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Intake <span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={intake}
                        onChange={(e) => setIntake(e.target.value)}
                        placeholder="Enter intake"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Intake Year
                      </label>
                      <input
                        value={intakeYear}
                        onChange={(e) => setIntakeYear(e.target.value)}
                        placeholder="2026"
                        inputMode="numeric"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      >
                        <option value="applied">Applied</option>
                        <option value="draft">Draft</option>
                        <option value="under_review">Under Review</option>
                        <option value="offer_received">Offer Received</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Application No
                      </label>
                      <input
                        value={applicationNo}
                        onChange={(e) => setApplicationNo(e.target.value)}
                        placeholder="Optional application number"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Applied At
                      </label>
                      <input
                        type="date"
                        value={appliedAt}
                        onChange={(e) => setAppliedAt(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Offer Date
                      </label>
                      <input
                        type="date"
                        value={offerDate}
                        onChange={(e) => setOfferDate(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Notes
                      </label>
                      <textarea
                        rows={5}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Application notes"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                    </div>
                  </div>
                </section>

                {submitError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {submitError}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Creating..." : "Create Application"}
                  </button>

                  <Link
                    href="/applications"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </Link>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-950">
                    Summary
                  </h2>

                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-slate-500">Client</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedClient ? getClientLabel(selectedClient) : "Not selected"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Provider</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedProvider?.name || leadPrefill?.applicationPrefill?.providerName || "Not selected"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Course</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedCourse?.name || leadPrefill?.applicationPrefill?.courseName || "Not selected"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Intake</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {intake || "Not set"}
                      </p>
                    </div>
                  </div>
                </div>

                {leadPrefill ? (
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">
                      Lead prefill
                    </h2>

                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-slate-500">Lead</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {[leadPrefill.lead.firstName, leadPrefill.lead.lastName]
                            .filter(Boolean)
                            .join(" ") || "Unnamed lead"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Referral</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {leadPrefill.subagent?.name || "Direct / unassigned"}
                        </p>
                        <p className="mt-1 text-slate-600">
                          {leadPrefill.subagent?.agencyName ||
                            leadPrefill.subagent?.referralCode ||
                            "No agency/referral code"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Destination</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {leadPrefill.applicationPrefill.destinationCountry || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Suggested study level</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {leadPrefill.applicationPrefill.studyLevel || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Preferred campus</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {leadPrefill.applicationPrefill.preferredCampus || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </aside>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}