"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LeadStatus =
  | "new_lead"
  | "assigned"
  | "contacted"
  | "qualified"
  | "under_review"
  | "converted"
  | "closed";

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

type AgentItem = {
  id: string;
  name: string;
  referralCode: string;
  country: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

type LeadItem = {
  id: string;
  branchId: string | null;
  intakeSubmissionId: string | null;
  clientId: string | null;
  clientCheckInId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  passportNumber: string | null;
  country?: string | null;
  source: string | null;
  status: LeadStatus;
  assignedToId: string | null;
  assignedAt: Date | string | null;
  notes: string | null;
  lastActivityAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  branch: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  agent?: AgentItem | null;
  assignedTo: UserItem | null;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string;
    assignedToId?: string | null;
    createdById?: string | null;
  } | null;
  intakeSubmission: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    assignedToId?: string | null;
    submissionMeta?: unknown;
  } | null;
  clientCheckIn: {
    id: string;
    checkedInAt: Date | string;
    checkInMethod: string;
    visitReason: string | null;
    notes: string | null;
  } | null;
  followers: Array<{
    id: string;
    userId: string;
    createdAt: Date | string;
    user: UserItem;
  }>;
};

type Props = {
  leads: LeadItem[];
  users: UserItem[];
  currentUserId: string;
  currentUserRole: string;
  currentUserBranchId: string | null;
  canCrossBranchAssign: boolean;
};

type LeadResponse = {
  success: true;
  message: string;
  lead: LeadItem;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FORMATTER.format(date);
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_TIME_FORMATTER.format(date);
}

function formatPersonName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return `${first}${last}`.toUpperCase() || "LD";
}

function getLeadStatusBadgeClass(status: LeadStatus) {
  switch (status) {
    case "new_lead":
      return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
    case "assigned":
      return "bg-violet-100 text-violet-700 ring-1 ring-violet-200";
    case "contacted":
      return "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200";
    case "qualified":
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    case "under_review":
      return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    case "converted":
      return "bg-green-100 text-green-700 ring-1 ring-green-200";
    case "closed":
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

function getSourceBadgeClass(source?: string | null) {
  if (!source) return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  if (source === "agent") {
    return "bg-violet-100 text-violet-700 ring-1 ring-violet-200";
  }

  if (source === "subagent") {
    return "bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200";
  }

  if (source === "intake_form") {
    return "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200";
  }

  if (source === "event") {
    return "bg-orange-100 text-orange-700 ring-1 ring-orange-200";
  }

  if (source === "partner") {
    return "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200";
  }

  if (
    source === "check_in" ||
    source === "walk_in" ||
    source === "check_in_new" ||
    source === "existing_client" ||
    source === "existing_intake"
  ) {
    return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  }

  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

function formatSource(source?: string | null) {
  if (!source) return "Unknown";
  return source.replaceAll("_", " ");
}

function sortLeadsByActivity(leads: LeadItem[]) {
  return [...leads].sort(
    (a, b) =>
      new Date(b.lastActivityAt).getTime() -
      new Date(a.lastActivityAt).getTime()
  );
}

type SubmissionMeta = {
  subagent?: {
    name?: string | null;
    agencyName?: string | null;
    email?: string | null;
    phone?: string | null;
    reference?: string | null;
  };
  applicationInterest?: {
    destinationCountry?: string | null;
    providerName?: string | null;
    courseName?: string | null;
    subjectArea?: string | null;
    intake?: string | null;
    studyLevel?: string | null;
    preferredCampus?: string | null;
  };
  duplicateCheck?: {
    existingClientFound?: boolean;
    existingClientId?: string | null;
  };
};

function getSubmissionMeta(value: unknown): SubmissionMeta | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as SubmissionMeta;
}

function MetricCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {subtext ? <p className="mt-1 text-xs text-slate-500">{subtext}</p> : null}
    </div>
  );
}

