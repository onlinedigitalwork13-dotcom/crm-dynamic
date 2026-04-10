import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type IntakeFormSettings = {
  referralType?: string;
  agentId?: string | null;
  source?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getSettingsObject(value: Prisma.JsonValue | null): IntakeFormSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const settings = value as Record<string, unknown>;

  return {
    referralType:
      typeof settings.referralType === "string"
        ? settings.referralType.trim()
        : undefined,
    agentId:
      typeof settings.agentId === "string" ? settings.agentId.trim() : null,
    source:
      typeof settings.source === "string" ? settings.source.trim() : undefined,
  };
}

function getAbsoluteOrRelativeUrl(value: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") || "";

  return appUrl ? `${appUrl}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}` : trimmed;
}

export default async function AgentsPage() {
  const [subagents, intakeForms] = await Promise.all([
    prisma.subagent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        clients: {
          select: {
            id: true,
          },
        },
        leads: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.intakeFormRequest.findMany({
      select: {
        id: true,
        title: true,
        token: true,
        publicUrl: true,
        status: true,
        isActive: true,
        settings: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const linkedFormsByAgentId = new Map<
    string,
    {
      id: string;
      title: string;
      token: string;
      publicUrl: string | null;
      status: string;
      isActive: boolean;
      updatedAt: Date;
      createdAt: Date;
    }
  >();

  for (const form of intakeForms) {
    const settings = getSettingsObject(form.settings as Prisma.JsonValue | null);

    if (settings.referralType !== "agent" || !settings.agentId) {
      continue;
    }

    if (!linkedFormsByAgentId.has(settings.agentId)) {
      linkedFormsByAgentId.set(settings.agentId, {
        id: form.id,
        title: form.title,
        token: form.token,
        publicUrl: form.publicUrl,
        status: form.status,
        isActive: form.isActive,
        updatedAt: form.updatedAt,
        createdAt: form.createdAt,
      });
    }
  }

  const totalAgents = subagents.length;
  const activeAgents = subagents.filter((item) => item.isActive).length;
  const inactiveAgents = totalAgents - activeAgents;

  const totalActiveClients = subagents.reduce(
    (sum, item) => sum + item.clients.length,
    0
  );

  const totalLeads = subagents.reduce(
    (sum, item) => sum + item.leads.length,
    0
  );

  const openLeads = subagents.reduce(
    (sum, item) =>
      sum +
      item.leads.filter(
        (lead) => lead.status !== "converted" && lead.status !== "closed"
      ).length,
    0
  );

  const convertedLeads = subagents.reduce(
    (sum, item) =>
      sum + item.leads.filter((lead) => lead.status === "converted").length,
    0
  );

  const linkedFormsCount = subagents.filter((subagent) =>
    linkedFormsByAgentId.has(subagent.id)
  ).length;

  const agents = subagents.map((subagent) => {
    const totalLeadsCount = subagent.leads.length;
    const openLeadsCount = subagent.leads.filter(
      (lead) => lead.status !== "converted" && lead.status !== "closed"
    ).length;
    const convertedLeadsCount = subagent.leads.filter(
      (lead) => lead.status === "converted"
    ).length;

    const conversionRate =
      totalLeadsCount > 0
        ? Math.round((convertedLeadsCount / totalLeadsCount) * 100)
        : 0;

    const linkedForm = linkedFormsByAgentId.get(subagent.id) ?? null;
    const linkedPublicUrl = linkedForm
      ? getAbsoluteOrRelativeUrl(linkedForm.publicUrl || `/forms/${linkedForm.token}`)
      : null;

    return {
      ...subagent,
      totalLeadsCount,
      openLeadsCount,
      convertedLeadsCount,
      conversionRate,
      linkedForm,
      linkedPublicUrl,
    };
  });

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="border-b border-slate-200/70 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Partner Network
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Agents
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Manage external agents, referral partners, linked intake forms,
                and incoming lead channels from one premium workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/subagents/new"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Add Agent
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8 xl:grid-cols-6">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 xl:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Total Agents
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              {totalAgents}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              All registered partner agents
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 xl:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Active
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              {activeAgents}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Currently enabled for referrals
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 xl:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              Inactive
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              {inactiveAgents}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Saved but not receiving submissions
            </p>
          </div>

          <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 xl:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
              Active Clients
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              {totalActiveClients}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Clients currently linked to agents
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 xl:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Total Leads
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              {totalLeads}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Leads submitted through agents
            </p>
          </div>

          <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 xl:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
              Linked Forms
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              {linkedFormsCount}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Agents with working public intake forms
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Agent Directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Premium overview of all partner agents, linked intake forms, and
              lead performance.
            </p>
          </div>

          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            {totalAgents} total records
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="px-6 py-16 sm:px-8">
            <div className="mx-auto max-w-xl rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white">
                A
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950">
                No agents found
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start building your external referral network by creating your
                first agent profile.
              </p>

              <Link
                href="/subagents/new"
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Add Agent
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden xl:block">
              <table className="min-w-full">
                <thead className="bg-slate-50/90 text-left">
                  <tr>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Agent
                    </th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Contact
                    </th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Country
                    </th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Referral Code
                    </th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Linked Intake Form
                    </th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Active Clients
                    </th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Leads
                    </th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Conversion
                    </th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {agents.map((subagent) => (
                    <tr
                      key={subagent.id}
                      className="border-t border-slate-200/70 transition hover:bg-slate-50/80"
                    >
                      <td className="px-8 py-5">
                        <Link
                          href={`/subagents/${subagent.id}`}
                          className="group block rounded-2xl focus:outline-none"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                              {getInitials(subagent.name || "A")}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-950 transition group-hover:underline">
                                {subagent.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {subagent.contact || "No contact person"}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </td>

                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-sm text-slate-700">
                            {subagent.email || "No email"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {subagent.phone || "No phone"}
                          </p>
                        </div>
                      </td>

                      <td className="px-8 py-5 text-sm text-slate-600">
                        {subagent.country || "Not set"}
                      </td>

                      <td className="px-8 py-5">
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold tracking-[0.16em] text-slate-700">
                          {subagent.referralCode}
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        {subagent.linkedForm && subagent.linkedPublicUrl ? (
                          <div className="space-y-2">
                            <Link
                              href={`/intake-forms/${subagent.linkedForm.id}`}
                              className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200"
                            >
                              {subagent.linkedForm.title}
                            </Link>
                            <p className="max-w-[260px] truncate text-sm text-slate-700">
                              {subagent.linkedPublicUrl}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                              No linked form
                            </span>
                            <Link
                              href="/intake-forms/new"
                              className="block text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
                            >
                              Create intake form
                            </Link>
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-5 text-sm font-semibold text-slate-900">
                        {subagent.clients.length}
                      </td>

                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {subagent.totalLeadsCount}
                          </p>
                          <p className="text-xs text-slate-500">
                            {subagent.openLeadsCount} open
                          </p>
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {subagent.conversionRate}%
                          </p>
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-slate-900"
                              style={{ width: `${subagent.conversionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        {subagent.isActive ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 xl:hidden sm:p-6">
              {agents.map((subagent) => (
                <Link
                  key={subagent.id}
                  href={`/subagents/${subagent.id}`}
                  className="block rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                        {getInitials(subagent.name || "A")}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {subagent.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {subagent.contact || "No contact person"}
                        </p>
                      </div>
                    </div>

                    {subagent.isActive ? (
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Email
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {subagent.email || "No email"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Phone
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {subagent.phone || "No phone"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Country
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {subagent.country || "Not set"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Active Clients
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {subagent.clients.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Total Leads
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {subagent.totalLeadsCount}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Conversion
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {subagent.conversionRate}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Referral Code
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {subagent.referralCode}
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Linked Intake Form
                    </p>

                    {subagent.linkedForm && subagent.linkedPublicUrl ? (
                      <>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {subagent.linkedForm.title}
                        </p>
                        <p className="mt-2 break-all text-sm text-slate-700">
                          {subagent.linkedPublicUrl}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-sm text-slate-600">
                          No linked form yet
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Create an intake form and assign this agent in Referral Configuration.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Open Leads
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {subagent.openLeadsCount}
                        </p>
                      </div>

                      <div className="min-w-[110px]">
                        <p className="text-right text-xs text-slate-500">
                          Converted: {subagent.convertedLeadsCount}
                        </p>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-slate-900"
                            style={{ width: `${subagent.conversionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}