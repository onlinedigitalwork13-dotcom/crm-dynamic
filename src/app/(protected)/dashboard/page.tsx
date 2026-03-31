import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

function SectionHeader({
  title,
  description,
  href,
  hrefLabel = "View more",
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          {hrefLabel}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

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

function getTaskState(dueDate: Date | null) {
  if (!dueDate) {
    return {
      label: "No due date",
      className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    };
  }

  const due = new Date(dueDate);
  const now = new Date();

  const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dueOnly < nowOnly) {
    return {
      label: "Overdue",
      className: "bg-red-100 text-red-700 ring-1 ring-red-200",
    };
  }

  if (dueOnly.getTime() === nowOnly.getTime()) {
    return {
      label: "Due today",
      className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    };
  }

  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const soonOnly = new Date(soon.getFullYear(), soon.getMonth(), soon.getDate());

  if (dueOnly <= soonOnly) {
    return {
      label: "Due soon",
      className: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200",
    };
  }

  return {
    label: "Upcoming",
    className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  };
}

function getCheckInType(item: {
  clientId: string | null;
  intakeSubmissionId: string | null;
  client: { id: string } | null;
}) {
  if (item.clientId && item.client && !item.intakeSubmissionId) {
    return {
      label: "Existing Client",
      className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    };
  }

  if (item.intakeSubmissionId && item.clientId) {
    return {
      label: "Existing Intake",
      className: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    };
  }

  if (item.intakeSubmissionId && !item.clientId) {
    return {
      label: "New Check-in",
      className: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
    };
  }

  return {
    label: "Unknown",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  };
}

function getDaysUntil(dateValue: Date | string | null | undefined) {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getVisaAlertState(daysLeft: number | null) {
  if (daysLeft === null) {
    return {
      label: "Unknown",
      className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    };
  }

  if (daysLeft < 0) {
    return {
      label: "Expired",
      className: "bg-red-100 text-red-700 ring-1 ring-red-200",
    };
  }

  if (daysLeft <= 7) {
    return {
      label: "Urgent",
      className: "bg-red-100 text-red-700 ring-1 ring-red-200",
    };
  }

  if (daysLeft <= 14) {
    return {
      label: "High Priority",
      className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    };
  }

  return {
    label: "Upcoming",
    className: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  };
}

export default async function DashboardPage() {
  const session = await requireAuth();

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email ?? undefined },
    include: {
      role: true,
      branch: true,
    },
  });

  if (!currentUser) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-red-600">
          Logged-in user record was not found in the database.
        </p>
      </div>
    );
  }

  const now = new Date();
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);

  const [
    totalClients,
    totalProviders,
    totalCourses,
    totalApplications,
    totalTasks,
    totalIntakeSubmissions,
    assignedTasks,
    createdTasks,
    recentClients,
    recentApplications,
    intakeStatusCounts,
    recentCheckIns,
    myClients,
    visaExpiryAlerts,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.provider.count(),
    prisma.course.count(),
    prisma.clientApplication.count(),
    prisma.task.count(),
    prisma.intakeFormSubmission.count(),

    prisma.task.findMany({
      where: {
        assignedToId: currentUser.id,
        status: { not: "completed" },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 6,
      include: {
        client: true,
        assignedBy: true,
      },
    }),

    prisma.task.findMany({
      where: {
        assignedById: currentUser.id,
        status: { not: "completed" },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 6,
      include: {
        client: true,
        assignedTo: true,
      },
    }),

    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        source: true,
        branch: true,
      },
    }),

    prisma.clientApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: true,
        provider: true,
        course: true,
      },
    }),

    prisma.intakeFormSubmission.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    prisma.clientCheckIn.findMany({
      orderBy: { checkedInAt: "desc" },
      take: 6,
      include: {
        client: true,
        intakeSubmission: true,
        branch: true,
      },
    }),

    prisma.client.findMany({
      where: {
        OR: [{ createdById: currentUser.id }, { assignedToId: currentUser.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        source: true,
        branch: true,
        createdBy: true,
        assignedTo: true,
      },
    }),

    prisma.applicationJourney.findMany({
      where: {
        visaExpiryDate: {
          not: null,
          gte: now,
          lte: next30Days,
        },
      },
      orderBy: {
        visaExpiryDate: "asc",
      },
      take: 6,
      include: {
        application: {
          include: {
            client: true,
            provider: true,
            course: true,
          },
        },
      },
    }),
  ]);

  const intakeStatusMap = {
    new: 0,
    assigned: 0,
    contacted: 0,
    under_review: 0,
    converted: 0,
    closed: 0,
  } as Record<string, number>;

  for (const item of intakeStatusCounts) {
    intakeStatusMap[item.status] = item._count.status;
  }

  const statCards = [
    {
      label: "Clients",
      value: totalClients,
      href: "/clients",
      accent: "from-blue-500/15 to-blue-100",
      valueClass: "text-blue-900",
      icon: "C",
    },
    {
      label: "Applications",
      value: totalApplications,
      href: "/applications",
      accent: "from-indigo-500/15 to-indigo-100",
      valueClass: "text-indigo-900",
      icon: "A",
    },
    {
      label: "Tasks",
      value: totalTasks,
      href: "/tasks",
      accent: "from-amber-500/15 to-amber-100",
      valueClass: "text-amber-900",
      icon: "T",
    },
    {
      label: "Providers",
      value: totalProviders,
      href: "/providers",
      accent: "from-emerald-500/15 to-emerald-100",
      valueClass: "text-emerald-900",
      icon: "P",
    },
    {
      label: "Courses",
      value: totalCourses,
      href: "/courses-config",
      accent: "from-violet-500/15 to-violet-100",
      valueClass: "text-violet-900",
      icon: "Co",
    },
    {
      label: "Intake Submissions",
      value: totalIntakeSubmissions,
      href: "/intake-submissions",
      accent: "from-cyan-500/15 to-cyan-100",
      valueClass: "text-cyan-900",
      icon: "I",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)] ring-1 ring-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
              Executive Overview
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Welcome back, {currentUser.firstName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Monitor check-ins, clients, applications, and daily operations from
              one premium workspace designed for fast action.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Role: {currentUser.role?.name || "No role"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Branch: {currentUser.branch?.name || "No branch"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Email: {currentUser.email}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/clients/new"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Add Client
            </Link>

            <Link
              href="/leads"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open Leads
            </Link>

            <Link
              href="/tasks"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              View Tasks
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-70`} />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.label}</p>
                  <p className={`mt-3 text-3xl font-semibold ${card.valueClass}`}>
                    {card.value}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-xs font-bold text-slate-700 shadow-sm">
                  {card.icon}
                </div>
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500 transition group-hover:text-slate-700">
                Open module →
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-7">
          <SectionHeader
            title="Recent Check-ins"
            description="Live visibility into student arrivals and check-in type"
            href="/leads"
            hrefLabel="Open lead queue"
          />

          {recentCheckIns.length === 0 ? (
            <EmptyState text="No recent check-ins." />
          ) : (
            <div className="mt-5 space-y-3">
              {recentCheckIns.map((item) => {
                const checkInType = getCheckInType(item);
                const displayName = item.client
                  ? formatPersonName(item.client.firstName, item.client.lastName)
                  : item.intakeSubmission
                  ? formatPersonName(
                      item.intakeSubmission.firstName,
                      item.intakeSubmission.lastName
                    )
                  : "Unknown";

                const subText = item.client
                  ? item.client.phone || item.client.email || "—"
                  : item.intakeSubmission?.phone ||
                    item.intakeSubmission?.email ||
                    "—";

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {displayName}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">{subText}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.branch?.name || "No branch"} •{" "}
                          {formatDateTime(item.checkedInAt)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${checkInType.className}`}
                        >
                          {checkInType.label}
                        </span>

                        {item.client ? (
                          <Link
                            href={`/clients/${item.client.id}`}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Open Client
                          </Link>
                        ) : item.intakeSubmission ? (
                          <Link
                            href={`/intake-submissions/${item.intakeSubmission.id}/convert`}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Open Intake
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">
          <SectionHeader
            title="My Clients"
            description="Clients created by you or assigned to you"
            href="/clients"
            hrefLabel="Open clients"
          />

          {myClients.length === 0 ? (
            <EmptyState text="No owned clients found yet." />
          ) : (
            <div className="mt-5 space-y-3">
              {myClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {client.phone}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {client.branch?.name || "No branch"} •{" "}
                        {client.source?.name || "No source"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {client.createdById === currentUser.id ? (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                            Created by me
                          </span>
                        ) : null}
                        {client.assignedToId === currentUser.id ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            Assigned to me
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {formatDate(client.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm 2xl:col-span-6">
          <SectionHeader
            title="Tasks Assigned to Me"
            description="Pending work that needs my attention first"
            href="/tasks"
            hrefLabel="View all"
          />

          {assignedTasks.length === 0 ? (
            <EmptyState text="No pending assigned tasks." />
          ) : (
            <div className="mt-5 space-y-3">
              {assignedTasks.map((task) => {
                const state = getTaskState(task.dueDate);

                return (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{task.title}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          Created by {task.assignedBy.firstName} {task.assignedBy.lastName}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {task.client
                            ? `Client: ${task.client.firstName} ${task.client.lastName}`
                            : "No client linked"}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${state.className}`}
                        >
                          {state.label}
                        </span>
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm 2xl:col-span-6">
          <SectionHeader
            title="Tasks Created by Me"
            description="Follow-up work assigned by you that is still active"
            href="/tasks"
            hrefLabel="View all"
          />

          {createdTasks.length === 0 ? (
            <EmptyState text="No active tasks created by you." />
          ) : (
            <div className="mt-5 space-y-3">
              {createdTasks.map((task) => {
                const state = getTaskState(task.dueDate);

                return (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{task.title}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          Assigned to {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {task.client
                            ? `Client: ${task.client.firstName} ${task.client.lastName}`
                            : "No client linked"}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${state.className}`}
                        >
                          {state.label}
                        </span>
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Visa Alerts"
          description="Students whose visas are expiring within the next 30 days"
          href="/applications"
          hrefLabel="Open applications"
        />

        {visaExpiryAlerts.length === 0 ? (
          <EmptyState text="No visa expiries found within the next 30 days." />
        ) : (
          <div className="mt-5 space-y-3">
            {visaExpiryAlerts.map((journey) => {
              const client = journey.application.client;
              const provider = journey.application.provider;
              const course = journey.application.course;
              const daysLeft = getDaysUntil(journey.visaExpiryDate);
              const alertState = getVisaAlertState(daysLeft);

              return (
                <div
                  key={journey.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {formatPersonName(client.firstName, client.lastName)}
                      </div>

                      <div className="mt-1 text-sm text-slate-600">
                        {provider.name} • {course.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Visa expires on {formatDate(journey.visaExpiryDate)}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${alertState.className}`}
                        >
                          {alertState.label}
                        </span>

                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {daysLeft === null
                            ? "Days left unknown"
                            : daysLeft === 0
                            ? "Expires today"
                            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/clients/${client.id}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Open Client
                      </Link>

                      <Link
                        href={`/clients/${client.id}/applications/${journey.application.id}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Open Application
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">
          <SectionHeader
            title="Intake Pipeline"
            description="Current submission flow snapshot"
            href="/intake-submissions"
            hrefLabel="Open queue"
          />

          <div className="mt-5 space-y-3">
            {[
              ["New", intakeStatusMap.new],
              ["Assigned", intakeStatusMap.assigned],
              ["Contacted", intakeStatusMap.contacted],
              ["Under Review", intakeStatusMap.under_review],
              ["Converted", intakeStatusMap.converted],
              ["Closed", intakeStatusMap.closed],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {value as number}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">
          <SectionHeader
            title="Recent Applications"
            description="Latest education applications"
            href="/applications"
            hrefLabel="View all"
          />

          {recentApplications.length === 0 ? (
            <EmptyState text="No applications yet." />
          ) : (
            <div className="mt-5 space-y-3">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {app.client.firstName} {app.client.lastName}
                  </div>

                  <div className="mt-1 text-xs text-slate-600">
                    {app.provider.name} • {app.course.name}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {app.intake} {app.intakeYear || ""}
                    </span>
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">
          <SectionHeader
            title="Recent Clients"
            description="Latest clients added to the system"
            href="/clients"
            hrefLabel="View all"
          />

          {recentClients.length === 0 ? (
            <EmptyState text="No clients yet." />
          ) : (
            <div className="mt-5 space-y-3">
              {recentClients.map((client) => (
                <div
                  key={client.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {client.firstName} {client.lastName}
                  </div>

                  <div className="mt-1 text-xs text-slate-600">{client.phone}</div>

                  <div className="mt-1 text-xs text-slate-500">
                    {client.branch?.name || "No branch"} •{" "}
                    {client.source?.name || "No source"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Quick Navigation"
          description="Jump into core operational modules quickly"
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          {[
            { label: "Clients", href: "/clients" },
            { label: "Leads", href: "/leads" },
            { label: "Providers", href: "/providers" },
            { label: "Courses", href: "/courses-config" },
            { label: "Applications", href: "/applications" },
            { label: "Intake Forms", href: "/intake-forms" },
            { label: "Submissions", href: "/intake-submissions" },
            { label: "Tasks", href: "/tasks" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}