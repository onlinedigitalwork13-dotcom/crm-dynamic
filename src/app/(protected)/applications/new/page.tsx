"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FilePlus2,
  FileText,
  GraduationCap,
  Loader2,
  Search,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  passport?: string | null;
};

type Provider = {
  id: string;
  name: string;
  isActive?: boolean;
  code?: string | null;
  city?: string | null;
  country?: string | null;
};

type Course = {
  id: string;
  providerId: string;
  name: string;
  code?: string | null;
  level?: string | null;
  campus?: string | null;
  intakeMonths?: string | null;
  tuitionFee?: number | null;
  currency?: string | null;
};

type ApiListResponse<T> =
  | T[]
  | {
      data?: T[];
      error?: string;
      message?: string;
      success?: boolean;
    };

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function inputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
}

function selectClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
}

function textareaClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
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

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <label className="text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
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

function formatCurrency(value?: number | null, currency?: string | null) {
  if (value === null || value === undefined) return "—";
  return `${currency || "AUD"} ${value.toLocaleString()}`;
}

function extractList<T>(payload: ApiListResponse<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

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
  const [successMessage, setSuccessMessage] = useState("");

  const [clientQuery, setClientQuery] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);

  const clientPickerRef = useRef<HTMLDivElement | null>(null);

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

        const [clientsData, providersData, coursesData] = (await Promise.all([
          clientsRes.json(),
          providersRes.json(),
          coursesRes.json(),
        ])) as [
          ApiListResponse<Client>,
          ApiListResponse<Provider>,
          ApiListResponse<Course>
        ];

        if (!clientsRes.ok) {
          throw new Error(
            (!Array.isArray(clientsData) && clientsData?.error) ||
              "Failed to load clients"
          );
        }

        if (!providersRes.ok) {
          throw new Error(
            (!Array.isArray(providersData) && providersData?.error) ||
              "Failed to load providers"
          );
        }

        if (!coursesRes.ok) {
          throw new Error(
            (!Array.isArray(coursesData) && coursesData?.error) ||
              "Failed to load courses"
          );
        }

        const resolvedClients = extractList(clientsData);
        const resolvedProviders = extractList(providersData);
        const resolvedCourses = extractList(coursesData);

        setClients(resolvedClients);
        setProviders(
          resolvedProviders.filter(
            (provider: Provider) => provider.isActive !== false
          )
        );
        setCourses(resolvedCourses);
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

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === clientId) ?? null,
    [clients, clientId]
  );

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === providerId) ?? null,
    [providers, providerId]
  );

  const selectedCourse = useMemo(
    () => filteredCourses.find((course) => course.id === courseId) ?? null,
    [filteredCourses, courseId]
  );

  const filteredClients = useMemo(() => {
    const query = clientQuery.trim().toLowerCase();

    if (!query) {
      return clients.slice(0, 12);
    }

    return clients
      .filter((client) => {
        const haystack = [
          client.firstName,
          client.lastName,
          client.email || "",
          client.phone || "",
          client.passport || "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
      .slice(0, 20);
  }, [clientQuery, clients]);

  const completionScore = useMemo(() => {
    let score = 0;
    if (clientId) score += 25;
    if (providerId) score += 20;
    if (courseId) score += 20;
    if (intake.trim()) score += 10;
    if (intakeYear.trim()) score += 5;
    if (status.trim()) score += 5;
    if (applicationNo.trim()) score += 5;
    if (appliedAt.trim()) score += 5;
    if (notes.trim()) score += 5;
    return Math.min(score, 100);
  }, [
    clientId,
    providerId,
    courseId,
    intake,
    intakeYear,
    status,
    applicationNo,
    appliedAt,
    notes,
  ]);

  const completionTone =
    completionScore >= 80 ? "green" : completionScore >= 50 ? "blue" : "amber";

  useEffect(() => {
    setCourseId("");
  }, [providerId]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        clientPickerRef.current &&
        !clientPickerRef.current.contains(event.target as Node)
      ) {
        setClientPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleClientSelect(client: Client) {
    setClientId(client.id);
    setClientQuery(
      `${client.firstName} ${client.lastName}${
        client.email ? ` · ${client.email}` : ""
      }`
    );
    setClientPickerOpen(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!clientId || !providerId || !courseId || !intake.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

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

      setSuccessMessage("Application created successfully.");
      router.push(`/applications/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong while creating the application");
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_70%,_#f8fafc)]">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.22),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_46%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
                Application Setup
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Add Application
              </h1>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading application form...
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
                  <Link href="/applications" className="transition hover:text-white">
                    Applications
                  </Link>
                  <span>/</span>
                  <span className="font-medium text-white">New</span>
                </div>

                <div className="mt-5 flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/15">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
                      Application Setup
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                      Add Application
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                      Create a new student application and connect it to client,
                      provider, course, intake, and workflow-ready processing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 xl:w-[340px]">
                <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                    Workflow Focus
                  </p>
                  <p className="mt-1 text-sm text-white">
                    Premium application creation with advanced client search and
                    provider-linked course selection.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/applications"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                title="Application Setup"
                description="Choose the client, provider, and course with smarter searchable selection."
                icon={UserRoundSearch}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2" ref={clientPickerRef}>
                    <Field
                      label="Client"
                      required
                      hint="Search by first name, last name, email, phone, or passport."
                    >
                      <div className="relative">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={clientQuery}
                            onChange={(e) => {
                              setClientQuery(e.target.value);
                              setClientPickerOpen(true);
                              setClientId("");
                            }}
                            onFocus={() => setClientPickerOpen(true)}
                            placeholder="Search client by name, email, phone, passport..."
                            className={cn(inputClassName(), "pl-11 pr-11")}
                            required={!clientId}
                          />
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>

                        {clientPickerOpen && (
                          <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.15)]">
                            {filteredClients.length === 0 ? (
                              <div className="rounded-xl px-4 py-6 text-sm text-slate-500">
                                No matching clients found.
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {filteredClients.map((client) => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => handleClientSelect(client)}
                                    className="w-full rounded-xl border border-transparent px-4 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                          {client.firstName} {client.lastName}
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                                          <span>{client.email || "No email"}</span>
                                          <span>{client.phone || "No phone"}</span>
                                          <span>
                                            Passport: {client.passport || "—"}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="shrink-0">
                                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                          Select
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Field>
                  </div>

                  <Field label="Provider" required>
                    <select
                      value={providerId}
                      onChange={(e) => setProviderId(e.target.value)}
                      className={selectClassName()}
                      required
                    >
                      <option value="">Select provider</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Course" required>
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className={cn(
                        selectClassName(),
                        !providerId && "bg-slate-100 text-slate-400"
                      )}
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
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="Intake & Status"
                description="Set the operational intake timeline and current application stage."
                icon={CalendarDays}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Intake" required>
                    <input
                      type="text"
                      value={intake}
                      onChange={(e) => setIntake(e.target.value)}
                      placeholder="February"
                      className={inputClassName()}
                      required
                    />
                  </Field>

                  <Field label="Intake Year">
                    <input
                      type="number"
                      value={intakeYear}
                      onChange={(e) => setIntakeYear(e.target.value)}
                      placeholder="2026"
                      className={inputClassName()}
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className={selectClassName()}
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
                  </Field>

                  <Field label="Application No">
                    <input
                      type="text"
                      value={applicationNo}
                      onChange={(e) => setApplicationNo(e.target.value)}
                      placeholder="APP-001"
                      className={inputClassName()}
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Applied At">
                      <input
                        type="date"
                        value={appliedAt}
                        onChange={(e) => setAppliedAt(e.target.value)}
                        className={inputClassName()}
                      />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Notes"
                description="Internal notes for processing, handover, and special handling."
                icon={FileText}
              >
                <Field label="Internal Notes">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    placeholder="Optional application notes"
                    className={textareaClassName()}
                  />
                </Field>
              </SectionCard>
            </div>

            <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <SectionCard
                title="Application Snapshot"
                description="Live summary while creating the record."
                icon={Sparkles}
              >
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Selected Client
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedClient
                        ? `${selectedClient.firstName} ${selectedClient.lastName}`
                        : "No client selected"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedClient?.email || "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatBadge
                      label="Completion"
                      value={`${completionScore}%`}
                      tone={completionTone}
                    />
                    <StatBadge
                      label="Status"
                      value={status || "draft"}
                      tone="blue"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        Provider
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {selectedProvider?.name || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        Course
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {selectedCourse?.name || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        Intake Window
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {[intake, intakeYear].filter(Boolean).join(" ") || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Course Intelligence"
                description="Provider-linked course context for application decisions."
                icon={GraduationCap}
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Level
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedCourse?.level || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Campus
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedCourse?.campus || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Intake Months
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedCourse?.intakeMonths || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Tuition
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatCurrency(
                        selectedCourse?.tuitionFee,
                        selectedCourse?.currency
                      )}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Save Application"
                description="Create the record and open the application workspace."
                icon={CheckCircle2}
              >
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Application...
                      </>
                    ) : (
                      <>
                        <FilePlus2 className="h-4 w-4" />
                        Create Application
                      </>
                    )}
                  </button>

                  <Link
                    href="/applications"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </Link>
                </div>
              </SectionCard>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}