import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import DeleteClientButton from "./delete-client-button";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeRole(value?: string | null) {
  return (value || "").trim().toUpperCase().replace(/\s+/g, "_");
}

function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatAnswerValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatPersonName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return `${first}${last}`.toUpperCase() || "CL";
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function getStageTone(stage?: string | null) {
  const normalized = (stage || "").toLowerCase();

  if (normalized.includes("offer")) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (normalized.includes("visa")) {
    return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
  }

  if (normalized.includes("review")) {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  if (normalized.includes("application")) {
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  }

  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
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

function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 py-3 md:grid-cols-[140px_1fr] md:gap-4">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div className="text-sm text-slate-700">{value}</div>
    </div>
  );
}

export default async function ClientDetailPage({ params }: PageProps) {
  const session = await requireAuth();
  const { id } = await params;

  const currentUserId = session.user.id;
  const currentUserRole = normalizeRole(session.user.roleName);
  const canManageAll =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      branch: true,
      source: true,
      subagent: true,
      assignedTo: {
        include: {
          role: true,
        },
      },
      createdBy: {
        include: {
          role: true,
        },
      },
      workflow: {
        include: {
          stages: {
            orderBy: {
              orderSequence: "asc",
            },
          },
        },
      },
      currentStage: true,
      originalIntakeSubmission: {
        include: {
          intakeFormRequest: true,
        },
      },
      followers: {
        include: {
          user: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      activities: {
        orderBy: {
          createdAt: "desc",
        },
      },
      notes: {
        orderBy: {
          createdAt: "desc",
        },
      },
      documents: {
        orderBy: {
          createdAt: "desc",
        },
      },
      tasks: {
        include: {
          assignedTo: true,
          assignedBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      applications: {
        include: {
          provider: true,
          course: true,
          journey: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const workflows = await prisma.workflow.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const subagents = await prisma.subagent.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      role: true,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const amIFollowing = client.followers.some(
    (follower) => follower.userId === currentUserId
  );

  const followerCandidateUsers = users.filter(
    (user) => !client.followers.some((follower) => follower.userId === user.id)
  );

  const currentStageLabel = client.currentStage?.stageName || "Not started";
  const assignedStaffLabel = client.assignedTo
    ? formatPersonName(client.assignedTo.firstName, client.assignedTo.lastName)
    : "Unassigned";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white ring-1 ring-white/15 backdrop-blur">
                {getInitials(client.firstName, client.lastName)}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                  Client Profile
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  {client.firstName} {client.lastName}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                    {client.branch?.name || "No branch"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStageTone(
                      client.currentStage?.stageName || ""
                    )}`}
                  >
                    Stage: {currentStageLabel}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                    Workflow: {client.workflow?.name || "Not assigned"}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                    Assigned: {assignedStaffLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <Link
                href={`/clients/${client.id}/applications`}
                className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                View Applications
              </Link>

              <Link
                href={`/clients/${client.id}/applications/new`}
                className="rounded-2xl bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
              >
                Add Application
              </Link>

              <DeleteClientButton clientId={client.id} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-300">
                Email
              </p>
              <p className="mt-1 truncate text-sm font-medium text-white">
                {client.email || "No email"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-300">
                Phone
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {client.phone || "No phone"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-300">
                Passport
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {client.passport || "Not provided"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-300">
                Lead Source
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {client.source?.name || "No source"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-slate-50/70 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Applications"
            value={client.applications.length}
            subtext="Client-linked application records"
          />
          <MetricCard
            label="Tasks"
            value={client.tasks.length}
            subtext="Operational workload for this client"
          />
          <MetricCard
            label="Notes"
            value={client.notes.length}
            subtext="Internal collaboration and context"
          />
          <MetricCard
            label="Followers"
            value={client.followers.length}
            subtext="People watching this client record"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard
            title="Profile Overview"
            description="Core client details, ownership, and source context."
          >
            <div className="divide-y divide-slate-100">
              <DetailRow label="Full Name" value={`${client.firstName} ${client.lastName}`} />
              <DetailRow label="Email" value={client.email || "No email"} />
              <DetailRow label="Phone" value={client.phone || "No phone"} />
              <DetailRow label="Passport" value={client.passport || "Not provided"} />
              <DetailRow label="Branch" value={client.branch?.name || "No branch"} />
              <DetailRow label="Lead Source" value={client.source?.name || "No source"} />
              <DetailRow label="Subagent" value={client.subagent?.name || "Not assigned"} />
              <DetailRow label="Workflow" value={client.workflow?.name || "Not assigned"} />
              <DetailRow label="Current Stage" value={currentStageLabel} />
              <DetailRow label="Assigned Staff" value={assignedStaffLabel} />
              <DetailRow
                label="Created By"
                value={
                  client.createdBy
                    ? formatPersonName(
                        client.createdBy.firstName,
                        client.createdBy.lastName
                      )
                    : "Unknown"
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Relationship Management"
            description="Premium assignment and collaboration controls for this client."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Assign Staff
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Assign or reassign the ownership of this client.
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    Current: {assignedStaffLabel}
                  </span>
                </div>

                <form
                  action={`/api/clients/${client.id}/assign`}
                  method="post"
                  className="mt-4 flex flex-col gap-3"
                >
                  <select
                    name="assignedToId"
                    defaultValue={client.assignedToId || ""}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                  >
                    <option value="">Select staff member</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {formatPersonName(user.firstName, user.lastName)} —{" "}
                        {user.role?.name || "User"}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Save Assignment
                  </button>
                </form>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Followers
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Followers are stored in the client follower relation and can be shown later in a dedicated follower portal.
                    </p>
                  </div>

                  {amIFollowing ? (
                    <form
                      action={`/api/clients/${client.id}/followers`}
                      method="post"
                    >
                      <input type="hidden" name="_action" value="unfollow_me" />
                      <button
                        type="submit"
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Unfollow Me
                      </button>
                    </form>
                  ) : (
                    <form
                      action={`/api/clients/${client.id}/followers`}
                      method="post"
                    >
                      <input type="hidden" name="_action" value="follow_me" />
                      <button
                        type="submit"
                        className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Follow Me
                      </button>
                    </form>
                  )}
                </div>

                <form
                  action={`/api/clients/${client.id}/followers`}
                  method="post"
                  className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"
                >
                  <input type="hidden" name="_action" value="add_follower" />
                  <select
                    name="userId"
                    defaultValue=""
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
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
                    type="submit"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Add Follower
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap gap-2">
                  {client.followers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                      No followers yet.
                    </div>
                  ) : (
                    client.followers.map((follower) => {
                      const canRemove =
                        canManageAll || follower.userId === currentUserId;

                      return (
                        <div
                          key={follower.id}
                          className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
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
                            <form
                              action={`/api/clients/${client.id}/followers`}
                              method="post"
                            >
                              <input
                                type="hidden"
                                name="_action"
                                value="remove_follower"
                              />
                              <input
                                type="hidden"
                                name="userId"
                                value={follower.userId}
                              />
                              <button
                                type="submit"
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
                              >
                                Remove
                              </button>
                            </form>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <form
                action={`/api/clients/${client.id}/subagent`}
                method="post"
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <p className="text-sm font-semibold text-slate-900">
                  Assign Subagent
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Link an external or partner representative.
                </p>

                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <select
                    name="subagentId"
                    defaultValue={client.subagentId || ""}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                  >
                    <option value="">Select subagent</option>
                    {subagents.map((subagent) => (
                      <option key={subagent.id} value={subagent.id}>
                        {subagent.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Save
                  </button>
                </div>
              </form>

              <form
                action={`/api/clients/${client.id}/workflow`}
                method="post"
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <p className="text-sm font-semibold text-slate-900">
                  Assign Workflow
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Set the operational pipeline for this client.
                </p>

                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <select
                    name="workflowId"
                    defaultValue={client.workflowId || ""}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                  >
                    <option value="">Select workflow</option>
                    {workflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </SectionCard>

          <SectionCard
            title="Applications Overview"
            description="Quick visibility into provider, course, and journey progress."
            action={
              <Link
                href={`/clients/${client.id}/applications`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                View All
              </Link>
            }
          >
            {client.applications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No applications added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {client.applications.slice(0, 5).map((application) => (
                  <div
                    key={application.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-slate-900">
                            {application.provider.name}
                          </p>

                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {formatStatusLabel(application.status)}
                          </span>

                          {application.journey ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              Journey Active
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <p>Course: {application.course.name}</p>
                          <p>
                            Intake: {application.intake}
                            {application.intakeYear ? ` ${application.intakeYear}` : ""}
                          </p>
                          <p>
                            Application No: {application.applicationNo || "Not set"}
                          </p>
                          <p>
                            Applied At:{" "}
                            {application.appliedAt
                              ? new Date(application.appliedAt).toLocaleDateString()
                              : "Not set"}
                          </p>
                          <p>
                            Offer Date:{" "}
                            {application.offerDate
                              ? new Date(application.offerDate).toLocaleDateString()
                              : "Not set"}
                          </p>

                          {application.journey ? (
                            <>
                              <p>
                                Offer Status:{" "}
                                {formatStatusLabel(application.journey.offerStatus)}
                              </p>
                              <p>
                                COE Status:{" "}
                                {formatStatusLabel(application.journey.coeStatus)}
                              </p>
                              <p>
                                Visa Status:{" "}
                                {formatStatusLabel(application.journey.visaStatus)}
                              </p>
                            </>
                          ) : null}
                        </div>

                        {application.notes ? (
                          <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                            {application.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/clients/${client.id}/applications/${application.id}`}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Journey
                        </Link>

                        <Link
                          href={`/clients/${client.id}/applications/${application.id}/edit`}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Workflow Progress"
            description="High-level stage progression for this client."
          >
            {!client.workflow ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No workflow assigned to this client.
              </div>
            ) : client.workflow.stages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                This workflow has no stages yet.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {client.workflow.stages.map((stage) => {
                  const isCurrent = client.currentStageId === stage.id;

                  return (
                    <div
                      key={stage.id}
                      className={`rounded-2xl px-4 py-3 text-sm font-medium ring-1 ${
                        isCurrent
                          ? "bg-slate-950 text-white ring-slate-950"
                          : "bg-white text-slate-700 ring-slate-200"
                      }`}
                    >
                      {stage.orderSequence}. {stage.stageName}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <StageUpdateSection
            clientId={client.id}
            workflowId={client.workflowId}
            currentStageId={client.currentStageId}
          />

          <SectionCard
            title="Client Tasks"
            description="Create, assign, and manage operational follow-ups."
          >
            <form
              action={`/api/clients/${client.id}/tasks`}
              method="post"
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Task Title
                  </label>
                  <input
                    name="title"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                    placeholder="Request passport / Follow up / Check documents"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                    placeholder="Optional task details"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Assign To
                    </label>
                    <select
                      name="assignedToId"
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value="">Select staff</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Assigned By
                    </label>
                    <select
                      name="assignedById"
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value="">Select staff</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Create Task
                </button>
              </div>
            </form>

            {client.tasks.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                No tasks created yet.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {client.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5"
                  >
                    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-slate-900">
                            {task.title}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {task.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {task.description || "No description"}
                        </p>

                        <div className="mt-4 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                          <p>
                            Assigned To: {task.assignedTo.firstName}{" "}
                            {task.assignedTo.lastName}
                          </p>
                          <p>
                            Assigned By: {task.assignedBy.firstName}{" "}
                            {task.assignedBy.lastName}
                          </p>
                          <p>
                            Due Date:{" "}
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : "No due date"}
                          </p>
                          <p>Created: {formatDateTime(task.createdAt)}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <form
                          action={`/api/tasks/${task.id}/status`}
                          method="post"
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Update Status
                          </label>
                          <select
                            name="status"
                            defaultValue={task.status}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>

                          <button
                            type="submit"
                            className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
                          >
                            Update Status
                          </button>
                        </form>

                        <form
                          action={`/api/clients/${client.id}/tasks/${task.id}/edit`}
                          method="post"
                          className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <h3 className="text-sm font-medium text-slate-900">
                            Edit Task
                          </h3>

                          <input
                            name="title"
                            defaultValue={task.title}
                            required
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                            placeholder="Task title"
                          />

                          <textarea
                            name="description"
                            rows={3}
                            defaultValue={task.description || ""}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                            placeholder="Task description"
                          />

                          <select
                            name="assignedToId"
                            defaultValue={task.assignedToId}
                            required
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                          >
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </option>
                            ))}
                          </select>

                          <input
                            type="date"
                            name="dueDate"
                            defaultValue={
                              task.dueDate
                                ? new Date(task.dueDate).toISOString().split("T")[0]
                                : ""
                            }
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                          />

                          <button
                            type="submit"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Save Task Changes
                          </button>
                        </form>

                        <form
                          action={`/api/clients/${client.id}/tasks/${task.id}`}
                          method="post"
                        >
                          <button
                            type="submit"
                            className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100"
                          >
                            Delete Task
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          {client.originalIntakeSubmission ? (
            <SectionCard
              title="Original Intake Submission"
              description="This client was converted from a public intake form submission."
              action={
                <Link
                  href="/intake-submissions"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View Leads
                </Link>
              }
            >
              <div className="grid gap-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-3 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-900">Form:</span>{" "}
                      {client.originalIntakeSubmission.intakeFormRequest.title}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Submitted At:</span>{" "}
                      {new Date(
                        client.originalIntakeSubmission.submittedAt
                      ).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Status:</span>{" "}
                      {formatStatusLabel(client.originalIntakeSubmission.status)}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Submission Phone:</span>{" "}
                      {client.originalIntakeSubmission.phone || "—"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Submission Email:</span>{" "}
                      {client.originalIntakeSubmission.email || "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Submitted Answers
                  </h3>

                  <div className="mt-3 space-y-3">
                    {client.originalIntakeSubmission.answers &&
                    typeof client.originalIntakeSubmission.answers === "object" &&
                    !Array.isArray(client.originalIntakeSubmission.answers) ? (
                      Object.entries(
                        client.originalIntakeSubmission.answers as Record<
                          string,
                          unknown
                        >
                      ).map(([key, value]) => (
                        <div
                          key={key}
                          className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="text-sm font-medium text-slate-800">
                            {key}
                          </div>
                          <div className="text-sm text-slate-600">
                            {formatAnswerValue(value)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                        No original submitted answers available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Notes"
            description="Private internal commentary for this client."
          >
            <form
              action={`/api/clients/${client.id}/notes`}
              method="post"
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Add Note
              </label>
              <textarea
                name="content"
                rows={4}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                placeholder="Write internal notes about this client..."
              />

              <button
                type="submit"
                className="mt-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                Save Note
              </button>
            </form>

            {client.notes.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                No notes added yet.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {client.notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-3xl border border-slate-200 bg-white p-4"
                  >
                    <p className="whitespace-pre-wrap text-sm text-slate-800">
                      {note.content}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>

                      <form
                        action={`/api/clients/${client.id}/notes/${note.id}`}
                        method="post"
                      >
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Documents"
            description="Securely attach and manage supporting files."
          >
            <form
              action={`/api/clients/${client.id}/documents`}
              method="post"
              encType="multipart/form-data"
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Document Title
                  </label>
                  <input
                    name="title"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                    placeholder="Passport / IELTS / Offer Letter"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Upload File
                  </label>
                  <input type="file" name="file" required className="w-full text-sm" />
                </div>

                <button
                  type="submit"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Upload Document
                </button>
              </div>
            </form>

            {client.documents.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                No documents uploaded.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {client.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{doc.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(doc.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={doc.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View
                      </a>

                      <form
                        action={`/api/clients/${client.id}/documents/${doc.id}`}
                        method="post"
                      >
                        <button
                          type="submit"
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Activity Timeline"
            description="A live record of important client actions."
          >
            {client.activities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No activity recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {client.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {activity.message}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

async function StageUpdateSection({
  clientId,
  workflowId,
  currentStageId,
}: {
  clientId: string;
  workflowId: string | null;
  currentStageId: string | null;
}) {
  if (!workflowId) {
    return (
      <SectionCard
        title="Update Stage"
        description="Assign a workflow first before updating stages."
      >
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No workflow assigned yet.
        </div>
      </SectionCard>
    );
  }

  const stages = await prisma.workflowStage.findMany({
    where: { workflowId },
    orderBy: { orderSequence: "asc" },
  });

  return (
    <SectionCard
      title="Update Stage"
      description="Move the client through the workflow lifecycle."
    >
      <form
        action={`/api/clients/${clientId}/stage`}
        method="post"
        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Select Stage
            </label>
            <select
              name="stageId"
              defaultValue={currentStageId || ""}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="">Select stage</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.orderSequence}. {stage.stageName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Update Stage
          </button>
        </div>
      </form>
    </SectionCard>
  );
}