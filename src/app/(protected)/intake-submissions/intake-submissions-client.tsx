"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type SubmissionStatus =
  | "new"
  | "assigned"
  | "contacted"
  | "under_review"
  | "converted"
  | "closed";

type SubmissionItem = {
  id: string;
  intakeFormRequestId: string;
  branchId: string | null;
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
  status: SubmissionStatus;
  assignedAt: Date | string | null;
  reviewedAt: Date | string | null;
  convertedAt: Date | string | null;
  closedAt: Date | string | null;
  submittedAt: Date | string;

  intakeFormRequest: {
    id: string;
    title: string;
    token: string;
  } | null;

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

  reviewedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;

  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
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
  submissions: SubmissionItem[];
  users: UserItem[];
  currentUserRole: string;
  currentUserBranchId: string | null;
  canCrossBranchAssign: boolean;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
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

function getStatusClasses(status: SubmissionStatus) {
  switch (status) {
    case "new":
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

function formatStatus(status: SubmissionStatus) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

export default function IntakeSubmissionsClient({
  submissions,
  users,
  currentUserRole,
  currentUserBranchId,
  canCrossBranchAssign,
}: Props) {
  const [items, setItems] = useState(submissions);
  const [selectedId, setSelectedId] = useState(submissions[0]?.id ?? null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  const assignableUsers = useMemo(() => {
    if (!selected) return [];

    if (canCrossBranchAssign) return users;

    return users.filter(
      (user) => user.branchId && user.branchId === selected.branchId
    );
  }, [users, selected, canCrossBranchAssign]);

  async function assign(submissionId: string, assignedToId: string) {
    if (!assignedToId) return;

    try {
      setAssigningId(submissionId);

      const response = await fetch(`/api/intake-submissions/${submissionId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignedToId }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign submission");
      }

      const assignedUser = users.find((user) => user.id === assignedToId) || null;

      setItems((prev) =>
        prev.map((item) =>
          item.id === submissionId
            ? {
                ...item,
                status: item.status === "new" ? "assigned" : item.status,
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
      alert("Failed to assign submission.");
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Lead Workspace
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Intake Submissions
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review incoming leads, assign ownership, and convert qualified
              submissions into clients with a cleaner operations workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Total Leads</p>
              <p className="mt-1 text-xl font-bold text-slate-950">
                {items.length}
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
                  Select a submission to view full details
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
                No intake submissions found.
              </div>
            ) : (
              items.map((submission) => {
                const isActive = selectedId === submission.id;
                const assignedName = submission.assignedTo
                  ? formatPersonName(
                      submission.assignedTo.firstName,
                      submission.assignedTo.lastName
                    )
                  : "Unassigned";

                return (
                  <button
                    key={submission.id}
                    type="button"
                    onClick={() => setSelectedId(submission.id)}
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
                        {getInitials(submission.firstName, submission.lastName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className={`truncate text-sm font-semibold ${
                              isActive ? "text-white" : "text-slate-950"
                            }`}
                          >
                            {formatPersonName(
                              submission.firstName,
                              submission.lastName
                            )}
                          </p>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              isActive
                                ? "bg-white/10 text-white ring-1 ring-inset ring-white/15"
                                : getStatusClasses(submission.status)
                            }`}
                          >
                            {formatStatus(submission.status)}
                          </span>
                        </div>

                        <p
                          className={`mt-1 truncate text-sm ${
                            isActive ? "text-slate-200" : "text-slate-500"
                          }`}
                        >
                          {submission.phone || submission.email || "No contact info"}
                        </p>

                        <p
                          className={`mt-1 truncate text-xs ${
                            isActive ? "text-slate-300" : "text-slate-400"
                          }`}
                        >
                          {submission.intakeFormRequest?.title ?? "Direct check-in"}
                        </p>

                        <div
                          className={`mt-3 flex items-center justify-between gap-3 text-xs ${
                            isActive ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          <span className="truncate">Assigned: {assignedName}</span>
                          <span className="shrink-0">
                            {formatDate(submission.submittedAt)}
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
              Select a submission from the left to view details.
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
                        Form: {selected.intakeFormRequest?.title ?? "Direct check-in"}
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
                    ) : (
                      <Link
                        href={`/intake-submissions/${selected.id}/convert`}
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Convert to Client
                      </Link>
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
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">
                          Lead Details
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Core contact and intake information
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <DetailItem label="Email" value={selected.email || "—"} />
                      <DetailItem label="Phone" value={selected.phone || "—"} />
                      <DetailItem label="Country" value={selected.country || "—"} />
                      <DetailItem label="City" value={selected.city || "—"} />
                      <DetailItem
                        label="Nationality"
                        value={selected.nationality || "—"}
                      />
                      <DetailItem
                        label="Passport Number"
                        value={selected.passportNumber || "—"}
                      />
                      <DetailItem
                        label="Date of Birth"
                        value={formatDate(selected.dateOfBirth)}
                      />
                      <DetailItem
                        label="Submitted At"
                        value={formatDateTime(selected.submittedAt)}
                      />
                      <DetailItem
                        label="Converted At"
                        value={formatDateTime(selected.convertedAt)}
                      />
                    </div>

                    <div className="mt-4 grid gap-4">
                      <DetailItem
                        label="Address"
                        value={selected.address || "—"}
                      />
                      <DetailItem
                        label="Applicant Notes"
                        value={selected.notes || "—"}
                      />
                      <DetailItem
                        label="Internal Notes"
                        value={selected.internalNotes || "—"}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-950">
                      Assignment
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Assign or reassign this submission to a team member
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
                          This submission has not been assigned yet.
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
                          {selected.reviewedBy
                            ? formatPersonName(
                                selected.reviewedBy.firstName,
                                selected.reviewedBy.lastName
                              )
                            : "Not reviewed yet"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Reviewed At
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {formatDateTime(selected.reviewedAt)}
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
                          {formatDateTime(selected.closedAt)}
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
                        <Link
                          href={`/clients/${selected.client.id}`}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Open Client Profile
                        </Link>
                      ) : (
                        <Link
                          href={`/intake-submissions/${selected.id}/convert`}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Convert to Client
                        </Link>
                      )}

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