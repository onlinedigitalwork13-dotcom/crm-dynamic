"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type JsonRecord = Record<string, unknown>;

type LeadStatus =
  | "new"
  | "new_lead"
  | "assigned"
  | "contacted"
  | "under_review"
  | "converted"
  | "closed";

type LeadItem = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  passportNumber: string | null;
  country: string | null;
  notes: string | null;
  source: string | null;
  status: LeadStatus | string;
  assignedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string | null;
  lastActivityAt: Date | string | null;

  branch: {
    id: string;
    name: string;
    code: string | null;
  } | null;

  assignedTo: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    branchId: string | null;
  } | null;

  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  } | null;

  agent: {
    id: string;
    name: string;
    referralCode: string;
  } | null;

  intakeSubmission: {
    id: string;
    status: string | null;
    submittedAt: Date | string;
    reviewedAt: Date | string | null;
    convertedAt: Date | string | null;
    closedAt: Date | string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    city: string | null;
    address: string | null;
    nationality: string | null;
    dateOfBirth: Date | string | null;
    passportNumber: string | null;
    notes: string | null;
    internalNotes: string | null;
    submissionMeta: unknown;
    reviewedBy: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  } | null;

  clientCheckIn: {
    id: string;
    checkInMethod: string | null;
    visitReason: string | null;
    notes: string | null;
    checkedInAt: Date | string;
    intakeSubmissionId: string | null;
  } | null;

  followers: { id: string }[];
  activities: { id: string }[];
};

type UserItem = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  branchId: string | null;
  role: {
    id: string;
    name: string;
  } | null;
};

type Props = {
  leads: LeadItem[];
  users: UserItem[];
  currentUserRole: string;
  currentUserBranchId: string | null;
  canCrossBranchAssign: boolean;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function formatPersonName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim()?.charAt(0) ?? "";
  const last = lastName?.trim()?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "NA";
}

function formatRole(value?: string | null) {
  if (!value) return "User";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClasses(status: string) {
  switch (status) {
    case "new":
    case "new_lead":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
    case "assigned":
      return "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200";
    case "contacted":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "under_review":
      return "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200";
    case "converted":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "closed":
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function safeObject(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as JsonRecord;
}

function safeNestedObject(parent: JsonRecord | null, key: string): JsonRecord | null {
  const value = parent?.[key];
  return safeObject(value);
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900 break-words">
        {value || "—"}
      </p>
    </div>
  );
}

function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lead?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || "Failed to delete lead");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete lead");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="inline-flex items-center justify-center rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
    >
      Delete Lead
    </button>
  );
}

