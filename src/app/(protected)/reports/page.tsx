import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { getReportsOverview } from "@/lib/report-service";

function normalizeRole(roleName?: string | null) {
  return (roleName || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
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

export default async function ReportsPage() {
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
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-2 text-sm text-red-600">
          Logged-in user record was not found in the database.
        </p>
      </div>
    );
  }

  const role = normalizeRole(currentUser.role?.name);
  const canAccessReports = role === "super_admin" || role === "admin";

  if (!canAccessReports) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)] ring-1 ring-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%)]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
              Restricted Area
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Reports access is limited
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              This module is available only for admin and super admin users.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            Your current role does not have access to executive reporting.
          </p>
        </div>
      </div>
    );
  }

  const data = await getReportsOverview();

  const statCards = [
    {
      label: "Total Clients",
      value: data.totalClients,
      accent: "from-blue-500/15 to-blue-100",
      valueClass: "text-blue-900",
      icon: "C",
    },
    {
      label: "Active Clients",
      value: data.activeClients,
      accent: "from-indigo-500/15 to-indigo-100",
      valueClass: "text-indigo-900",
      icon: "A",
    },
    {
      label: "Final Stage Clients",
      value: data.finalStageClients,
      accent: "from-emerald-500/15 to-emerald-100",
      valueClass: "text-emerald-900",
      icon: "F",
    },
    {
      label: "Converted This Month",
      value: data.convertedThisMonth,
      accent: "from-violet-500/15 to-violet-100",
      valueClass: "text-violet-900",
      icon: "M",
    },
    {
      label: "Assigned Cases",
      value: data.totalAssignedCases,
      accent: "from-amber-500/15 to-amber-100",
      valueClass: "text-amber-900",
      icon: "W",
    },
    {
      label: "Avg Cases / Staff",
      value: data.avgCasesPerStaff,
      accent: "from-cyan-500/15 to-cyan-100",
      valueClass: "text-cyan-900",
      icon: "S",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)] ring-1 ring-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
              Executive Reports
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Reports & Performance Intelligence
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              A premium management view of staff workload, client ownership,
              final-stage conversions, and workflow movement across the CRM.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Access: {currentUser.role?.name || "No role"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Branch: {currentUser.branch?.name || "All branches"}
              </span>
              {data.topPerformer ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                  Top performer: {data.topPerformer.name}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/clients"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Open Clients
            </Link>

            <Link
              href="/applications"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open Applications
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-70`}
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {card.label}
                  </p>
                  <p className={`mt-3 text-3xl font-semibold ${card.valueClass}`}>
                    {card.value}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-xs font-bold text-slate-700 shadow-sm">
                  {card.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-7">
          <SectionHeader
            title="Staff Performance"
            description="See which staff are handling cases, how many are active, and how many reached final stage."
          />

          {data.staffPerformance.length === 0 ? (
            <EmptyState text="No staff performance data found." />
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3 font-semibold">Staff</th>
                    <th className="px-3 py-3 font-semibold">Assigned</th>
                    <th className="px-3 py-3 font-semibold">Active</th>
                    <th className="px-3 py-3 font-semibold">Final Stage</th>
                    <th className="px-3 py-3 font-semibold">Converted</th>
                    <th className="px-3 py-3 font-semibold">Open Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staffPerformance.map((staff) => (
                    <tr
                      key={staff.userId}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">
                          {staff.staffName}
                        </div>
                        <div className="text-xs text-slate-500">{staff.email}</div>
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-slate-700">
                        {staff.totalAssignedClients}
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-slate-700">
                        {staff.activeClients}
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-slate-700">
                        {staff.finalStageClients}
                      </td>
                      <td className="px-3 py-4 text-sm font-semibold text-emerald-700">
                        {staff.convertedClients}
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-slate-700">
                        {staff.openTasks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">
          <SectionHeader
            title="Recent Converted Clients"
            description="Clients whose current workflow stage is marked as final."
          />

          {data.recentConvertedClients.length === 0 ? (
            <EmptyState text="No final-stage converted clients found." />
          ) : (
            <div className="mt-5 space-y-3">
              {data.recentConvertedClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {client.clientName}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {client.workflowName} • {client.stageName}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Staff: {client.assignedStaffName}
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {formatDate(client.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-7">
          <SectionHeader
            title="Staff Case Ownership"
            description="Which staff is working on which client, with current workflow and stage visibility."
          />

          {data.staffPerformance.length === 0 ? (
            <EmptyState text="No assigned client cases found." />
          ) : (
            <div className="mt-5 space-y-6">
              {data.staffPerformance.map((staff) => (
                <div
                  key={staff.userId}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {staff.staffName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {staff.totalAssignedClients} assigned case
                        {staff.totalAssignedClients === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Active {staff.activeClients}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        Final {staff.finalStageClients}
                      </span>
                    </div>
                  </div>

                  {staff.cases.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                      No cases assigned.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {staff.cases.slice(0, 6).map((item) => (
                        <Link
                          key={item.clientId}
                          href={`/clients/${item.clientId}`}
                          className="flex flex-col gap-3 rounded-2xl border border-white bg-white p-4 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {item.clientName}
                            </div>
                            <div className="mt-1 text-xs text-slate-600">
                              {item.workflowName} • {item.stageName}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.branchName}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                item.isFinalStage
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {item.isFinalStage ? "Final Stage" : "In Progress"}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {formatDate(item.updatedAt)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">
          <SectionHeader
            title="Workflow Funnel Snapshot"
            description="Stage distribution across workflows, including final-stage counts."
          />

          {data.workflowStageCounts.length === 0 ? (
            <EmptyState text="No workflow stage data found." />
          ) : (
            <div className="mt-5 space-y-3">
              {data.workflowStageCounts.map((item) => (
                <div
                  key={item.stageId}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.workflowName}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {item.stageName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">
                        {item.clientCount}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.isFinal
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {item.isFinal ? "Final Stage" : "Open Stage"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Monthly Conversion Trend"
          description="Last 6 months of final-stage conversion movement."
        />

        {data.conversionTrend.length === 0 ? (
          <EmptyState text="No monthly conversion data found." />
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {data.conversionTrend.map((item) => (
              <div
                key={item.monthKey}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {item.monthLabel}
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-900">
                  {item.convertedCount}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Final-stage conversions
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}