export default function LeadsClient({
  leads,
  users,
  currentUserId,
  currentUserRole,
  currentUserBranchId,
  canCrossBranchAssign,
}: Props) {
  const initialSortedLeads = useMemo(() => sortLeadsByActivity(leads), [leads]);

  const [items, setItems] = useState<LeadItem[]>(initialSortedLeads);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    initialSortedLeads[0]?.id ?? null
  );
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [followerLoadingId, setFollowerLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedFollowerUserId, setSelectedFollowerUserId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [draftAssignedUserId, setDraftAssignedUserId] = useState("");
  const [draftNotes, setDraftNotes] = useState("");

  const selectedLead = useMemo(
    () => items.find((item) => item.id === selectedLeadId) ?? null,
    [items, selectedLeadId]
  );

  const selectedSubmissionMeta = useMemo(
    () => getSubmissionMeta(selectedLead?.intakeSubmission?.submissionMeta),
    [selectedLead]
  );

  useEffect(() => {
    setDraftAssignedUserId(selectedLead?.assignedToId || "");
    setDraftNotes(selectedLead?.notes || "");
    setSelectedFollowerUserId("");
  }, [selectedLeadId, selectedLead?.assignedToId, selectedLead?.notes]);

  const assignableUsers = useMemo(() => {
    if (!selectedLead) return [];

    if (canCrossBranchAssign) {
      return users;
    }

    return users.filter(
      (user) => user.branchId && user.branchId === selectedLead.branchId
    );
  }, [users, selectedLead, canCrossBranchAssign]);

  const followerCandidateUsers = useMemo(() => {
    if (!selectedLead) return [];

    const alreadyFollowerIds = new Set(
      selectedLead.followers.map((follower) => follower.userId)
    );

    return assignableUsers.filter((user) => !alreadyFollowerIds.has(user.id));
  }, [assignableUsers, selectedLead]);

  const amIFollowing = useMemo(() => {
    if (!selectedLead) return false;
    return selectedLead.followers.some(
      (follower) => follower.userId === currentUserId
    );
  }, [selectedLead, currentUserId]);

  const stats = useMemo(() => {
    const total = items.length;
    const unassigned = items.filter((item) => !item.assignedToId).length;
    const converted = items.filter((item) => item.status === "converted").length;
    const followed = items.reduce(
      (count, item) =>
        count +
        (item.followers.some((follower) => follower.userId === currentUserId)
          ? 1
          : 0),
      0
    );
    const agentLeads = items.filter(
      (item) => item.source === "agent" || item.source === "subagent"
    ).length;

    return { total, unassigned, converted, followed, agentLeads };
  }, [items, currentUserId]);

  async function handleAssign(leadId: string, assignedToId: string) {
    try {
      setAssigningId(leadId);
      setMessage(null);

      const response = await fetch(`/api/leads/${leadId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignedToId: assignedToId || null }),
      });

      const data: LeadResponse | { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(
          data && "error" in data
            ? data.error || "Failed to assign lead"
            : "Failed to assign lead"
        );
      }

      const successData = data as LeadResponse;

      setItems((prev) =>
        sortLeadsByActivity(
          prev.map((item) =>
            item.id === leadId ? successData.lead : item
          )
        )
      );

      setSelectedLeadId(successData.lead.id);
      setDraftAssignedUserId(successData.lead.assignedToId || "");
      setMessage(
        successData.lead.assignedTo
          ? `Lead assigned to ${formatPersonName(
              successData.lead.assignedTo.firstName,
              successData.lead.assignedTo.lastName
            )}.`
          : "Lead assignment cleared."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to assign lead");
    } finally {
      setAssigningId(null);
    }
  }

  async function handleStatusUpdate(leadId: string, status: LeadStatus) {
    try {
      setSavingStatusId(leadId);
      setMessage(null);

      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data: LeadResponse | { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(
          data && "error" in data
            ? data.error || "Failed to update lead"
            : "Failed to update lead"
        );
      }

      const successData = data as LeadResponse;

      setItems((prev) =>
        sortLeadsByActivity(
          prev.map((item) =>
            item.id === leadId ? successData.lead : item
          )
        )
      );

      setSelectedLeadId(successData.lead.id);
      setMessage("Lead status updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update lead");
    } finally {
      setSavingStatusId(null);
    }
  }

  async function handleNotesUpdate(leadId: string, notes: string) {
    try {
      setSavingNotesId(leadId);
      setMessage(null);

      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      const data: LeadResponse | { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(
          data && "error" in data
            ? data.error || "Failed to save notes"
            : "Failed to save notes"
        );
      }

      const successData = data as LeadResponse;

      setItems((prev) =>
        sortLeadsByActivity(
          prev.map((item) =>
            item.id === leadId ? successData.lead : item
          )
        )
      );

      setSelectedLeadId(successData.lead.id);
      setDraftNotes(successData.lead.notes || "");
      setMessage("Lead notes saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save notes");
    } finally {
      setSavingNotesId(null);
    }
  }

  async function handleFollowLead(leadId: string, userId?: string) {
    try {
      setFollowerLoadingId(leadId);
      setMessage(null);

      const response = await fetch(`/api/leads/${leadId}/followers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userId ? { userId } : {}),
      });

      const data: LeadResponse | { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(
          data && "error" in data
            ? data.error || "Failed to add follower"
            : "Failed to add follower"
        );
      }

      const successData = data as LeadResponse;

      setItems((prev) =>
        sortLeadsByActivity(
          prev.map((item) =>
            item.id === leadId ? successData.lead : item
          )
        )
      );

      setSelectedLeadId(successData.lead.id);
      setSelectedFollowerUserId("");
      setMessage("Follower added successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add follower");
    } finally {
      setFollowerLoadingId(null);
    }
  }

  async function handleUnfollowLead(leadId: string, userId?: string) {
    try {
      setFollowerLoadingId(leadId);
      setMessage(null);

      const response = await fetch(`/api/leads/${leadId}/followers`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userId ? { userId } : {}),
      });

      const data: LeadResponse | { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(
          data && "error" in data
            ? data.error || "Failed to remove follower"
            : "Failed to remove follower"
        );
      }

      const successData = data as LeadResponse;

      setItems((prev) =>
        sortLeadsByActivity(
          prev.map((item) =>
            item.id === leadId ? successData.lead : item
          )
        )
      );

      setSelectedLeadId(successData.lead.id);
      setMessage("Follower removed successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to remove follower"
      );
    } finally {
      setFollowerLoadingId(null);
    }
  }

  async function handleDeleteLead(leadId: string) {
    const leadToDelete = items.find((item) => item.id === leadId);
    const leadName = formatPersonName(
      leadToDelete?.firstName,
      leadToDelete?.lastName
    );

    const confirmed = window.confirm(
      `Delete lead "${leadName}"?\n\nThis will permanently remove the lead record, followers, and lead activities.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(leadId);
      setMessage(null);

      const response = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      });

      const data: { success?: boolean; error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete lead");
      }

      setItems((prev) => {
        const next = prev.filter((item) => item.id !== leadId);

        if (selectedLeadId === leadId) {
          setSelectedLeadId(next[0]?.id ?? null);
        }

        return sortLeadsByActivity(next);
      });

      setMessage(`Lead "${leadName}" deleted successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete lead");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                Lead Management
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Lead Queue
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                Review intake submissions and check-ins, assign ownership,
                manage followers, track readiness, and convert qualified leads
                into active clients.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                  Role: {currentUserRole}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                  Branch: {currentUserBranchId || "No branch"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                  Cross-branch assign: {canCrossBranchAssign ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {message ? (
              <div className="max-w-md rounded-2xl bg-white/10 px-4 py-3 text-sm text-white ring-1 ring-white/10">
                {message}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 bg-slate-50/70 px-6 py-5 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Total Leads"
            value={stats.total}
            subtext="All records in the active queue"
          />
          <MetricCard
            label="Unassigned"
            value={stats.unassigned}
            subtext="Leads needing ownership"
          />
          <MetricCard
            label="Converted"
            value={stats.converted}
            subtext="Leads already turned into clients"
          />
          <MetricCard
            label="Following"
            value={stats.followed}
            subtext="Leads you currently follow"
          />
          <MetricCard
            label="Agent Leads"
            value={stats.agentLeads}
            subtext="Created from agent referral forms"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Leads
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select a lead to review and manage.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {items.length}
              </span>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-600">No leads found.</div>
          ) : (
            <div className="max-h-[920px] overflow-y-auto">
              {items.map((lead) => {
                const active = selectedLeadId === lead.id;

                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`w-full border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 ${
                      active ? "bg-slate-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {getInitials(lead.firstName, lead.lastName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {formatPersonName(lead.firstName, lead.lastName)}
                            </p>
                            <p className="mt-1 truncate text-sm text-slate-600">
                              {lead.phone || lead.email || "—"}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${getLeadStatusBadgeClass(
                              lead.status
                            )}`}
                          >
                            {lead.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>{lead.branch?.name || "No branch"}</span>
                          <span>•</span>
                          <span>{formatDate(lead.createdAt)}</span>
                          <span>•</span>
                          <span>
                            {lead.assignedTo
                              ? `Assigned to ${formatPersonName(
                                  lead.assignedTo.firstName,
                                  lead.assignedTo.lastName
                                )}`
                              : "Unassigned"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getSourceBadgeClass(
                              lead.source
                            )}`}
                          >
                            {formatSource(lead.source)}
                          </span>

                          {lead.agent ? (
                            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200">
                              Agent: {lead.agent.name}
                            </span>
                          ) : null}

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            {lead.followers.length} followers
                          </span>

                          {lead.client ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-medium text-green-700">
                              Linked Client
                            </span>
                          ) : null}

                          {lead.clientCheckIn ? (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200">
                              Recent Check-in
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          {!selectedLead ? (
            <div className="px-6 py-10 text-sm text-slate-600">
              Select a lead to review.
            </div>
          ) : (
            <div className="space-y-6 p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                    {getInitials(selectedLead.firstName, selectedLead.lastName)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Lead Details
                    </p>
                    <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-900">
                      {formatPersonName(selectedLead.firstName, selectedLead.lastName)}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getLeadStatusBadgeClass(
                          selectedLead.status
                        )}`}
                      >
                        {selectedLead.status}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getSourceBadgeClass(
                          selectedLead.source
                        )}`}
                      >
                        Source: {formatSource(selectedLead.source)}
                      </span>

                      {selectedLead.agent ? (
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
                          Agent: {selectedLead.agent.name}
                        </span>
                      ) : null}

                      {selectedLead.client ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Linked Client
                        </span>
                      ) : null}

                      {selectedLead.clientCheckIn ? (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                          Recent Check-in
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      Assigned To
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedLead.assignedTo
                        ? formatPersonName(
                            selectedLead.assignedTo.firstName,
                            selectedLead.assignedTo.lastName
                          )
                        : "Unassigned"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedLead.assignedAt
                        ? `Assigned ${formatDateTime(selectedLead.assignedAt)}`
                        : "No assignment yet"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      Last Activity
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDateTime(selectedLead.lastActivityAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Created {formatDateTime(selectedLead.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Contact</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700">
                    <div>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Email
                      </span>
                      <p className="mt-1">{selectedLead.email || "—"}</p>
                    </div>

                    <div>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Phone
                      </span>
                      <p className="mt-1">{selectedLead.phone || "—"}</p>
                    </div>

                    <div>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Passport
                      </span>
                      <p className="mt-1">{selectedLead.passportNumber || "—"}</p>
                    </div>

                    <div>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Country
                      </span>
                      <p className="mt-1">{selectedLead.country || "—"}</p>
                    </div>

                    <div>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Branch
                      </span>
                      <p className="mt-1">{selectedLead.branch?.name || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Tracking</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700">
                    <div>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Submission
                      </span>
                      <p className="mt-1">
                        {selectedLead.intakeSubmission
                          ? formatPersonName(
                              selectedLead.intakeSubmission.firstName,
                              selectedLead.intakeSubmission.lastName
                            )
                          : "No intake submission"}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Source
                      </span>
                      <p className="mt-1">{formatSource(selectedLead.source)}</p>
                    </div>

                    <div>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Followers
                      </span>
                      <p className="mt-1">{selectedLead.followers.length}</p>
                    </div>

                    <div>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Client Link
                      </span>
                      <p className="mt-1">
                        {selectedLead.client ? "Client created" : "Not converted"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSubmissionMeta ? (
                <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Application Intelligence
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Captured from the public intake form and available for review before conversion.
                      </p>
                    </div>

                    {selectedSubmissionMeta.duplicateCheck?.existingClientFound ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200">
                        Existing student matched
                      </span>
                    ) : (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                        New intake submission
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Destination
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedSubmissionMeta.applicationInterest?.destinationCountry || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Provider
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedSubmissionMeta.applicationInterest?.providerName || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Course
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedSubmissionMeta.applicationInterest?.courseName || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Subject
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedSubmissionMeta.applicationInterest?.subjectArea || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Intake
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedSubmissionMeta.applicationInterest?.intake || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Study Level
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedSubmissionMeta.applicationInterest?.studyLevel || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Preferred Campus
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedSubmissionMeta.applicationInterest?.preferredCampus || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Subagent Name
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedSubmissionMeta.subagent?.name || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Agency Name
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedSubmissionMeta.subagent?.agencyName || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedLead.agent ? (
                <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Agent Referral
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        This lead came through an agent-linked referral form.
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
                      {selectedLead.agent.referralCode}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-violet-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Agent Name
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedLead.agent.name}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-violet-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Contact
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {selectedLead.agent.contact || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-violet-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Email
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {selectedLead.agent.email || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-violet-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Phone
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {selectedLead.agent.phone || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Assignment
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Pick a staff member, then confirm assignment with an action.
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {canCrossBranchAssign
                        ? "Cross-branch allowed"
                        : "Same branch only"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Current Owner
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedLead.assignedTo
                          ? formatPersonName(
                              selectedLead.assignedTo.firstName,
                              selectedLead.assignedTo.lastName
                            )
                          : "Unassigned"}
                      </p>
                    </div>

                    <select
                      value={draftAssignedUserId}
                      onChange={(e) => setDraftAssignedUserId(e.target.value)}
                      disabled={assigningId === selectedLead.id}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    >
                      <option value="">Select staff member</option>
                      {assignableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {formatPersonName(user.firstName, user.lastName)} —{" "}
                          {user.role?.name || "User"}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleAssign(selectedLead.id, draftAssignedUserId)}
                        disabled={assigningId === selectedLead.id}
                        className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                      >
                        {assigningId === selectedLead.id
                          ? "Assigning..."
                          : draftAssignedUserId
                          ? "Assign Lead"
                          : "Save Unassigned"}
                      </button>

                      {selectedLead.assignedToId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDraftAssignedUserId("");
                            void handleAssign(selectedLead.id, "");
                          }}
                          disabled={assigningId === selectedLead.id}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          Clear Assignment
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900">Status</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Update lead readiness and pipeline position.
                  </p>

                  <div className="mt-4 space-y-3">
                    <select
                      value={selectedLead.status}
                      onChange={(e) =>
                        void handleStatusUpdate(
                          selectedLead.id,
                          e.target.value as LeadStatus
                        )
                      }
                      disabled={savingStatusId === selectedLead.id}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    >
                      <option value="new_lead">new_lead</option>
                      <option value="assigned">assigned</option>
                      <option value="contacted">contacted</option>
                      <option value="qualified">qualified</option>
                      <option value="under_review">under_review</option>
                      <option value="converted">converted</option>
                      <option value="closed">closed</option>
                    </select>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                      {savingStatusId === selectedLead.id
                        ? "Updating status..."
                        : "Status changes are saved immediately."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Followers</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Team members can follow this lead for visibility and collaboration.
                    </p>
                  </div>

                  {amIFollowing ? (
                    <button
                      type="button"
                      onClick={() => void handleUnfollowLead(selectedLead.id)}
                      disabled={followerLoadingId === selectedLead.id}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Unfollow Me
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleFollowLead(selectedLead.id)}
                      disabled={followerLoadingId === selectedLead.id}
                      className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      Follow Me
                    </button>
                  )}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <select
                    value={selectedFollowerUserId}
                    onChange={(e) => setSelectedFollowerUserId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                  >
                    <option value="">Select staff member to add as follower</option>
                    {followerCandidateUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {formatPersonName(user.firstName, user.lastName)} —{" "}
                        {user.role?.name || "User"}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      selectedFollowerUserId
                        ? void handleFollowLead(selectedLead.id, selectedFollowerUserId)
                        : undefined
                    }
                    disabled={
                      followerLoadingId === selectedLead.id || !selectedFollowerUserId
                    }
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Add Follower
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedLead.followers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      No followers yet.
                    </div>
                  ) : (
                    selectedLead.followers.map((follower) => {
                      const canRemove =
                        canCrossBranchAssign || follower.userId === currentUserId;

                      return (
                        <div
                          key={follower.id}
                          className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-700">
                            {getInitials(
                              follower.user.firstName,
                              follower.user.lastName
                            )}
                          </span>

                          <span>
                            {formatPersonName(
                              follower.user.firstName,
                              follower.user.lastName
                            )}{" "}
                            — {follower.user.role?.name || "User"}
                          </span>

                          {canRemove ? (
                            <button
                              type="button"
                              onClick={() =>
                                void handleUnfollowLead(
                                  selectedLead.id,
                                  follower.userId
                                )
                              }
                              disabled={followerLoadingId === selectedLead.id}
                              className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Notes</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Save internal notes for the lead.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleNotesUpdate(selectedLead.id, draftNotes)}
                    disabled={savingNotesId === selectedLead.id}
                    className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {savingNotesId === selectedLead.id ? "Saving..." : "Save Notes"}
                  </button>
                </div>

                <textarea
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  rows={6}
                  className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                  placeholder="Add internal notes about this lead..."
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">Quick Links</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {selectedLead.client ? (
                    <Link
                      href={`/clients/${selectedLead.client.id}`}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Open Client
                    </Link>
                  ) : null}

                  {selectedLead.intakeSubmission ? (
                    <Link
                      href={`/leads/${selectedLead.id}/convert`}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Convert Submission
                    </Link>
                  ) : null}

                  <Link
                    href="/intake-submissions"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Intake Submissions
                  </Link>

                  <button
                    type="button"
                    onClick={() => void handleDeleteLead(selectedLead.id)}
                    disabled={deletingId === selectedLead.id}
                    className="rounded-2xl border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === selectedLead.id ? "Deleting..." : "Delete Lead"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}