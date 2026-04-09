"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardPlus,
  FileText,
  Loader2,
  Search,
  Sparkles,
  UserRoundSearch,
  Users,
  CalendarDays,
} from "lucide-react";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
};

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  passport?: string | null;
};

type Props = {
  users: User[];
  clients: Client[];
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

export default function TaskCreateForm({ users, clients }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedToId: "",
    clientId: "",
    dueDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [clientQuery, setClientQuery] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const clientPickerRef = useRef<HTMLDivElement | null>(null);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === form.assignedToId) ?? null,
    [users, form.assignedToId]
  );

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === form.clientId) ?? null,
    [clients, form.clientId]
  );

  const filteredClients = useMemo(() => {
    const query = clientQuery.trim().toLowerCase();

    if (!query) return clients.slice(0, 12);

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
    if (form.title.trim()) score += 35;
    if (form.assignedToId) score += 25;
    if (form.clientId) score += 15;
    if (form.description.trim()) score += 10;
    if (form.dueDate.trim()) score += 15;
    return Math.min(score, 100);
  }, [form]);

  const completionTone =
    completionScore >= 80 ? "green" : completionScore >= 50 ? "blue" : "amber";

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
    setForm((prev) => ({ ...prev, clientId: client.id }));
    setClientQuery(
      `${client.firstName} ${client.lastName}${
        client.email ? ` · ${client.email}` : ""
      }`
    );
    setClientPickerOpen(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to create task");
        setLoading(false);
        return;
      }

      setSuccessMessage("Task created successfully.");
      router.push("/tasks");
      router.refresh();
    } catch {
      setError("Something went wrong while creating the task");
      setLoading(false);
    }
  }

  return (
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
            title="Task Details"
            description="Create a clear task, assign responsibility, and connect it to the right client."
            icon={ClipboardPlus}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  label="Task Title"
                  required
                  hint="Keep it short and action-oriented."
                >
                  <input
                    className={inputClassName()}
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Follow up with client about missing documents"
                    required
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Description"
                  hint="Add context, instructions, or handover notes."
                >
                  <textarea
                    className={textareaClassName()}
                    rows={5}
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Add details for the assignee..."
                  />
                </Field>
              </div>

              <Field label="Assign To" required hint="Choose the staff member responsible for this task.">
                <select
                  className={selectClassName()}
                  value={form.assignedToId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      assignedToId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select staff</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                      {user.email ? ` (${user.email})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Due Date" hint="Optional deadline for follow-up or completion.">
                <input
                  type="date"
                  className={inputClassName()}
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
              </Field>

              <div className="md:col-span-2" ref={clientPickerRef}>
                <Field
                  label="Client"
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
                          setForm((prev) => ({ ...prev, clientId: "" }));
                        }}
                        onFocus={() => setClientPickerOpen(true)}
                        placeholder="Search linked client..."
                        className={cn(inputClassName(), "pl-11 pr-11")}
                      />
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    {clientPickerOpen && (
                      <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.15)]">
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, clientId: "" }));
                            setClientQuery("");
                            setClientPickerOpen(false);
                          }}
                          className="mb-1 w-full rounded-xl border border-transparent px-4 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            No client
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Save this task without linking a client.
                          </p>
                        </button>

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
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <SectionCard
            title="Task Snapshot"
            description="Live summary while preparing the task."
            icon={Sparkles}
          >
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  Task Title
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {form.title || "Untitled task"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatBadge
                  label="Completion"
                  value={`${completionScore}%`}
                  tone={completionTone}
                />
                <StatBadge
                  label="Priority"
                  value={form.dueDate ? "Scheduled" : "Open"}
                  tone={form.dueDate ? "blue" : "amber"}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                    Assigned To
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {selectedUser
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                    Linked Client
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {selectedClient
                      ? `${selectedClient.firstName} ${selectedClient.lastName}`
                      : "No client linked"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                    Due Date
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {form.dueDate || "No due date"}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Save Task"
            description="Create the task and return to your task workspace."
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
                    Saving Task...
                  </>
                ) : (
                  <>
                    <ClipboardPlus className="h-4 w-4" />
                    Save Task
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/tasks")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Assignment Intelligence"
            description="Quick context for staffing and client linkage."
            icon={Users}
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  Staff Pool
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {users.length} active staff available
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  Client Link
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedClient ? "Linked" : "Optional"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  Description
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {form.description.trim() ? "Added" : "Not added"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  Schedule State
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {form.dueDate ? "Deadline set" : "Open timeline"}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </form>
  );
}