export default function LeadsWorkspaceClient({
  leads,
  users,
  currentUserRole,
  currentUserBranchId,
  canCrossBranchAssign,
}: Props) {
  const [items, setItems] = useState(leads);
  const [selectedId, setSelectedId] = useState(leads[0]?.id ?? null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  const assignableUsers = useMemo(() => {
    if (!selected) return [];
    if (canCrossBranchAssign) return users;

    return users.filter(
      (user) => user.branchId && user.branchId === selected.branch?.id
    );
  }, [users, selected, canCrossBranchAssign]);

  const meta = useMemo(() => {
    if (!selected?.intakeSubmission?.submissionMeta) return null;
    return safeObject(selected.intakeSubmission.submissionMeta);
  }, [selected]);

  const applicationInterest = safeNestedObject(meta, "applicationInterest");
  const subagent = safeNestedObject(meta, "subagent");
  const visa = safeNestedObject(meta, "visaDetails");
  const emergency = safeNestedObject(meta, "emergencyContact");

  async function assign(leadId: string, assignedToId: string) {
    if (!assignedToId) return;

    try {
      setAssigningId(leadId);

      const response = await fetch(`/api/leads/${leadId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignedToId }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign lead");
      }

      const assignedUser = users.find((user) => user.id === assignedToId) || null;

      setItems((prev) =>
        prev.map((item) =>
          item.id === leadId
            ? {
                ...item,
                status:
                  item.status === "new" || item.status === "new_lead"
                    ? "assigned"
                    : item.status,
                assignedAt: new Date().toISOString(),
                assignedTo: assignedUser
                  ? {
                      id: assignedUser.id,
                      firstName: assignedUser.firstName,
                      lastName: assignedUser.lastName,
                      email: assignedUser.email,
                      branchId: assignedUser.branchId,
                    }
                  : null,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("Failed to assign lead.");
    } finally {
      setAssigningId(null);
    }
  }

  const totalLeads = items.length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Lead Workspace
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Leads
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review incoming leads, whether from public intake or check-in, and
              convert qualified records into clients.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Total Leads</p>
              <p className="mt-1 text-xl font-bold text-slate-950">
                {totalLeads}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">My Branch</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {currentUserBranchId ? "Available" : "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Your Role</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {formatRole(currentUserRole)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Lead Queue
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select a lead to view full details
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {items.length} items
              </span>
            </div>
          </div>

          <div className="max-h-[75vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No leads found.
              </div>
            ) : (
              items.map((lead) => {
                const isActive = selectedId === lead.id;
                const assignedName = lead.assignedTo
                  ? formatPersonName(
                      lead.assignedTo.firstName,
                      lead.assignedTo.lastName
                    )
                  : "Unassigned";

                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => setSelectedId(lead.id)}
                    className={`w-full border-b border-slate-200 px-5 py-4 text-left transition last:border-b-0 ${
                      isActive
                        ? "bg-slate-950 text-white"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {getInitials(lead.firstName, lead.lastName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className={`truncate text-sm font-semibold ${
                              isActive ? "text-white" : "text-slate-950"
                            }`}
                          >
                            {formatPersonName(lead.firstName, lead.lastName)}
                          </p>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              isActive
                                ? "bg-white/10 text-white ring-1 ring-inset ring-white/15"
                                : getStatusClasses(lead.status)
                            }`}
                          >
                            {formatStatus(lead.status)}
                          </span>
                        </div>

                        <p
                          className={`mt-1 truncate text-sm ${
                            isActive ? "text-slate-200" : "text-slate-500"
                          }`}
                        >
                          {lead.phone || lead.email || "No contact info"}
                        </p>

                        <p
                          className={`mt-1 truncate text-xs ${
                            isActive ? "text-slate-300" : "text-slate-400"
                          }`}
                        >
                          {lead.intakeSubmission
                            ? "Intake Submission"
                            : lead.clientCheckIn
                            ? "Check-in"
                            : lead.source || "Direct lead"}
                        </p>

                        <div
                          className={`mt-3 flex items-center justify-between gap-3 text-xs ${
                            isActive ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          <span className="truncate">Assigned: {assignedName}</span>
                          <span className="shrink-0">
                            {formatDate(lead.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="min-w-0">
          {!selected ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              Select a lead from the left to view details.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-slate-950 text-lg font-bold text-white shadow-sm">
                      {getInitials(selected.firstName, selected.lastName)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                          {formatPersonName(selected.firstName, selected.lastName)}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            selected.status
                          )}`}
                        >
                          {formatStatus(selected.status)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {selected.intakeSubmission
                          ? "Source: Intake Submission"
                          : selected.clientCheckIn
                          ? "Source: Check-in"
                          : `Source: ${selected.source || "Direct lead"}`}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {selected.client ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            Client Created
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                            Awaiting Conversion
                          </span>
                        )}

                        {selected.branch?.name ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                            Branch: {selected.branch.name}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {selected.client ? (
                      <Link
                        href={`/clients/${selected.client.id}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View Client
                      </Link>
                    ) : selected.intakeSubmission ? (
                      <Link
                        href={`/intake-submissions/${selected.intakeSubmission.id}/convert`}
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Convert to Client
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                        disabled
                      >
                        Convert flow not linked
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(selected.id)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Copy Lead ID
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        Lead Details
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Core contact and lead information
                      </p>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <DetailItem label="Email" value={selected.email || "—"} />
                      <DetailItem label="Phone" value={selected.phone || "—"} />
                      <DetailItem label="Country" value={selected.country || "—"} />
                      <DetailItem
                        label="Passport Number"
                        value={selected.passportNumber || "—"}
                      />
                      <DetailItem
                        label="Created At"
                        value={formatDateTime(selected.createdAt)}
                      />
                      <DetailItem
                        label="Assigned At"
                        value={formatDateTime(selected.assignedAt)}
                      />
                      <DetailItem
                        label="Last Activity"
                        value={formatDateTime(selected.lastActivityAt)}
                      />
                    </div>

                    <div className="mt-4 grid gap-4">
                      <DetailItem label="Lead Notes" value={selected.notes || "—"} />
                    </div>
                  </div>

                  {selected.intakeSubmission ? (
                    <>
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">
                          Intake Details
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Full source information from the intake submission
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <DetailItem
                            label="Email"
                            value={selected.intakeSubmission.email || "—"}
                          />
                          <DetailItem
                            label="Phone"
                            value={selected.intakeSubmission.phone || "—"}
                          />
                          <DetailItem
                            label="Country"
                            value={selected.intakeSubmission.country || "—"}
                          />
                          <DetailItem
                            label="City"
                            value={selected.intakeSubmission.city || "—"}
                          />
                          <DetailItem
                            label="Nationality"
                            value={selected.intakeSubmission.nationality || "—"}
                          />
                          <DetailItem
                            label="Passport Number"
                            value={selected.intakeSubmission.passportNumber || "—"}
                          />
                          <DetailItem
                            label="Date of Birth"
                            value={formatDate(selected.intakeSubmission.dateOfBirth)}
                          />
                          <DetailItem
                            label="Submitted At"
                            value={formatDateTime(selected.intakeSubmission.submittedAt)}
                          />
                          <DetailItem
                            label="Converted At"
                            value={formatDateTime(selected.intakeSubmission.convertedAt)}
                          />
                        </div>

                        <div className="mt-4 grid gap-4">
                          <DetailItem
                            label="Address"
                            value={selected.intakeSubmission.address || "—"}
                          />
                          <DetailItem
                            label="Applicant Notes"
                            value={selected.intakeSubmission.notes || "—"}
                          />
                          <DetailItem
                            label="Internal Notes"
                            value={selected.intakeSubmission.internalNotes || "—"}
                          />
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">
                          Application Interest
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Provider, course, intake, and study preferences
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <DetailItem
                            label="Destination Country"
                            value={safeString(applicationInterest?.destinationCountry) || "—"}
                          />
                          <DetailItem
                            label="Provider"
                            value={safeString(applicationInterest?.providerName) || "—"}
                          />
                          <DetailItem
                            label="Course"
                            value={safeString(applicationInterest?.courseName) || "—"}
                          />
                          <DetailItem
                            label="Intake"
                            value={safeString(applicationInterest?.intake) || "—"}
                          />
                          <DetailItem
                            label="Study Level"
                            value={safeString(applicationInterest?.studyLevel) || "—"}
                          />
                          <DetailItem
                            label="Preferred Campus"
                            value={safeString(applicationInterest?.preferredCampus) || "—"}
                          />
                          <DetailItem
                            label="Subject Area"
                            value={safeString(applicationInterest?.subjectArea) || "—"}
                          />
                          <DetailItem
                            label="Duration"
                            value={safeString(applicationInterest?.duration) || "—"}
                          />
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">
                          Referral / Subagent
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Captured referral ownership from the public intake
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <DetailItem
                            label="Subagent Name"
                            value={safeString(subagent?.name) || "—"}
                          />
                          <DetailItem
                            label="Agency"
                            value={safeString(subagent?.agencyName) || "—"}
                          />
                          <DetailItem
                            label="Reference Code"
                            value={safeString(subagent?.reference) || "—"}
                          />
                          <DetailItem
                            label="Subagent Email"
                            value={safeString(subagent?.email) || "—"}
                          />
                          <DetailItem
                            label="Subagent Phone"
                            value={safeString(subagent?.phone) || "—"}
                          />
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">
                          Visa
                        </h3>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <DetailItem
                            label="Subclass"
                            value={safeString(visa?.subclass) || "—"}
                          />
                          <DetailItem
                            label="Expiry"
                            value={safeString(visa?.expiry) || "—"}
                          />
                          <DetailItem
                            label="Conditions"
                            value={safeString(visa?.conditions) || "—"}
                          />
                          <DetailItem
                            label="Applicable Members"
                            value={safeString(visa?.applicableFamilyMembers) || "—"}
                          />
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">
                          Emergency Contact
                        </h3>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <DetailItem
                            label="First Name"
                            value={safeString(emergency?.firstName) || "—"}
                          />
                          <DetailItem
                            label="Surname"
                            value={safeString(emergency?.lastName) || "—"}
                          />
                          <DetailItem
                            label="Address"
                            value={safeString(emergency?.address) || "—"}
                          />
                          <DetailItem
                            label="Mobile"
                            value={safeString(emergency?.mobile) || "—"}
                          />
                          <DetailItem
                            label="Home"
                            value={safeString(emergency?.home) || "—"}
                          />
                          <DetailItem
                            label="Work"
                            value={safeString(emergency?.work) || "—"}
                          />
                          <DetailItem
                            label="Email"
                            value={safeString(emergency?.email) || "—"}
                          />
                        </div>
                      </div>
                    </>
                  ) : null}

                  {selected.clientCheckIn ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-950">
                        Check-in Details
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Source information from the client check-in
                      </p>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <DetailItem
                          label="Checked In At"
                          value={formatDateTime(selected.clientCheckIn.checkedInAt)}
                        />
                        <DetailItem
                          label="Method"
                          value={selected.clientCheckIn.checkInMethod || "—"}
                        />
                        <DetailItem
                          label="Visit Reason"
                          value={selected.clientCheckIn.visitReason || "—"}
                        />
                        <DetailItem
                          label="Check-in Notes"
                          value={selected.clientCheckIn.notes || "—"}
                        />
                        <DetailItem
                          label="Linked Intake Submission"
                          value={selected.clientCheckIn.intakeSubmissionId || "—"}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-950">
                      Assignment
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Assign or reassign this lead to a team member
                    </p>

                    <div className="mt-5">
                      <label
                        htmlFor="assignedToId"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Assign To
                      </label>

                      <select
                        id="assignedToId"
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                        value={selected.assignedTo?.id || ""}
                        onChange={(e) => assign(selected.id, e.target.value)}
                        disabled={assigningId === selected.id}
                      >
                        <option value="">Select staff member</option>
                        {assignableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {formatPersonName(user.firstName, user.lastName)} —{" "}
                            {user.role?.name || "User"}
                          </option>
                        ))}
                      </select>

                      <p className="mt-2 text-xs text-slate-500">
                        {canCrossBranchAssign
                          ? "Assignment is enabled across branches."
                          : "Assignment is restricted to the same branch."}
                      </p>

                      {selected.assignedTo ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Current Owner
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatPersonName(
                              selected.assignedTo.firstName,
                              selected.assignedTo.lastName
                            )}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {selected.assignedTo.email}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-500">
                          This lead has not been assigned yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-950">
                      Workflow Snapshot
                    </h3>

                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Reviewed By
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {selected.intakeSubmission?.reviewedBy
                            ? formatPersonName(
                                selected.intakeSubmission.reviewedBy.firstName,
                                selected.intakeSubmission.reviewedBy.lastName
                              )
                            : "Not reviewed yet"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Reviewed At
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {formatDateTime(selected.intakeSubmission?.reviewedAt)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Assigned At
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {formatDateTime(selected.assignedAt)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Closed At
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {formatDateTime(selected.intakeSubmission?.closedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-950">
                      Quick Actions
                    </h3>

                    <div className="mt-5 grid gap-3">
                      {selected.client ? (
                        <>
                          <Link
                            href={`/clients/${selected.client.id}`}
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Open Client
                          </Link>

                          <Link
                            href={`/applications/new?leadId=${selected.id}`}
                            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                          >
                            Create Application
                          </Link>
                        </>
                      ) : selected.intakeSubmission ? (
                        <Link
                          href={`/intake-submissions/${selected.intakeSubmission.id}/convert`}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Convert to Client
                        </Link>
                      ) : null}

                      <DeleteLeadButton leadId={selected.id} />

                      <Link
                        href="/clients"
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Go to Clients
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}