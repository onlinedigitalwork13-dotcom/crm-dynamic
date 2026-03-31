import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

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

export default async function MyFollowingPage() {
  const session = await requireAuth();

  const currentUserId = session.user.id;

  const followedClients = await prisma.clientFollower.findMany({
    where: {
      userId: currentUserId,
    },
    include: {
      client: {
        include: {
          branch: true,
          source: true,
          workflow: true,
          currentStage: true,
          assignedTo: {
            include: {
              role: true,
            },
          },
          followers: true,
          tasks: true,
          notes: true,
          applications: true,
          activities: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalFollowed = followedClients.length;
  const withAssignedStaff = followedClients.filter(
    (item) => item.client.assignedToId
  ).length;
  const withWorkflow = followedClients.filter(
    (item) => item.client.workflowId
  ).length;
  const withApplications = followedClients.filter(
    (item) => item.client.applications.length > 0
  ).length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                Collaboration Workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                My Following
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                A premium visibility hub for every client you follow. This page
                reads directly from the client follower relationship and gives
                you a clean portfolio of watched clients.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/clients"
                className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Open Clients
              </Link>
              <Link
                href="/leads"
                className="rounded-2xl bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
              >
                Open Leads
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-slate-50/70 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Followed Clients"
            value={totalFollowed}
            subtext="Total clients you are watching"
          />
          <MetricCard
            label="Assigned"
            value={withAssignedStaff}
            subtext="Clients with an assigned owner"
          />
          <MetricCard
            label="Workflow Active"
            value={withWorkflow}
            subtext="Clients already in a workflow"
          />
          <MetricCard
            label="Applications"
            value={withApplications}
            subtext="Clients with at least one application"
          />
        </div>
      </section>

      {followedClients.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            No followed clients yet
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Once you follow a client from the client detail page, it will appear
            here automatically.
          </p>
          <div className="mt-5">
            <Link
              href="/clients"
              className="inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Browse Clients
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {followedClients.map((item) => {
            const client = item.client;
            const latestActivity = client.activities[0] || null;

            return (
              <article
                key={item.id}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                      {getInitials(client.firstName, client.lastName)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xl font-semibold tracking-tight text-slate-900">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {client.email || client.phone || "No contact details"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStageTone(
                            client.currentStage?.stageName || ""
                          )}`}
                        >
                          {client.currentStage?.stageName || "Not started"}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                          {client.workflow?.name || "No workflow"}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                          {client.branch?.name || "No branch"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/clients/${client.id}`}
                    className="shrink-0 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Open
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      Assigned Staff
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {client.assignedTo
                        ? formatPersonName(
                            client.assignedTo.firstName,
                            client.assignedTo.lastName
                          )
                        : "Unassigned"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {client.assignedTo?.role?.name || "No staff role"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      Source
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {client.source?.name || "No source"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Followed on {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                      Followers
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {client.followers.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                      Tasks
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {client.tasks.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                      Notes
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {client.notes.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                      Applications
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {client.applications.length}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Latest Activity
                  </p>
                  {latestActivity ? (
                    <>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {latestActivity.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(latestActivity.createdAt)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No recorded activity yet.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/clients/${client.id}/applications`}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Applications
                  </Link>
                  <Link
                    href={`/clients/${client.id}`}
                    className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Manage Client
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}